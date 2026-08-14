import express from "express";
import {
    getAllReview,
    createReview,
    deleteReview,
    updateReview,
    getReviewById,
    getReviewSummary,
    getReviewsByBook,
} from "../controllers/review.controller.js";
import authMiddleware from "../middlewares/authentication.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

router.get("/summary", getReviewSummary);
router.get("/book/:bookId", getReviewsByBook);

router
    .route("/")
    .get(authMiddleware, authorize("admin"), getAllReview)
    .post(authMiddleware, createReview); 

router
    .route("/:id")
    .get(getReviewById)
    .patch(authMiddleware, authorize("admin"), updateReview) 
    .delete(authMiddleware, authorize("admin"), deleteReview);

export default router;
