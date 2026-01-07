import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
            unique: true,
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
        },

        currency: {
            type: String,
            default: "INR",
        },
    },
    { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);

export { Payment };
