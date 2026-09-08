import mongoose from "mongoose";
import { Discount, getDiscountStatus, calculateDiscountAmount } from "../models/discount.model.js";
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { ApiError, handleError } from "../utils/apiError.js";

const DISCOUNT_TYPES = ["percentage", "fixed_amount"];
const ALLOWED_FIELDS = [
    "discount_code",
    "discount_type",
    "amount",
    "starts_at",
    "ends_at",
    "minimum_order_amount",
    "maximum_discount_amount",
    "usage_limit",
    "usage_limit_per_user",
    "active",
];
const SORT_WHITELIST = ["createdAt", "updatedAt", "discount_code", "amount", "used_count", "starts_at", "ends_at"];

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const normalizeCode = (code) => String(code).trim().toUpperCase();
const isBoolean = (v) => typeof v === "boolean";

const STATUS_FILTERS = {
    active: (now) => ({
        active: true,
        $and: [
            { $or: [{ starts_at: null }, { starts_at: { $lte: now } }] },
            { $or: [{ ends_at: null }, { ends_at: { $gte: now } }] },
            { $expr: { $or: [{ $eq: ["$usage_limit", null] }, { $lt: ["$used_count", "$usage_limit"] }] } },
        ],
    }),
    scheduled: (now) => ({ active: true, starts_at: { $gt: now } }),
    expired: (now) => ({ ends_at: { $ne: null, $lt: now } }),
    fully_used: () => ({ usage_limit: { $ne: null }, $expr: { $gte: ["$used_count", "$usage_limit"] } }),
    inactive: () => ({ active: false }),
};

const validateDiscountPayload = (data, { partial = false, existing = null } = {}) => {
    const effective = { ...(existing?.toObject ? existing.toObject() : existing || {}), ...data };

    if (!partial && data.discount_code === undefined) throw new ApiError(400, "discount_code is required");
    if (data.discount_code !== undefined) {
        const normalized = normalizeCode(data.discount_code);
        if (!CODE_RE_TEST(normalized)) {
            throw new ApiError(400, "discount_code must be 3-50 characters: uppercase letters, numbers, underscores, and hyphens only");
        }
    }

    if (!partial && data.discount_type === undefined) throw new ApiError(400, "discount_type is required");
    if (data.discount_type !== undefined && !DISCOUNT_TYPES.includes(data.discount_type)) {
        throw new ApiError(400, `discount_type must be one of: ${DISCOUNT_TYPES.join(", ")}`);
    }

    if (!partial && data.amount === undefined) throw new ApiError(400, "amount is required");
    if (data.amount !== undefined) {
        const amt = Number(data.amount);
        if (!Number.isFinite(amt) || amt <= 0) throw new ApiError(400, "amount must be a positive number");
        if (effective.discount_type === "percentage" && amt > 100) {
            throw new ApiError(400, "percentage amount cannot exceed 100");
        }
    }

    if (data.starts_at !== undefined && data.starts_at !== null && isNaN(new Date(data.starts_at).getTime())) {
        throw new ApiError(400, "starts_at must be a valid date");
    }
    if (data.ends_at !== undefined && data.ends_at !== null && isNaN(new Date(data.ends_at).getTime())) {
        throw new ApiError(400, "ends_at must be a valid date");
    }
    if (effective.ends_at) {
        const end = new Date(effective.ends_at);
        const start = effective.starts_at ? new Date(effective.starts_at) : null;
        if (start && !isNaN(start.getTime()) && !isNaN(end.getTime()) && end <= start) {
            throw new ApiError(400, "ends_at must be after starts_at");
        }
    }

    if (data.minimum_order_amount !== undefined && data.minimum_order_amount !== null) {
        const v = Number(data.minimum_order_amount);
        if (!Number.isFinite(v) || v < 0) throw new ApiError(400, "minimum_order_amount must be a non-negative number");
    }

    if (data.maximum_discount_amount !== undefined && data.maximum_discount_amount !== null) {
        const v = Number(data.maximum_discount_amount);
        if (!Number.isFinite(v) || v < 0) throw new ApiError(400, "maximum_discount_amount must be a non-negative number");
        if (effective.discount_type === "fixed_amount") {
            throw new ApiError(400, "maximum_discount_amount is only applicable to percentage discounts");
        }
    }

    if (data.usage_limit !== undefined && data.usage_limit !== null) {
        const v = Number(data.usage_limit);
        if (!Number.isInteger(v) || v < 1) throw new ApiError(400, "usage_limit must be a positive integer, or null for unlimited");
    }

    if (data.usage_limit_per_user !== undefined && data.usage_limit_per_user !== null) {
        const v = Number(data.usage_limit_per_user);
        if (!Number.isInteger(v) || v < 1) throw new ApiError(400, "usage_limit_per_user must be a positive integer, or null for unlimited");
    }

    if (data.active !== undefined && !isBoolean(data.active)) {
        throw new ApiError(400, "active must be a boolean value");
    }
};

const CODE_RE_TEST = (v) => /^[A-Z0-9_-]{3,50}$/.test(v);

const formatAdminDiscount = (d) => ({
    id: d._id,
    discount_code: d.discount_code,
    discount_type: d.discount_type,
    amount: d.amount,
    starts_at: d.starts_at,
    ends_at: d.ends_at,
    minimum_order_amount: d.minimum_order_amount,
    maximum_discount_amount: d.maximum_discount_amount,
    usage_limit: d.usage_limit,
    usage_limit_per_user: d.usage_limit_per_user,
    used_count: d.used_count,
    active: d.active,
    status: getDiscountStatus(d),
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
});

const resolveSubtotal = async (userId, bodyAmount) => {
    const cart = await Cart.findOne({ userId }).lean();

    if (cart && cart.items.length > 0) {
        const productIds = [...new Set(cart.items.map((i) => String(i.productId)))];
        const products = await Product.find({ _id: { $in: productIds } }).select("isActive variants").lean();
        const productMap = new Map(products.map((p) => [String(p._id), p]));

        let subtotal = 0;
        for (const item of cart.items) {
            const product = productMap.get(String(item.productId));
            if (!product || product.isActive === false) continue;
            const variant = item.variantId
                ? product.variants.find((v) => String(v._id) === String(item.variantId))
                : null;
            if (!variant || variant.isActive === false) continue;
            subtotal += variant.price * item.quantity;
        }
        return { subtotal, source: "cart" };
    }

    if (bodyAmount !== undefined) {
        const amt = Number(bodyAmount);
        if (!Number.isFinite(amt) || amt <= 0) throw new ApiError(400, "amount must be a positive number");
        return { subtotal: amt, source: "client_provided" };
    }

    throw new ApiError(400, "Your cart is empty. Add items to your cart before applying a coupon.");
};

export const getAllDiscount = async (req, res) => {
    try {
        const { page = 1, limit = 20, active, discount_type, status, search, sortBy = "createdAt", sortOrder = "desc" } = req.query;

        const pageNum = Math.max(1, Number(page) || 1);
        const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));

        const filter = {};

        if (active !== undefined) filter.active = active === "true" || active === true;

        if (discount_type !== undefined) {
            if (!DISCOUNT_TYPES.includes(discount_type)) throw new ApiError(400, `Invalid discount_type. Allowed: ${DISCOUNT_TYPES.join(", ")}`);
            filter.discount_type = discount_type;
        }

        if (status !== undefined) {
            if (!STATUS_FILTERS[status]) throw new ApiError(400, `Invalid status filter. Allowed: ${Object.keys(STATUS_FILTERS).join(", ")}`);
            Object.assign(filter, STATUS_FILTERS[status](new Date()));
        }

        if (search) {
            filter.discount_code = { $regex: escapeRegex(String(search).toUpperCase()), $options: "i" };
        }

        if (!SORT_WHITELIST.includes(sortBy)) throw new ApiError(400, `Invalid sortBy. Allowed: ${SORT_WHITELIST.join(", ")}`);
        const sortOrderValue = sortOrder === "asc" ? 1 : -1;

        const [discounts, total] = await Promise.all([
            Discount.find(filter)
                .sort({ [sortBy]: sortOrderValue })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .lean(),
            Discount.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            data: discounts.map(formatAdminDiscount),
            meta: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
                hasNextPage: pageNum * limitNum < total,
                hasPreviousPage: pageNum > 1,
            },
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getDiscountById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid Discount ID");

        const discount = await Discount.findById(id).lean();
        if (!discount) throw new ApiError(404, "Discount not found");

        res.status(200).json({ success: true, data: formatAdminDiscount(discount) });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const createDiscount = async (req, res) => {
    try {
        const data = {};
        for (const field of ALLOWED_FIELDS) {
            if (req.body[field] !== undefined) data[field] = req.body[field];
        }

        validateDiscountPayload(data, { partial: false });
        data.discount_code = normalizeCode(data.discount_code);

        let discount;
        try {
            discount = await Discount.create(data);
        } catch (error) {
            if (error.code === 11000) throw new ApiError(409, "A discount with this code already exists");
            throw error;
        }

        res.status(201).json({
            success: true,
            message: "Discount created successfully",
            data: formatAdminDiscount(discount.toObject()),
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const updateDiscount = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid Discount ID");

        const discount = await Discount.findById(id);
        if (!discount) throw new ApiError(404, "Discount not found");

        const updates = {};
        for (const field of ALLOWED_FIELDS) {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        }

        if (discount.used_count > 0) {
            const riskyFields = ["discount_type", "amount", "discount_code"].filter(
                (f) => updates[f] !== undefined && String(updates[f]) !== String(discount[f])
            );
            if (riskyFields.length) {
                throw new ApiError(
                    400,
                    `Cannot change ${riskyFields.join(", ")} — this coupon has already been used ${discount.used_count} time(s) and historical orders depend on its original configuration.`
                );
            }
        }

        validateDiscountPayload(updates, { partial: true, existing: discount });

        if (updates.discount_code !== undefined) {
            updates.discount_code = normalizeCode(updates.discount_code);
        }

        Object.assign(discount, updates);

        try {
            await discount.save();
        } catch (error) {
            if (error.code === 11000) throw new ApiError(409, "A discount with this code already exists");
            throw error;
        }

        res.status(200).json({
            success: true,
            message: "Discount updated successfully",
            data: formatAdminDiscount(discount.toObject()),
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const deleteDiscount = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid Discount ID");

        const discount = await Discount.findById(id);
        if (!discount) throw new ApiError(404, "Discount not found");

        if (discount.used_count > 0) {
            discount.active = false;
            await discount.save();
            return res.status(200).json({
                success: true,
                message: "This discount has already been used and cannot be deleted, so it has been deactivated instead.",
                data: { deleted: false, deactivated: true },
            });
        }

        await Discount.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: "Discount deleted successfully",
            data: { deleted: true, deactivated: false },
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const applyDiscount = async (req, res) => {
    try {
        const userId = req.user.id;
        const { code } = req.body;
        if (!code || typeof code !== "string") throw new ApiError(400, "A discount code is required");

        const normalizedCode = normalizeCode(code);

        const discount = await Discount.findOne({ discount_code: normalizedCode }).lean();
        if (!discount) throw new ApiError(404, "Invalid coupon code");

        const status = getDiscountStatus(discount);
        if (status === "inactive") throw new ApiError(400, "This coupon is not active");
        if (status === "scheduled") throw new ApiError(400, "This coupon is not yet active");
        if (status === "expired") throw new ApiError(400, "This coupon has expired");
        if (status === "exhausted") throw new ApiError(400, "This coupon has reached its usage limit");

        const { subtotal, source } = await resolveSubtotal(userId, req.body.amount);

        if (discount.minimum_order_amount && subtotal < discount.minimum_order_amount) {
            throw new ApiError(400, `A minimum order amount of ${discount.minimum_order_amount} is required to use this coupon`);
        }

        if (discount.usage_limit_per_user != null) {
            const userUsageCount = await Order.countDocuments({
                userId,
                couponCode: normalizedCode,
                status: { $ne: "cancelled" },
            });
            if (userUsageCount >= discount.usage_limit_per_user) {
                throw new ApiError(400, "You have already used this coupon the maximum number of times");
            }
        }

        const discountAmount = calculateDiscountAmount(discount, subtotal);
        const finalSubtotal = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

        res.status(200).json({
            success: true,
            data: {
                discountCode: discount.discount_code,
                discountType: discount.discount_type,
                discountAmount,
                subtotal,
                finalSubtotal,
                minimumOrderAmount: discount.minimum_order_amount || 0,
                subtotalSource: source,
            },
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getAdminDiscountStats = async (req, res) => {
    try {
        const now = new Date();
        const [agg] = await Discount.aggregate([
            {
                $facet: {
                    total: [{ $count: "count" }],
                    byType: [{ $group: { _id: "$discount_type", count: { $sum: 1 } } }],
                    active: [{ $match: { active: true } }, { $count: "count" }],
                    inactive: [{ $match: { active: false } }, { $count: "count" }],
                    scheduled: [{ $match: { active: true, starts_at: { $gt: now } } }, { $count: "count" }],
                    expired: [{ $match: { ends_at: { $ne: null, $lt: now } } }, { $count: "count" }],
                    exhausted: [
                        { $match: { usage_limit: { $ne: null }, $expr: { $gte: ["$used_count", "$usage_limit"] } } },
                        { $count: "count" },
                    ],
                    totalUses: [{ $group: { _id: null, sum: { $sum: "$used_count" } } }],
                    mostUsed: [
                        { $sort: { used_count: -1 } },
                        { $limit: 5 },
                        { $project: { _id: 0, discount_code: 1, discount_type: 1, used_count: 1 } },
                    ],
                },
            },
        ]);

        const byTypeCounts = Object.fromEntries((agg.byType || []).map((t) => [t._id, t.count]));

        res.status(200).json({
            success: true,
            stats: {
                totalDiscounts: agg.total[0]?.count || 0,
                activeDiscounts: agg.active[0]?.count || 0,
                inactiveDiscounts: agg.inactive[0]?.count || 0,
                scheduledDiscounts: agg.scheduled[0]?.count || 0,
                expiredDiscounts: agg.expired[0]?.count || 0,
                exhaustedDiscounts: agg.exhausted[0]?.count || 0,
                totalCouponUses: agg.totalUses[0]?.sum || 0,
                byType: {
                    percentage: byTypeCounts.percentage || 0,
                    fixed_amount: byTypeCounts.fixed_amount || 0,
                },
                mostUsedCoupons: agg.mostUsed || [],
            },
        });
    } catch (error) {
        handleError(error, req, res);
    }
};