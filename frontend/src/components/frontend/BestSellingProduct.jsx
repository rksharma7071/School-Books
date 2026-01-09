import React, { useContext, useEffect } from 'react'
import { BookContext } from '../../context/School.jsx';
import ProductCard from './ProductCard.jsx';

function BestSellingProduct() {
    const { user, books, cartItems, setCartItems, loading, setLoading } = useContext(BookContext);

    useEffect(() => {
        setLoading(true);

        if (books && books.length > 0) {
            setLoading(false);
        }
    }, [books, setLoading]);

    // console.log("Loading: ", loading);


    return (
        <div className="bg-slate-50 py-12">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Best Selling Books</h2>
                        <p className="text-sm text-gray-500 mt-1">Most loved books by our readers</p>
                    </div>

                    <a href="/best-sellers" className="text-sm font-medium text-blue-600 hover:text-blue-700">View All →</a>
                </div>
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <span className="text-gray-500 text-lg animate-pulse">
                            Loading books...
                        </span>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {books.length > 0 &&
                            books
                                .filter(book => book.isActive === true)
                                .slice(0, 10)
                                .map((book) => <ProductCard key={book._id} book={book} user={user} cartItems={cartItems} setCartItems={setCartItems} />)}
                    </div>
                )}
            </div>
        </div>

    )
}

export default BestSellingProduct