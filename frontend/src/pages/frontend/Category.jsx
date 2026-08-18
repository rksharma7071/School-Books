import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
    FiBookOpen,
    FiArrowRight,
    FiSearch,
} from "react-icons/fi";

const API = import.meta.env.VITE_API;

function Categories() {
    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // useEffect(() => {
    //     const fetchCategories = async () => {
    //         try {
    //             setLoading(true);
    //             setError("");
    //             const response = await axios.get(`${API}/api/book/category`);
    //             setCategories(response.data?.data || []);
    //         } catch (err) {
    //             console.error("Failed to fetch categories:", err);
    //             setError(err.response?.data?.message || "Unable to load categories.");
    //         } finally {
    //             setLoading(false);
    //         }
    //     };

    //     fetchCategories();
    // }, []);

    useEffect(() => {
        fetchCategories();
    }, []);

    console.log("categories: ", categories);
    

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${API}/api/categories/all?sortBy=bookCount&sortOrder=desc`);
            const data = await response.json();

            if (data.success) {
                setCategories(data.data);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    console.log("Categories", categories);
    


    const filteredCategories = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (!term) return categories;

        return categories.filter((category) =>
            category.name?.toLowerCase().includes(term)
        );
    }, [categories, search]);

    return (
        <main className="min-h-screen bg-slate-50">
            {/* Hero */}
            <section className="bg-blue-950 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
                    <div className="max-w-3xl">
                        <p className="text-sm font-medium text-blue-200 mb-3">SchoolBook</p>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">Explore All Categories</h1>

                        <p className="mt-4 text-blue-100 text-sm sm:text-base leading-relaxed">
                            Find textbooks, study materials and educational
                            resources organized by subject and category.
                        </p>
                    </div>
                </div>
            </section>

            <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">All Categories</h2>
                        <p className="mt-1 text-sm text-gray-500">{categories.length} categories available</p>
                    </div>

                    <div className="relative w-full md:w-80">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search categories..."
                            className="w-full rounded-xl border border-gray-200
                            bg-white py-3 pl-10 pr-4 text-sm outline-none
                            focus:border-blue-600 focus:ring-2
                            focus:ring-blue-100"
                        />
                    </div>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {Array.from({ length: 8 }).map((_, index) => (
                            <div key={index} className="h-36 rounded-2xl bg-white border border-gray-200 animate-pulse" />
                        ))}
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="mt-10 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">{error}</div>
                )}

                {/* Categories */}
                {!loading && !error && (
                    <>
                        {filteredCategories.length === 0 ? (
                            <div className="mt-10 rounded-2xl bg-white border
                                border-gray-200 p-12 text-center">
                                <FiBookOpen className="mx-auto text-4xl text-gray-300" />

                                <h3 className="mt-4 text-lg font-semibold text-gray-900">No categories found</h3>

                                <p className="mt-2 text-sm text-gray-500">Try searching with another category name.</p>
                            </div>
                        ) : (
                            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                {filteredCategories.map((category) => (
                                    <Link
                                        key={category._id}
                                        to={`/categories/${encodeURIComponent(
                                            category.slug
                                        )}`}
                                        state={{
                                            categoryId: category._id,
                                            categoryName: category.name,
                                        }}
                                        className="group rounded-2xl border
                                        border-gray-200 bg-white p-6
                                        shadow-sm hover:-translate-y-1
                                        hover:shadow-lg transition-all"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="h-12 w-12 rounded-xl
                                                bg-blue-50 text-blue-700
                                                flex items-center justify-center">
                                                <FiBookOpen className="text-xl" />
                                            </div>

                                            <FiArrowRight
                                                className="text-gray-300
                                                group-hover:text-blue-600
                                                group-hover:translate-x-1
                                                transition-all"
                                            />
                                        </div>

                                        <h3 className="mt-5 text-lg font-semibold
                                            text-gray-900">
                                            {category.name}
                                        </h3>

                                        {category.description && (
                                            <p className="mt-2 text-sm text-gray-500
                                                line-clamp-2">
                                                {category.description}
                                            </p>
                                        )}

                                        <div className="mt-5 text-sm font-medium
                                            text-blue-600">
                                            View Books →
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </section>
        </main>
    );
}

export default Categories;