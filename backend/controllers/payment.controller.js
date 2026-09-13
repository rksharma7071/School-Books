import mongoose from "mongoose";
import { Order } from "../models/order.model.js";
import { Payment } from "../models/payment.model.js";
import { ApiError, handleError } from "../utils/apiError.js";

const ORDER_POPULATE = {
    path: "orderId",
    select: "orderNumber status subtotal shipping tax discount total items userId createdAt",
    populate: [
        { path: "userId", select: "email role name" },
        { path: "items.productId", select: "name price coverImage" },
    ],
};

const normalize = (p) => ({
    ...p,
    order: p.orderId || null,
    user: p.orderId?.userId || null,
});

export const getAllPayment = async (req, res) => {
    try {
        const filter = {};
        if (req.query.status) filter.status = req.query.status;

        const payments = await Payment.find(filter).populate(ORDER_POPULATE).sort({ createdAt: -1 }).lean();
        res.json(payments.map(normalize));
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getPaymentById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid payment ID");

        const payment = await Payment.findById(id).populate(ORDER_POPULATE).lean();
        if (!payment) throw new ApiError(404, "Payment not found");

        res.json(normalize(payment));
    } catch (error) {
        handleError(error, req, res);
    }
};

export const createPayment = async (req, res) => {
    try {
        const { orderId, provider, status, amount, transactionId, currency } = req.body;

        if (!orderId || !provider || !status || !transactionId) throw new ApiError(400, "orderId, provider, status, and transactionId are required");
        if (!mongoose.Types.ObjectId.isValid(orderId)) throw new ApiError(400, "Invalid order ID");

        const validProviders = ["stripe", "paypal", "razorpay", "shopify_payments"];
        if (!validProviders.includes(provider)) throw new ApiError(400, `Invalid provider. Must be one of: ${validProviders.join(", ")}`);

        const validStatuses = ["pending", "paid", "failed", "refunded"];
        if (!validStatuses.includes(status)) throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(", ")}`);

        const order = await Order.findById(orderId);
        if (!order) throw new ApiError(404, "Order does not exist");

        const expectedAmount = order.total;
        const providedAmount = amount !== undefined ? Number(amount) : expectedAmount;
        if (providedAmount !== expectedAmount) throw new ApiError(400, `Amount mismatch. Expected ${expectedAmount}, got ${providedAmount}`);

        const existingPayment = await Payment.findOne({ orderId: order._id });
        if (existingPayment) throw new ApiError(409, "A payment already exists for this order");

        const existingTransaction = await Payment.findOne({ transactionId });
        if (existingTransaction) throw new ApiError(409, "A payment with this transaction ID already exists");

        const payment = await Payment.create({
            orderId,
            provider,
            status,
            amount: expectedAmount,
            transactionId,
            currency: currency || "INR",
            paymentDate: status === "paid" ? new Date() : null,
        });

        if (status === "paid" && order.status !== "fulfilled") {
            order.status = "fulfilled";
            order.paymentId = transactionId;
            order.paymentDate = new Date();
            await order.save();
        }

        res.status(201).json({ message: "Payment successfully created", payment });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const deletePayment = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid payment ID");

        const payment = await Payment.findByIdAndDelete(id);
        if (!payment) throw new ApiError(404, "Payment not found");

        res.status(200).json({ status: "success", message: "Payment deleted successfully." });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getPaymentByOrderId = async (req, res) => {
    try {
        const { orderId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(orderId)) throw new ApiError(400, "Invalid order ID");

        const payment = await Payment.findOne({ orderId }).populate(ORDER_POPULATE).lean();
        if (!payment) throw new ApiError(404, "Payment not found");

        res.json(normalize(payment));
    } catch (error) {
        handleError(error, req, res);
    }
};