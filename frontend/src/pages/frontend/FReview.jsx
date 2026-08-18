// frontend/src/pages/frontend/FReview.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { FiStar, FiUser, FiBookOpen, FiSearch } from "react-icons/fi";
import Review from "../../components/frontend/Review.jsx";
import Loading from "../../components/UI/Loading.jsx";
import api from "../../utils/api.js";

const FReview = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [ratingFilter, setRatingFilter] = useState(0);
    const [sortBy, setSortBy] = useState("newest");


    console.log("reviews", reviews);
    

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            setError("");
            
            const response = await api.get(`/api/review/published`);
            const publishedReviews = response.data.data || [];
            setReviews(publishedReviews);
        } catch (error) {
            console.error("Failed to fetch reviews:", error);
            setError(error.response?.data?.message || "Failed to load reviews. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Filter and sort reviews
    const filteredReviews = useMemo(() => {
        let result = [...reviews];
        
        // Filter by search term
        if (search.trim()) {
            const term = search.toLowerCase();
            result = result.filter(r => 
                r.title?.toLowerCase().includes(term) ||
                r.body?.toLowerCase().includes(term) ||
                r.book?.name?.toLowerCase().includes(term) ||
                r.user?.username?.toLowerCase().includes(term)
            );
        }
        
        // Filter by rating
        if (ratingFilter > 0) {
            result = result.filter(r => Math.round(r.rating) === ratingFilter);
        }
        
        // Sort
        switch (sortBy) {
            case "newest":
                result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case "oldest":
                result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case "highest":
                result.sort((a, b) => b.rating - a.rating);
                break;
            case "lowest":
                result.sort((a, b) => a.rating - b.rating);
                break;
            default:
                break;
        }
        
        return result;
    }, [reviews, search, ratingFilter, sortBy]);

    // Calculate statistics
    const stats = useMemo(() => {
        if (!reviews.length) return { total: 0, avgRating: 0, distribution: {} };
        
        const total = reviews.length;
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        const avgRating = sum / total;
        
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews.forEach(r => {
            const rounded = Math.round(r.rating);
            if (rounded >= 1 && rounded <= 5) {
                distribution[rounded] = (distribution[rounded] || 0) + 1;
            }
        });
        
        return { total, avgRating, distribution };
    }, [reviews]);

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const truncateText = (text, maxLength = 150) => {
        if (!text) return "";
        return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Customer Reviews</h1>
                    <p className="text-gray-600 mt-2">
                        Read what our readers have to say about their favorite books
                    </p>
                </div>

                {/* Stats Section */}
                {!loading && reviews.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-gray-900">
                                    {stats.total}
                                </p>
                                <p className="text-sm text-gray-600">Total Reviews</p>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-3xl font-bold text-gray-900">
                                        {stats.avgRating.toFixed(1)}
                                    </span>
                                    <Review rating={stats.avgRating} size={20} />
                                </div>
                                <p className="text-sm text-gray-600">Average Rating</p>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1 flex-col">
                                    {[5, 4, 3, 2, 1].map(star => (
                                        <div key={star} className="flex items-center gap-1">
                                            <span className="text-sm text-gray-600">{star}★</span>
                                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-yellow-400 rounded-full"
                                                    style={{ 
                                                        width: `${(stats.distribution[star] || 0) / stats.total * 100}%` 
                                                    }}
                                                />
                                            </div>
                                            <span className="text-xs text-gray-500">
                                                {stats.distribution[star] || 0}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search reviews by book, author, or title..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        
                        <div className="flex gap-2">
                            <select
                                value={ratingFilter}
                                onChange={(e) => setRatingFilter(Number(e.target.value))}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={0}>All Ratings</option>
                                <option value={5}>5 Stars</option>
                                <option value={4}>4 Stars</option>
                                <option value={3}>3 Stars</option>
                                <option value={2}>2 Stars</option>
                                <option value={1}>1 Star</option>
                            </select>
                            
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="highest">Highest Rating</option>
                                <option value="lowest">Lowest Rating</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading && <Loading text="Loading reviews..." />}

                {/* Error State */}
                {!loading && error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <p className="text-red-600">{error}</p>
                        <button
                            onClick={fetchReviews}
                            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* No Reviews State */}
                {!loading && !error && filteredReviews.length === 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                        <FiBookOpen className="mx-auto text-6xl text-gray-300" />
                        <h3 className="mt-4 text-xl font-semibold text-gray-900">No Reviews Found</h3>
                        <p className="mt-2 text-gray-600">
                            {search || ratingFilter 
                                ? "Try adjusting your filters to see more results."
                                : "Be the first to share your thoughts on our books!"}
                        </p>
                    </div>
                )}

                {/* Reviews Grid */}
                {!loading && !error && filteredReviews.length > 0 && (
                    <div className="space-y-6">
                        <p className="text-sm text-gray-600">
                            Showing {filteredReviews.length} of {reviews.length} reviews
                        </p>
                        
                        {filteredReviews.map((review) => (
                            <div
                                key={review._id}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                <FiUser className="text-blue-600 text-lg" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">
                                                    {review.user?.first_name} {review.user?.last_name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatDate(review.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="mb-2">
                                            <Review rating={review.rating} size={16} />
                                        </div>
                                        
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {review.title}
                                        </h3>
                                        
                                        <p className="text-gray-700 mt-2 leading-relaxed">
                                            {truncateText(review.body, 200)}
                                        </p>
                                        
                                        {review.book && (
                                            <Link
                                                to={`/products/${review.book.slug}`}
                                                className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                                            >
                                                <FiBookOpen />
                                                {review.book.name}
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FReview;