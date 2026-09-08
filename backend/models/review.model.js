import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
    {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        title: { type: String, required: true, trim: true },
        body: { type: String, required: true, trim: true },
        approved: { type: Boolean, default: false },
        approvedAt: { type: Date },
    },
    { timestamps: true }
);

reviewSchema.index({ productId: 1, approved: 1 });

const Review = mongoose.model("Review", reviewSchema);

export { Review };