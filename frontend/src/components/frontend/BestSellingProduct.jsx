import { useEffect, useState } from "react";
import { getBooks } from "../../data/book.js";
import ProductCard from "./ProductCard.jsx";
import Loading from "../UI/Loading.jsx";
import { useContext } from "react";
import { BookContext } from "../../context/School.jsx";

function BestSellingProduct() {
    const {
        user,
        cartItems,
        setCartItems,
    } = useContext(BookContext);

    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);

    // ONE request for all ratings, instead of one per card
    useEffect(() => {
        let mounted = true;

        const loadBooks = async () => {
            try {
                setLoading(true);

                const response = await getBooks({
                    page: 1,
                    limit: 10,
                    sortBy: "createdAt",
                    sortOrder: "desc",
                });

                if (mounted) {
                    setBooks(response?.data || []);
                }
            } catch (error) {
                console.error("Failed to load books:", error);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        loadBooks();

        return () => {
            mounted = false;
        };
    }, []);

    const visibleBooks = useMemo(
        () => books.filter((b) => b.isActive).slice(0, 10),
        [books]
    );

    return (
        <section className="bg-slate-50 py-12">
            <div className="max-w-7xl mx-auto px-4">

                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Best Selling Books
                        </h2>

                        <p className="text-sm text-gray-500 mt-1">
                            Most loved books by our readers
                        </p>
                    </div>
                </div>

                {loading ? (
                    <Loading />
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {books.map((book) => (
                            <ProductCard
                                key={book._id}
                                book={book}
                                user={user}
                                cartItems={cartItems}
                                setCartItems={setCartItems}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

export default BestSellingProduct;