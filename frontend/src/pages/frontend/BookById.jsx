import axios from "axios";
import React, { useContext, useEffect, useState, useMemo, useRef } from "react";
import { useLoaderData, useNavigate, useNavigation } from "react-router-dom";
import { BookContext } from "../../context/School.jsx";
import Review from "../../components/frontend/Review.jsx";
import ReviewByBook from "../../components/frontend/ReviewByBook.jsx";
import ReviewForm from "../../components/frontend/ReviewForm.jsx";
import { IoIosArrowDown } from "react-icons/io";
import Loading from "../../components/UI/Loading.jsx";
import { useSEO } from "../../seo/SEO.jsx";

function BookById() {
    const book = useLoaderData();
    const { user, setCartItems, setToastConfig, setShowToast, token } = useContext(BookContext);
    const navigate = useNavigate();
    const [showReviewForm, setShowReviewForm] = useState(false);
    const reviewSectionRef = useRef(null);
    const navigation = useNavigation();
    const [imageError, setImageError] = useState(false);
    const [selectedOptions, setSelectedOptions] = useState({});
    const [selectedImage, setSelectedImage] = useState(0);

    const scrollToReviews = () => {
        reviewSectionRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    };

    const bookId = book?._id;

    const {
        _id,
        title = book.name || "Untitled",
        description = "",
        handle = book.slug || "",
        options = [],
        variants = [],
        images = [],
        isActive = true,
        minPrice = 0,
        maxPrice = 0,
        totalInventory = 0,
        inventoryStatus = "out_of_stock",
        reviews = { summary: { averageRating: 0, totalReviews: 0 }, recent: [] },
        createdAt,
        updatedAt,
    } = book || {};

    const defaultVariant = variants[0] || {};

    const currentVariant = useMemo(() => {
        return variants.find(v =>
            Object.entries(selectedOptions).every(([key, value]) =>
                v.options?.[key] === value || v.options?.[key.charAt(0).toUpperCase() + key.slice(1)] === value
            )
        ) || defaultVariant;
    }, [selectedOptions, variants, defaultVariant]);

    useEffect(() => {
        if (defaultVariant.options && Object.keys(selectedOptions).length === 0) {
            const initialOptions = {};
            Object.keys(defaultVariant.options).forEach(key => {
                initialOptions[key.toLowerCase()] = defaultVariant.options[key];
            });
            setSelectedOptions(initialOptions);
        }
    }, [defaultVariant]);

    const [expanded, setExpanded] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);

    const approvedReviews = useMemo(
        () => reviews?.recent?.filter((r) => r.approved) || [],
        [reviews]
    );

    const avgRating = reviews?.summary?.averageRating || 0;
    const totalReviews = reviews?.summary?.totalReviews || approvedReviews.length;

    const displayPrice = currentVariant.price || minPrice || 0;
    const stockQty = currentVariant.inventory_quantity ?? totalInventory ?? 0;
    const allImages = images.length > 0 ? images : (currentVariant.images || []);
    const displayImage = allImages[selectedImage] || allImages[0] || null;

    const increaseQty = () => {
        if (quantity < stockQty) setQuantity((q) => q + 1);
    };

    const decreaseQty = () => {
        if (quantity > 1) setQuantity((q) => q - 1);
    };

    const handleOptionChange = (optionName, value) => {
        setSelectedOptions(prev => ({
            ...prev,
            [optionName.toLowerCase()]: value
        }));
    };

    const getVariantOptionsString = () => {
        if (!currentVariant.options) return "";
        return Object.values(currentVariant.options).join(" - ");
    };

    const handleAddToCart = async () => {
        if (!user) {
            navigate("/login");
            return;
        }

        if (loading) return;
        if (!currentVariant._id) return;

        setLoading(true);

        const cartItem = {
            bookId: _id,
            variantId: currentVariant._id,
            quantity,
            book: {
                ...book,
                selectedVariant: currentVariant,
                displayPrice: currentVariant.price,
                variantOptions: getVariantOptionsString()
            }
        };

        setCartItems((prev) => {
            const item = prev.find((i) => i.variantId === currentVariant._id);
            return item
                ? prev.map((i) =>
                    i.variantId === currentVariant._id
                        ? { ...i, quantity: i.quantity + quantity }
                        : i
                )
                : [...prev, cartItem];
        });

        try {
            await axios.post(`${import.meta.env.VITE_API}/api/cart`, {
                userId: user.id,
                bookId: _id,
                variantId: currentVariant._id,
                quantity,
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            setToastConfig({
                type: "success",
                title: "Added to cart",
                message: `${title}${getVariantOptionsString() ? ` (${getVariantOptionsString()})` : ''} added to cart.`,
            });
        } catch (error) {
            console.error("Error adding to cart:", error);
            setToastConfig({
                type: "error",
                title: "Failed",
                message: error.response?.data?.message || "Could not add to cart. Please try again.",
            });
        } finally {
            setLoading(false);
            setShowToast(true);
        }
    };

    const jsonLdSchema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "@id": `https://schoolbook.lol/products/${bookId}`,
        name: title,
        description: description.replace(/\r?\n|\r/g, " ").slice(0, 300),
        sku: currentVariant.sku || bookId,
        image: allImages.length > 0 ? allImages : [null],
        brand: {
            "@type": "Brand",
            name: "SchoolBook",
        },
        offers: {
            "@type": "AggregateOffer",
            url: `https://schoolbook.lol/products/${handle}`,
            priceCurrency: "INR",
            lowPrice: minPrice,
            highPrice: maxPrice,
            offerCount: variants.length,
            availability: stockQty > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        },
        aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: avgRating.toFixed(1),
            reviewCount: totalReviews,
            bestRating: "5",
            worstRating: "1",
        },
    };

    useSEO({
        title: `${title} | Buy Online`,
        description: description,
        canonical: `https://schoolbook.lol/products/${handle}`,
        ogTitle: title,
        jsonLd: jsonLdSchema,
    });

    if (navigation.state === "loading") {
        return <Loading />;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-white rounded-2xl p-6">
                <div className="flex flex-col gap-4">
                    <div className="flex justify-center bg-gray-50 rounded-xl p-4">
                        {displayImage && !imageError ? (
                            <img
                                src={displayImage}
                                alt={title}
                                className="w-full max-w-md rounded-xl aspect-3/4 object-contain"
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center w-full max-w-md aspect-3/4 text-gray-400">
                                <svg className="w-24 h-24 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>No image available</span>
                            </div>
                        )}
                    </div>

                    {allImages.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto">
                            {allImages.map((img, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedImage(index)}
                                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index ? 'border-blue-600' : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <img src={img} alt={`${title} - ${index + 1}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-4">
                    <h1 className="text-3xl font-bold text-gray-900">{title}</h1>

                    {/* {description && (
                        <p className="text-gray-600 line-clamp-2">{description}</p>
                    )} */}

                    <div className="flex items-center gap-3">
                        <button
                            onClick={scrollToReviews}
                            className="flex items-center gap-2 cursor-pointer"
                        >
                            <Review rating={avgRating} />
                        </button>

                        <span className="text-sm text-gray-500">
                            ({totalReviews} reviews)
                        </span>
                    </div>

                    <div className="flex items-baseline gap-3">
                        <div className="text-2xl font-semibold text-blue-950">
                            ₹{displayPrice.toFixed(2)}
                        </div>
                        {minPrice !== maxPrice && (
                            <div className="text-sm text-gray-500">
                                (Range: ₹{minPrice} - ₹{maxPrice})
                            </div>
                        )}
                    </div>

                    {options.length > 0 && (
                        <div className="space-y-4 mt-2">
                            {options.map((option) => (
                                <div key={option._id}>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">{option.name}</label>
                                    <div className="flex flex-wrap gap-2">
                                        {option.values.map((value) => {
                                            const isSelected = selectedOptions[option.name.toLowerCase()] === value;
                                            return (
                                                <button
                                                    key={value}
                                                    onClick={() => handleOptionChange(option.name, value)}
                                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isSelected
                                                        ? 'bg-blue-900 text-white shadow-md'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                    )}

                    {getVariantOptionsString() && (
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">Selected:</span> {getVariantOptionsString()}
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        {stockQty > 0 ? (
                            stockQty <= 5 ? (
                                <span className="text-sm font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                                    Only {stockQty} left in stock
                                </span>
                            ) : (
                                <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                    In Stock
                                </span>
                            )
                        ) : (
                            <span className="text-sm font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full">
                                Out of Stock
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-4 mt-2">
                        <span className="font-medium">Quantity</span>
                        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                            <button onClick={decreaseQty} className="px-4 py-2 text-lg">−</button>
                            <span className="px-5 py-2">{quantity}</span>
                            <button onClick={increaseQty} className="px-4 py-2 text-lg">+</button>
                        </div>
                    </div>

                    <button
                        onClick={handleAddToCart}
                        disabled={stockQty === 0 || loading}
                        className={`mt-6 w-full py-3 rounded-xl text-white font-semibold transition
                            ${stockQty === 0
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-blue-900 hover:bg-blue-950"
                            }`}
                    >
                        {loading ? "Adding..." : stockQty === 0 ? "Out of Stock" : "Add to Cart"}
                    </button>

                    <div className="mt-6 border border-gray-200 rounded-xl overflow-hidden">
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition"
                        >
                            <span className="text-sm font-semibold text-gray-900">
                                Description
                            </span>

                            <span
                                className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
                            >
                                <IoIosArrowDown />
                            </span>
                        </button>

                        <div
                            className={`overflow-hidden transition-all duration-300 ${expanded ? "max-h-full" : "max-h-0"}`}
                        >
                            <div className="px-4 py-3">
                                <p className="text-gray-700 leading-relaxed text-sm">
                                    {description}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showReviewForm && (
                <ReviewForm
                    onClose={() => setShowReviewForm(false)}
                    onSubmit={(data) => { setShowReviewForm(false) }}
                    bookId={bookId}
                    userId={user?.id}
                />
            )}
            <ReviewByBook
                review={approvedReviews}
                reviewSectionRef={reviewSectionRef}
                showReviewForm={showReviewForm}
                setShowReviewForm={setShowReviewForm}
            />
        </div>
    );
}

export default BookById;
