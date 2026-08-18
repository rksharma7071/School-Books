import axios from "axios";
import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Review from "./Review.jsx";
import { BookContext } from "../../context/School.jsx";

function ProductCard({ book, rating = 0 }) {
    const { user, setCartItems, setToastConfig, setShowToast } = useContext(BookContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

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

    const img = book.coverImage?.includes("/upload/")
        ? book.coverImage.replace("/upload/", "/upload/f_auto,q_auto,c_limit,w_400/")
        : book.coverImage;

    return (
        <div className="group bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
            <Link
                to={`products/${book.slug}`}
                className="relative aspect-square bg-gray-50 flex items-center justify-center overflow-hidden"
            >
                <img
                    src={img}
                    alt={book.name}
                    width={300}
                    height={300}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 text-[10px] font-semibold bg-green-600 text-white px-2 py-1 rounded-lg">
                    Best Seller
                </span>
            </Link>

            <div className="p-4 flex flex-col gap-2">
                <Link
                    to={`/products/${book.slug}`}
                    className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug"
                >
                    {book.name}
                </Link>
                <p className="text-xs text-gray-500 line-clamp-1">by {book.author}</p>

                <Review rating={rating} showValue={false} />

                <div className="mt-3 flex items-center justify-between">
                    <span className="text-base font-bold text-gray-900">₹{book.price}</span>
                    <button
                        onClick={handleAddToCart}
                        disabled={loading}
                        className="text-xs font-medium px-4 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition disabled:opacity-60"
                    >
                        {loading ? "Adding..." : "Add to Cart"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default React.memo(ProductCard);