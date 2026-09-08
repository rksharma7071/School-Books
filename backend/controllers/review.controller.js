import mongoose from "mongoose";
import { Review } from "../models/review.model.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { ApiError, handleError } from "../utils/apiError.js";

const REQUIRE_VERIFIED_PURCHASE = true;

const RATING_MIN = 1;
const RATING_MAX = 5;
const TITLE_MIN = 3;
const TITLE_MAX = 120;
const BODY_MIN = 10;
const BODY_MAX = 3000;

const PRODUCT_REVIEW_SORTS = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    highest: { rating: -1, createdAt: -1 },
    lowest: { rating: 1, createdAt: -1 },
    helpful: { helpfulCount: -1, createdAt: -1 },
};

const ADMIN_SORT_WHITELIST = ["createdAt", "updatedAt", "rating", "helpfulCount", "reportCount"];

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const clampPage = (v) => Math.max(1, Number(v) || 1);
const clampLimit = (v, max = 100, def = 20) => Math.min(max, Math.max(1, Number(v) || def));
const roundRating = (v) => Math.round((v || 0) * 10) / 10;

const validateRating = (rating) => {
    if (!Number.isInteger(rating) || rating < RATING_MIN || rating > RATING_MAX) {
        throw new ApiError(400, `rating must be an integer between ${RATING_MIN} and ${RATING_MAX}`);
    }
};

const validateTitle = (title) => {
    if (typeof title !== "string" || !title.trim()) throw new ApiError(400, "title is required");
    const trimmed = title.trim();
    if (trimmed.length < TITLE_MIN) throw new ApiError(400, `title must be at least ${TITLE_MIN} characters`);
    if (trimmed.length > TITLE_MAX) throw new ApiError(400, `title must be at most ${TITLE_MAX} characters`);
};

const validateBody = (body) => {
    if (typeof body !== "string" || !body.trim()) throw new ApiError(400, "body is required");
    const trimmed = body.trim();
    if (trimmed.length < BODY_MIN) throw new ApiError(400, `body must be at least ${BODY_MIN} characters`);
    if (trimmed.length > BODY_MAX) throw new ApiError(400, `body must be at most ${BODY_MAX} characters`);
};

const checkVerifiedPurchase = async (userId, productId) => {
    const exists = await Order.exists({ userId, status: "fulfilled", "items.productId": productId });
    return !!exists;
};

const buildRatingDistributionStages = () => [
    { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
    { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
    { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
    { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
    { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
];

const formatPublicUser = (u) => {
    if (!u || typeof u !== "object") return null;
    return { id: u._id, username: u.username, firstName: u.first_name, lastName: u.last_name };
};

const formatPublicProduct = (p) => {
    if (!p || typeof p !== "object") return null;
    return { id: p._id, title: p.title, handle: p.handle };
};

const formatPublicReview = (r) => ({
    id: r._id,
    productId: r.productId?._id ? r.productId._id : r.productId,
    product: r.productId?.title ? formatPublicProduct(r.productId) : undefined,
    rating: r.rating,
    title: r.title,
    body: r.body,
    verifiedPurchase: r.verifiedPurchase,
    helpfulCount: r.helpfulCount,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    user: formatPublicUser(r.userId),
});

const formatOwnerReview = (r) => ({
    id: r._id,
    productId: r.productId?._id ? r.productId._id : r.productId,
    product: r.productId?.title ? formatPublicProduct(r.productId) : undefined,
    rating: r.rating,
    title: r.title,
    body: r.body,
    approved: r.approved,
    verifiedPurchase: r.verifiedPurchase,
    helpfulCount: r.helpfulCount,
    notHelpfulCount: r.notHelpfulCount,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
});

const formatAdminReview = (r) => ({
    id: r._id,
    productId: r.productId?._id ? r.productId._id : r.productId,
    product: r.productId?.title ? formatPublicProduct(r.productId) : undefined,
    userId: r.userId?._id ? r.userId._id : r.userId,
    user: r.userId && typeof r.userId === "object"
        ? { id: r.userId._id, username: r.userId.username, firstName: r.userId.first_name, lastName: r.userId.last_name, email: r.userId.email }
        : undefined,
    rating: r.rating,
    title: r.title,
    body: r.body,
    approved: r.approved,
    approvedAt: r.approvedAt,
    verifiedPurchase: r.verifiedPurchase,
    verifiedPurchaseAt: r.verifiedPurchaseAt,
    helpfulCount: r.helpfulCount,
    notHelpfulCount: r.notHelpfulCount,
    reported: r.reported,
    reportCount: r.reportCount,
    reportedAt: r.reportedAt,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
});

export const getAllReview = async (req, res) => {
    try {
        const page = clampPage(req.query.page);
        const limit = clampLimit(req.query.limit);
        const { approved, productId, userId, rating, verifiedPurchase, reported, search, sortBy = "createdAt", sortOrder = "desc" } = req.query;

        const filter = {};

        if (approved !== undefined) filter.approved = approved === "true" || approved === true;

        if (productId !== undefined) {
            if (!isValidId(productId)) throw new ApiError(400, "Invalid productId");
            filter.productId = productId;
        }

        if (userId !== undefined) {
            if (!isValidId(userId)) throw new ApiError(400, "Invalid userId");
            filter.userId = userId;
        }

        if (rating !== undefined) {
            const r = Number(rating);
            if (!Number.isInteger(r) || r < 1 || r > 5) throw new ApiError(400, "Invalid rating filter");
            filter.rating = r;
        }

        if (verifiedPurchase !== undefined) filter.verifiedPurchase = verifiedPurchase === "true" || verifiedPurchase === true;
        if (reported !== undefined) filter.reported = reported === "true" || reported === true;

        if (search) {
            const safe = escapeRegex(search);
            filter.$or = [{ title: { $regex: safe, $options: "i" } }, { body: { $regex: safe, $options: "i" } }];
        }

        if (!ADMIN_SORT_WHITELIST.includes(sortBy)) {
            throw new ApiError(400, `Invalid sortBy. Allowed: ${ADMIN_SORT_WHITELIST.join(", ")}`);
        }
        const sortOrderValue = sortOrder === "asc" ? 1 : -1;

        const [reviews, total, approvedAvgAgg] = await Promise.all([
            Review.find(filter)
                .populate("userId", "username first_name last_name email")
                .populate("productId", "title handle")
                .sort({ [sortBy]: sortOrderValue })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Review.countDocuments(filter),
            Review.aggregate([{ $match: { approved: true } }, { $group: { _id: null, avg: { $avg: "$rating" } } }]),
        ]);

        res.status(200).json({
            success: true,
            data: reviews.map(formatAdminReview),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < total,
                hasPreviousPage: page > 1,
            },
            approvedAverageRating: approvedAvgAgg[0] ? roundRating(approvedAvgAgg[0].avg) : 0,
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getReviewById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) throw new ApiError(400, "Invalid review id");

        const review = await Review.findById(id).populate("userId", "username first_name last_name").lean();
        if (!review) throw new ApiError(404, "Review not found");

        const reviewOwnerId = review.userId?._id || review.userId;
        const isOwner = !!req.user && String(reviewOwnerId) === String(req.user.id);
        const isAdmin = req.user?.role === "admin";

        if (!review.approved && !isOwner && !isAdmin) {
            throw new ApiError(404, "Review not found");
        }

        const data = isAdmin ? formatAdminReview(review) : isOwner ? formatOwnerReview(review) : formatPublicReview(review);
        res.status(200).json({ success: true, data });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const createReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, rating, title, body } = req.body;

        if (!productId || !isValidId(productId)) throw new ApiError(400, "A valid productId is required");
        validateRating(rating);
        validateTitle(title);
        validateBody(body);

        const product = await Product.findById(productId).select("isActive").lean();
        if (!product) throw new ApiError(404, "Product not found");
        if (product.isActive === false) throw new ApiError(400, "This product is not available for review");

        const existingReview = await Review.findOne({ productId, userId }).lean();
        if (existingReview) throw new ApiError(409, "You have already reviewed this product");

        const verifiedPurchase = await checkVerifiedPurchase(userId, productId);
        if (REQUIRE_VERIFIED_PURCHASE && !verifiedPurchase) {
            throw new ApiError(403, "You can only review products you have purchased and received");
        }

        let review;
        try {
            review = await Review.create({
                productId,
                userId,
                rating,
                title: title.trim(),
                body: body.trim(),
                verifiedPurchase,
                verifiedPurchaseAt: verifiedPurchase ? new Date() : null,
                approved: false,
                approvedAt: null,
            });
        } catch (error) {
            if (error.code === 11000) throw new ApiError(409, "You have already reviewed this product");
            throw error;
        }

        res.status(201).json({
            success: true,
            message: "Review submitted successfully and is pending moderation",
            data: formatOwnerReview(review.toObject()),
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const updateReview = async (req, res) => {
    try {
        const review = req.review;
        const isAdmin = req.user.role === "admin";
        const isOwner = String(review.userId) === String(req.user.id);

        const { rating, title, body, approved } = req.body;

        if (approved !== undefined) {
            if (!isAdmin) throw new ApiError(403, "Only admins can change approval status");
            if (isOwner) throw new ApiError(403, "You cannot moderate your own review");
            review.approved = approved === true;
            review.approvedAt = review.approved ? new Date() : null;
        }

        const wantsContentEdit = rating !== undefined || title !== undefined || body !== undefined;
        if (wantsContentEdit) {
            if (!isOwner) throw new ApiError(403, "Only the review owner can edit its content");

            if (rating !== undefined) {
                validateRating(rating);
                review.rating = rating;
            }
            if (title !== undefined) {
                validateTitle(title);
                review.title = title.trim();
            }
            if (body !== undefined) {
                validateBody(body);
                review.body = body.trim();
            }

            review.approved = false;
            review.approvedAt = null;
        }

        await review.save();

        const data = isAdmin ? formatAdminReview(review.toObject()) : formatOwnerReview(review.toObject());
        res.status(200).json({ success: true, message: "Review updated successfully", data });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const deleteReview = async (req, res) => {
    try {
        await Review.findByIdAndDelete(req.review._id);
        res.status(200).json({ success: true, message: "Review deleted successfully" });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getReviewSummary = async (req, res) => {
    try {
        const [r1, r2, r3, r4, r5] = buildRatingDistributionStages();
        const data = await Review.aggregate([
            { $match: { approved: true } },
            {
                $group: {
                    _id: "$productId",
                    avgRating: { $avg: "$rating" },
                    totalReviews: { $sum: 1 },
                    rating1: r1,
                    rating2: r2,
                    rating3: r3,
                    rating4: r4,
                    rating5: r5,
                },
            },
        ]);

        res.set("Cache-Control", "public, max-age=120");
        res.json({
            success: true,
            data: data.map((d) => ({
                productId: String(d._id),
                avgRating: roundRating(d.avgRating),
                count: d.totalReviews,
                totalReviews: d.totalReviews,
                averageRating: roundRating(d.avgRating),
                distribution: { 1: d.rating1, 2: d.rating2, 3: d.rating3, 4: d.rating4, 5: d.rating5 },
            })),
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getReviewsByProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        if (!productId) throw new ApiError(400, "Product ID or handle is required");

        let productObjectId;
        if (isValidId(productId)) {
            productObjectId = new mongoose.Types.ObjectId(productId);
        } else {
            const product = await Product.findOne({ handle: productId }).select("_id").lean();
            if (!product) throw new ApiError(404, "Product not found");
            productObjectId = product._id;
        }

        const page = clampPage(req.query.page);
        const limit = clampLimit(req.query.limit);
        const sortKey = req.query.sort || "newest";
        if (!PRODUCT_REVIEW_SORTS[sortKey]) {
            throw new ApiError(400, `Invalid sort. Allowed: ${Object.keys(PRODUCT_REVIEW_SORTS).join(", ")}`);
        }

        const filter = { productId: productObjectId, approved: true };
        const [r1, r2, r3, r4, r5] = buildRatingDistributionStages();

        const [reviews, total, statsAgg] = await Promise.all([
            Review.find(filter)
                .populate("userId", "username first_name last_name")
                .sort(PRODUCT_REVIEW_SORTS[sortKey])
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Review.countDocuments(filter),
            Review.aggregate([
                { $match: filter },
                { $group: { _id: null, avgRating: { $avg: "$rating" }, rating1: r1, rating2: r2, rating3: r3, rating4: r4, rating5: r5 } },
            ]),
        ]);

        const stats = statsAgg[0];

        res.status(200).json({
            success: true,
            productId: productObjectId,
            averageRating: stats ? roundRating(stats.avgRating) : 0,
            totalReviews: total,
            distribution: stats
                ? { 1: stats.rating1, 2: stats.rating2, 3: stats.rating3, 4: stats.rating4, 5: stats.rating5 }
                : { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            reviews: reviews.map(formatPublicReview),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < total,
                hasPreviousPage: page > 1,
            },
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getMyReviews = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = clampPage(req.query.page);
        const limit = clampLimit(req.query.limit);
        const { approved, verifiedPurchase, rating } = req.query;

        const filter = { userId };
        if (approved !== undefined) filter.approved = approved === "true" || approved === true;
        if (verifiedPurchase !== undefined) filter.verifiedPurchase = verifiedPurchase === "true" || verifiedPurchase === true;
        if (rating !== undefined) {
            const r = Number(rating);
            if (!Number.isInteger(r) || r < 1 || r > 5) throw new ApiError(400, "Invalid rating filter");
            filter.rating = r;
        }

        const [reviews, total] = await Promise.all([
            Review.find(filter)
                .populate("productId", "title handle image images")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Review.countDocuments(filter),
        ]);

        res.json({
            success: true,
            data: reviews.map(formatOwnerReview),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < total,
                hasPreviousPage: page > 1,
            },
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getAllPublishedReviews = async (req, res) => {
    try {
        const page = clampPage(req.query.page);
        const limit = clampLimit(req.query.limit);
        const { rating, productId, verifiedPurchase, sort = "newest" } = req.query;

        if (!PRODUCT_REVIEW_SORTS[sort]) {
            throw new ApiError(400, `Invalid sort. Allowed: ${Object.keys(PRODUCT_REVIEW_SORTS).join(", ")}`);
        }

        const filter = { approved: true };
        if (rating !== undefined) {
            const r = Number(rating);
            if (!Number.isInteger(r) || r < 1 || r > 5) throw new ApiError(400, "Invalid rating filter");
            filter.rating = r;
        }
        if (productId !== undefined) {
            if (!isValidId(productId)) throw new ApiError(400, "Invalid productId");
            filter.productId = productId;
        }
        if (verifiedPurchase !== undefined) filter.verifiedPurchase = verifiedPurchase === "true" || verifiedPurchase === true;

        const [reviews, total] = await Promise.all([
            Review.find(filter)
                .populate("userId", "username first_name last_name")
                .populate("productId", "title handle image")
                .sort(PRODUCT_REVIEW_SORTS[sort])
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Review.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            data: reviews.map(formatPublicReview),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < total,
                hasPreviousPage: page > 1,
            },
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getReviewEligibility = async (req, res) => {
    try {
        const { productId } = req.params;
        if (!isValidId(productId)) throw new ApiError(400, "Invalid productId");

        const product = await Product.findById(productId).select("isActive").lean();
        if (!product) {
            return res.status(200).json({
                success: true,
                data: { canReview: false, reason: "product_not_found", alreadyReviewed: false, verifiedPurchase: false },
            });
        }
        if (product.isActive === false) {
            return res.status(200).json({
                success: true,
                data: { canReview: false, reason: "product_unavailable", alreadyReviewed: false, verifiedPurchase: false },
            });
        }

        const [existingReview, verifiedPurchase] = await Promise.all([
            Review.exists({ productId, userId: req.user.id }),
            checkVerifiedPurchase(req.user.id, productId),
        ]);

        if (existingReview) {
            return res.status(200).json({
                success: true,
                data: { canReview: false, reason: "already_reviewed", alreadyReviewed: true, verifiedPurchase },
            });
        }

        if (REQUIRE_VERIFIED_PURCHASE && !verifiedPurchase) {
            return res.status(200).json({
                success: true,
                data: { canReview: false, reason: "not_purchased", alreadyReviewed: false, verifiedPurchase: false },
            });
        }

        res.status(200).json({ success: true, data: { canReview: true, alreadyReviewed: false, verifiedPurchase } });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const voteReview = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) throw new ApiError(400, "Invalid review id");

        const { vote } = req.body;
        if (!["helpful", "not_helpful"].includes(vote)) throw new ApiError(400, "vote must be 'helpful' or 'not_helpful'");

        const review = await Review.findById(id).select("+votes helpfulCount notHelpfulCount approved userId");
        if (!review || !review.approved) throw new ApiError(404, "Review not found");

        const existingIdx = review.votes.findIndex((v) => String(v.userId) === String(req.user.id));

        if (existingIdx === -1) {
            review.votes.push({ userId: req.user.id, vote });
            if (vote === "helpful") review.helpfulCount += 1;
            else review.notHelpfulCount += 1;
        } else {
            const existing = review.votes[existingIdx];
            if (existing.vote !== vote) {
                if (existing.vote === "helpful") review.helpfulCount = Math.max(0, review.helpfulCount - 1);
                else review.notHelpfulCount = Math.max(0, review.notHelpfulCount - 1);

                if (vote === "helpful") review.helpfulCount += 1;
                else review.notHelpfulCount += 1;

                existing.vote = vote;
                existing.votedAt = new Date();
            }
        }

        await review.save();

        res.status(200).json({
            success: true,
            data: { helpfulCount: review.helpfulCount, notHelpfulCount: review.notHelpfulCount, currentUserVote: vote },
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const reportReview = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) throw new ApiError(400, "Invalid review id");

        const review = await Review.findById(id).select("+reporters reportCount reported");
        if (!review) throw new ApiError(404, "Review not found");

        const alreadyReported = review.reporters.some((r) => String(r.userId) === String(req.user.id));
        if (alreadyReported) throw new ApiError(409, "You have already reported this review");

        review.reporters.push({ userId: req.user.id });
        review.reportCount += 1;
        review.reported = true;
        review.reportedAt = new Date();

        await review.save();

        res.status(200).json({ success: true, message: "Review reported. Thank you for the feedback.", data: { reportCount: review.reportCount } });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getAdminReviewStats = async (req, res) => {
    try {
        const [r1, r2, r3, r4, r5] = buildRatingDistributionStages();

        const [statusAgg, verifiedAgg, reportedAgg, totalReviews, ratingAgg] = await Promise.all([
            Review.aggregate([{ $group: { _id: "$approved", count: { $sum: 1 } } }]),
            Review.aggregate([{ $match: { verifiedPurchase: true } }, { $count: "count" }]),
            Review.aggregate([{ $match: { reported: true } }, { $count: "count" }]),
            Review.countDocuments({}),
            Review.aggregate([
                { $match: { approved: true } },
                { $group: { _id: null, avgRating: { $avg: "$rating" }, rating1: r1, rating2: r2, rating3: r3, rating4: r4, rating5: r5 } },
            ]),
        ]);

        const approvedCount = statusAgg.find((s) => s._id === true)?.count || 0;
        const pendingCount = statusAgg.find((s) => s._id === false)?.count || 0;
        const ratingStats = ratingAgg[0];

        res.status(200).json({
            success: true,
            stats: {
                totalReviews,
                approvedReviews: approvedCount,
                pendingReviews: pendingCount,
                verifiedPurchaseReviews: verifiedAgg[0]?.count || 0,
                reportedReviews: reportedAgg[0]?.count || 0,
                averageApprovedRating: ratingStats ? roundRating(ratingStats.avgRating) : 0,
                ratingDistribution: ratingStats
                    ? { 1: ratingStats.rating1, 2: ratingStats.rating2, 3: ratingStats.rating3, 4: ratingStats.rating4, 5: ratingStats.rating5 }
                    : { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            },
        });
    } catch (error) {
        handleError(error, req, res);
    }
};