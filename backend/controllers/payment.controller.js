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

async function createPayment(req, res) {
    try {
        const { orderId, provider, status, amount, transactionId, currency } =
            req.body;

        if (
            !orderId ||
            !provider ||
            !status ||
            !amount ||
            !transactionId ||
            !currency
        ) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: "Invalid order ID" });
        }

        const existingOrder = await Order.findById(orderId).select("_id").lean();

        if (!existingOrder) {
            return res.status(404).json({ message: "Order does not exist" });
        }

        const payment = await Payment.create({
            orderId,
            provider,
            status,
            amount,
            transactionId,
            currency,
        });

        return res.status(201).json({
            message: "Payment successfully created",
            payment,
        });
    } catch (error) {
        console.error("Create Payment Error:", error);

        if (error.code === 11000) {
            return res
                .status(409)
                .json({ message: "A payment already exists for this order" });
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

export { getAllPayment, getPaymentById, createPayment, deletePayment };