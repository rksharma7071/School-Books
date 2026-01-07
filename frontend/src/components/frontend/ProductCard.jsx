import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Review from "./Review.jsx";
import { getReview } from "../../data/review.js";
import StatusMessage from "./StatusMessage.jsx";
import { BookContext } from "../../context/School.jsx";

function ProductCard({ user, book }) {
    const { toastConfig, setToastConfig, showToast, cartItems, setCartItems, setShowToast, } = useContext(BookContext);


    const navigate = useNavigate();
    const [avgRating, setAvgRating] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleAddToCart = async () => {
        if (!user || loading) {
            navigate('/login')
            return;
        }
        setLoading(true);

        setCartItems(prev => {
            const item = prev.find(i => i.bookId === book._id);
            return item
                ? prev.map(i =>
                    i.bookId === book._id
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                )
                : [...prev, { bookId: book._id, quantity: 1 }];
        });

        try {
            await axios.post(`${import.meta.env.VITE_API}/api/cart`, {
                userId: user.id,
                bookId: book._id,
                quantity: 1
            });
            setToastConfig({
                type: "success",
                title: "Added to cart",
                message: "The item has been successfully added to your cart.",
            });
        } finally {
            setLoading(false);
            setShowToast(true)
        }
    };

    useEffect(() => {
        const fetchReview = async () => {
            try {
                const res = await getReview();
                const result = res.review.filter((rev) => rev.bookId == book._id);
                const avgRating = result.reduce((sum, r) => sum + Number(r.rating || 0), 0) / (result.length || 1);
                setAvgRating(avgRating);
            } catch (error) {
                console.log("Fetch Review Error: ", error);   
            }
        }
        fetchReview()
    }, [])

    return (
        <div className="group bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
            <Link to={`products/${book._id}`} className="relative aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                <img
                    src={book.coverImage}
                    alt={book.name}
                    className="h-full w-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                />

                <span className="absolute top-3 left-3 text-[10px] font-semibold bg-green-600 text-white px-2 py-1 rounded-lg">
                    Best Seller
                </span>
            </Link>

            <div className="p-4 flex flex-col gap-2">

                <Link to={`products/${book._id}`} className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">{book.name}</Link>
                <p className="text-xs text-gray-500 line-clamp-1">by {book.author}</p>
                <Review rating={avgRating} showValue={false} />
                <div className="mt-3 flex items-center justify-between">
                    <span className="text-base font-bold text-gray-900">₹{book.price}</span>

                    <button
                        onClick={handleAddToCart}
                        className="text-xs font-medium px-4 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition"
                    >
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProductCard;
