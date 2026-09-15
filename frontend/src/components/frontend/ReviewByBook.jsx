import React from "react";
import Review from "./Review.jsx";
import ReviewHeader from "./ReviewHeader.jsx";

function ReviewByBook({ review = [], reviewSectionRef, showReviewForm, setShowReviewForm }) {

    const book = review[0]?.book;

    return (
        <section className="max-w-5xl mx-auto px-4 py-10">
            <div ref={reviewSectionRef}>
                <ReviewHeader book={book} approvedReviews={review} setShowReviewForm={setShowReviewForm} />

            </div>
            <div className="space-y-6">
                {!review.length && <div className="text-center py-5 text-gray-500">No reviews available for this book.</div>}
                {review.map((r) => (
                    <div
                        key={r._id}
                        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-900">{r.user?.name}</p>
                                <p className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</p>
                            </div>

                            <Review rating={r.rating} size={14} />
                        </div>

                        <h3 className="mt-3 text-base font-semibold text-gray-800">{r.title}</h3>
                        <p className="mt-2 text-sm text-gray-600 leading-relaxed">{r.body}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default ReviewByBook;
