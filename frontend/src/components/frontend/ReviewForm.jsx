import React, { useEffect, useState } from "react";
import { FaStar } from "react-icons/fa";
import axios from "axios";
function ReviewForm({ onClose, onSubmit, bookId, userId }) {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await axios.post("/api/review", {
                rating,
                title,
                body,
                bookId,
                userId,
            });

            console.log("Review added:", res.data);

            onSubmit(res.data);
            setRating(0);
            setTitle("");
            setBody("");

        } catch (error) {
            console.error("Review Add Error:", error.response?.data || error.message);
        }
    };

    useEffect(() => {
        const esc = (e) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", esc);
        return () => document.removeEventListener("keydown", esc);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center px-4"
            onClick={onClose}
        >
            {/* Modal Card */}
            <div
                className="w-full max-w-lg bg-white rounded-2xl shadow p-6 sm:p-8 animate-scaleIn"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">
                        Write a review
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                        ✕
                    </button>
                </div>

                {/* Rating */}
                <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rating
                    </label>

                    <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHover(star)}
                                onMouseLeave={() => setHover(0)}
                            >
                                <FaStar
                                    className={`text-2xl transition ${(hover || rating) >= star
                                        ? "text-yellow-400"
                                        : "text-gray-300"
                                        }`}
                                />
                            </button>
                        ))}
                    </div>

                    {!rating && (
                        <p className="text-xs text-gray-400 mt-1">
                            Click to rate
                        </p>
                    )}
                </div>

                {/* Title */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Review title
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Give your review a title"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Body */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Review
                    </label>
                    <textarea
                        rows="5"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Write your review here..."
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md border text-sm text-gray-600 hover:bg-gray-100"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={!rating || !title || !body}
                        className="px-6 py-2 rounded-md bg-blue-900 text-white text-sm font-medium hover:bg-blue-950 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                    >
                        Submit review
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ReviewForm;
