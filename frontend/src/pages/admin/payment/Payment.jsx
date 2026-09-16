import React, { useMemo, useState } from "react";
import { useLoaderData, useSearchParams } from "react-router-dom";
import PaymentTable from "../../../components/admin/PaymentTable.jsx";

function Payment() {
    const loader = useLoaderData();
    const [searchParams, setSearchParams] = useSearchParams();

    const payments = Array.isArray(loader?.data) ? loader.data : [];
    const pagination = loader?.pagination ?? {};

    // ---- URL is the source of truth ----
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.max(1, Number(searchParams.get("limit")) || 20);
    const searchFromUrl = searchParams.get("search") ?? "";

    const [searchInput, setSearchInput] = useState(searchFromUrl);
    const [selectedIds, setSelectedIds] = useState([]);

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
        updateParams({ search: searchInput.trim(), page: 1 });
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
        () => payments.map((p) => p._id || p.id).filter(Boolean),
        [payments]
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
    const total = pagination.total ?? payments.length;
    const startIndex = total > 0 ? (page - 1) * limit + 1 : 0;
    const endIndex = Math.min(page * limit, total);
    const totalPages = pagination.totalPages ?? 1;

    return (
        <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                        Payment
                    </h2>
                </div>

                <form
                    onSubmit={handleSearchSubmit}
                    className="w-full sm:w-auto"
                >
                    <input
                        type="search"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search transaction, provider, order..."
                        className="w-full sm:w-80 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </form>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                {selectedIds.length > 0 && (
                    <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                        <span>{selectedIds.length} payment(s) selected</span>
                        <button
                            className="text-blue-600 hover:underline"
                            onClick={() => setSelectedIds([])}
                        >
                            Clear selection
                        </button>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <PaymentTable
                        isAllSelected={isAllSelected}
                        toggleSelectAll={toggleSelectAll}
                        paginatedPayment={payments}
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
                                ? `Showing ${startIndex}–${endIndex} of ${total} payments`
                                : "Showing 0 of 0 payments"}
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

export default Payment;