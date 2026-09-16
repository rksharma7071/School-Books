import React, { useMemo, useState } from "react";
import { useLoaderData, useSearchParams } from "react-router-dom";
import OrderTable from "../../../components/admin/OrderTable.jsx";

function Order() {
    const loader = useLoaderData();
    const [searchParams, setSearchParams] = useSearchParams();

    const orders = Array.isArray(loader?.data) ? loader.data : [];
    const pagination = loader?.pagination ?? {};

    // ---- URL is the source of truth ----
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.max(1, Number(searchParams.get("limit")) || 20);
    const searchFromUrl = searchParams.get("search") ?? "";
    const statusFilter = searchParams.get("status") ?? "all";

    const [searchInput, setSearchInput] = useState(searchFromUrl);
    const [selectedIds, setSelectedIds] = useState([]);

    // ---- URL param helper (merges, never clobbers) ----
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

    const handleStatusChange = (e) => {
        const value = e.target.value;
        updateParams({ status: value === "all" ? "" : value, page: 1 });
    };

    const handleLimitChange = (e) =>
        updateParams({ limit: Number(e.target.value), page: 1 });

    const handlePrevPage = () => {
        if (pagination.hasPreviousPage) updateParams({ page: page - 1 });
    };

    const handleNextPage = () => {
        if (pagination.hasNextPage) updateParams({ page: page + 1 });
    };

    // ---- Selection (current page slice) ----
    const allVisibleIds = useMemo(
        () => orders.map((o) => o._id).filter(Boolean),
        [orders]
    );

    const isAllSelected =
        allVisibleIds.length > 0 &&
        allVisibleIds.every((id) => selectedIds.includes(id));

    const toggleSelect = (id) =>
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds((prev) => prev.filter((id) => !allVisibleIds.includes(id)));
        } else {
            setSelectedIds((prev) => Array.from(new Set([...prev, ...allVisibleIds])));
        }
    };

    // ---- Footer counters ----
    const total = pagination.total ?? orders.length;
    const totalPages = pagination.totalPages ?? 1;
    const startIndex = total > 0 ? (page - 1) * limit + 1 : 0;
    const endIndex = Math.min(page * limit, total);

    return (
        <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                        Orders
                    </h2>
                    <p className="text-sm text-gray-500">
                        Track and fulfil customer orders.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <select
                        value={statusFilter}
                        onChange={handleStatusChange}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All statuses</option>
                        <option value="in progress">In Progress</option>
                        <option value="fulfilled">Fulfilled</option>
                        <option value="unfulfilled">Unfulfilled</option>
                        <option value="cancelled">Cancelled</option>
                    </select>

                    <form
                        onSubmit={handleSearchSubmit}
                        className="flex-1 sm:w-64"
                    >
                        <input
                            type="search"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search by order #, customer, total..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </form>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                {selectedIds.length > 0 && (
                    <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between text-xs text-gray-600">
                        <span>{selectedIds.length} order(s) selected</span>
                        <button
                            className="text-blue-600 hover:underline"
                            onClick={() => setSelectedIds([])}
                        >
                            Clear selection
                        </button>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <OrderTable
                        isAllSelected={isAllSelected}
                        toggleSelectAll={toggleSelectAll}
                        paginatedOrder={orders}
                        selectedIds={selectedIds}
                        toggleSelect={toggleSelect}
                    />
                </div>

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
                                ? `Showing ${startIndex}–${endIndex} of ${total} orders`
                                : "Showing 0 of 0 orders"}
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

export default Order;