import React, { useState } from "react";
import { Link, useLoaderData, useSearchParams } from "react-router-dom";
import { FiBookOpen, FiArrowRight, FiSearch } from "react-icons/fi";

function Categories() {
    const loaderData = useLoaderData();
    const [searchParams, setSearchParams] = useSearchParams();

    const categories = Array.isArray(loaderData?.data) ? loaderData.data : [];
    const pagination = loaderData?.pagination ?? {};

    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.max(1, Number(searchParams.get("limit")) || 20);
    const searchFromUrl = searchParams.get("search") ?? "";

    const [searchInput, setSearchInput] = useState(searchFromUrl);

    const updateParams = (patch, { replace = false } = {}) => {
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                Object.entries(patch).forEach(([k, v]) => {
                    if (v === "" || v === null || v === undefined) next.delete(k);
                    else next.set(k, String(v));
                });
                return next;
            },
            { replace }
        );
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        updateParams({ search: searchInput.trim(), page: 1 });
    };

    const handleLimitChange = (e) =>
        updateParams({  page: 1, limit: Number(e.target.value) });

    const handlePrevPage = () => {
        if (pagination.hasPreviousPage) updateParams({ page: page - 1 });
    };

    const handleNextPage = () => {
        if (pagination.hasNextPage) updateParams({ page: page + 1 });
    };

    const total = pagination.total ?? categories.length;
    const totalPages = pagination.totalPages ?? 1;

    // "Showing X–Y of Z" — use server totals, clamp to real range
    const startIndex = total > 0 ? (page - 1) * limit + 1 : 0;
    const endIndex = Math.min(page * limit, total);

    return (
        <main className="min-h-screen bg-slate-50">
            {/* Hero */}
            <section className="bg-blue-950 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
                    <div className="max-w-3xl">
                        <p className="text-sm font-medium text-blue-200 mb-3">
                            SchoolBook
                        </p>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                            Explore All Categories
                        </h1>
                        <p className="mt-4 text-blue-100 text-sm sm:text-base leading-relaxed">
                            Find textbooks, study materials and educational
                            resources organized by subject and category.
                        </p>
                    </div>
                </div>
            </section>

            <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
                {/* Header + Search */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            All Categories
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            {total} categor{total === 1 ? "y" : "ies"} available
                        </p>
                    </div>

                    <form
                        onSubmit={handleSearchSubmit}
                        className="relative w-full md:w-80"
                    >
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="search"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search categories..."
                            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                    </form>
                </div>

                {/* Grid / Empty state */}
                {categories.length === 0 ? (
                    <div className="mt-10 rounded-2xl bg-white border border-gray-200 p-12 text-center">
                        <FiBookOpen className="mx-auto text-4xl text-gray-300" />
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">
                            No categories found
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                            {searchFromUrl
                                ? "Try searching with another category name."
                                : "No categories have been added yet."}
                        </p>
                    </div>
                ) : (
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {categories.map((category) => (
                            <Link
                                key={category.id}
                                to={`/categories/${category.handle}`}
                                state={{
                                    categoryId: category.id,
                                    categoryName: category.name,
                                }}
                                className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center overflow-hidden">
                                        {category.image ? (
                                            <img
                                                src={category.image}
                                                alt={category.name}
                                                className="h-full w-full object-cover"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <FiBookOpen className="text-xl" />
                                        )}
                                    </div>

                                    <FiArrowRight className="text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                                </div>

                                <h3 className="mt-5 text-lg font-semibold text-gray-900">
                                    {category.name}
                                </h3>

                                {category.description && (
                                    <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                                        {category.description}
                                    </p>
                                )}

                                <div className="mt-5 flex items-center justify-between text-sm">
                                    <span className="text-gray-400">
                                        {category.productCount} book
                                        {category.productCount === 1 ? "" : "s"}
                                    </span>
                                    <span className="font-medium text-blue-600">
                                        View Books →
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* ---- Pagination footer (always visible when there are items) ---- */}
                {categories.length > 0 && (
                    <div className="mt-10 border-t border-gray-200 pt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                            <span>Rows per page:</span>
                            <select
                                value={limit}
                                onChange={handleLimitChange}
                                className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={5}>5 rows</option>
                                <option value={10}>10 rows</option>
                                <option value={20}>20 rows</option>
                                <option value={30}>30 rows</option>
                                <option value={50}>50 rows</option>
                            </select>

                            <span className="hidden sm:inline">
                                {total > 0
                                    ? `Showing ${startIndex}–${endIndex} of ${total}`
                                    : "Showing 0 of 0"}
                            </span>
                        </div>

                        <div className="flex items-center gap-3 justify-end">
                            <button
                                onClick={handlePrevPage}
                                disabled={!pagination.hasPreviousPage}
                                className={`px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 ${!pagination.hasPreviousPage
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                    }`}
                            >
                                Prev
                            </button>

                            <span>
                                Page{" "}
                                <span className="font-semibold text-gray-700">
                                    {page}
                                </span>{" "}
                                of{" "}
                                <span className="font-semibold text-gray-700">
                                    {totalPages}
                                </span>
                            </span>

                            <button
                                onClick={handleNextPage}
                                disabled={!pagination.hasNextPage}
                                className={`px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 ${!pagination.hasNextPage
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                    }`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}

export default Categories;