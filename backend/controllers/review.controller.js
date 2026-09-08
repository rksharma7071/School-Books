import mongoose from "mongoose";
import { Review } from "../models/review.model.js";
import { ApiError, handleError } from "../utils/apiError.js";

export const getAllReview = async (req, res) => {
    try {
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
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getReviewById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid review id");
        const review = await Review.findById(id).lean();
        if (!review) throw new ApiError(404, "Review not found");
        res.json(review);
    } catch (error) {
        handleError(error, req, res);
    }
};

export const createReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, rating, title, body } = req.body;

        if (!productId) throw new ApiError(400, "productId is required.");
        if (!mongoose.Types.ObjectId.isValid(productId)) throw new ApiError(400, "Invalid productId format");
        if (!rating || !title || !body) throw new ApiError(400, "All fields are required...");
        if (rating < 1 || rating > 5) throw new ApiError(400, "Rating must be 1-5");

        const existingReview = await Review.findOne({ productId, userId });
        if (existingReview) throw new ApiError(400, "You have already reviewed this product");

        const result = await Review.create({ productId, userId, rating, title, body });
        res.status(201).json({ message: "Review created successfully!", review: result });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const updateReview = async (req, res) => {
    try {
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
    } catch (error) {
        handleError(error, req, res);
    }
};

export const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid Review ID");

        const review = await Review.findById(id);
        if (!review) throw new ApiError(404, "Review not found");
        if (req.user.role !== "admin" && String(review.userId) !== String(req.user.id)) throw new ApiError(403, "You can only delete your own reviews");

        await Review.findByIdAndDelete(id);
        res.json({ status: "success", message: "Review deleted successfully" });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getReviewSummary = async (req, res) => {
    try {
        const data = await Review.aggregate([
            { $match: { approved: true } },
            { $group: { _id: "$productId", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
        ]);

        res.set("Cache-Control", "public, max-age=120");
        res.json(data.map((d) => ({ productId: String(d._id), avgRating: d.avg, count: d.count })));
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getReviewsByProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        if (!productId) throw new ApiError(400, "Product ID or handle is required");

        let query = {};
        if (mongoose.Types.ObjectId.isValid(productId)) {
            query._id = productId;
        } else {
            const Product = mongoose.model("Product");
            const product = await Product.findOne({ handle: productId }).select("_id").lean();
            if (!product) throw new ApiError(404, "Product not found");
            query._id = product._id;
        }

        const reviews = await Review.find({ productId: query._id, approved: true })
            .populate("userId", "first_name last_name username")
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;

        res.status(200).json({
            success: true,
            productId: query._id,
            averageRating: parseFloat(averageRating),
            totalReviews: reviews.length,
            reviews: reviews.map((r) => ({ ...r, user: r.userId, userId: undefined })),
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getMyReviews = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Number(req.query.limit) || 20);

        const [reviews, total] = await Promise.all([
            Review.find({ userId })
                .populate("productId", "name coverImage author price")
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
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getAllPublishedReviews = async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Number(req.query.limit) || 20);
        const skip = (page - 1) * limit;

        const filter = { approved: true };
        const [reviews, total] = await Promise.all([
            Review.find(filter)
                .populate("userId", "first_name last_name username email")
                .populate("productId", "name coverImage author price handle")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Review.countDocuments(filter),
        ]);

        const formattedReviews = reviews.map((review) => ({
            ...review,
            user: review.userId,
            product: review.productId,
            userId: undefined,
            productId: undefined,
        }));

        res.status(200).json({
            success: true,
            data: formattedReviews,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        handleError(error, req, res);
    }
};