import axios from "axios";
import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookContext } from "../../context/School.jsx";
import { getImageUrl } from "../../data/file.js";

function ProductCard({ book, rating = 0 }) {
    const { user, setCartItems, setToastConfig, setShowToast, token } = useContext(BookContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [selectedOptions, setSelectedOptions] = useState({});

    const defaultVariant = book.variants?.[0] || {};
    const currentVariant = book.variants?.find(v =>
        Object.entries(selectedOptions).every(([key, value]) => v.options[key] === value)
    ) || defaultVariant;

    const handleOptionChange = (optionName, value) => {
        setSelectedOptions(prev => ({ ...prev, [optionName]: value }));
    };

    const handleAddToCart = async () => {
        if (!user) return navigate("/login");
        if (loading) return;
        if (!currentVariant._id) return;

        setLoading(true);

        const cartItem = {
            bookId: book._id,
            variantId: currentVariant._id,
            quantity: 1,
            book: { ...book, selectedVariant: currentVariant }
        };

        setCartItems((prev) => {
            const item = prev.find((i) => i.variantId === currentVariant._id);
            return item ? prev.map((i) => i.variantId === currentVariant._id ? { ...i, quantity: i.quantity + 1 } : i) : [...prev, cartItem];
        });

        try {
            await axios.post(`${import.meta.env.VITE_API}/api/cart`, {
                userId: user.id,
                bookId: book._id,
                variantId: currentVariant._id,
                quantity: 1,
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            setToastConfig({
                type: "success",
                title: "Added to cart",
                message: `${book.title} (${Object.values(currentVariant.options || {}).join(" - ")}) added to cart.`,
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

    // const img = import.meta.env.VITE_API + "/api/" + book.images[0]?.publicId || currentVariant.images?.[0] || "/placeholder-image.jpg";
    // console.log("getImageUrl(book.images[0]): ",getImageUrl(book.images[0]));
    
    const img = getImageUrl(book.images[0]) || currentVariant.images?.[0] || "/placeholder-image.jpg";
    const displayPrice = currentVariant.price || book.minPrice || 0;
    const stockQty = currentVariant.inventory_quantity ?? book.totalInventory ?? 0;



    // console.log("Book", book.images[0]);
    // console.log("img", { title: book.title, img });

    return (
        <div className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col hover:-translate-y-1">
            <Link
                to={`/products/${book.handle}`}
                className="relative aspect-[4/5] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden"
            >
                {imageError ? (
                    <div className="flex flex-col items-center justify-center text-gray-400">
                        <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs">No image available</span>
                    </div>
                ) : (
                    <img
                        src={img}
                        alt={book.title}
                        width={300}
                        height={375}
                        loading="lazy"
                        decoding="async"
                        onError={() => setImageError(true)}
                        className="h-full w-full object-contain p-5 group-hover:scale-110 transition-transform duration-500 ease-out"
                    />
                )}

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
                <div className="absolute inset-x-3 bottom-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    <button
                        onClick={handleAddToCart}
                        disabled={loading || stockQty === 0}
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
                                {stockQty === 0 ? 'Out of Stock' : 'Add to Cart'}
                            </span>
                        )}
                    </button>
                </div>
            </Link>

            <div className="p-4 flex flex-col flex-1">
                <Link
                    to={`/products/${book.handle}`}
                    className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug hover:text-blue-600 transition-colors duration-200"
                >
                    {book.title}
                </Link>

                {book.description && (
                    <p className="mt-1.5 text-xs text-gray-500 line-clamp-2">{book.description}</p>
                )}

                {/* {book.options && book.options.length > 0 && (
                    <div className="mt-3 space-y-2">
                        {book.options.map((option) => (
                            <div key={option._id} className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-600 capitalize min-w-[60px]">
                                    {option.name}:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                    {option.values.map((value) => {
                                        const isSelected = selectedOptions[option.name] === value || 
                                            (!selectedOptions[option.name] && defaultVariant.options?.[option.name] === value);
                                        return (
                                            <button
                                                key={value}
                                                onClick={() => handleOptionChange(option.name, value)}
                                                className={`text-[11px] px-2 py-1 rounded-md transition-colors ${
                                                    isSelected
                                                        ? 'bg-[#162556] text-white font-medium'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                            >
                                                {value}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )} */}

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
                </div>

                <div className="mt-auto pt-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-gray-900">
                                ₹{displayPrice.toFixed(2)}
                            </span>
                            {/* {book.minPrice !== book.maxPrice && (
                                <span className="text-xs text-gray-400">
                                    ₹{book.minPrice} - ₹{book.maxPrice}
                                </span>
                            )} */}
                        </div>

                        {stockQty > 0 ? (
                            stockQty <= 5 ? (
                                <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                                    Only {stockQty} left
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

                    {/* {book.variants && book.variants.length > 1 && (
                        <div className="mt-2 text-[11px] text-gray-500">
                            {book.variants.length} variants available
                        </div>
                    )} */}

                    <button
                        onClick={handleAddToCart}
                        disabled={loading || stockQty === 0}
                        className="mt-3 w-full sm:hidden text-xs font-semibold px-4 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {stockQty === 0 ? "Out of Stock" : loading ? "Adding..." : "Add to Cart"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default React.memo(ProductCard);
