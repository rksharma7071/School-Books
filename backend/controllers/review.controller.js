// controllers/review.controller.js
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

// ✅ FIXED: Use req.user.id instead of trusting client input
const createReview = asyncHandler(async (req, res) => {
    const userId = req.user.id; // ✅ Use authenticated user ID
    const { bookId, rating, title, body } = req.body; // ✅ Removed userId from body

    if (!bookId) {
        return res.status(400).json({ message: "bookId is required." });
    }
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
        return res.status(400).json({ message: "Invalid bookId format" });
    }
    if (!rating || !title || !body) {
        return res.status(400).json({ message: "All fields are required..." });
    }
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be 1-5" });
    }

    // ✅ Check if user already reviewed this book
    const existingReview = await Review.findOne({ bookId, userId });
    if (existingReview) {
        return res.status(400).json({
            message: "You have already reviewed this book"
        });
    }

    const result = await Review.create({
        bookId,
        userId,
        rating,
        title,
        body
    });

    return res
        .status(201)
        .json({ message: "Review created successfully!", review: result });
});

// ✅ Admin only: Update review approval status
const updateReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { approved } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid review ID" });
    }

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    // ✅ Only admin can update review status
    if (req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Only admins can update review status"
        });
    }

    review.approved = approved;
    review.approvedAt = approved ? new Date() : null;
    const result = await review.save();

    return res
        .status(200)
        .json({ message: "Review updated successfully", review: result });
});

// ✅ Admin only: Delete review
const deleteReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid Review ID" });
    }

    // ✅ Verify review exists
    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    // ✅ Only admin or review owner can delete
    if (
        req.user.role !== "admin" &&
        String(review.userId) !== String(req.user.id)
    ) {
        return res.status(403).json({
            success: false,
            message: "You can only delete your own reviews"
        });
    }

    await Review.findByIdAndDelete(id);
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

// ✅ Get user's own reviews
const getMyReviews = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);

    const [reviews, total] = await Promise.all([
        Review.find({ userId })
            .populate("bookId", "name coverImage author price")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Review.countDocuments({ userId }),
    ]);

    return res.json({
        success: true,
        data: reviews,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    });
});

const getAllPublishedReviews = asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    // Only fetch approved/published reviews
    const filter = { approved: true };

    const [reviews, total] = await Promise.all([
        Review.find(filter)
            .populate("userId", "first_name last_name username email")
            .populate("bookId", "name coverImage author price slug")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Review.countDocuments(filter),
    ]);

    // Format response
    const formattedReviews = reviews.map(review => ({
        ...review,
        user: review.userId,
        book: review.bookId,
        userId: undefined,
        bookId: undefined,
    }));

    return res.status(200).json({
        success: true,
        data: formattedReviews,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
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
    getMyReviews,
    getAllPublishedReviews
};