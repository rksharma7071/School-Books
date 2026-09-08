import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
        provider: { type: String, required: true, enum: ["stripe", "paypal", "razorpay", "shopify_payments"] },
        status: { type: String, required: true, enum: ["pending", "paid", "failed", "refunded"] },
        amount: { type: Number, required: true, min: 0 },
        transactionId: { type: String, unique: true, sparse: true, required: true },
        currency: { type: String, default: "INR" },
        razorpayOrderId: { type: String, sparse: true },
        paymentDate: { type: Date },
        paymentMethod: { type: String },
        paymentDetails: {
            bank: String,
            wallet: String,
            vpa: String,
            email: String,
            contact: String,
        },
        verificationAttempts: { type: Number, default: 0 },
        lastVerificationAttempt: { type: Date },
    },
    { timestamps: true }
);

paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ razorpayOrderId: 1 });

const Payment = mongoose.model("Payment", paymentSchema);

export { Payment };
