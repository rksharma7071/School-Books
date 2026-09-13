import mongoose from "mongoose";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { Discount, calculateDiscountAmount } from "../models/discount.model.js";
import Counter from "../models/counter.model.js";
import { Cart } from "../models/cart.model.js";
import { Address, User } from "../models/user.model.js";
import { ApiError, handleError } from "../utils/apiError.js";


const ORDER_STATUSES = ["in progress", "fulfilled", "unfulfilled", "cancelled"];
const STATUS_TRANSITIONS = {
    "in progress": ["unfulfilled", "fulfilled", "cancelled"],
    unfulfilled: ["fulfilled", "cancelled"],
    fulfilled: [],
    cancelled: [],
};

const SHIPMENT_STATUSES = ["pending", "shipped", "delivered", "cancelled"];
const SHIPMENT_TRANSITIONS = {
    pending: ["shipped", "cancelled"],
    shipped: ["delivered", "cancelled"],
    delivered: [],
    cancelled: [],
};

const toAddressSnapshot = (a) => ({
    fullName: a.fullName,
    phone: a.phone,
    address: a.address,
    city: a.city,
    state: a.state,
    pincode: a.pincode,
    country: a.country,
    type: a.type,
    landmark: a.landmark,
});

const recomputeProductInventory = async (productId, session) => {
    const product = await Product.findById(productId)
        .select("variants")
        .session(session);

    if (!product) return;

    const totalInventory = product.variants
        .filter((v) => v.isActive !== false)
        .reduce((sum, v) => sum + (Number(v.inventory_quantity) || 0), 0);
    await Product.updateOne(
        { _id: productId },
        { $set: { inventory_quantity: totalInventory } },
        { session });
};

export const getAllOrder = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, userId, orderNumber, search, from, to } = req.query;

        const pageNum = Math.max(1, Number(page) || 1);
        const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));

        const filter = {};

        if (status !== undefined) {
            if (!ORDER_STATUSES.includes(status))
                throw new ApiError(400, `Invalid status. Allowed: ${ORDER_STATUSES.join(", ")}`);
            filter.status = status;
        }

        if (userId !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(userId))
                throw new ApiError(400, "Invalid userId");
            filter.userId = userId;
        }

        if (orderNumber !== undefined) {
            const num = Number(orderNumber);
            if (!Number.isInteger(num))
                throw new ApiError(400, "orderNumber must be a number");
            filter.orderNumber = num;
        }

        if (from || to) {
            filter.createdAt = {};
            if (from) {
                const fromDate = new Date(from);
                if (isNaN(fromDate.getTime()))
                    throw new ApiError(400, "Invalid 'from' date");
                filter.createdAt.$gte = fromDate;
            }
            if (to) {
                const toDate = new Date(to);
                if (isNaN(toDate.getTime()))
                    throw new ApiError(400, "Invalid 'to' date");
                filter.createdAt.$lte = toDate;
            }
        }

        if (search) {
            const orConditions = [];
            const numericSearch = Number(search);
            if (Number.isInteger(numericSearch))
                orConditions.push({ orderNumber: numericSearch });

            const matchingUsers = await User.find({
                $or: [
                    { email: { $regex: search, $options: "i" } },
                    { name: { $regex: search, $options: "i" } }
                ],
            })
                .select("_id")
                .lean();

            if (matchingUsers.length)
                orConditions.push({ userId: { $in: matchingUsers.map((u) => u._id) } });

            if (orConditions.length) {
                filter.$or = orConditions;
            } else {
                return res.status(200).json({
                    success: true,
                    data: [],
                    meta: { total: 0, page: pageNum, limit: limitNum, totalPages: 0, hasNextPage: false, hasPreviousPage: pageNum > 1 },
                });
            }
        }

        const [data, total] = await Promise.all([
            Order.find(filter)
                .populate("userId", "name email")
                .populate("items.productId", "title image images isActive")
                .sort({ createdAt: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .lean(),
            Order.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            data,
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

export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
            throw new ApiError(400, "Invalid order ID");

        const order = await Order.findById(id)
            .populate("userId", "name email")
            .populate("items.productId", "title image images isActive")
            .lean();
        if (!order)
            throw new ApiError(404, "Order not found");
        if (req.user.role !== "admin" && String(order.userId?._id) !== String(req.user.id)) {
            throw new ApiError(403, "Access denied");
        }

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const createOrder = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const userId = req.user.id;
        const { shippingAddressId, billingAddressId, billingSameAsShipping, coupon } = req.body;
        const idempotencyKey = req.headers["idempotency-key"] || req.body.idempotencyKey || null;

        if (!shippingAddressId || !mongoose.Types.ObjectId.isValid(shippingAddressId)) {
            throw new ApiError(400, "A valid shippingAddressId is required");
        }

        const effectiveBillingId = billingSameAsShipping ? shippingAddressId : billingAddressId;
        if (!effectiveBillingId || !mongoose.Types.ObjectId.isValid(effectiveBillingId)) {
            throw new ApiError(400, "A valid billingAddressId is required (or set billingSameAsShipping: true)");
        }

        if (idempotencyKey) {
            const existingOrder = await Order.findOne({ userId, idempotencyKey }).lean();
            if (existingOrder) {
                return res.status(200).json({ success: true, message: "Order already created for this request", data: existingOrder });
            }
        }

        let order;

        try {
            await session.withTransaction(async () => {
                const cart = await Cart.findOne({ userId }).session(session);
                if (!cart || cart.items.length === 0)
                    throw new ApiError(400, "Cart is empty");

                const mergedMap = new Map();
                for (const item of cart.items) {
                    const key = `${item.productId}:${item.variantId || ""}`;
                    if (mergedMap.has(key)) {
                        mergedMap.get(key).quantity += item.quantity;
                    } else {
                        mergedMap.set(key, { productId: item.productId, variantId: item.variantId || null, quantity: item.quantity });
                    }
                }
                const cartItems = [...mergedMap.values()];

                const productIds = [...new Set(cartItems.map((i) => String(i.productId)))];
                const products = await Product.find({ _id: { $in: productIds } }).session(session);
                const productMap = new Map(products.map((p) => [String(p._id), p]));

                let subtotal = 0;
                const orderItems = [];

                for (const item of cartItems) {
                    const product = productMap.get(String(item.productId));
                    if (!product)
                        throw new ApiError(404, `Product not found: ${item.productId}`);
                    if (product.isActive === false)
                        throw new ApiError(400, `Product is not available: ${product.title}`);

                    const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
                    let variant = null;

                    if (hasVariants) {
                        if (!item.variantId)
                            throw new ApiError(400, `A variant must be selected for: ${product.title}`);
                        variant = product.variants.id(item.variantId);
                        if (!variant)
                            throw new ApiError(404, `Variant not found for: ${product.title}`);
                        if (variant.isActive === false)
                            throw new ApiError(400, `Selected variant is not available for: ${product.title}`);
                        if (variant.inventory_quantity < item.quantity) {
                            throw new ApiError(409, `Insufficient inventory for ${product.title}`);
                        }
                    }

                    const unitPrice = variant ? variant.price : 0;
                    const totalPrice = unitPrice * item.quantity;
                    subtotal += totalPrice;

                    orderItems.push({
                        productId: product._id,
                        variantId: variant ? variant._id : null,
                        productName: product.title,
                        variantSku: variant ? variant.sku : null,
                        variantOptions: variant ? variant.options : undefined,
                        quantity: item.quantity,
                        unit_price: unitPrice,
                        total_price: totalPrice,
                    });
                }

                for (const oi of orderItems) {
                    if (!oi.variantId) continue;
                    const upd = await Product.updateOne(
                        { _id: oi.productId, "variants._id": oi.variantId, "variants.inventory_quantity": { $gte: oi.quantity } },
                        { $inc: { "variants.$.inventory_quantity": -oi.quantity } },
                        { session }
                    );
                    if (upd.modifiedCount === 0) {
                        throw new ApiError(409, `Inventory changed for ${oi.productName}. Please review your cart and try again.`);
                    }
                    await recomputeProductInventory(oi.productId, session);
                }

                let discount = 0;
                let appliedCouponCode = null;
                if (coupon) {
                    const normalizedCode = String(coupon).trim().toUpperCase();

                    const existingDiscount = await Discount.findOne({ discount_code: normalizedCode }).session(session);
                    if (!existingDiscount)
                        throw new ApiError(400, "Invalid or expired coupon");

                    if (existingDiscount.minimum_order_amount && subtotal < existingDiscount.minimum_order_amount) {
                        throw new ApiError(400, `A minimum order amount of ${existingDiscount.minimum_order_amount} is required to use this coupon`);
                    }

                    if (existingDiscount.usage_limit_per_user != null) {
                        const userUsageCount = await Order.countDocuments({
                            userId,
                            couponCode: normalizedCode,
                            status: { $ne: "cancelled" },
                        }).session(session);
                        if (userUsageCount >= existingDiscount.usage_limit_per_user) {
                            throw new ApiError(400, "You have already used this coupon the maximum number of times");
                        }
                    }

                    const d = await Discount.findOneAndUpdate(
                        {
                            discount_code: normalizedCode,
                            active: true,
                            $and: [
                                { $or: [{ starts_at: null }, { starts_at: { $lte: new Date() } }] },
                                { $or: [{ ends_at: null }, { ends_at: { $gte: new Date() } }] },
                                { $expr: { $or: [{ $eq: ["$usage_limit", null] }, { $lt: ["$used_count", "$usage_limit"] }] } },
                            ],
                        },
                        { $inc: { used_count: 1 } },
                        { new: true, session }
                    );
                    if (!d)
                        throw new ApiError(400, "Invalid or expired coupon");

                    discount = calculateDiscountAmount(d, subtotal);
                    appliedCouponCode = d.discount_code;
                }

                const shipping = subtotal > 0 ? 50 : 0;
                const tax = 0;
                const total = Math.max(0, subtotal + shipping + tax - discount);

                const shippingAddress = await Address.findOne({ _id: shippingAddressId, userId }).session(session).lean();
                if (!shippingAddress)
                    throw new ApiError(400, "Selected shipping address not found or does not belong to you");

                const billingAddress = await Address.findOne({ _id: effectiveBillingId, userId }).session(session).lean();
                if (!billingAddress)
                    throw new ApiError(400, "Selected billing address not found or does not belong to you");

                const counter = await Counter.findOneAndUpdate(
                    { name: "order" },
                    { $inc: { seq: 1 } },
                    { new: true, upsert: true, session }
                );

                const created = await Order.create(
                    [
                        {
                            orderNumber: counter.seq,
                            userId,
                            items: orderItems,
                            shipping,
                            tax,
                            discount,
                            subtotal,
                            total,
                            couponCode: appliedCouponCode,
                            shipping_address: toAddressSnapshot(shippingAddress),
                            billing_address: toAddressSnapshot(billingAddress),
                            idempotencyKey: idempotencyKey || undefined,
                        },
                    ],
                    { session }
                );
                order = created[0];

                cart.items = [];
                await cart.save({ session });
            });
        } catch (error) {
            if (error.code === 11000 && idempotencyKey) {
                const existingOrder = await Order.findOne({ userId, idempotencyKey }).lean();
                if (existingOrder) {
                    return res.status(200).json({ success: true, message: "Order already created for this request", data: existingOrder });
                }
            }
            throw error;
        }

        res.status(201).json({ success: true, message: "Order created successfully", data: order });
    } catch (error) {
        handleError(error, req, res);
    } finally {
        session.endSession();
    }
};

export const updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
            throw new ApiError(400, "Invalid order ID");
        if (req.user.role !== "admin")
            throw new ApiError(403, "Only admins can update order status or shipment details");

        const order = await Order.findById(id);
        if (!order)
            throw new ApiError(404, "Order not found");

        const { status, shipment } = req.body;

        if (status !== undefined) {
            if (!ORDER_STATUSES.includes(status))
                throw new ApiError(400, `Invalid status. Allowed: ${ORDER_STATUSES.join(", ")}`);
            if (status === "cancelled")
                throw new ApiError(400, "Use the cancel endpoint to cancel an order");

            const allowedNext = STATUS_TRANSITIONS[order.status] || [];
            if (order.status !== status && !allowedNext.includes(status)) {
                throw new ApiError(400, `Cannot transition order from "${order.status}" to "${status}"`);
            }

            if (status !== order.status) {
                if (status === "unfulfilled") order.confirmedAt = order.confirmedAt || new Date();
                if (status === "fulfilled") order.paidAt = order.paidAt || new Date();
                order.status = status;
            }
        }

        if (shipment !== undefined) {
            const { carrier, tracking_number, status: shipmentStatus } = shipment;
            const current = order.shipment?.toObject?.() || order.shipment || {};
            const currentStatus = current.status || "pending";

            if (shipmentStatus !== undefined) {
                if (!SHIPMENT_STATUSES.includes(shipmentStatus)) {
                    throw new ApiError(400, `Invalid shipment status. Allowed: ${SHIPMENT_STATUSES.join(", ")}`);
                }
                const allowedNext = SHIPMENT_TRANSITIONS[currentStatus] || [];
                if (currentStatus !== shipmentStatus && !allowedNext.includes(shipmentStatus)) {
                    throw new ApiError(400, `Cannot transition shipment from "${currentStatus}" to "${shipmentStatus}"`);
                }
            }

            const updatedShipment = {
                carrier: carrier !== undefined ? carrier : current.carrier,
                tracking_number: tracking_number !== undefined ? tracking_number : current.tracking_number,
                status: shipmentStatus !== undefined ? shipmentStatus : currentStatus,
                shipped_at: current.shipped_at,
                delivered_at: current.delivered_at,
            };

            if (shipmentStatus === "shipped" && !updatedShipment.shipped_at) updatedShipment.shipped_at = new Date();
            if (shipmentStatus === "delivered") {
                updatedShipment.shipped_at = updatedShipment.shipped_at || new Date();
                updatedShipment.delivered_at = new Date();
            }

            order.shipment = updatedShipment;
        }

        await order.save();
        const populated = await Order.findById(order._id)
            .populate("userId", "name email")
            .populate("items.productId", "title image images isActive").lean();
        res.status(200).json({ success: true, message: "Order updated successfully", data: populated });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const cancelOrder = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { id } = req.params;
        const { reason } = req.body;
        if (!mongoose.Types.ObjectId.isValid(id))
            throw new ApiError(400, "Invalid order ID");

        const existing = await Order.findById(id).lean();
        if (!existing)
            throw new ApiError(404, "Order not found");
        if (req.user.role !== "admin" && String(existing.userId) !== String(req.user.id)) {
            throw new ApiError(403, "You are not authorized to cancel this order");
        }
        if (existing.status === "fulfilled")
            throw new ApiError(400, "Fulfilled orders cannot be cancelled");
        if (existing.status === "cancelled")
            throw new ApiError(400, "Order is already cancelled");

        let cancelledOrder;

        await session.withTransaction(async () => {
            const updated = await Order.findOneAndUpdate(
                { _id: id, status: { $in: ["in progress", "unfulfilled"] } },
                { $set: { status: "cancelled", cancelledAt: new Date(), cancellationReason: reason || "Order cancelled" } },
                { session }
            );

            if (!updated)
                throw new ApiError(400, "Order is no longer eligible for cancellation");

            for (const item of updated.items) {
                if (!item.variantId) continue;
                await Product.updateOne(
                    { _id: item.productId, "variants._id": item.variantId },
                    { $inc: { "variants.$.inventory_quantity": item.quantity } },
                    { session }
                );
                await recomputeProductInventory(item.productId, session);
            }

            if (updated.couponCode) {
                await Discount.updateOne(
                    { discount_code: updated.couponCode, used_count: { $gt: 0 } },
                    { $inc: { used_count: -1 } },
                    { session }
                );
            }

            cancelledOrder = updated;
        });

        const populated = await Order.findById(cancelledOrder._id)
            .populate("userId", "name email")
            .populate("items.productId", "title image images isActive").lean();
        res.status(200).json({ success: true, message: "Order cancelled successfully. Inventory has been restored.", data: populated });
    } catch (error) {
        handleError(error, req, res);
    } finally {
        session.endSession();
    }
};

export const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
            throw new ApiError(400, "Invalid order ID");

        const order = await Order.findById(id);
        if (!order)
            throw new ApiError(404, "Order not found");
        if (order.status !== "cancelled")
            throw new ApiError(400, "Only cancelled orders can be deleted");

        await Order.findByIdAndDelete(id);
        res.json({ success: true, message: "Order deleted successfully" });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getMyOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status } = req.query;
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Number(req.query.limit) || 20);

        const filter = { userId };
        if (status !== undefined) {
            if (!ORDER_STATUSES.includes(status))
                throw new ApiError(400, `Invalid status. Allowed: ${ORDER_STATUSES.join(", ")}`);
            filter.status = status;
        }

        const [data, total] = await Promise.all([
            Order.find(filter)
                .populate("items.productId", "title image images isActive")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Order.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < total,
                hasPreviousPage: page > 1,
            },
        });
    } catch (error) {
        handleError(error, req, res);
    }
};