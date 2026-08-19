import axios from "axios";
import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Review from "./Review.jsx";
import { BookContext } from "../../context/School.jsx";

function ProductCard({ book, rating = 0 }) {
    const { user, setCartItems, setToastConfig, setShowToast } = useContext(BookContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isWishlisted, setIsWishlisted] = useState(false);

    const handleAddToCart = async () => {
        if (!user) return navigate("/login");
        if (loading) return;

        setLoading(true);

        setCartItems((prev) => {
            const item = prev.find((i) => i.bookId === book._id);
            return item
                ? prev.map((i) =>
                    i.bookId === book._id ? { ...i, quantity: i.quantity + 1 } : i
                )
                : [...prev, { bookId: book._id, quantity: 1, book }];
        });

        try {
            await axios.post(`${import.meta.env.VITE_API}/api/cart`, {
                userId: user.id,
                bookId: book._id,
                quantity: 1,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setToastConfig({
                type: "success",
                title: "Added to cart",
                message: "The item has been successfully added to your cart.",
            });
        } catch (e) {
            setToastConfig({
                type: "error",
                title: "Failed",
                message: "Could not add to cart. Please try again.",
            });
        } finally {
            setLoading(false);
            setShowToast(true);
        }
    };

    const toggleWishlist = () => {
        setIsWishlisted(!isWishlisted);
    };
    
    const img = book.coverImage?.includes("/upload/")
        ? book.coverImage.replace("/upload/", "/upload/f_auto,q_auto,c_limit,w_400/")
        : book.coverImage;

    return (
        <div className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col hover:-translate-y-1">
            {/* Image Container */}
            <Link
                to={`/products/${book.slug}`}
                className="relative aspect-[4/5] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden"
            >
                <img
                    src={img}
                    alt={book.name}
                    width={300}
                    height={375}
                    loading="lazy"
                    decoding="async"
                    onError={() => setImageError(true)}
                    className="h-full w-full object-contain p-5 group-hover:scale-110 transition-transform duration-500 ease-out"
                />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {book.isBestSeller && (
                        <span className="text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2.5 py-1.5 rounded-full shadow-md flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Best Seller
                        </span>
                    )}

                    {book.discountPercentage > 0 && (
                        <span className="text-[10px] font-bold bg-red-500 text-white px-2.5 py-1.5 rounded-full shadow-md">
                            -{book.discountPercentage}%
                        </span>
                    )}
                </div>

                {/* Wishlist Button */}
                <button
                    onClick={toggleWishlist}
                    className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-gray-600 hover:text-red-500 hover:scale-110 transition-all duration-200 shadow-md"
                >
                    <svg
                        className={`w-4 h-4 transition-colors ${isWishlisted ? 'text-red-500' : ''}`}
                        fill={isWishlisted ? "currentColor" : "none"}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                </button>

                {/* Quick View Button on Hover */}
                <div className="absolute inset-x-3 bottom-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    <button
                        onClick={handleAddToCart}
                        disabled={loading || book.stockQty === 0}
                        className="flex-1 text-xs font-semibold px-4 py-2.5 rounded-lg bg-[#162556] text-white hover:bg-[#162556]/90 active:scale-95 transition-all duration-200 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-1">
                                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Adding...
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                {book.stockQty === 0 ? 'Out of Stock' : 'Add to Cart'}
                            </span>
                        )}
                    </button>
                </div>
            </Link>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1">
                {/* Category */}
                {book.category && (
                    <Link
                        to={`/category/${book.category.slug}`}
                        className="text-[10px] font-medium text-[#162556] uppercase tracking-wider mb-2 hover:text-blue-700"
                    >
                        {book.category.name}
                    </Link>
                )}

                {/* Title */}
                <Link
                    to={`/products/${book.slug}`}
                    className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug hover:text-blue-600 transition-colors duration-200"
                >
                    {book.name}
                </Link>

                {/* Author */}
                <p className="mt-1.5 text-xs text-gray-500 line-clamp-1">
                    by <span className="font-medium text-gray-700">{book.author}</span>
                </p>

                {/* Rating */}
                <div className="mt-2 flex items-center gap-1.5">
                    <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                            <svg
                                key={i}
                                className={`w-3.5 h-3.5 ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        ))}
                    </div>
                    <span className="text-xs font-medium text-gray-600">{rating.toFixed(1)}</span>
                    {book.reviewCount > 0 && (
                        <span className="text-xs text-gray-400">({book.reviewCount})</span>
                    )}
                </div>

                {/* Price and Stock */}
                <div className="mt-auto pt-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-gray-900">
                                ₹{book.price.toFixed(2)}
                            </span>
                            {book.originalPrice && book.originalPrice > book.price && (
                                <span className="text-sm text-gray-400 line-through">
                                    ₹{book.originalPrice.toFixed(2)}
                                </span>
                            )}
                        </div>

                        {/* Stock Status */}
                        {book.stockQty > 0 ? (
                            book.stockQty <= 5 ? (
                                <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                                    Only {book.stockQty} left
                                </span>
                            ) : (
                                <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                    In Stock
                                </span>
                            )
                        ) : (
                            <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                                Out of Stock
                            </span>
                        )}
                    </div>

                    {/* Savings */}
                    {book.discountPercentage > 0 && (
                        <div className="mt-2 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-green-700 bg-green-100 px-2 py-1 rounded">
                                Save ₹{((book.originalPrice || 0) - book.price).toFixed(2)}
                            </span>
                            <span className="text-[11px] text-gray-500">
                                Free Delivery
                            </span>
                        </div>
                    )}

                    {/* Mobile Add to Cart */}
                    <button
                        onClick={handleAddToCart}
                        disabled={loading || book.stockQty === 0}
                        className="mt-3 w-full sm:hidden text-xs font-semibold px-4 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {book.stockQty === 0 ? "Out of Stock" : loading ? "Adding..." : "Add to Cart"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default React.memo(ProductCard);