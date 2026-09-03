import express from "express";
import {
    getAllReview,
    createReview,
    deleteReview,
    updateReview,
    getReviewById,
    getReviewSummary,
    getReviewsByBook,
    getMyReviews,
    getAllPublishedReviews,
} from "../controllers/review.controller.js";
import authMiddleware from "../middlewares/authentication.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

router.get("/summary", getReviewSummary);
router.get("/book/:bookId", getReviewsByBook);
router.get("/published", getAllPublishedReviews);

router.route("/")
    .get(getAllReview)
    .post(createReview);

router.use(authMiddleware);

router.get("/my-reviews", getMyReviews);

router.route("/:id")
    .get(getReviewById)
    .patch(authorize("admin"), updateReview)
    .delete(deleteReview);

export default router;