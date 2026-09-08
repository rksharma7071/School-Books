import express from "express";
import jwt from "jsonwebtoken";
import {
    getAllReview,
    createReview,
    updateReview,
    deleteReview,
    getReviewById,
    getReviewSummary,
    getReviewsByProduct,
    getMyReviews,
    getAllPublishedReviews,
    getReviewEligibility,
    voteReview,
    reportReview,
    getAdminReviewStats,
} from "../controllers/review.controller.js";
import { User } from "../models/user.model.js";
import authMiddleware from "../middlewares/authentication.js";
import { authorize, verifyReviewOwnership } from "../middlewares/authorize.js";

const router = express.Router();

const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) return next();

        const token = authHeader.slice(7).trim();
        if (!token) return next();

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded?.id) return next();

        const user = await User.findById(decoded.id).select("role status tokenVersion").lean();
        if (!user) return next();
        if ((user.tokenVersion || 0) !== (decoded.tokenVersion || 0)) return next();
        if (user.status === "blocked" || user.status === "suspended") return next();

        req.user = { id: user._id, role: user.role, status: user.status };
    } catch {
    }
    next();
};

router.get("/summary", getReviewSummary);
router.get("/product/:productId", getReviewsByProduct);
router.get("/published", getAllPublishedReviews);

router.get("/admin/stats", authMiddleware, authorize("admin"), getAdminReviewStats);
router.get("/", authMiddleware, authorize("admin"), getAllReview);

router.post("/", authMiddleware, createReview);
router.get("/my-reviews", authMiddleware, getMyReviews);
router.get("/eligibility/:productId", authMiddleware, getReviewEligibility);
router.post("/:id/vote", authMiddleware, voteReview);
router.post("/:id/report", authMiddleware, reportReview);

router.patch("/:id", authMiddleware, verifyReviewOwnership, updateReview);
router.delete("/:id", authMiddleware, verifyReviewOwnership, deleteReview);

router.get("/:id", optionalAuth, getReviewById);

export default router;