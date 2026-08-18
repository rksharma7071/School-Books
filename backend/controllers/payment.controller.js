// controllers/payment.controller.js
import mongoose from "mongoose";
import { Order } from "../models/order.model.js";
import { Payment } from "../models/payment.model.js";

const ORDER_POPULATE = {
    path: "orderId",
    select: "orderNumber status subtotal shipping tax discount total items userId createdAt",
    populate: [
        { path: "userId", select: "email role first_name last_name username" },
        { path: "items.bookId", select: "name price coverImage" },
    ],
};

const normalize = (p) => ({
    ...p,
    order: p.orderId || null,
    user: p.orderId?.userId || null,
});

async function getAllPayment(req, res) {
    try {
        const filter = {};
        if (req.query.status) filter.status = req.query.status;

        const payments = await Payment.find(filter)
            .populate(ORDER_POPULATE)
            .sort({ createdAt: -1 })
            .lean();

        return res.json(payments.map(normalize));
    } catch (error) {
        console.error("Get payments error:", error);
        return res.status(500).json({ message: "Failed to fetch payments" });
    }
}

async function getPaymentById(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid payment ID" });
        }

        const payment = await Payment.findById(id)
            .populate(ORDER_POPULATE)
            .lean();

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        return res.json(normalize(payment));
    } catch (error) {
        console.error("Get payment error:", error);
        return res.status(500).json({ message: "Failed to fetch payment" });
    }
}

// ✅ FIXED: Payment creation with proper validation
async function createPayment(req, res) {
    try {
        const {
            orderId,
            provider,
            status,
            amount, // ❌ This should be verified
            transactionId,
            currency,
        } = req.body;

        // ✅ Validate required fields
        if (!orderId || !provider || !status || !transactionId) {
            return res.status(400).json({
                message: "orderId, provider, status, and transactionId are required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: "Invalid order ID" });
        }

        // ✅ Validate provider
        const validProviders = ["stripe", "paypal", "razorpay", "shopify_payments"];
        if (!validProviders.includes(provider)) {
            return res.status(400).json({
                message: `Invalid provider. Must be one of: ${validProviders.join(", ")}`
            });
        }

        // ✅ Validate status
        const validStatuses = ["pending", "paid", "failed", "refunded"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
            });
        }

        // ✅ Verify order exists and get order details
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order does not exist" });
        }

        // ✅ CRITICAL: Verify amount matches order total
        // This prevents admin from creating payments with incorrect amounts
        const expectedAmount = order.total;
        const providedAmount = amount !== undefined ? Number(amount) : expectedAmount;

        if (providedAmount !== expectedAmount) {
            return res.status(400).json({
                message: `Amount mismatch. Expected ${expectedAmount}, got ${providedAmount}`
            });
        }

        // ✅ Use verified amount and currency
        const verifiedAmount = expectedAmount;
        const verifiedCurrency = currency || "INR";

        // ✅ Check if payment already exists for this order
        const existingPayment = await Payment.findOne({ orderId: order._id });
        if (existingPayment) {
            return res.status(409).json({
                message: "A payment already exists for this order"
            });
        }

        // ✅ Check if transactionId is unique
        const existingTransaction = await Payment.findOne({ transactionId });
        if (existingTransaction) {
            return res.status(409).json({
                message: "A payment with this transaction ID already exists"
            });
        }

        // ✅ Create payment with verified data
        const payment = await Payment.create({
            orderId,
            provider,
            status,
            amount: verifiedAmount, // ✅ Use verified amount
            transactionId,
            currency: verifiedCurrency, // ✅ Use verified currency
            paymentDate: status === "paid" ? new Date() : null,
        });

        // ✅ Update order status if payment is marked as paid
        if (status === "paid" && order.status !== "fulfilled") {
            order.status = "fulfilled";
            order.paymentId = transactionId;
            order.paymentDate = new Date();
            await order.save();
        }

        return res.status(201).json({
            message: "Payment successfully created",
            payment,
        });
    } catch (error) {
        console.error("Create Payment Error:", error);

        if (error.code === 11000) {
            return res
                .status(409)
                .json({ message: "A payment already exists for this order or transaction ID" });
        }

        return res.status(500).json({ message: "Internal server error" });
    }
}

async function deletePayment(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid payment ID" });
        }

        const payment = await Payment.findByIdAndDelete(id);

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        return res.status(200).json({
            status: "success",
            message: "Payment deleted successfully.",
        });
    } catch (error) {
        console.error("Delete payment error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

// ✅ Get payment by order ID
async function getPaymentByOrderId(req, res) {
    try {
        const { orderId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: "Invalid order ID" });
        }

        const payment = await Payment.findOne({ orderId })
            .populate(ORDER_POPULATE)
            .lean();

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        return res.json(normalize(payment));
    } catch (error) {
        console.error("Get payment by order error:", error);
        return res.status(500).json({ message: "Failed to fetch payment" });
    }
}

export {
    getAllPayment,
    getPaymentById,
    getPaymentByOrderId,
    createPayment,
    deletePayment,
};