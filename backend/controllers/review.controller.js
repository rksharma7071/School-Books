import mongoose from "mongoose";
import { Review } from "../models/review.model.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";

const REQUIRE_VERIFIED_PURCHASE =
    process.env.REQUIRE_VERIFIED_PURCHASE !== "false";

const PRODUCT_REVIEW_SORTS = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    highest: { rating: -1, createdAt: -1 },
    lowest: { rating: 1, createdAt: -1 },
    helpful: { helpfulCount: -1, createdAt: -1 },
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
    return { id: u._id, name: u.name };
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
    user:
        r.userId && typeof r.userId === "object"
            ? { id: r.userId._id, name: r.userId.name, email: r.userId.email }
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

const checkVerifiedPurchase = async (userId, productId) => {
    const exists = await Order.exists({
        userId,
        status: "fulfilled",
        "items.productId": productId,
    });
    return !!exists;
};

/* ------------------------------------------------------------------ */
/* GET /reviews  (admin)                                              */
/* ------------------------------------------------------------------ */
export const getAllReview = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, +req.query.limit || 20));

        const {
            approved,
            productId,
            userId,
            rating,
            verifiedPurchase,
            reported,
            search,
            sortBy = "createdAt",
            sortOrder = "desc",
        } = req.query;

        const filter = {};

        if (approved !== undefined) filter.approved = approved === "true" || approved === true;

        if (productId !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(productId)) {
                return res.status(400).json({ success: false, message: "Invalid productId" });
            }
            filter.productId = productId;
        }

        if (userId !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ success: false, message: "Invalid userId" });
            }
            filter.userId = userId;
        }

        if (rating !== undefined) {
            const r = Number(rating);
            if (!Number.isInteger(r) || r < 1 || r > 5) {
                return res.status(400).json({ success: false, message: "Invalid rating filter" });
            }
            filter.rating = r;
        }

        if (verifiedPurchase !== undefined) {
            filter.verifiedPurchase = verifiedPurchase === "true" || verifiedPurchase === true;
        }

        if (reported !== undefined) {
            filter.reported = reported === "true" || reported === true;
        }

        if (search) {
            const safe = String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            filter.$or = [
                { title: { $regex: safe, $options: "i" } },
                { body: { $regex: safe, $options: "i" } },
            ];
        }

        const ADMIN_SORT_WHITELIST = ["createdAt", "updatedAt", "rating", "helpfulCount", "reportCount"];
        if (!ADMIN_SORT_WHITELIST.includes(sortBy)) {
            return res.status(400).json({
                success: false,
                message: `Invalid sortBy. Allowed: ${ADMIN_SORT_WHITELIST.join(", ")}`,
            });
        }
        const sortOrderValue = sortOrder === "asc" ? 1 : -1;

        const [reviews, total, approvedAvgAgg] = await Promise.all([
            Review.find(filter)
                .populate("userId", "name email")
                .populate("productId", "title handle")
                .sort({ [sortBy]: sortOrderValue })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Review.countDocuments(filter),
            Review.aggregate([
                { $match: { approved: true } },
                { $group: { _id: null, avg: { $avg: "$rating" } } },
            ]),
        ]);

        return res.status(200).json({
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
            approvedAverageRating: approvedAvgAgg[0]
                ? Math.round(approvedAvgAgg[0].avg * 10) / 10
                : 0,
        });
    } catch (error) {
        console.error("getAllReview error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/* ------------------------------------------------------------------ */
/* GET /reviews/:id                                                   */
/* ------------------------------------------------------------------ */
export const getReviewById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid review id" });
        }

        const review = await Review.findById(id).populate("userId", "name").lean();
        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        const reviewOwnerId = review.userId?._id || review.userId;
        const isOwner = !!req.user && String(reviewOwnerId) === String(req.user.id);
        const isAdmin = req.user?.role === "admin";

        if (!review.approved && !isOwner && !isAdmin) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        const data = isAdmin
            ? formatAdminReview(review)
            : isOwner
                ? formatOwnerReview(review)
                : formatPublicReview(review);

        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error("getReviewById error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/* ------------------------------------------------------------------ */
/* POST /reviews                                                      */
/* ------------------------------------------------------------------ */
export const createReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, rating, title, body } = req.body;

        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: "A valid productId is required" });
        }

        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "rating must be an integer between 1 and 5",
            });
        }

        if (typeof title !== "string" || !title.trim()) {
            return res.status(400).json({ success: false, message: "title is required" });
        }
        const trimmedTitle = title.trim();
        if (trimmedTitle.length < 3) {
            return res.status(400).json({ success: false, message: "title must be at least 3 characters" });
        }
        if (trimmedTitle.length > 120) {
            return res.status(400).json({ success: false, message: "title must be at most 120 characters" });
        }

        if (typeof body !== "string" || !body.trim()) {
            return res.status(400).json({ success: false, message: "body is required" });
        }
        const trimmedBody = body.trim();
        if (trimmedBody.length < 10) {
            return res.status(400).json({ success: false, message: "body must be at least 10 characters" });
        }
        if (trimmedBody.length > 3000) {
            return res.status(400).json({ success: false, message: "body must be at most 3000 characters" });
        }

        const product = await Product.findById(productId).select("isActive").lean();
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        if (product.isActive === false) {
            return res.status(400).json({
                success: false,
                message: "This product is not available for review",
            });
        }

        const existingReview = await Review.findOne({ productId, userId }).lean();
        if (existingReview) {
            return res.status(409).json({
                success: false,
                message: "You have already reviewed this product",
            });
        }

        const verifiedPurchase = await checkVerifiedPurchase(userId, productId);
        if (REQUIRE_VERIFIED_PURCHASE && !verifiedPurchase) {
            return res.status(403).json({
                success: false,
                message: "You can only review products you have purchased and received",
            });
        }

        let review;
        try {
            review = await Review.create({
                productId,
                userId,
                rating,
                title: trimmedTitle,
                body: trimmedBody,
                verifiedPurchase,
                verifiedPurchaseAt: verifiedPurchase ? new Date() : null,
                approved: false,
                approvedAt: null,
            });
        } catch (error) {
            if (error.code === 11000) {
                return res.status(409).json({
                    success: false,
                    message: "You have already reviewed this product",
                });
            }
            throw error;
        }

        return res.status(201).json({
            success: true,
            message: "Review submitted successfully and is pending moderation",
            data: formatOwnerReview(review.toObject()),
        });
    } catch (error) {
        console.error("createReview error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/* ------------------------------------------------------------------ */
/* PATCH /reviews/:id                                                 */
/* ------------------------------------------------------------------ */
export const updateReview = async (req, res) => {
    try {
        const review = req.review;
        const isAdmin = req.user.role === "admin";
        const isOwner = String(review.userId) === String(req.user.id);

        const { rating, title, body, approved } = req.body;

        if (approved !== undefined) {
            if (!isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: "Only admins can change approval status",
                });
            }
            if (isOwner) {
                return res.status(403).json({
                    success: false,
                    message: "You cannot moderate your own review",
                });
            }
            review.approved = approved === true;
            review.approvedAt = review.approved ? new Date() : null;
        }

        const wantsContentEdit =
            rating !== undefined || title !== undefined || body !== undefined;

        if (wantsContentEdit) {
            if (!isOwner) {
                return res.status(403).json({
                    success: false,
                    message: "Only the review owner can edit its content",
                });
            }

            if (rating !== undefined) {
                if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
                    return res.status(400).json({
                        success: false,
                        message: "rating must be an integer between 1 and 5",
                    });
                }
                review.rating = rating;
            }

            if (title !== undefined) {
                if (typeof title !== "string" || !title.trim()) {
                    return res.status(400).json({ success: false, message: "title is required" });
                }
                const trimmedTitle = title.trim();
                if (trimmedTitle.length < 3) {
                    return res.status(400).json({ success: false, message: "title must be at least 3 characters" });
                }
                if (trimmedTitle.length > 120) {
                    return res.status(400).json({ success: false, message: "title must be at most 120 characters" });
                }
                review.title = trimmedTitle;
            }

            if (body !== undefined) {
                if (typeof body !== "string" || !body.trim()) {
                    return res.status(400).json({ success: false, message: "body is required" });
                }
                const trimmedBody = body.trim();
                if (trimmedBody.length < 10) {
                    return res.status(400).json({ success: false, message: "body must be at least 10 characters" });
                }
                if (trimmedBody.length > 3000) {
                    return res.status(400).json({ success: false, message: "body must be at most 3000 characters" });
                }
                review.body = trimmedBody;
            }

            review.approved = false;
            review.approvedAt = null;
        }

        await review.save();

        const data = isAdmin
            ? formatAdminReview(review.toObject())
            : formatOwnerReview(review.toObject());

        return res.status(200).json({
            success: true,
            message: "Review updated successfully",
            data,
        });
    } catch (error) {
        console.error("updateReview error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/* ------------------------------------------------------------------ */
/* DELETE /reviews/:id                                                */
/* ------------------------------------------------------------------ */
export const deleteReview = async (req, res) => {
    try {
        await Review.findByIdAndDelete(req.review._id);
        return res.status(200).json({ success: true, message: "Review deleted successfully" });
    } catch (error) {
        console.error("deleteReview error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/* ------------------------------------------------------------------ */
/* GET /reviews/summary                                               */
/* ------------------------------------------------------------------ */
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
        return res.json({
            success: true,
            data: data.map((d) => {
                const avg = Math.round((d.avgRating || 0) * 10) / 10;
                return {
                    productId: String(d._id),
                    avgRating: avg,
                    averageRating: avg,
                    count: d.totalReviews,
                    totalReviews: d.totalReviews,
                    distribution: {
                        1: d.rating1,
                        2: d.rating2,
                        3: d.rating3,
                        4: d.rating4,
                        5: d.rating5,
                    },
                };
            }),
        });
    } catch (error) {
        console.error("getReviewSummary error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/* ------------------------------------------------------------------ */
/* GET /reviews/product/:productId                                    */
/* ------------------------------------------------------------------ */
export const getReviewsByProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        if (!productId) {
            return res.status(400).json({ success: false, message: "Product ID or handle is required" });
        }

        let productObjectId;
        if (mongoose.Types.ObjectId.isValid(productId)) {
            productObjectId = new mongoose.Types.ObjectId(productId);
        } else {
            const product = await Product.findOne({ handle: productId }).select("_id").lean();
            if (!product) {
                return res.status(404).json({ success: false, message: "Product not found" });
            }
            productObjectId = product._id;
        }

        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, +req.query.limit || 20));
        const sortKey = req.query.sort || "newest";

        if (!PRODUCT_REVIEW_SORTS[sortKey]) {
            return res.status(400).json({
                success: false,
                message: `Invalid sort. Allowed: ${Object.keys(PRODUCT_REVIEW_SORTS).join(", ")}`,
            });
        }

        const filter = { productId: productObjectId, approved: true };
        const [r1, r2, r3, r4, r5] = buildRatingDistributionStages();

        const [reviews, total, statsAgg] = await Promise.all([
            Review.find(filter)
                .populate("userId", "name")
                .sort(PRODUCT_REVIEW_SORTS[sortKey])
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Review.countDocuments(filter),
            Review.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: null,
                        avgRating: { $avg: "$rating" },
                        rating1: r1,
                        rating2: r2,
                        rating3: r3,
                        rating4: r4,
                        rating5: r5,
                    },
                },
            ]),
        ]);

        const stats = statsAgg[0];

        return res.status(200).json({
            success: true,
            productId: productObjectId,
            averageRating: stats ? Math.round((stats.avgRating || 0) * 10) / 10 : 0,
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
        console.error("getReviewsByProduct error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/* ------------------------------------------------------------------ */
/* GET /reviews/my-reviews                                            */
/* ------------------------------------------------------------------ */
export const getMyReviews = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, +req.query.limit || 20));
        const { approved, verifiedPurchase, rating } = req.query;

        const filter = { userId };
        if (approved !== undefined) filter.approved = approved === "true" || approved === true;
        if (verifiedPurchase !== undefined) {
            filter.verifiedPurchase = verifiedPurchase === "true" || verifiedPurchase === true;
        }
        if (rating !== undefined) {
            const r = Number(rating);
            if (!Number.isInteger(r) || r < 1 || r > 5) {
                return res.status(400).json({ success: false, message: "Invalid rating filter" });
            }
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

        return res.json({
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
        console.error("getMyReviews error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/* ------------------------------------------------------------------ */
/* GET /reviews/published                                             */
/* ------------------------------------------------------------------ */
export const getAllPublishedReviews = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, +req.query.limit || 20));
        const { rating, productId, verifiedPurchase, sort = "newest" } = req.query;

        if (!PRODUCT_REVIEW_SORTS[sort]) {
            return res.status(400).json({
                success: false,
                message: `Invalid sort. Allowed: ${Object.keys(PRODUCT_REVIEW_SORTS).join(", ")}`,
            });
        }

        const filter = { approved: true };
        if (rating !== undefined) {
            const r = Number(rating);
            if (!Number.isInteger(r) || r < 1 || r > 5) {
                return res.status(400).json({ success: false, message: "Invalid rating filter" });
            }
            filter.rating = r;
        }
        if (productId !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(productId)) {
                return res.status(400).json({ success: false, message: "Invalid productId" });
            }
            filter.productId = productId;
        }
        if (verifiedPurchase !== undefined) {
            filter.verifiedPurchase = verifiedPurchase === "true" || verifiedPurchase === true;
        }

        const [reviews, total] = await Promise.all([
            Review.find(filter)
                .populate("userId", "name")
                .populate("productId", "title handle image")
                .sort(PRODUCT_REVIEW_SORTS[sort])
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Review.countDocuments(filter),
        ]);

        return res.status(200).json({
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
        console.error("getAllPublishedReviews error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/* ------------------------------------------------------------------ */
/* GET /reviews/eligibility/:productId                                */
/* ------------------------------------------------------------------ */
export const getReviewEligibility = async (req, res) => {
    try {
        const { productId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: "Invalid productId" });
        }

        const product = await Product.findById(productId).select("isActive").lean();
        if (!product) {
            return res.status(200).json({
                success: true,
                data: {
                    canReview: false,
                    reason: "product_not_found",
                    alreadyReviewed: false,
                    verifiedPurchase: false,
                },
            });
        }
        if (product.isActive === false) {
            return res.status(200).json({
                success: true,
                data: {
                    canReview: false,
                    reason: "product_unavailable",
                    alreadyReviewed: false,
                    verifiedPurchase: false,
                },
            });
        }

        const [existingReview, verifiedPurchase] = await Promise.all([
            Review.exists({ productId, userId: req.user.id }),
            checkVerifiedPurchase(req.user.id, productId),
        ]);

        if (existingReview) {
            return res.status(200).json({
                success: true,
                data: {
                    canReview: false,
                    reason: "already_reviewed",
                    alreadyReviewed: true,
                    verifiedPurchase,
                },
            });
        }

        if (REQUIRE_VERIFIED_PURCHASE && !verifiedPurchase) {
            return res.status(200).json({
                success: true,
                data: {
                    canReview: false,
                    reason: "not_purchased",
                    alreadyReviewed: false,
                    verifiedPurchase: false,
                },
            });
        }

        return res.status(200).json({
            success: true,
            data: { canReview: true, alreadyReviewed: false, verifiedPurchase },
        });
    } catch (error) {
        console.error("getReviewEligibility error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/* ------------------------------------------------------------------ */
/* POST /reviews/:id/vote                                             */
/* ------------------------------------------------------------------ */
export const voteReview = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid review id" });
        }

        const { vote } = req.body;
        if (!["helpful", "not_helpful"].includes(vote)) {
            return res.status(400).json({
                success: false,
                message: "vote must be 'helpful' or 'not_helpful'",
            });
        }

        const review = await Review.findById(id).select("+votes helpfulCount notHelpfulCount approved userId");
        if (!review || !review.approved) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        const existingIdx = review.votes.findIndex(
            (v) => String(v.userId) === String(req.user.id)
        );

        let currentUserVote = vote;

        if (existingIdx === -1) {
            review.votes.push({ userId: req.user.id, vote });
            if (vote === "helpful") review.helpfulCount += 1;
            else review.notHelpfulCount += 1;
        } else {
            const existing = review.votes[existingIdx];
            if (existing.vote === vote) {
                currentUserVote = existing.vote;
            } else {
                if (existing.vote === "helpful") {
                    review.helpfulCount = Math.max(0, review.helpfulCount - 1);
                } else {
                    review.notHelpfulCount = Math.max(0, review.notHelpfulCount - 1);
                }

                if (vote === "helpful") review.helpfulCount += 1;
                else review.notHelpfulCount += 1;

                existing.vote = vote;
                existing.votedAt = new Date();
            }
        }

        await review.save();

        return res.status(200).json({
            success: true,
            data: {
                helpfulCount: review.helpfulCount,
                notHelpfulCount: review.notHelpfulCount,
                currentUserVote,
            },
        });
    } catch (error) {
        console.error("voteReview error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/* ------------------------------------------------------------------ */
/* POST /reviews/:id/report                                           */
/* ------------------------------------------------------------------ */
export const reportReview = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid review id" });
        }

        const review = await Review.findById(id).select("+reporters reportCount reported");
        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        const alreadyReported = review.reporters.some(
            (r) => String(r.userId) === String(req.user.id)
        );
        if (alreadyReported) {
            return res.status(409).json({
                success: false,
                message: "You have already reported this review",
            });
        }

        review.reporters.push({ userId: req.user.id });
        review.reportCount += 1;
        review.reported = true;
        review.reportedAt = new Date();

        await review.save();

        return res.status(200).json({
            success: true,
            message: "Review reported. Thank you for the feedback.",
            data: { reportCount: review.reportCount },
        });
    } catch (error) {
        console.error("reportReview error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/* ------------------------------------------------------------------ */
/* GET /reviews/admin/stats                                           */
/* ------------------------------------------------------------------ */
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
                {
                    $group: {
                        _id: null,
                        avgRating: { $avg: "$rating" },
                        rating1: r1,
                        rating2: r2,
                        rating3: r3,
                        rating4: r4,
                        rating5: r5,
                    },
                },
            ]),
        ]);

        const approvedCount = statusAgg.find((s) => s._id === true)?.count || 0;
        const pendingCount = statusAgg.find((s) => s._id === false)?.count || 0;
        const ratingStats = ratingAgg[0];

        return res.status(200).json({
            success: true,
            stats: {
                totalReviews,
                approvedReviews: approvedCount,
                pendingReviews: pendingCount,
                verifiedPurchaseReviews: verifiedAgg[0]?.count || 0,
                reportedReviews: reportedAgg[0]?.count || 0,
                averageApprovedRating: ratingStats
                    ? Math.round((ratingStats.avgRating || 0) * 10) / 10
                    : 0,
                ratingDistribution: ratingStats
                    ? {
                        1: ratingStats.rating1,
                        2: ratingStats.rating2,
                        3: ratingStats.rating3,
                        4: ratingStats.rating4,
                        5: ratingStats.rating5,
                    }
                    : { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            },
        });
    } catch (error) {
        console.error("getAdminReviewStats error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};