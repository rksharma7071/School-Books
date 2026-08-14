import React, { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { BookContext } from "../../context/School.jsx";
import ProductCard from "./ProductCard.jsx";

function BestSellingProduct() {
    const { books, booksLoading } = useContext(BookContext);
    const [ratings, setRatings] = useState({});

    // ONE request for all ratings, instead of one per card
    useEffect(() => {
        const controller = new AbortController();

        axios
            .get(`${import.meta.env.VITE_API}/api/review/summary`, {
                signal: controller.signal,
            })
            .then(({ data }) =>
                setRatings(
                    Object.fromEntries(data.map((r) => [r.bookId, r.avgRating]))
                )
            )
            .catch(() => {});

        return () => controller.abort();
    }, []);

    const visibleBooks = useMemo(
        () => books.filter((b) => b.isActive).slice(0, 10),
        [books]
    );

    return (
        <div className="bg-slate-50 py-12">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Best Selling Books</h2>
                        <p className="text-sm text-gray-500 mt-1">Most loved books by our readers</p>
                    </div>
                    <a href="/best-sellers" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                        View All →
                    </a>
                </div>

                { booksLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="aspect-square bg-gray-200 rounded-lg" />
                                <div className="h-4 bg-gray-200 rounded mt-3" />
                                <div className="h-3 bg-gray-200 rounded mt-2 w-2/3" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {visibleBooks.map((book) => (
                            <ProductCard
                                key={book._id}
                                book={book}
                                rating={ratings[book._id] ?? 0}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default BestSellingProduct;