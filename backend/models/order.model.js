import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        orderNumber: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        items: [
            {
                bookId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Book",
                    required: true,
                },
                quantity: { type: Number, required: true, min: 1, default: 1 },
            },
        ],

        shipment: {
            carrier: { type: String, required: true },
            tracking_number: { type: String, required: true },
            status: {
                type: String,
                enum: ["pending", "shipped", "delivered", "cancelled"],
                required: true,
            },
            shipped_at: { type: Date },
            delivered_at: { type: Date },
        },

        shipping: { type: Number, required: true, min: 0 },
        subtotal: { type: Number, required: true, min: 0 },
        tax: { type: Number, required: true, min: 0 },
        discount: { type: Number, default: 0, min: 0 },
        total: { type: Number, required: true, min: 0 },
    },
    {
        timestamps: true,
    }
);

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

export { Order };
