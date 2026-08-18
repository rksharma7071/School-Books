// models/payment.model.js
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
            unique: true, // ✅ This already creates an index
            // ❌ Do NOT add index: true here
        },
        provider: {
            type: String,
            required: true,
            enum: ["stripe", "paypal", "razorpay", "shopify_payments"],
        },
        status: {
            type: String,
            required: true,
            enum: ["pending", "paid", "failed", "refunded"],
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        transactionId: {
            type: String,
            unique: true,
            sparse: true,
            required: true,
            // ❌ Do NOT add index: true here (unique already creates index)
        },
        currency: {
            type: String,
            default: "INR",
        },
        razorpayOrderId: {
            type: String,
            sparse: true,
            // ✅ Only add index here if not using schema.index()
            // index: true,
        },
        paymentDate: {
            type: Date,
        },
        paymentMethod: {
            type: String,
        },
        paymentDetails: {
            bank: String,
            wallet: String,
            vpa: String,
            email: String,
            contact: String,
        },
        verificationAttempts: {
            type: Number,
            default: 0,
        },
        lastVerificationAttempt: {
            type: Date,
        },
    },
    { timestamps: true }
);

// ✅ Only define indexes that aren't already covered by unique:true
// orderId and transactionId already have indexes from unique:true
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ razorpayOrderId: 1 }); // ✅ Only if you need this index

// ❌ REMOVE these if they're already covered by unique:true
// paymentSchema.index({ orderId: 1 }); // Already indexed by unique:true
// paymentSchema.index({ transactionId: 1 }); // Already indexed by unique:true

const Payment = mongoose.model("Payment", paymentSchema);

export { Payment };