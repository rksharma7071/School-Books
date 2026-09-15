import mongoose from "mongoose";

const voteSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        vote: { type: String, enum: ["helpful", "not_helpful"], required: true },
        votedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const reporterSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        reportedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const reviewSchema = new mongoose.Schema(
    {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
            validate: {
                validator: Number.isInteger,
                message: "rating must be an integer between 1 and 5",
            },
        },
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: [3, "title must be at least 3 characters"],
            maxlength: [120, "title must be at most 120 characters"],
        },
        body: {
            type: String,
            required: true,
            trim: true,
            minlength: [10, "body must be at least 10 characters"],
            maxlength: [3000, "body must be at most 3000 characters"],
        },

        approved: { type: Boolean, default: false },
        approvedAt: { type: Date, default: null },

        verifiedPurchase: { type: Boolean, default: false },
        verifiedPurchaseAt: { type: Date, default: null },

        helpfulCount: { type: Number, default: 0, min: 0 },
        notHelpfulCount: { type: Number, default: 0, min: 0 },
        votes: { type: [voteSchema], default: [], select: false },

        reported: { type: Boolean, default: false },
        reportCount: { type: Number, default: 0, min: 0 },
        reportedAt: { type: Date, default: null },
        reporters: { type: [reporterSchema], default: [], select: false },
    },
    { timestamps: true }
);

reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });
reviewSchema.index({ productId: 1, approved: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, createdAt: -1 });
reviewSchema.index({ approved: 1, createdAt: -1 });
reviewSchema.index({ rating: 1 });

const Review = mongoose.model("Review", reviewSchema);

export { Review };