import React, { useMemo, useState } from "react";
import { useLoaderData, useSearchParams } from "react-router-dom";
import CartTable from "../../../components/admin/CartTable.jsx";

function Cart() {
    const loader = useLoaderData();
    const [searchParams, setSearchParams] = useSearchParams();

    const carts = Array.isArray(loader?.data) ? loader.data : [];
    const pagination = loader?.pagination ?? {};

    // ---- URL is the source of truth ----
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.max(1, Number(searchParams.get("limit")) || 20);
    const searchFromUrl = searchParams.get("search") ?? "";

    const [searchInput, setSearchInput] = useState(searchFromUrl);

    // ---- Merge-style URL updater ----
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
        // Search is client-side on the current page.
        // We only track the term in the URL for shareability; no server call.
        updateParams({ search: searchInput.trim() }, { replace: true });
    };

    const handleLimitChange = (e) =>
        updateParams({ limit: Number(e.target.value), page: 1 });

    const handlePrevPage = () => {
        if (pagination.hasPreviousPage) updateParams({ page: page - 1 });
    };

    const handleNextPage = () => {
        if (pagination.hasNextPage) updateParams({ page: page + 1 });
    };

    // ---- Client-side filter on the current page slice ----
    const visibleCarts = useMemo(() => {
        const term = (searchFromUrl || "").trim().toLowerCase();
        if (!term) return carts;

        return carts.filter((cart) => {
            const userStr = cart.user
                ? `${cart.user.name || ""} ${cart.user.email || ""}`.toLowerCase()
                : "";

            const hasProduct = (cart.items || []).some((item) =>
                (item.product?.name || "").toLowerCase().includes(term)
            );

            return userStr.includes(term) || hasProduct;
        });
    }, [carts, searchFromUrl]);

    // ---- Footer counters ----
    const total = pagination.total ?? carts.length;
    const totalPages = pagination.totalPages ?? 1;
    const startIndex = total > 0 ? (page - 1) * limit + 1 : 0;
    const endIndex = Math.min(page * limit, total);

    return (
        <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                        Carts
                    </h2>
                    <p className="text-sm text-gray-500">
                        Active carts that haven't been checked out.
                    </p>
                </div>

                <form
                    onSubmit={handleSearchSubmit}
                    className="w-full sm:w-auto"
                >
                    <input
                        type="search"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search by customer or book..."
                        className="w-full sm:w-72 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </form>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <CartTable paginatedCarts={visibleCarts} />

                <div className="border-t border-gray-100 px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500">
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
                        </select>
                        <span className="hidden sm:inline">
                            {total > 0
                                ? `Showing ${startIndex}–${endIndex} of ${total} carts`
                                : "Showing 0 of 0 carts"}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 justify-end">
                        <button
                            onClick={handlePrevPage}
                            disabled={!pagination.hasPreviousPage}
                            className={`px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 ${!pagination.hasPreviousPage
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
                            className={`px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 ${!pagination.hasNextPage
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }`}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Cart;