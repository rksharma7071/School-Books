// controllers/razorpay.controller.js
import razorpay from "../config/razorpay.js";
import crypto from "crypto";
import { Order } from "../models/order.model.js";
import { Payment } from "../models/payment.model.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

// ✅ Helper function to verify payment with Razorpay API
const verifyRazorpayPaymentDetails = async (razorpayPaymentId, expectedAmount, expectedCurrency) => {
    try {
        // Fetch payment details from Razorpay API
        const payment = await razorpay.payments.fetch(razorpayPaymentId);

        // Verify payment exists
        if (!payment) {
            throw new Error("Payment not found in Razorpay");
        }

        // ✅ Verify amount matches (Razorpay returns amount in paise)
        const actualAmount = payment.amount / 100; // Convert from paise to rupees
        if (actualAmount !== expectedAmount) {
            throw new Error(`Amount mismatch: Expected ${expectedAmount}, got ${actualAmount}`);
        }

        // ✅ Verify currency matches
        if (payment.currency !== expectedCurrency) {
            throw new Error(`Currency mismatch: Expected ${expectedCurrency}, got ${payment.currency}`);
        }

        // ✅ Verify payment status is captured
        if (payment.status !== "captured") {
            throw new Error(`Payment not captured. Status: ${payment.status}`);
        }

        // ✅ Verify payment method exists
        if (!payment.method) {
            throw new Error("Invalid payment method");
        }

        return payment;
    } catch (error) {
        console.error("Razorpay payment verification error:", error);
        throw error;
    }
};

const createRazorpayOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.body;

    if (!orderId) {
        return res.status(400).json({
            success: false,
            message: "Order ID is required"
        });
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Order not found"
        });
    }

    // ✅ Security Check: Verify user owns the order
    if (
        req.user.role !== "admin" &&
        String(order.userId) !== String(req.user.id)
    ) {
        return res.status(403).json({
            success: false,
            message: "You are not authorized to pay for this order",
        });
    }

    // ✅ Check if order is already paid
    if (order.status === "fulfilled") {
        return res.status(400).json({
            success: false,
            message: "This order has already been fulfilled",
        });
    }

    // ✅ Check if order is cancelled
    if (order.status === "cancelled") {
        return res.status(400).json({
            success: false,
            message: "This order has been cancelled",
        });
    }

    // ✅ Check if payment already exists for this order
    const existingPayment = await Payment.findOne({ orderId: order._id });
    if (existingPayment) {
        return res.status(400).json({
            success: false,
            message: "A payment already exists for this order",
        });
    }

    try {
        // Create Razorpay order
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(order.total * 100), // Convert to paise
            currency: "INR",
            receipt: `ORD-${order.orderNumber}`,
            notes: {
                orderId: order._id.toString(),
                userId: req.user.id,
                orderNumber: order.orderNumber.toString(),
                amount: order.total.toString(),
                currency: "INR"
            },
        });

        // ✅ Store the Razorpay order ID in the order for verification
        order.razorpayOrderId = razorpayOrder.id;
        order.razorpayOrderDetails = {
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            receipt: razorpayOrder.receipt,
            createdAt: new Date()
        };
        await order.save();

        return res.status(200).json({
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
        return res.status(500).json({
            success: false,
            message: "Failed to create Razorpay order",
            error: error.message,
        });
    }
});

const verifyRazorpayPayment = asyncHandler(async (req, res) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        orderId,
    } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
        return res.status(400).json({
            success: false,
            message: "Missing required payment verification fields",
        });
    }

    // ✅ Step 1: Verify signature first
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");

    const sigValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(razorpay_signature)
    );

    if (!sigValid) {
        return res.status(400).json({
            success: false,
            message: "Invalid payment signature",
        });
    }

    // ✅ Step 2: Find the order
    const order = await Order.findById(orderId);
    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Order not found",
        });
    }

    // ✅ Step 3: Verify user owns the order
    if (
        req.user.role !== "admin" &&
        String(order.userId) !== String(req.user.id)
    ) {
        return res.status(403).json({
            success: false,
            message: "You are not authorized to verify payment for this order",
        });
    }

    // ✅ Step 4: Verify Razorpay order ID matches
    if (!order.razorpayOrderId) {
        return res.status(400).json({
            success: false,
            message: "No Razorpay order associated with this order",
        });
    }

    if (order.razorpayOrderId !== razorpay_order_id) {
        return res.status(400).json({
            success: false,
            message: "Payment does not belong to this order",
        });
    }

    // ✅ Step 5: Verify payment details with Razorpay API
    try {
        const paymentDetails = await verifyRazorpayPaymentDetails(
            razorpay_payment_id,
            order.total,
            "INR"
        );

        // ✅ Step 6: Check if payment already exists (idempotency)
        const existingPayment = await Payment.findOne({
            transactionId: razorpay_payment_id,
        });

        if (existingPayment) {
            return res.status(200).json({
                success: true,
                message: "Payment already verified",
                data: {
                    payment: existingPayment,
                    order: order,
                },
            });
        }

        // ✅ Step 7: Check if a payment already exists for this order
        const existingOrderPayment = await Payment.findOne({
            orderId: order._id,
        });

        if (existingOrderPayment) {
            return res.status(400).json({
                success: false,
                message: "A payment already exists for this order",
            });
        }

        // ✅ Step 8: Check order status
        if (order.status === "fulfilled") {
            return res.status(400).json({
                success: false,
                message: "This order has already been fulfilled",
            });
        }

        if (order.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "This order has been cancelled",
            });
        }

        // ✅ Step 9: Create payment record with verified data
        const payment = await Payment.create({
            orderId: order._id,
            provider: "razorpay",
            status: "paid",
            amount: order.total, // ✅ Use order total, not client input
            transactionId: razorpay_payment_id,
            currency: "INR", // ✅ Use verified currency
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

        // ✅ Step 10: Update order status
        order.status = "fulfilled";
        order.paymentId = razorpay_payment_id;
        order.paymentDate = new Date();
        order.paymentVerified = true;
        await order.save();

        return res.status(200).json({
            success: true,
            message: "Payment verified successfully",
            data: {
                payment,
                order,
            },
        });
    } catch (error) {
        console.error("Payment verification error:", error);

        // ✅ If payment verification fails, update order status
        if (order.status !== "cancelled") {
            order.status = "unfulfilled";
            await order.save();
        }

        return res.status(400).json({
            success: false,
            message: error.message || "Payment verification failed",
        });
    }
});

const handleRazorpayWebhook = asyncHandler(async (req, res) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    // Webhook secret must always be configured
    if (!webhookSecret) {
        console.error("RAZORPAY_WEBHOOK_SECRET is not configured");

        return res.status(500).json({
            success: false,
            message: "Webhook secret is not configured",
        });
    }

    // Signature header is required
    if (!signature) {
        return res.status(400).json({
            success: false,
            message: "Missing Razorpay webhook signature",
        });
    }

    // express.raw() gives us the original request body as Buffer
    if (!Buffer.isBuffer(req.body)) {
        console.error("Razorpay webhook body is not a Buffer");

        return res.status(400).json({
            success: false,
            message: "Invalid webhook body",
        });
    }

    const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(req.body)
        .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const receivedBuffer = Buffer.from(signature, "utf8");

    // Avoid timingSafeEqual throwing on different lengths
    if (
        expectedBuffer.length !== receivedBuffer.length ||
        !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
        console.error("Invalid Razorpay webhook signature");

        return res.status(400).json({
            success: false,
            message: "Invalid webhook signature",
        });
    }

    let webhookData;

    try {
        webhookData = JSON.parse(req.body.toString("utf8"));
    } catch (error) {
        console.error("Invalid webhook JSON:", error);

        return res.status(400).json({
            success: false,
            message: "Invalid webhook payload",
        });
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
                    console.warn(
                        `Webhook: Razorpay order ID mismatch for order ${orderId}`
                    );
                    break;
                }

                const existingPayment = await Payment.findOne({
                    transactionId: paymentId,
                });

                if (!existingPayment) {
                    const existingOrderPayment = await Payment.findOne({
                        orderId: order._id,
                    });

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
                const failedOrderId =
                    payload?.payment?.entity?.notes?.orderId;

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
                const refundOrderId =
                    payload?.payment?.entity?.notes?.orderId;

                if (refundOrderId) {
                    const order = await Order.findById(refundOrderId);

                    if (order) {
                        order.status = "cancelled";
                        await order.save();

                        await Payment.findOneAndUpdate(
                            { orderId: order._id },
                            { status: "refunded" }
                        );
                    }
                }

                break;
            }

            default:
                console.log(`Unhandled Razorpay webhook event: ${event}`);
        }

        return res.status(200).json({
            success: true,
            message: "Webhook processed successfully",
        });
    } catch (error) {
        console.error("Webhook processing error:", error);

        return res.status(500).json({
            success: false,
            message: "Webhook processing failed",
        });
    }
});

export {
    createRazorpayOrder,
    verifyRazorpayPayment,
    handleRazorpayWebhook
}