import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
    {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
        quantity: {
            type: Number,
            required: true,
            min: [1, "quantity must be at least 1"],
            default: 1,
            validate: {
                validator: Number.isInteger,
                message: "quantity must be an integer",
            },
        },
    },
    { _id: true }
);

const cartSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
        items: { type: [cartItemSchema], default: [] },
    },
    { timestamps: true }
);

const Cart = mongoose.model("Cart", cartSchema);

export { Cart };