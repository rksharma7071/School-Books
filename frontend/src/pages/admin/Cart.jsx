import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useLoaderData } from "react-router-dom";
import { getCart } from "../../data/cart.js";
import CartTable from "../../components/admin/CartTable.jsx";

function Cart() {
    const loader = useLoaderData();

    const [carts, setCarts] = useState(loader || []);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCarts(loader || []);
    }, [loader]);

    const refresh = useCallback(async () => {
        setRefreshing(true);
        try {
            const data = await getCart();
            setCarts(data || []);
        } finally {
            setRefreshing(false);
        }
    }, []);

    const filteredCarts = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (!term) return carts;

        return carts.filter((cart) => {
            const user = `${cart.user?.name || ""} ${cart.user?.email || ""}`.toLowerCase();
            const hasBook = (cart.items || []).some((item) => item.book?.name?.toLowerCase().includes(term));
            return user.includes(term) || hasBook;
        });
    }, [carts, search]);

    const totalPages = Math.max(1, Math.ceil(filteredCarts.length / rowsPerPage));

    const paginatedCarts = useMemo(() => {
        const safePage = Math.min(currentPage, totalPages);
        const start = (safePage - 1) * rowsPerPage;
        return filteredCarts.slice(start, start + rowsPerPage);
    }, [filteredCarts, currentPage, rowsPerPage, totalPages]);

    const handlePaginationChange = (e) => {
        setRowsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const handlePrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
    const handleNextPage = () =>
        setCurrentPage((p) => Math.min(totalPages, p + 1));

    const startIndex =
        filteredCarts.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
    const endIndex = Math.min(currentPage * rowsPerPage, filteredCarts.length);

    return (
        <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                        Carts
                    </h2>
                    <p className="text-sm text-gray-500">
                        Active carts that haven’t been checked out.
                    </p>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Search by customer or book..."
                        className="flex-1 sm:w-72 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={refresh}
                        disabled={refreshing}
                        className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </button>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <CartTable paginatedCarts={paginatedCarts} />

                <div className="border-t border-gray-100 px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                        <span>Rows per page:</span>
                        <select
                            value={rowsPerPage}
                            onChange={handlePaginationChange}
                            className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={5}>5 rows</option>
                            <option value={10}>10 rows</option>
                            <option value={20}>20 rows</option>
                            <option value={30}>30 rows</option>
                        </select>
                        <span className="hidden sm:inline">
                            {filteredCarts.length > 0
                                ? `Showing ${startIndex}–${endIndex} of ${filteredCarts.length} carts`
                                : "Showing 0 of 0 carts"}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 justify-end">
                        <button
                            onClick={handlePrevPage}
                            disabled={currentPage === 1}
                            className={`px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 ${currentPage === 1
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                                }`}
                        >
                            Prev
                        </button>
                        <span>
                            Page{" "}
                            <span className="font-semibold text-gray-700">
                                {Math.min(currentPage, totalPages)}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-gray-700">
                                {totalPages}
                            </span>
                        </span>
                        <button
                            onClick={handleNextPage}
                            disabled={currentPage >= totalPages}
                            className={`px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 ${currentPage >= totalPages
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
