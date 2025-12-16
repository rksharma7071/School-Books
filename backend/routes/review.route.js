import express from "express";
import {
    getAllReview,
    createReview,
    deleteReview,
    updateReview,
    getReviewById
} from "../controllers/review.controller.js";

const router = express.Router();

router.route("/").get(getAllReview).post(createReview);

router.route("/:id").get(getReviewById).patch(updateReview).delete(deleteReview);

export default router;
