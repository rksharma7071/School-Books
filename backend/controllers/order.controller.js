import mongoose from "mongoose";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { Discount } from "../models/discount.model.js";
import Counter from "../models/counter.model.js";
import { ApiError, handleError } from "../utils/apiError.js";

const USER_FIELDS = "first_name last_name email username";
const PRODUCT_FIELDS = "name price coverImage author";
const SHIPPING_FLAT = 50;

export const getAllOrder = async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Number(req.query.limit) || 20);

        const filter = {};
        if (req.query.userId && mongoose.Types.ObjectId.isValid(req.query.userId)) filter.userId = req.query.userId;
        if (req.query.status) filter.status = req.query.status;

        const [data, total] = await Promise.all([
            Order.find(filter)
                .populate("userId", USER_FIELDS)
                .populate("items.productId", PRODUCT_FIELDS)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Order.countDocuments(filter),
        ]);

        res.status(200).json({ data, total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid order ID");

        const order = await Order.findById(id)
            .populate("userId", USER_FIELDS)
            .populate("items.productId", PRODUCT_FIELDS)
            .lean();
        if (!order) throw new ApiError(404, "Order not found");
        if (req.user.role !== "admin" && String(order.userId?._id) !== String(req.user.id)) throw new ApiError(403, "Access denied");

        res.status(200).json(order);
    } catch (error) {
        handleError(error, req, res);
    }
};

export const createOrder = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { items, shipping_address, billing_address, coupon } = req.body;
        const userId = req.user.id;

        if (!items?.length) throw new ApiError(400, "Order must have items");
        if (!shipping_address || !billing_address) throw new ApiError(400, "shipping_address and billing_address required");

        const ids = [...new Set(items.map((i) => String(i.productId)))];
        if (ids.some((id) => !mongoose.Types.ObjectId.isValid(id))) throw new ApiError(400, "Invalid product ID in items");

        let order;
        await session.withTransaction(async () => {
            const products = await Product.find({ _id: { $in: ids } }).select("price stockQty isActive").session(session).lean();
            const productMap = new Map(products.map((p) => [String(p._id), p]));

            let subtotal = 0;
            const orderItems = [];
            for (const item of items) {
                const product = productMap.get(String(item.productId));
                if (!product || product.isActive === false) throw new ApiError(404, `Product not available: ${item.productId}`);
                const quantity = Number(item.quantity) || 1;
                if (quantity < 1) throw new ApiError(400, "Invalid quantity");
                if (product.stockQty < quantity) throw new ApiError(409, `Insufficient stock for ${item.productId}`);

                subtotal += product.price * quantity;
                orderItems.push({ productId: product._id, quantity, unit_price: product.price, total_price: product.price * quantity });
            }

            for (const oi of orderItems) {
                const upd = await Product.updateOne({ _id: oi.productId, stockQty: { $gte: oi.quantity } }, { $inc: { stockQty: -oi.quantity } }, { session });
                if (upd.modifiedCount === 0) throw new ApiError(409, `Stock changed for ${oi.productId}, retry`);
            }

            let discount = 0;
            if (coupon) {
                const d = await Discount.findOneAndUpdate(
                    {
                        discount_code: String(coupon).toUpperCase(),
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
                if (!d) throw new ApiError(400, "Invalid or expired coupon");
                discount = d.discount_type === "fixed_amount" ? d.amount : Math.round((subtotal * d.amount) / 100);
                discount = Math.min(discount, subtotal);
            }

            const shipping = SHIPPING_FLAT;
            const tax = 0;
            const total = subtotal + shipping + tax - discount;

            const counter = await Counter.findOneAndUpdate(
                { name: "order" },
                { $inc: { seq: 1 } },
                { new: true, upsert: true, session }
            );

            const created = await Order.create([{
                orderNumber: counter.seq,
                userId,
                items: orderItems,
                shipping, tax, discount, subtotal, total,
                shipping_address, billing_address,
            }], { session });
            order = created[0];
        });

        res.status(201).json(order);
    } catch (error) {
        handleError(error, req, res);
    } finally {
        session.endSession();
    }
};

export const updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid order ID");

        const order = await Order.findById(id);
        if (!order) throw new ApiError(404, "Order not found");

        const { status, shipment, shipping_address, billing_address } = req.body;

        if (status === "cancelled") {
            if (req.user.role !== "admin" && String(order.userId) !== String(req.user.id)) throw new ApiError(403, "You are not authorized to cancel this order");
            if (order.status === "fulfilled") throw new ApiError(400, "Fulfilled orders cannot be cancelled");
            if (order.status === "cancelled") throw new ApiError(400, "Order is already cancelled");

            const session = await mongoose.startSession();
            try {
                await session.withTransaction(async () => {
                    for (const item of order.items) {
                        await Product.updateOne({ _id: item.productId }, { $inc: { stockQty: item.quantity } }, { session });
                    }
                    order.status = "cancelled";
                    order.cancelledAt = new Date();
                    order.cancellationReason = req.body.cancellationReason || "Customer cancelled order";
                    await order.save({ session });
                });
            } finally {
                session.endSession();
            }

            const populated = await Order.findById(order._id).populate("userId", USER_FIELDS).populate("items.productId", PRODUCT_FIELDS).lean();
            return res.status(200).json({ message: "Order cancelled successfully. Stock has been restored.", order: populated });
        }

        if (status && status !== "cancelled" && req.user.role !== "admin") throw new ApiError(403, "Only admins can update order status");
        if (shipment && req.user.role !== "admin") throw new ApiError(403, "Only admins can update shipment details");
        if ((shipping_address || billing_address) && req.user.role !== "admin") throw new ApiError(403, "Only admins can update addresses");

        if (status) order.status = status;
        if (shipment) order.shipment = { ...(order.shipment?.toObject?.() || order.shipment), ...shipment };
        if (shipping_address) order.shipping_address = shipping_address;
        if (billing_address) order.billing_address = billing_address;

        await order.save();
        const populated = await Order.findById(order._id).populate("userId", USER_FIELDS).populate("items.productId", PRODUCT_FIELDS).lean();
        res.status(200).json({ message: "Order updated successfully", order: populated });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const cancelOrder = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid order ID");

        const order = await Order.findById(id);
        if (!order) throw new ApiError(404, "Order not found");
        if (req.user.role !== "admin" && String(order.userId) !== String(req.user.id)) throw new ApiError(403, "You are not authorized to cancel this order");
        if (order.status === "fulfilled") throw new ApiError(400, "Fulfilled orders cannot be cancelled");
        if (order.status === "cancelled") throw new ApiError(400, "Order is already cancelled");

        let cancelledOrder;
        await session.withTransaction(async () => {
            for (const item of order.items) {
                await Product.updateOne({ _id: item.productId }, { $inc: { stockQty: item.quantity } }, { session });
            }
            order.status = "cancelled";
            order.cancelledAt = new Date();
            order.cancellationReason = reason || "Customer cancelled order";
            await order.save({ session });
            cancelledOrder = order;
        });

        const populated = await Order.findById(cancelledOrder._id).populate("userId", USER_FIELDS).populate("items.productId", PRODUCT_FIELDS).lean();
        res.status(200).json({ success: true, message: "Order cancelled successfully. Stock has been restored.", order: populated });
    } catch (error) {
        if (error instanceof ApiError) {
            handleError(error, req, res);
        } else {
            console.error("Cancel order error:", error);
            handleError(new ApiError(500, "Failed to cancel order"), req, res);
        }
    } finally {
        session.endSession();
    }
};

export const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid order ID");

        const order = await Order.findById(id);
        if (!order) throw new ApiError(404, "Order not found");
        if (order.status !== "cancelled") throw new ApiError(400, "Only cancelled orders can be deleted");

        await Order.findByIdAndDelete(id);
        res.json({ status: "success", message: "Order deleted successfully" });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getMyOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Number(req.query.limit) || 20);

        const filter = { userId };
        if (req.query.status) filter.status = req.query.status;

        const [data, total] = await Promise.all([
            Order.find(filter).populate("userId", USER_FIELDS).populate("items.productId", PRODUCT_FIELDS)
                .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
            Order.countDocuments(filter),
        ]);

        res.status(200).json({ success: true, data, total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
        handleError(error, req, res);
    }
};