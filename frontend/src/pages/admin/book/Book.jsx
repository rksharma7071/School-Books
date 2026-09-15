import React, { useContext, useState, useMemo, useCallback } from "react";
import { Link, useLoaderData, useSearchParams } from "react-router-dom";
import BookTable from "../../../components/admin/BookTable.jsx";
import { BookContext } from "../../../context/School.jsx";

function Book() {
    const { setToastConfig, setShowToast } = useContext(BookContext);
    const loaderData = useLoaderData();
    const [searchParams, setSearchParams] = useSearchParams();

    const books = loaderData?.data ?? [];
    const pagination = loaderData?.pagination ?? {};

    // URL is the source of truth
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;
    const searchFromUrl = searchParams.get("search") ?? "";

    // Local input only — mirrors the URL, doesn't drive it
    const [searchInput, setSearchInput] = useState(searchFromUrl);
    const [selectedIds, setSelectedIds] = useState([]);

    // Update URL query params (single helper)
    const updateParams = useCallback(
        (patch, { replace = false } = {}) => {
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
        },
        [setSearchParams]
    );

    // Search submit — updates URL, resets to page 1
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        updateParams({ search: searchInput.trim(), page: 1 });
    };

    // Pagination
    const handleNextPage = () => pagination.hasNextPage && updateParams({ page: page + 1 });
    const handlePrevPage = () => pagination.hasPreviousPage && updateParams({ page: page - 1 });
    const handleLimitChange = (e) => updateParams({ limit: Number(e.target.value), page: 1 });

    // Selection (current page slice)
    const allVisibleIds = useMemo(
        () => books.map((b) => b.id || b._id).filter(Boolean),
        [books]
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

    const total = pagination.total ?? 0;
    const startIndex = total > 0 ? (page - 1) * limit + 1 : 0;
    const endIndex = Math.min(page * limit, total);

    return (
        <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Books</h2>
                    <p className="text-sm text-gray-500">Manage all school books and inventory.</p>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <form onSubmit={handleSearchSubmit} className="flex-1 sm:w-72">
                        <input
                            type="search"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search by title, class, medium, edition..."
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </form>

                    <Link
                        to={`/${import.meta.env.VITE_ADMIN}/books/add`}
                        className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                    >
                        Add Book
                    </Link>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                {selectedIds.length > 0 && (
                    <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between text-xs text-gray-600">
                        <span>{selectedIds.length} book(s) selected</span>
                        <button
                            className="text-blue-600 hover:underline"
                            onClick={() => setSelectedIds([])}
                        >
                            Clear selection
                        </button>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <BookTable
                        isAllSelected={isAllSelected}
                        toggleSelectAll={toggleSelectAll}
                        paginatedBooks={books}
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
                                ? `Showing ${startIndex}–${endIndex} of ${total} books`
                                : "Showing 0 of 0 books"}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 justify-end">
                        <button
                            onClick={handlePrevPage}
                            disabled={!pagination.hasPreviousPage}
                            className={`px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 ${!pagination.hasPreviousPage ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                        >
                            Prev
                        </button>

                        <span>
                            Page{" "}
                            <span className="font-semibold text-gray-700">{page}</span> of{" "}
                            <span className="font-semibold text-gray-700">
                                {pagination.totalPages ?? 1}
                            </span>
                        </span>

                        <button
                            onClick={handleNextPage}
                            disabled={!pagination.hasNextPage}
                            className={`px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 ${!pagination.hasNextPage ? "opacity-50 cursor-not-allowed" : ""
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

export default Book;