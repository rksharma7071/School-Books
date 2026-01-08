import razorpay from "../config/razorpay.js";
import crypto from "crypto";
import { Order } from "../models/order.model.js";
import { Payment } from "../models/payment.model.js";

export async function createRazorpayOrder(req, res) {
    try {
        const { orderId } = req.body;

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });

        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(order.total * 100),
            currency: "INR",
            receipt: `ORD-${order.orderNumber}`,
            notes: { orderId: order._id.toString() },
        });

        res.json({ success: true, razorpayOrder });
    } catch (error) {
        console.error("Razorpay order error:", error);
        res.status(500).json({ message: "Failed to create Razorpay order" });
    }
}

export async function verifyRazorpayPayment(req, res) {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderId,
        } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        if (expectedSignature !== razorpay_signature)
            return res
                .status(400)
                .json({ message: "Invalid payment signature" });

        const existingPayment = await Payment.findOne({
            transactionId: razorpay_payment_id,
        });

        if (existingPayment) {
            return res.json({
                success: true,
                message: "Payment already verified",
                payment: existingPayment,
            });
        }

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });

        const payment = await Payment.create({
            orderId: order._id,
            provider: "razorpay",
            status: "paid",
            amount: order.total,
            transactionId: razorpay_payment_id,
            currency: "INR",
        });

        // order.status = "fulfilled";
        order.paymentId = razorpay_payment_id;
        await order.save();

        res.json({ success: true, payment });
    } catch (error) {
        console.error("Payment verification error:", error);
        res.status(500).json({ message: "Payment verification failed" });
    }
}
