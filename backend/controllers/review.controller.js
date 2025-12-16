import mongoose from "mongoose";
import { Review } from "../models/review.model.js";

async function getAllReview(req, res) {
    const review = await Review.find({});

    const averageRating =
        review.reduce((sum, r) => sum + r.rating, 0) / review.length || 0;

    return res.json({ totalReview: review.length, averageRating, review });
}

async function getReviewById(req, res) {
    // const review = await Review.find({});
    const review = await Review.findById(req.params.id);

    return res.json(review);
}

async function createReview(req, res) {
    try {
        const { bookId, userId, rating, title, body } = req.body;

        if (!bookId) {
            return res.status(400).json({ msg: "Book Id is required." });
        }
        if (!userId) {
            return res.status(400).json({ msg: "User Id is required." });
        }

        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            return res.status(400).json({ msg: "Invalid bookId format" });
        }
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ msg: "Invalid userId format" });
        }
        if (!rating || !title || !body) {
            return res.status(400).json({ msg: "All fields are required..." });
        }

        const result = await Review.create({
            bookId: bookId,
            userId: userId,
            rating: rating,
            title: title,
            body: body,
        });
        return res
            .status(201)
            .json({ msg: "Reivew created successfully!", review: result });
    } catch (error) {
        console.error("Error creating review:", error);
        return res.status(500).json({ msg: "Internal Server Error" });
    }
}
async function updateReview(req, res) {
    try {
        const { id } = req.params;
        const { approved } = req.body;

        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).json({ msg: "Review not found" });
        }

        review.approved = approved;
        review.approvedAt = approved ? new Date() : null;

        const result = await review.save();

        return res.status(200).json({
            msg: "Review updated successfully",
            review: result,
        });
    } catch (error) {
        console.error("Error updating review:", error);
        return res.status(500).json({ msg: "Internal Server Error" });
    }
}

async function deleteReview(req, res) {
    try {
        const reviewId = req.params.id;
        if (!reviewId) {
            return res.status(400).json({ msg: "Invalid Reivew ID" });
        }
        await Review.findByIdAndDelete(reviewId);
        return res.json({
            status: "success",
            message: "Review deleted successfully",
        });
    } catch (error) {
        console.error("Reivew delete error:", error);
        return res.status(500).json({ msg: "Internal Server Error" });
    }
}

export {
    getAllReview,
    getReviewById,
    createReview,
    updateReview,
    deleteReview,
};
