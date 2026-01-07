import axios from "axios";
import React, { useContext, useEffect, useState, useMemo, useRef } from "react";
import { useLoaderData, useNavigate, useNavigation } from "react-router-dom";
import { BookContext } from "../../context/School.jsx";
import Review from "../../components/frontend/Review.jsx";
import ReviewByBook from "../../components/frontend/ReviewByBook.jsx";
import ReviewForm from "../../components/frontend/ReviewForm.jsx";
import { IoIosArrowDown } from "react-icons/io";
import Loading from "../../components/UI/Loading.jsx";

function BookById() {
    const book = useLoaderData();
    const { user, setCartItems, setToastConfig, setShowToast, } = useContext(BookContext);
    const navigate = useNavigate();
    const [showReviewForm, setShowReviewForm] = useState(false);
    const reviewSectionRef = useRef(null);
    const navigation = useNavigation();
    const pageLoading = navigation.state === "loading";

    // if (pageLoading) {
    //     return <Loading />
    // }
    const scrollToReviews = () => {
        reviewSectionRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    };
    const bookId = book?._id;
    const userId = user?.id;


    const {
        _id,
        name,
        description,
        price,
        author,
        publisher,
        classLevel,
        subject,
        language,
        stockQty,
        coverImage,
        review = [],
    } = book;
    const [expanded, setExpanded] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [avgRating, setAvgRating] = useState(0);

    const approvedReviews = useMemo(
        () => review.filter((r) => r.approved),
        [review]
    );

    useEffect(() => {
        if (!approvedReviews.length) {
            setAvgRating(0);
            return;
        }
        const total = approvedReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0);
        setAvgRating(total / approvedReviews.length);
    }, [approvedReviews]);

    const increaseQty = () => {
        if (quantity < stockQty) setQuantity((q) => q + 1);
    };

    const decreaseQty = () => {
        if (quantity > 1) setQuantity((q) => q - 1);
    };

    const handleAddToCart = async () => {
        if (!user) {
            navigate("/login");
            return;
        }

        if (loading) return;
        setLoading(true);

        setCartItems((prev) => {
            const item = prev.find((i) => i.bookId === _id);
            return item
                ? prev.map((i) => i.bookId === _id ? { ...i, quantity: i.quantity + quantity } : i)
                : [...prev, { bookId: _id, quantity }];
        });

        try {
            await axios.post("/api/cart", {
                userId: user.id,
                bookId: _id, quantity,
            });
            setToastConfig({
                type: "success",
                title: "Added to cart",
                message: "The item has been successfully added to your cart.",
            });
        } catch (error) {
            console.error("Error adding to cart:", error);
        } finally {
            setLoading(false);
            setShowToast(true)
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-white rounded-2xl p-6">
                <div className="flex justify-center">
                    <img
                        src={coverImage}
                        alt={name}
                        className="w-full max-w-md rounded-xl aspect-[3/4] object-contain"
                    />
                </div>
                <div className="flex flex-col gap-4">
                    <h1 className="text-3xl font-bold text-gray-900">{name}</h1>
                    <p className="text-gray-600">by {author}</p>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={scrollToReviews}
                            className="flex items-center gap-2 cursor-pointer"
                        >
                            <Review rating={avgRating} />
                        </button>

                        <span className="text-sm text-gray-500">
                            ({approvedReviews.length} reviews)
                        </span>
                    </div>

                    <div className="text-2xl font-semibold text-blue-950">
                        ₹{price}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                        <p><span className="font-medium">Publisher:</span> {publisher}</p>
                        <p><span className="font-medium">Class:</span> {classLevel}</p>
                        <p><span className="font-medium">Subject:</span> {subject}</p>
                        <p><span className="font-medium">Language:</span> {language}</p>
                    </div>

                    <div className="flex items-center gap-4 mt-4">
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
                                className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""
                                    }`}
                            >
                                <IoIosArrowDown />
                            </span>
                        </button>

                        <div
                            className={`overflow-hidden transition-all duration-300 ${expanded ? "max-h-full" : "max-h-0"
                                }`}
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

            {/* Reviews Section */}
            {showReviewForm && (
                <ReviewForm
                    onClose={() => setShowReviewForm(false)}
                    onSubmit={(data) => {
                        console.log("Review submitted:", data);
                        setShowReviewForm(false);
                    }}
                    bookId={bookId}
                    userId={userId}
                />
            )}
            <ReviewByBook review={approvedReviews} reviewSectionRef={reviewSectionRef} showReviewForm={showReviewForm} setShowReviewForm={setShowReviewForm} />
        </div>
    );
}

export default BookById;
