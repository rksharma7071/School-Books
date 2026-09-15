import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useLoaderData, useSearchParams } from "react-router-dom";
import axios from "axios";
import ReviewTable from "../../../components/admin/ReviewTable.jsx";

function Review() {
    const loaderData = useLoaderData();
    const [searchParams, setSearchParams] = useSearchParams();

    // ---- URL is the source of truth ----
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.max(1, Number(searchParams.get("limit")) || 20);
    const searchFromUrl = searchParams.get("search") ?? "";

    // ---- State seeded from loader ----
    const [reviews, setReviews] = useState(
        Array.isArray(loaderData?.data) ? loaderData.data : []
    );
    const [pagination, setPagination] = useState(
        loaderData?.pagination ?? {
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
        }
    );
    const [searchInput, setSearchInput] = useState(searchFromUrl);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(false);

    // ---- Refetch whenever URL params change ----
    const fetchReviews = useCallback(
        async (signal) => {
            setLoading(true);
            try {
                const token = localStorage.getItem("token");

                const params = new URLSearchParams();
                params.set("page", String(page));
                params.set("limit", String(limit));
                if (searchFromUrl) params.set("search", searchFromUrl);

                const { data } = await axios.get(
                    `${import.meta.env.VITE_API}/api/review?${params.toString()}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                        signal,
                    }
                );

                const list = Array.isArray(data?.data) ? data.data : [];
                const meta = data?.meta ?? {};

                setReviews(list);
                setPagination({
                    total: meta.total ?? list.length,
                    page: meta.page ?? page,
                    limit: meta.limit ?? limit,
                    totalPages:
                        meta.totalPages ??
                        Math.max(1, Math.ceil((meta.total ?? list.length) / limit)),
                    hasNextPage:
                        meta.hasNextPage ??
                        (meta.page ?? page) * limit < (meta.total ?? list.length),
                    hasPreviousPage: meta.hasPreviousPage ?? (meta.page ?? page) > 1,
                });
            } catch (error) {
                if (axios.isCancel?.(error)) return;
                console.error("Failed to fetch reviews:", error);
                setReviews([]);
                setPagination({
                    total: 0,
                    page,
                    limit,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPreviousPage: false,
                });
            } finally {
                setLoading(false);
            }
        },
        [page, limit, searchFromUrl]
    );

    useEffect(() => {
        const controller = new AbortController();
        fetchReviews(controller.signal);
        return () => controller.abort();
    }, [fetchReviews]);

    // ---- URL update helper (merges) ----
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

    // ---- Handlers ----
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        updateParams({ search: searchInput.trim(), page: 1 });
    };

    const handleLimitChange = (e) => {
        updateParams({ limit: Number(e.target.value), page: 1 });
    };

    const handlePrevPage = () => {
        if (pagination.hasPreviousPage) updateParams({ page: page - 1 });
    };

    const handleNextPage = () => {
        if (pagination.hasNextPage) updateParams({ page: page + 1 });
    };

    // ---- Selection (current page slice) ----
    const allVisibleIds = useMemo(
        () => reviews.map((r) => r.id).filter(Boolean),
        [reviews]
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
            setSelectedIds((prev) =>
                Array.from(new Set([...prev, ...allVisibleIds]))
            );
        }
    };

    // ---- Footer counters ----
    const total = pagination.total ?? reviews.length;
    const startIndex = total > 0 ? (page - 1) * limit + 1 : 0;
    const endIndex = Math.min(page * limit, total);
    const totalPages = pagination.totalPages ?? 1;

    return (
        <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                        Review
                    </h2>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <form onSubmit={handleSearchSubmit} className="flex-1 sm:w-72">
                        <input
                            type="search"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search by title, body, user, book..."
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </form>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                {selectedIds.length > 0 && (
                    <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                        <span>{selectedIds.length} review(s) selected</span>
                        <button
                            className="text-blue-600 hover:underline"
                            onClick={() => setSelectedIds([])}
                        >
                            Clear selection
                        </button>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <ReviewTable
                        render={loading}
                        setRender={fetchReviews}
                        isAllSelected={isAllSelected}
                        toggleSelectAll={toggleSelectAll}
                        paginatedReviews={reviews}
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
                                ? `Showing ${startIndex}–${endIndex} of ${total} reviews`
                                : "Showing 0 of 0 reviews"}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 justify-end">
                        <button
                            onClick={handlePrevPage}
                            disabled={!pagination.hasPreviousPage || loading}
                            className={`px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 ${!pagination.hasPreviousPage || loading
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }`}
                        >
                            Prev
                        </button>
                        <span>
                            Page{" "}
                            <span className="font-semibold text-gray-700">{page}</span> of{" "}
                            <span className="font-semibold text-gray-700">{totalPages}</span>
                        </span>
                        <button
                            onClick={handleNextPage}
                            disabled={!pagination.hasNextPage || loading}
                            className={`px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 ${!pagination.hasNextPage || loading
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

export default Review;