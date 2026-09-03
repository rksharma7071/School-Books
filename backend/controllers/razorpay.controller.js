import razorpay from "../config/razorpay.js";
import crypto from "crypto";
import { Order } from "../models/order.model.js";
import { Payment } from "../models/payment.model.js";
import { asyncHandler, ApiError } from "../middlewares/asyncHandler.js";

const verifyRazorpayPaymentDetails = async (razorpayPaymentId, expectedAmount, expectedCurrency) => {
    const payment = await razorpay.payments.fetch(razorpayPaymentId);
    if (!payment) throw new Error("Payment not found in Razorpay");

    const actualAmount = payment.amount / 100;
    if (actualAmount !== expectedAmount) throw new Error(`Amount mismatch: Expected ${expectedAmount}, got ${actualAmount}`);
    if (payment.currency !== expectedCurrency) throw new Error(`Currency mismatch: Expected ${expectedCurrency}, got ${payment.currency}`);
    if (payment.status !== "captured") throw new Error(`Payment not captured. Status: ${payment.status}`);
    if (!payment.method) throw new Error("Invalid payment method");

    return payment;
};

export const createRazorpayOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.body;
    if (!orderId) throw new ApiError(400, "Order ID is required");

    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, "Order not found");
    if (req.user.role !== "admin" && String(order.userId) !== String(req.user.id)) throw new ApiError(403, "You are not authorized to pay for this order");
    if (order.status === "fulfilled") throw new ApiError(400, "This order has already been fulfilled");
    if (order.status === "cancelled") throw new ApiError(400, "This order has been cancelled");

    const existingPayment = await Payment.findOne({ orderId: order._id });
    if (existingPayment) throw new ApiError(400, "A payment already exists for this order");

    try {
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(order.total * 100),
            currency: "INR",
            receipt: `ORD-${order.orderNumber}`,
            notes: {
                orderId: order._id.toString(),
                userId: req.user.id,
                orderNumber: order.orderNumber.toString(),
                amount: order.total.toString(),
                currency: "INR",
            },
        });

        order.razorpayOrderId = razorpayOrder.id;
        order.razorpayOrderDetails = {
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            receipt: razorpayOrder.receipt,
            createdAt: new Date(),
        };
        await order.save();

        res.status(200).json({
            success: true,
            data: {
                orderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                receipt: razorpayOrder.receipt,
                keyId: process.env.RAZORPAY_KEY_ID,
            },
            razorpayOrder,
        });
    } catch (error) {
        console.error("Razorpay order creation error:", error);
        throw new ApiError(500, "Failed to create Razorpay order");
    }
});

export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) throw new ApiError(400, "Missing required payment verification fields");

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(body).digest("hex");
    const sigValid = crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpay_signature));
    if (!sigValid) throw new ApiError(400, "Invalid payment signature");

    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, "Order not found");
    if (req.user.role !== "admin" && String(order.userId) !== String(req.user.id)) throw new ApiError(403, "You are not authorized to verify payment for this order");
    if (!order.razorpayOrderId) throw new ApiError(400, "No Razorpay order associated with this order");
    if (order.razorpayOrderId !== razorpay_order_id) throw new ApiError(400, "Payment does not belong to this order");

    try {
        const paymentDetails = await verifyRazorpayPaymentDetails(razorpay_payment_id, order.total, "INR");

        const existingPayment = await Payment.findOne({ transactionId: razorpay_payment_id });
        if (existingPayment) {
            return res.status(200).json({ success: true, message: "Payment already verified", data: { payment: existingPayment, order } });
        }

        const existingOrderPayment = await Payment.findOne({ orderId: order._id });
        if (existingOrderPayment) throw new ApiError(400, "A payment already exists for this order");
        if (order.status === "fulfilled") throw new ApiError(400, "This order has already been fulfilled");
        if (order.status === "cancelled") throw new ApiError(400, "This order has been cancelled");

        const payment = await Payment.create({
            orderId: order._id,
            provider: "razorpay",
            status: "paid",
            amount: order.total,
            transactionId: razorpay_payment_id,
            currency: "INR",
            razorpayOrderId: razorpay_order_id,
            paymentDate: new Date(),
            paymentMethod: paymentDetails.method,
            paymentDetails: {
                bank: paymentDetails.bank,
                wallet: paymentDetails.wallet,
                vpa: paymentDetails.vpa,
                email: paymentDetails.email,
                contact: paymentDetails.contact,
            },
        });

        order.status = "fulfilled";
        order.paymentId = razorpay_payment_id;
        order.paymentDate = new Date();
        order.paymentVerified = true;
        await order.save();

        res.status(200).json({ success: true, message: "Payment verified successfully", data: { payment, order } });
    } catch (error) {
        console.error("Payment verification error:", error);
        if (order.status !== "cancelled") {
            order.status = "unfulfilled";
            await order.save();
        }
        throw new ApiError(400, error.message || "Payment verification failed");
    }
});

export const handleRazorpayWebhook = asyncHandler(async (req, res) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    if (!webhookSecret) {
        console.error("RAZORPAY_WEBHOOK_SECRET is not configured");
        throw new ApiError(500, "Webhook secret is not configured");
    }
    if (!signature) throw new ApiError(400, "Missing Razorpay webhook signature");
    if (!Buffer.isBuffer(req.body)) throw new ApiError(400, "Invalid webhook body");

    const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(req.body).digest("hex");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const receivedBuffer = Buffer.from(signature, "utf8");

    if (expectedBuffer.length !== receivedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
        console.error("Invalid Razorpay webhook signature");
        throw new ApiError(400, "Invalid webhook signature");
    }

    let webhookData;
    try {
        webhookData = JSON.parse(req.body.toString("utf8"));
    } catch (error) {
        console.error("Invalid webhook JSON:", error);
        throw new ApiError(400, "Invalid webhook payload");
    }

    const { event, payload } = webhookData;

    try {
        switch (event) {
            case "payment.captured": {
                const paymentEntity = payload?.payment?.entity;
                if (!paymentEntity) {
                    console.warn("Webhook: payment entity missing");
                    break;
                }

                const paymentId = paymentEntity.id;
                const razorpayOrderId = paymentEntity.order_id;
                const orderId = paymentEntity.notes?.orderId;
                if (!orderId) {
                    console.warn("Webhook: No orderId in payment notes");
                    break;
                }

                const order = await Order.findById(orderId);
                if (!order) {
                    console.warn(`Webhook: Order ${orderId} not found`);
                    break;
                }
                if (order.razorpayOrderId !== razorpayOrderId) {
                    console.warn(`Webhook: Razorpay order ID mismatch for order ${orderId}`);
                    break;
                }

                const existingPayment = await Payment.findOne({ transactionId: paymentId });
                if (!existingPayment) {
                    const existingOrderPayment = await Payment.findOne({ orderId: order._id });
                    if (!existingOrderPayment) {
                        await Payment.create({
                            orderId: order._id,
                            provider: "razorpay",
                            status: "paid",
                            amount: order.total,
                            transactionId: paymentId,
                            currency: paymentEntity.currency || "INR",
                            razorpayOrderId,
                            paymentDate: new Date(),
                            paymentMethod: paymentEntity.method,
                        });
                    }
                }

                if (order.status !== "fulfilled") {
                    order.status = "fulfilled";
                    order.paymentId = paymentId;
                    order.paymentDate = new Date();
                    order.paymentVerified = true;
                    await order.save();
                }
                break;
            }

            case "payment.failed": {
                const failedOrderId = payload?.payment?.entity?.notes?.orderId;
                if (failedOrderId) {
                    const order = await Order.findById(failedOrderId);
                    if (order && order.status !== "fulfilled") {
                        order.status = "unfulfilled";
                        await order.save();
                    }
                }
                break;
            }

            case "payment.refunded": {
                const refundOrderId = payload?.payment?.entity?.notes?.orderId;
                if (refundOrderId) {
                    const order = await Order.findById(refundOrderId);
                    if (order) {
                        order.status = "cancelled";
                        await order.save();
                        await Payment.findOneAndUpdate({ orderId: order._id }, { status: "refunded" });
                    }
                }
                break;
            }

            default:
                console.log(`Unhandled Razorpay webhook event: ${event}`);
        }

        res.status(200).json({ success: true, message: "Webhook processed successfully" });
    } catch (error) {
        console.error("Webhook processing error:", error);
        throw new ApiError(500, "Webhook processing failed");
    }
});