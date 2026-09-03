import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
    {
        bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
        quantity: { type: Number, required: true, min: 1, default: 1 },
        unit_price: { type: Number, required: true, min: 0 },
        total_price: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

const shipmentSchema = new mongoose.Schema(
    {
        carrier: { type: String },
        tracking_number: { type: String },
        status: { type: String, enum: ["pending", "shipped", "delivered", "cancelled"], default: "pending" },
        shipped_at: { type: Date },
        delivered_at: { type: Date },
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        orderNumber: { type: Number, required: true, unique: true, index: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        items: {
            type: [orderItemSchema],
            required: true,
            validate: [(v) => v.length > 0, "Order must have at least one item"],
        },
        shipment: shipmentSchema,
        shipping: { type: Number, required: true, min: 0 },
        subtotal: { type: Number, required: true, min: 0 },
        tax: { type: Number, required: true, min: 0 },
        discount: { type: Number, default: 0, min: 0 },
        total: { type: Number, required: true, min: 0 },
        status: {
            type: String,
            enum: ["in progress", "fulfilled", "unfulfilled", "cancelled"],
            default: "in progress",
            index: true,
        },
        placed_at: { type: Date, default: Date.now },
        shipping_address: { type: String, required: true },
        billing_address: { type: String, required: true },
        paymentId: { type: String },
        razorpayOrderId: { type: String, sparse: true },
        razorpayOrderDetails: { amount: Number, currency: String, receipt: String, createdAt: Date },
        paymentVerified: { type: Boolean, default: false },
        paymentDate: { type: Date },
    },
    { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });

const Order = mongoose.model("Order", orderSchema);

export { Order };
