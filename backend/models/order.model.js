import mongoose from "mongoose";

const addressSnapshotSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
        country: { type: String, default: "India" },
        type: { type: String },
        landmark: { type: String },
    },
    { _id: false }
);

const orderItemSchema = new mongoose.Schema(
    {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
        productName: { type: String, required: true },
        variantSku: { type: String, default: null },
        variantOptions: { type: Map, of: String, default: undefined },
        quantity: { type: Number, required: true, min: 1 },
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
        couponCode: { type: String, default: null },
        status: {
            type: String,
            enum: ["in progress", "fulfilled", "unfulfilled", "cancelled"],
            default: "in progress",
            index: true,
        },
        placed_at: { type: Date, default: Date.now },
        confirmedAt: { type: Date, default: null },
        paidAt: { type: Date, default: null },
        shippedAt: { type: Date, default: null },
        deliveredAt: { type: Date, default: null },
        cancelledAt: { type: Date, default: null },
        cancellationReason: { type: String, default: null },
        refundedAt: { type: Date, default: null },
        shipping_address: { type: addressSnapshotSchema, required: true },
        billing_address: { type: addressSnapshotSchema, required: true },
        paymentId: { type: String },
        razorpayOrderId: { type: String, sparse: true },
        razorpayOrderDetails: { amount: Number, currency: String, receipt: String, createdAt: Date },
        paymentVerified: { type: Boolean, default: false },
        paymentDate: { type: Date },
        idempotencyKey: { type: String, default: null },
    },
    { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index(
    { userId: 1, idempotencyKey: 1 },
    { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } }
);

const Order = mongoose.model("Order", orderSchema);

export { Order };