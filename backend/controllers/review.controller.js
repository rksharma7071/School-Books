import mongoose from "mongoose";
import { Review } from "../models/review.model.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

const getAllReview = asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);

    const [review, total, agg] = await Promise.all([
        Review.find({})
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Review.countDocuments({}),
        Review.aggregate([
            { $group: { _id: null, avg: { $avg: "$rating" } } },
        ]),
    ]);

    return res.json({
        totalReview: total,
        averageRating: agg[0]?.avg || 0,
        page,
        pages: Math.ceil(total / limit),
        review,
    });
});

const getReviewById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid review id" });
    }
    const review = await Review.findById(id).lean();
    if (!review) return res.status(404).json({ message: "Review not found" });
    return res.json(review);
});

const createReview = asyncHandler(async (req, res) => {
    const { bookId, userId, rating, title, body } = req.body;

    if (!bookId || !userId) {
        return res
            .status(400)
            .json({ message: "bookId and userId are required." });
    }
    if (
        !mongoose.Types.ObjectId.isValid(bookId) ||
        !mongoose.Types.ObjectId.isValid(userId)
    ) {
        return res.status(400).json({ message: "Invalid id format" });
    }
    if (!rating || !title || !body) {
        return res.status(400).json({ message: "All fields are required..." });
    }
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be 1-5" });
    }

    const result = await Review.create({ bookId, userId, rating, title, body });
    return res
        .status(201)
        .json({ message: "Review created successfully!", review: result });
});

const updateReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { approved } = req.body;

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    review.approved = approved;
    review.approvedAt = approved ? new Date() : null;
    const result = await review.save();

    return res
        .status(200)
        .json({ message: "Review updated successfully", review: result });
});

const deleteReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid Review ID" });
    }
    const deleted = await Review.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Review not found" });
    return res.json({ status: "success", message: "Review deleted successfully" });
});

const getReviewSummary = asyncHandler(async (req, res) => {
    const data = await Review.aggregate([
        { $match: { approved: true } },
        {
            $group: {
                _id: "$bookId",
                avg: { $avg: "$rating" },
                count: { $sum: 1 },
            },
        },
    ]);

    res.set("Cache-Control", "public, max-age=120");
    return res.json(
        data.map((d) => ({
            bookId: String(d._id),
            avgRating: d.avg,
            count: d.count,
        }))
    );
});

const getReviewsByBook = asyncHandler(async (req, res) => {
    const { bookId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
        return res.status(400).json({ message: "Invalid bookId" });
    }
    const reviews = await Review.find({ bookId, approved: true })
        .populate("userId", "first_name last_name username")
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
    return res.json({
        reviews: reviews.map((r) => ({ ...r, user: r.userId })),
    });
});

export {
    getAllReview,
    getReviewById,
    createReview,
    updateReview,
    deleteReview,
    getReviewSummary,
    getReviewsByBook,
};
