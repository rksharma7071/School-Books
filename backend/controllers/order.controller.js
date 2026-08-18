import mongoose from "mongoose";
import { Order } from "../models/order.model.js";
import { Book } from "../models/book.model.js";
import { Discount } from "../models/discount.model.js";
import Counter from "../models/counter.model.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

const USER_FIELDS = "first_name last_name email username";
const BOOK_FIELDS = "name price coverImage author";

const getAllOrder = asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);

    const filter = {};
    if (req.query.userId && mongoose.Types.ObjectId.isValid(req.query.userId)) {
        filter.userId = req.query.userId;
    }
    if (req.query.status) filter.status = req.query.status;

    const [data, total] = await Promise.all([
        Order.find(filter)
            .populate("userId", USER_FIELDS)
            .populate("items.bookId", BOOK_FIELDS)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Order.countDocuments(filter),
    ]);

    return res
        .status(200)
        .json({ data, total, page, pages: Math.ceil(total / limit) });
});

const getOrderById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
        return res.status(400).json({ message: "Invalid order ID" });
    const order = await Order.findById(id)
        .populate("userId", USER_FIELDS)
        .populate("items.bookId", BOOK_FIELDS)
        .lean();
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (req.user.role !== "admin" && String(order.userId?._id) !== String(req.user.id))
        return res.status(403).json({ message: "Access denied" });
    return res.status(200).json(order);
});

const SHIPPING_FLAT = 50;

const createOrder = asyncHandler(async (req, res) => {
    const { items, shipping_address, billing_address, coupon } = req.body;
    const userId = req.user.id;

    if (!items?.length)
        return res.status(400).json({ message: "Order must have items" });
    if (!shipping_address || !billing_address)
        return res.status(400).json({ message: "shipping_address and billing_address required" });

    const ids = [...new Set(items.map((i) => String(i.bookId)))];
    if (ids.some((id) => !mongoose.Types.ObjectId.isValid(id)))
        return res.status(400).json({ message: "Invalid book ID in items" });

    const session = await mongoose.startSession();
    try {
        let order;
        await session.withTransaction(async () => {
            const books = await Book.find({ _id: { $in: ids } })
                .select("price stockQty isActive")
                .session(session)
                .lean();
            const bookMap = new Map(books.map((b) => [String(b._id), b]));

            let subtotal = 0;
            const orderItems = [];
            for (const item of items) {
                const book = bookMap.get(String(item.bookId));
                if (!book || book.isActive === false)
                    throw Object.assign(new Error(`Book not available: ${item.bookId}`), { status: 404 });
                const quantity = Number(item.quantity) || 1;
                if (quantity < 1)
                    throw Object.assign(new Error("Invalid quantity"), { status: 400 });
                if (book.stockQty < quantity)
                    throw Object.assign(new Error(`Insufficient stock for ${item.bookId}`), { status: 409 });

                subtotal += book.price * quantity;
                orderItems.push({
                    bookId: book._id,
                    quantity,
                    unit_price: book.price,
                    total_price: book.price * quantity,
                });
            }

            for (const oi of orderItems) {
                const upd = await Book.updateOne(
                    { _id: oi.bookId, stockQty: { $gte: oi.quantity } },
                    { $inc: { stockQty: -oi.quantity } },
                    { session }
                );
                if (upd.modifiedCount === 0)
                    throw Object.assign(new Error(`Stock changed for ${oi.bookId}, retry`), { status: 409 });
            }

            let discount = 0;
            if (coupon) {
                // ✅ Now Discount is properly imported and can be used
                const d = await Discount.findOneAndUpdate(
                    {
                        discount_code: String(coupon).toUpperCase(),
                        active: true,
                        $and: [
                            { $or: [{ starts_at: null }, { starts_at: { $lte: new Date() } }] },
                            { $or: [{ ends_at: null }, { ends_at: { $gte: new Date() } }] },
                            {
                                $expr: {
                                    $or: [
                                        { $eq: ["$usage_limit", null] },
                                        { $lt: ["$used_count", "$usage_limit"] },
                                    ]
                                }
                            },
                        ],
                    },
                    { $inc: { used_count: 1 } },
                    { new: true, session }
                );
                if (!d) throw Object.assign(new Error("Invalid or expired coupon"), { status: 400 });
                discount = d.discount_type === "fixed_amount"
                    ? d.amount
                    : Math.round((subtotal * d.amount) / 100);
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

        return res.status(201).json(order);
    } finally {
        session.endSession();
    }
});

const updateOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
    }

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const { status, shipment, shipping_address, billing_address } = req.body;

    // ✅ Handle cancellation with stock restoration
    if (status === "cancelled") {
        // Check if user is authorized to cancel
        if (req.user.role !== "admin" && String(order.userId) !== String(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to cancel this order",
            });
        }

        // Can't cancel fulfilled orders
        if (order.status === "fulfilled") {
            return res.status(400).json({
                success: false,
                message: "Fulfilled orders cannot be cancelled",
            });
        }

        // Can't cancel already cancelled orders
        if (order.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Order is already cancelled",
            });
        }

        // ✅ RESTORE STOCK for cancelled orders
        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                // Restore stock for each item
                for (const item of order.items) {
                    await Book.updateOne(
                        { _id: item.bookId },
                        { $inc: { stockQty: item.quantity } },
                        { session }
                    );
                }

                // Update order status
                order.status = "cancelled";
                order.cancelledAt = new Date();
                order.cancellationReason = req.body.cancellationReason || "Customer cancelled order";
                await order.save({ session });
            });
        } finally {
            session.endSession();
        }

        const populated = await Order.findById(order._id)
            .populate("userId", USER_FIELDS)
            .populate("items.bookId", BOOK_FIELDS)
            .lean();

        return res.status(200).json({
            message: "Order cancelled successfully. Stock has been restored.",
            order: populated,
        });
    }

    // Only admins can update status other than "cancelled"
    if (status && status !== "cancelled" && req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Only admins can update order status",
        });
    }

    // Only admins can update shipment details
    if (shipment && req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Only admins can update shipment details",
        });
    }

    // Only admins can update addresses
    if ((shipping_address || billing_address) && req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Only admins can update addresses",
        });
    }

    // Apply updates
    if (status) order.status = status;
    if (shipment) {
        order.shipment = {
            ...(order.shipment?.toObject?.() || order.shipment),
            ...shipment,
        };
    }
    if (shipping_address) order.shipping_address = shipping_address;
    if (billing_address) order.billing_address = billing_address;

    await order.save();

    const populated = await Order.findById(order._id)
        .populate("userId", USER_FIELDS)
        .populate("items.bookId", BOOK_FIELDS)
        .lean();

    return res
        .status(200)
        .json({ message: "Order updated successfully", order: populated });
});

const cancelOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
    }

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Check authorization
    if (req.user.role !== "admin" && String(order.userId) !== String(req.user.id)) {
        return res.status(403).json({
            success: false,
            message: "You are not authorized to cancel this order",
        });
    }

    // Check if order can be cancelled
    if (order.status === "fulfilled") {
        return res.status(400).json({
            success: false,
            message: "Fulfilled orders cannot be cancelled",
        });
    }

    if (order.status === "cancelled") {
        return res.status(400).json({
            success: false,
            message: "Order is already cancelled",
        });
    }

    const session = await mongoose.startSession();
    try {
        let cancelledOrder;
        await session.withTransaction(async () => {
            // Restore stock for each item
            for (const item of order.items) {
                await Book.updateOne(
                    { _id: item.bookId },
                    { $inc: { stockQty: item.quantity } },
                    { session }
                );
            }

            // Update order
            order.status = "cancelled";
            order.cancelledAt = new Date();
            order.cancellationReason = reason || "Customer cancelled order";
            await order.save({ session });

            cancelledOrder = order;
        });

        const populated = await Order.findById(cancelledOrder._id)
            .populate("userId", USER_FIELDS)
            .populate("items.bookId", BOOK_FIELDS)
            .lean();

        return res.status(200).json({
            success: true,
            message: "Order cancelled successfully. Stock has been restored.",
            order: populated,
        });
    } catch (error) {
        console.error("Cancel order error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to cancel order",
        });
    } finally {
        session.endSession();
    }
});

const deleteOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
    }

    // ✅ Only admins can delete orders, and only if they're cancelled
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status !== "cancelled") {
        return res.status(400).json({
            success: false,
            message: "Only cancelled orders can be deleted",
        });
    }

    await Order.findByIdAndDelete(id);
    return res.json({ status: "success", message: "Order deleted successfully" });
});

const getMyOrders = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);

    const filter = { userId };

    if (req.query.status) filter.status = req.query.status;

    const [data, total] = await Promise.all([
        Order.find(filter)
            .populate("userId", USER_FIELDS)
            .populate("items.bookId", BOOK_FIELDS)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Order.countDocuments(filter),
    ]);

    return res.status(200).json({
        success: true,
        data,
        total,
        page,
        pages: Math.ceil(total / limit),
    });
});


export { getAllOrder, getOrderById, getMyOrders, createOrder, updateOrder, cancelOrder, deleteOrder };