import React, { useMemo } from "react";
import Review from "./Review.jsx";

function ReviewHeader({ book, approvedReviews = [], setShowReviewForm }) {
    const totalReviews = approvedReviews.length;

    const averageRating = useMemo(() => {
        if (!totalReviews) return 0;
        const total = approvedReviews.reduce(
            (sum, r) => sum + Number(r.rating || 0),
            0
        );
        return total / totalReviews;
    }, [approvedReviews, totalReviews]);

    const ratingStats = useMemo(() => {
        const stats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        approvedReviews.forEach((r) => {
            const rounded = Math.round(r.rating);
            stats[rounded] += 1;
        });
        return stats;
    }, [approvedReviews]);

    return (
        <div className="border-b border-gray-200 pb-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900">Customer Reviews</h2>

                    <div className="flex items-center gap-3 mt-2">
                        <Review rating={averageRating} />
                        <span className="text-sm text-gray-700 font-medium">{averageRating.toFixed(2)} out of 5</span>
                    </div>

                    <p className="text-sm text-gray-500 mt-1">Based on {totalReviews} review{totalReviews !== 1 && "s"}</p>
                </div>

                <button
                    onClick={() => setShowReviewForm(true)}
                    className="self-start lg:self-center px-5 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-800 hover:bg-gray-100 transition"
                >
                    Write a review
                </button>
            </div>

            <div className="mt-6 space-y-2 max-w-md">
                {[5, 4, 3, 2, 1].map((star) => {
                    const count = ratingStats[star];
                    const percent = totalReviews ? Math.round((count / totalReviews) * 100) : 0;

                    return (
                        <div key={star} className="flex items-center gap-3 text-sm">
                            <div className="flex items-center gap-1 w-20">
                                {[...Array(star)].map((_, i) => (
                                    <span key={i} className="text-yellow-400">★</span>
                                ))}
                                {[...Array(5 - star)].map((_, i) => (
                                    <span key={i} className="text-gray-300">★</span>
                                ))}
                            </div>

                            <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
                                <div className="h-full bg-yellow-400" style={{ width: `${percent}%` }} />
                            </div>

                            <span className="w-8 text-right text-gray-600">{count}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default ReviewHeader;
