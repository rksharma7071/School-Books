import mongoose from "mongoose";
import { Review } from "../models/review.model.js";
import { asyncHandler, ApiError } from "../middlewares/asyncHandler.js";

export const getAllReview = asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);

    const [review, total, agg] = await Promise.all([
        Review.find({})
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Review.countDocuments({}),
        Review.aggregate([{ $group: { _id: null, avg: { $avg: "$rating" } } }]),
    ]);

    res.json({
        totalReview: total,
        averageRating: agg[0]?.avg || 0,
        page,
        pages: Math.ceil(total / limit),
        review,
    });
});

export const getReviewById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid review id");
    const review = await Review.findById(id).lean();
    if (!review) throw new ApiError(404, "Review not found");
    res.json(review);
});

export const createReview = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { bookId, rating, title, body } = req.body;

    if (!bookId) throw new ApiError(400, "bookId is required.");
    if (!mongoose.Types.ObjectId.isValid(bookId)) throw new ApiError(400, "Invalid bookId format");
    if (!rating || !title || !body) throw new ApiError(400, "All fields are required...");
    if (rating < 1 || rating > 5) throw new ApiError(400, "Rating must be 1-5");

    const existingReview = await Review.findOne({ bookId, userId });
    if (existingReview) throw new ApiError(400, "You have already reviewed this book");

    const result = await Review.create({ bookId, userId, rating, title, body });
    res.status(201).json({ message: "Review created successfully!", review: result });
});

export const updateReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { approved } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid review ID");

    const review = await Review.findById(id);
    if (!review) throw new ApiError(404, "Review not found");
    if (req.user.role !== "admin") throw new ApiError(403, "Only admins can update review status");

    review.approved = approved;
    review.approvedAt = approved ? new Date() : null;
    const result = await review.save();

    res.status(200).json({ message: "Review updated successfully", review: result });
});

export const deleteReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid Review ID");

    const review = await Review.findById(id);
    if (!review) throw new ApiError(404, "Review not found");
    if (req.user.role !== "admin" && String(review.userId) !== String(req.user.id)) throw new ApiError(403, "You can only delete your own reviews");

    await Review.findByIdAndDelete(id);
    res.json({ status: "success", message: "Review deleted successfully" });
});

export const getReviewSummary = asyncHandler(async (req, res) => {
    const data = await Review.aggregate([
        { $match: { approved: true } },
        { $group: { _id: "$bookId", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);

    res.set("Cache-Control", "public, max-age=120");
    res.json(data.map((d) => ({ bookId: String(d._id), avgRating: d.avg, count: d.count })));
});

export const getReviewsByBook = asyncHandler(async (req, res) => {
    const { bookId } = req.params;
    if (!bookId) throw new ApiError(400, "Book ID or slug is required");

    let query = {};
    if (mongoose.Types.ObjectId.isValid(bookId)) {
        query._id = bookId;
    } else {
        const Book = mongoose.model("Book");
        const book = await Book.findOne({ slug: bookId }).select("_id").lean();
        if (!book) throw new ApiError(404, "Book not found");
        query._id = book._id;
    }

    const reviews = await Review.find({ bookId: query._id, approved: true })
        .populate("userId", "first_name last_name username")
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;

    res.status(200).json({
        success: true,
        bookId: query._id,
        averageRating: parseFloat(averageRating),
        totalReviews: reviews.length,
        reviews: reviews.map((r) => ({ ...r, user: r.userId, userId: undefined })),
    });
});

export const getMyReviews = asyncHandler(async (req, res) => {
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

    res.json({
        success: true,
        data: reviews,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
});

export const getAllPublishedReviews = asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const skip = (page - 1) * limit;

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

    const formattedReviews = reviews.map((review) => ({
        ...review,
        user: review.userId,
        book: review.bookId,
        userId: undefined,
        bookId: undefined,
    }));

    res.status(200).json({
        success: true,
        data: formattedReviews,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
});