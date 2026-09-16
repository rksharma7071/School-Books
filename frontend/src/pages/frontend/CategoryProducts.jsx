import React, { useMemo } from "react";
import { Link, useLoaderData, useParams, useSearchParams } from "react-router-dom";
import { FiBookOpen, FiSliders, FiSearch, FiChevronRight } from "react-icons/fi";
import ProductCard from "../../components/frontend/ProductCard.jsx";

function CategoryProducts() {
    const loaderData = useLoaderData();
    
    const { handle } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    const category = loaderData?.category ?? null;
    const products = Array.isArray(loaderData?.products) ? loaderData.products : [];
    const pagination = loaderData?.pagination ?? {};
    const notFound = loaderData?.notFound === true;

    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.max(1, Number(searchParams.get("limit")) || 20);
    const sortBy = searchParams.get("sortBy") ?? "createdAt";
    const sortOrder = searchParams.get("sortOrder") ?? "desc";
    const searchFromUrl = searchParams.get("search") ?? "";

    const [searchInput, setSearchInput] = React.useState(searchFromUrl);

    const visibleProducts = useMemo(() => {
        const term = (searchFromUrl || "").trim().toLowerCase();
        if (!term) return products;
        return products.filter((p) => {
            const title = (p.title || "").toLowerCase();
            const sku = (p.variants || [])
                .map((v) => v.sku || "")
                .join(" ")
                .toLowerCase();
            return title.includes(term) || sku.includes(term);
        });
    }, [products, searchFromUrl]);

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

    const handleSortChange = (e) => {
        const [field, order] = e.target.value.split(":");
        updateParams({ sortBy: field, sortOrder: order, page: 1 });
    };

    const handlePrevPage = () => {
        if (pagination.hasPreviousPage) updateParams({ page: page - 1 });
    };

    const handleNextPage = () => {
        if (pagination.hasNextPage) updateParams({ page: page + 1 });
    };

    const total = pagination.total ?? 0;
    const totalPages = pagination.totalPages ?? 1;
    const displayName = category?.name || handle;

    return (
        <main className="min-h-screen bg-slate-50">
            {/* Hero */}
            <section className="bg-blue-950 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                    <nav className="flex items-center gap-2 text-sm text-blue-200">
                        <Link to="/" className="hover:text-white">
                            Home
                        </Link>
                        <FiChevronRight className="opacity-60" />
                        <Link to="/categories" className="hover:text-white">
                            Categories
                        </Link>
                        <FiChevronRight className="opacity-60" />
                        <span className="text-white/90">{displayName}</span>
                    </nav>

                    <h1 className="mt-4 text-3xl sm:text-4xl font-bold capitalize">
                        {displayName}
                    </h1>

                    {category?.description && (
                        <p className="mt-3 max-w-2xl text-blue-100 leading-relaxed">
                            {category.description}
                        </p>
                    )}
                </div>
            </section>

            {/* Controls */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <form
                        onSubmit={handleSearchSubmit}
                        className="relative w-full lg:max-w-md"
                    >
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="search"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder={`Search in ${displayName}...`}
                            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                    </form>

                    <div className="flex items-center gap-3">
                        <FiSliders className="text-gray-500" />
                        <select
                            value={`${sortBy}:${sortOrder}`}
                            onChange={handleSortChange}
                            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-600"
                        >
                            <option value="createdAt:desc">Newest</option>
                            <option value="createdAt:asc">Oldest</option>
                            <option value="price:asc">Price: Low to High</option>
                            <option value="price:desc">Price: High to Low</option>
                            <option value="title:asc">Name: A–Z</option>
                            <option value="title:desc">Name: Z–A</option>
                            <option value="inventory:desc">Most in stock</option>
                        </select>
                    </div>
                </div>
            </section>

            {/* Body */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
                {/* Not found */}
                {notFound && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center">
                        <FiBookOpen className="mx-auto text-4xl text-red-300" />
                        <h2 className="mt-4 text-lg font-semibold text-red-700">
                            Category Not Found
                        </h2>
                        <p className="mt-2 text-sm text-red-600">
                            We couldn't find “{handle}”.
                        </p>
                        <Link
                            to="/categories"
                            className="inline-block mt-5 px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800"
                        >
                            Back to Categories
                        </Link>
                    </div>
                )}

                {/* Summary */}
                {!notFound && (
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                {displayName} Books
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                {total} product{total === 1 ? "" : "s"} found
                                {searchFromUrl
                                    ? ` • showing matches for “${searchFromUrl}”`
                                    : ""}
                            </p>
                        </div>
                    </div>
                )}

                {/* Empty */}
                {!notFound && visibleProducts.length === 0 && (
                    <div className="rounded-2xl bg-white border border-gray-200 p-12 text-center">
                        <FiBookOpen className="mx-auto text-5xl text-gray-300" />
                        <h3 className="mt-5 text-lg font-semibold text-gray-900">
                            No products found
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                            {searchFromUrl
                                ? "Try a different search term."
                                : "There are currently no products in this category."}
                        </p>
                    </div>
                )}

                {/* Grid */}
                {!notFound && visibleProducts.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                        {visibleProducts.map((book) => (
                            <ProductCard key={book._id || book.id} book={book} />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {!notFound && totalPages > 1 && (
                    <div className="mt-10 border-t border-gray-200 pt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500">
                        <span>
                            Showing {(page - 1) * limit + 1}–
                            {Math.min(page * limit, total)} of {total}
                        </span>

                        <div className="flex items-center gap-3">
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

export default CategoryProducts;