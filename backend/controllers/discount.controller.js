import mongoose from "mongoose";
import {
    Discount,
    getDiscountStatus,
    calculateDiscountAmount,
} from "../models/discount.model.js";
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";

const DISCOUNT_TYPES = ["percentage", "fixed_amount"];
const ALLOWED_FIELDS = ["discount_code", "discount_type", "amount", "starts_at", "ends_at", "minimum_order_amount", "maximum_discount_amount", "usage_limit", "usage_limit_per_user", "active"];
const SORT_WHITELIST = ["createdAt", "updatedAt", "discount_code", "amount", "used_count", "starts_at", "ends_at"];
const CODE_ALLOWED_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-";

const normalizeCode = (code) => String(code).trim().toUpperCase();
const isValidDate = (value) => !isNaN(new Date(value).getTime());
const isPositiveNumber = (value) => Number.isFinite(Number(value)) && Number(value) > 0;
const isNonNegativeNumber = (value) => Number.isFinite(Number(value)) && Number(value) >= 0;
const isPositiveInteger = (value) => Number.isInteger(Number(value)) && Number(value) >= 1;

const isValidDiscountCode = (code) => {
    if (typeof code !== "string") return false;

    if (code.length < 3 || code.length > 50) {
        return false;
    }

    for (const char of code) {
        if (!CODE_ALLOWED_CHARS.includes(char)) {
            return false;
        }
    }

    return true;
};

const validateDiscountPayload = (data, { partial = false, existing = null } = {}) => {
    const current = {
        ...(existing?.toObject ? existing.toObject() : existing || {}),
        ...data,
    };

    if (!partial && data.discount_code === undefined) {
        return "discount_code is required";
    }

    if (
        data.discount_code !== undefined &&
        !isValidDiscountCode(normalizeCode(data.discount_code))
    ) {
        return "discount_code must be 3-50 characters: uppercase letters, numbers, underscores, and hyphens only";
    }

    if (!partial && data.discount_type === undefined) {
        return "discount_type is required";
    }

    if (
        data.discount_type !== undefined &&
        !DISCOUNT_TYPES.includes(data.discount_type)
    ) {
        return `discount_type must be one of: ${DISCOUNT_TYPES.join(", ")}`;
    }

    if (!partial && data.amount === undefined) {
        return "amount is required";
    }

    if (data.amount !== undefined) {
        if (!isPositiveNumber(data.amount)) {
            return "amount must be a positive number";
        }

        if (
            current.discount_type === "percentage" &&
            Number(data.amount) > 100
        ) {
            return "percentage amount cannot exceed 100";
        }
    }

    if (
        data.starts_at !== undefined &&
        data.starts_at !== null &&
        !isValidDate(data.starts_at)
    ) {
        return "starts_at must be a valid date";
    }

    if (
        data.ends_at !== undefined &&
        data.ends_at !== null &&
        !isValidDate(data.ends_at)
    ) {
        return "ends_at must be a valid date";
    }

    if (
        current.ends_at &&
        current.starts_at &&
        isValidDate(current.ends_at) &&
        isValidDate(current.starts_at) &&
        new Date(current.ends_at) <=
        new Date(current.starts_at)
    ) {
        return "ends_at must be after starts_at";
    }

    if (
        data.minimum_order_amount !== undefined &&
        data.minimum_order_amount !== null &&
        !isNonNegativeNumber(data.minimum_order_amount)
    ) {
        return "minimum_order_amount must be a non-negative number";
    }

    if (
        data.maximum_discount_amount !== undefined &&
        data.maximum_discount_amount !== null
    ) {
        if (!isNonNegativeNumber(data.maximum_discount_amount)) {
            return "maximum_discount_amount must be a non-negative number";
        }

        if (current.discount_type === "fixed_amount") {
            return "maximum_discount_amount is only applicable to percentage discounts";
        }
    }

    if (
        data.usage_limit !== undefined &&
        data.usage_limit !== null &&
        !isPositiveInteger(data.usage_limit)
    ) {
        return "usage_limit must be a positive integer, or null for unlimited";
    }

    if (
        data.usage_limit_per_user !== undefined &&
        data.usage_limit_per_user !== null &&
        !isPositiveInteger(data.usage_limit_per_user)
    ) {
        return "usage_limit_per_user must be a positive integer, or null for unlimited";
    }

    if (data.active !== undefined && typeof data.active !== "boolean") {
        return "active must be a boolean value";
    }

    return null;
};

const formatAdminDiscount = (discount) => ({
    id: discount._id,
    discount_code: discount.discount_code,
    discount_type: discount.discount_type,
    amount: discount.amount,
    starts_at: discount.starts_at,
    ends_at: discount.ends_at,
    minimum_order_amount: discount.minimum_order_amount,
    maximum_discount_amount: discount.maximum_discount_amount,
    usage_limit: discount.usage_limit,
    usage_limit_per_user: discount.usage_limit_per_user,
    used_count: discount.used_count,
    active: discount.active,
    status: getDiscountStatus(discount),
    createdAt: discount.createdAt,
    updatedAt: discount.updatedAt,
});

const resolveSubtotal = async (userId, bodyAmount) => {
    const cart = await Cart.findOne({ userId }).lean();

    if (cart?.items?.length > 0) {
        const productIds = [...new Set(cart.items.map((item) => String(item.productId)))];

        const products = await Product.find({ _id: { $in: productIds } })
            .select("isActive variants")
            .lean();

        const productMap = new Map(
            products.map((product) => [String(product._id), product])
        );

        let subtotal = 0;

        for (const item of cart.items) {
            const product = productMap.get(String(item.productId));

            if (!product || product.isActive === false) {
                continue;
            }

            const variant = item.variantId
                ? product.variants?.find((variant) => String(variant._id) === String(item.variantId))
                : null;

            if (!variant || variant.isActive === false) {
                continue;
            }

            subtotal += variant.price * item.quantity;
        }

        return { subtotal, source: "cart" };
    }

    if (bodyAmount !== undefined) {
        if (!isPositiveNumber(bodyAmount)) {
            return { error: "amount must be a positive number" };
        }
        return { subtotal: Number(bodyAmount), source: "client_provided" };
    }

    return { error: "Your cart is empty. Add items to your cart before applying a coupon." };
};

export const getAllDiscount = async (req, res) => {
    try {
        const { page = 1, limit = 20, active, discount_type, status, search, sortBy = "createdAt", sortOrder = "desc" } = req.query;

        const pageNum = Math.max(1, Number(page) || 1);
        const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));

        const conditions = [];

        if (active !== undefined) {
            conditions.push({ active: active === "true" || active === true });
        }

        if (discount_type !== undefined) {
            if (!DISCOUNT_TYPES.includes(discount_type)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid discount_type. Allowed: ${DISCOUNT_TYPES.join(", ")}`
                });
            }

            conditions.push({ discount_type });
        }

        if (status !== undefined) {
            const statusFilters = {
                active: (now) => ({
                    active: true,
                    $and: [
                        {
                            $or: [
                                { starts_at: null },
                                { starts_at: { $lte: now } },
                            ],
                        },
                        {
                            $or: [
                                { ends_at: null },
                                { ends_at: { $gte: now } },
                            ],
                        },
                        {
                            $expr: {
                                $or: [
                                    { $eq: ["$usage_limit", null] },
                                    { $lt: ["$used_count", "$usage_limit"] },
                                ],
                            },
                        },
                    ],
                }),
                scheduled: (now) => ({ active: true, starts_at: { $gt: now } }),
                expired: (now) => ({ ends_at: { $ne: null, $lt: now } }),
                fully_used: () => ({
                    usage_limit: { $ne: null },
                    $expr: { $gte: ["$used_count", "$usage_limit"] },
                }),
                inactive: () => ({ active: false }),
            };

            if (!statusFilters[status]) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid status filter. Allowed: ${Object.keys(statusFilters).join(", ")}`,
                });
            }

            conditions.push(statusFilters[status](new Date()));
        }

        if (search) {
            conditions.push({
                discount_code: { $regex: String(search).trim(), $options: "i" },
            });
        }

        if (!SORT_WHITELIST.includes(sortBy)) {
            return res.status(400).json({ success: false, message: `Invalid sortBy. Allowed: ${SORT_WHITELIST.join(", ")}` });
        }

        const filter = conditions.length ? { $and: conditions } : {};
        const sortOrderValue = sortOrder === "asc" ? 1 : -1;

        const [discounts, total] =
            await Promise.all([
                Discount.find(filter)
                    .sort({ [sortBy]: sortOrderValue })
                    .skip((pageNum - 1) * limitNum)
                    .limit(limitNum)
                    .lean(),

                Discount.countDocuments(filter),
            ]);

        return res.status(200).json({
            success: true,
            data: discounts.map(formatAdminDiscount),
            meta: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
                hasNextPage: pageNum * limitNum < total, hasPreviousPage: pageNum > 1,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getDiscountById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid Discount ID" });
        }

        const discount = await Discount.findById(id).lean();

        if (!discount) {
            return res.status(404).json({ success: false, message: "Discount not found" });
        }

        return res.status(200).json({ success: true, data: formatAdminDiscount(discount) });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const createDiscount = async (req, res) => {
    try {
        const data = {};

        for (const field of ALLOWED_FIELDS) {
            if (req.body[field] !== undefined) {
                data[field] = req.body[field];
            }
        }

        const validationError = validateDiscountPayload(data);

        if (validationError) {
            return res.status(400).json({ success: false, message: validationError });
        }

        data.discount_code = normalizeCode(data.discount_code);

        let discount;

        try {
            discount = await Discount.create(data);
        } catch (error) {
            if (error.code === 11000) {
                return res.status(409).json({ success: false, message: "A discount with this code already exists" });
            }

            throw error;
        }

        return res.status(201).json({
            success: true,
            message: "Discount created successfully",
            data: formatAdminDiscount(discount.toObject()),
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const updateDiscount = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid Discount ID" });
        }

        const discount =
            await Discount.findById(id);

        if (!discount) {
            return res.status(404).json({ success: false, message: "Discount not found" });
        }

        const updates = {};

        for (const field of ALLOWED_FIELDS) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (discount.used_count > 0) {
            const riskyFields = ["discount_type", "amount", "discount_code"].filter(
                (field) =>
                    updates[field] !== undefined &&
                    String(updates[field]) !==
                    String(discount[field])
            );

            if (riskyFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot change ${riskyFields.join(", ")} — this coupon has already been used ${discount.used_count} time(s) and historical orders depend on its original configuration.`,
                });
            }
        }

        const validationError = validateDiscountPayload(updates, { partial: true, existing: discount });

        if (validationError) {
            return res.status(400).json({ success: false, message: validationError });
        }

        if (updates.discount_code !== undefined) {
            updates.discount_code = normalizeCode(updates.discount_code);
        }

        Object.assign(discount, updates);

        try {
            await discount.save();
        } catch (error) {
            if (error.code === 11000) {
                return res.status(409).json({ success: false, message: "A discount with this code already exists" });
            }

            throw error;
        }

        return res.status(200).json({
            success: true,
            message: "Discount updated successfully",
            data: formatAdminDiscount(discount.toObject()),
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const deleteDiscount = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid Discount ID" });
        }

        const discount = await Discount.findById(id);

        if (!discount) {
            return res.status(404).json({ success: false, message: "Discount not found" });
        }

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

        return res.status(200).json({
            success: true,
            message: "Discount deleted successfully",
            data: { deleted: true, deactivated: false },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const applyDiscount = async (req, res) => {
    try {
        const userId = req.user.id;
        const { code } = req.body;

        if (!code || typeof code !== "string") {
            return res.status(400).json({ success: false, message: "A discount code is required" });
        }

        const normalizedCode = normalizeCode(code);
        const discount = await Discount.findOne({ discount_code: normalizedCode }).lean();

        if (!discount) {
            return res.status(404).json({ success: false, message: "Invalid coupon code" });
        }

        const discountStatus = getDiscountStatus(discount);

        if (discountStatus === "inactive") {
            return res.status(400).json({ success: false, message: "This coupon is not active" });
        }

        if (discountStatus === "scheduled") {
            return res.status(400).json({ success: false, message: "This coupon is not yet active" });
        }

        if (discountStatus === "expired") {
            return res.status(400).json({ success: false, message: "This coupon has expired" });
        }

        if (discountStatus === "exhausted") {
            return res.status(400).json({ success: false, message: "This coupon has reached its usage limit" });
        }

        const subtotalData = await resolveSubtotal(userId, req.body.amount);

        if (subtotalData.error) {
            return res.status(400).json({ success: false, message: subtotalData.error });
        }

        const { subtotal, source } = subtotalData;

        if (discount.minimum_order_amount && subtotal < discount.minimum_order_amount) {
            return res.status(400).json({ success: false, message: `A minimum order amount of ${discount.minimum_order_amount} is required to use this coupon` });
        }

        if (discount.usage_limit_per_user != null) {
            const userUsageCount =
                await Order.countDocuments({
                    userId,
                    couponCode: normalizedCode,
                    status: { $ne: "cancelled" },
                });

            if (userUsageCount >= discount.usage_limit_per_user) {
                return res.status(400).json({ success: false, message: "You have already used this coupon the maximum number of times" });
            }
        }

        const discountAmount = calculateDiscountAmount(discount, subtotal);
        const finalSubtotal = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

        return res.status(200).json({
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
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getAdminDiscountStats = async (req, res) => {
    try {
        const now = new Date();

        const [agg] = await Discount.aggregate([
            {
                $facet: {
                    total: [{ $count: "count" }],
                    byType: [
                        { $group: { _id: "$discount_type", count: { $sum: 1 } } },
                    ],
                    active: [
                        { $match: { active: true } },
                        { $count: "count" },
                    ],
                    inactive: [
                        { $match: { active: false } },
                        { $count: "count" },
                    ],
                    scheduled: [
                        { $match: { active: true, starts_at: { $gt: now } } },
                        { $count: "count" },
                    ],
                    expired: [
                        {
                            $match: {
                                ends_at: { $ne: null, $lt: now },
                            },
                        },
                        { $count: "count" },
                    ],
                    exhausted: [
                        {
                            $match: {
                                usage_limit: { $ne: null },
                                $expr: { $gte: ["$used_count", "$usage_limit"] },
                            },
                        },
                        { $count: "count" },
                    ],

                    totalUses: [
                        {
                            $group: {
                                _id: null,
                                sum: { $sum: "$used_count" },
                            },
                        },
                    ],

                    mostUsed: [
                        { $sort: { used_count: -1 } },
                        { $limit: 5 },
                        {
                            $project: {
                                _id: 0,
                                discount_code: 1,
                                discount_type: 1,
                                used_count: 1,
                            },
                        },
                    ],
                },
            },
        ]);

        const byTypeCounts = Object.fromEntries((agg.byType || []).map((item) => [item._id, item.count]));

        return res.status(200).json({
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
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};