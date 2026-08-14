import razorpay from "../config/razorpay.js";
import crypto from "crypto";
import { Order } from "../models/order.model.js";
import { Payment } from "../models/payment.model.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

export const createRazorpayOrder = asyncHandler(async (req, res) => {
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
});

export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
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

    const sigValid =
        razorpay_signature &&
        expectedSignature.length === razorpay_signature.length &&
        crypto.timingSafeEqual(
            Buffer.from(expectedSignature),
            Buffer.from(razorpay_signature)
        );

    if (!sigValid) {
        return res.status(400).json({ message: "Invalid payment signature" });
    }

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

    order.status = "fulfilled";
    order.paymentId = razorpay_payment_id;
    await order.save();

    res.json({ success: true, payment });
});
