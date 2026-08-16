import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FiBookOpen, FiSearch, FiSliders } from "react-icons/fi";
import axios from "axios";

import ProductCard from "../../components/frontend/ProductCard.jsx";
import Loading from "../../components/UI/Loading.jsx";
import { BookContext } from "../../context/School.jsx";
import { useContext } from "react";

const API = import.meta.env.VITE_API;

function CategoryProducts() {
    const { categoryName } = useParams();
    const { user } = useContext(BookContext);

    const [category, setCategory] = useState(null);
    const [books, setBooks] = useState([]);

    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const normalizeCategory = (value = "") => {
        return decodeURIComponent(value)
            .replace(/-/g, " ")
            .trim()
            .toLowerCase();
    };

    useEffect(() => {
        const fetchCategoryProducts = async () => {
            try {
                setLoading(true);
                setError("");

                const categoryResponse = await axios.get(`${API}/api/book/category`);

                const categories = categoryResponse.data?.data || [];

                const requestedCategory =
                    normalizeCategory(categoryName);

                const matchedCategory = categories.find(
                    (category) => normalizeCategory(category.name) === requestedCategory
                );
                if (!matchedCategory) {
                    setCategory(null);
                    setBooks([]);
                    setError(`Category "${categoryName}" was not found.`);
                    return;
                }

                setCategory(matchedCategory);

                const response = await axios.get(
                    `${API}/api/book`,
                    {
                        params: {
                            page: 1,
                            limit: 50,
                            category: matchedCategory._id,
                            search: search || undefined,
                            sortBy,
                            sortOrder,
                        },
                    }
                );

                setBooks(response.data?.data || []);
            } catch (error) {
                console.error("Category products error:", error);
                setError(error.response?.data?.message || "Failed to load category products.");
            } finally {
                setLoading(false);
            }
        };

        fetchCategoryProducts();
    }, [categoryName, search, sortBy, sortOrder]);

    return (
        <main className="min-h-screen bg-slate-50">
            <section className="bg-blue-950 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                    <div className="flex items-center gap-2 text-sm text-blue-200">
                        <FiBookOpen />
                        <span>Categories</span>
                        <span>/</span>
                        <span>{category?.name || categoryName}</span>
                    </div>
                    <h1 className="mt-4 text-3xl sm:text-4xl font-bold capitalize">{category?.name || categoryName}</h1>
                    {category?.description && (
                        <p className="mt-3 max-w-2xl text-blue-100 leading-relaxed">{category.description}</p>
                    )}
                </div>
            </section>

            <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="relative w-full lg:max-w-md">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={`Search ${category?.name || "products"}...`}
                            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <FiSliders className="text-gray-500" />
                        <select
                            value={`${sortBy}-${sortOrder}`}
                            onChange={(e) => {
                                const [field, order] = e.target.value.split("-");
                                setSortBy(field);
                                setSortOrder(order);
                            }}
                            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none">
                            <option value="createdAt-desc">Newest</option>
                            <option value="createdAt-asc">Oldest</option>
                            <option value="price-asc">Price: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                            <option value="name-asc">Name: A-Z</option>
                        </select>
                    </div>
                </div>

                {!loading && !error && category && (
                    <div className="mt-8 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{category.name} Books</h2>
                            <p className="mt-1 text-sm text-gray-500">{books.length} products found</p>
                        </div>

                    </div>
                )}

                {loading && (
                    <div className="mt-8"><Loading /></div>
                )}

                {!loading && error && (
                    <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
                        <FiBookOpen className="mx-auto text-4xl text-red-300" />
                        <h2 className="mt-4 text-lg font-semibold text-red-700">Category Not Found</h2>
                        <p className="mt-2 text-sm text-red-600">{error}</p>
                    </div>
                )}

                {!loading && !error && books.length > 0 && (
                    <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                        {books.map((book) => (
                            <ProductCard key={book._id} book={book} user={user} />
                        ))}
                    </div>
                )}

                {!loading && !error && books.length === 0 && (
                    <div className="mt-10 rounded-2xl bg-white border border-gray-200 p-12 text-center">
                        <FiBookOpen className="mx-auto text-5xl text-gray-300" />
                        <h3 className="mt-5 text-lg font-semibold text-gray-900">No products found</h3>
                        <p className="mt-2 text-sm text-gray-500">There are currently no products available in this category.</p>
                    </div>
                )}
            </section>
        </main>
    );
}

export default CategoryProducts;