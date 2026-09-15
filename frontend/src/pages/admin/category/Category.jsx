import React, { useState, useMemo, useContext, useEffect, useCallback } from "react";
import { Link, useLoaderData, useSearchParams } from "react-router-dom";
import axios from "axios";
import CategoryTable from "../../../components/admin/CategoryTable.jsx";
import { BookContext } from "../../../context/School.jsx";

function Category() {
    const { setToastConfig, setShowToast } = useContext(BookContext);
    const [searchParams, setSearchParams] = useSearchParams();

    const loaderData = useLoaderData();

    // ---- URL is the single source of truth ----
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.max(1, Number(searchParams.get("limit")) || 20);
    const searchFromUrl = searchParams.get("search") ?? "";

    // ---- Local state ----
    const [categories, setCategories] = useState(
        Array.isArray(loaderData?.data) ? loaderData.data : []
    );
    const [pagination, setPagination] = useState(
        loaderData?.pagination ?? {
            total: 0,
            page,
            limit,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
        }
    );
    const [searchInput, setSearchInput] = useState(searchFromUrl);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(false);

    // ---- Fetch function (reused by effect + manual refresh) ----
    const fetchCategories = useCallback(async (signal) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");

            const params = new URLSearchParams();
            params.set("page", String(page));
            params.set("limit", String(limit));
            params.set("includeInactive", "true");
            if (searchFromUrl) params.set("search", searchFromUrl);

            const { data } = await axios.get(
                `${import.meta.env.VITE_API}/api/categories/admin?${params.toString()}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    signal,
                }
            );

            const list = Array.isArray(data?.data) ? data.data : [];
            const meta = data?.meta ?? data?.pagination ?? {};

            setCategories(
                list.map((c) => ({
                    id: c.id || c._id,
                    name: c.name,
                    handle: c.handle,
                    description: c.description,
                    image: c.image,
                    type: c.type,
                    isActive: c.isActive,
                    sortOrder: c.sortOrder,
                    productCount: c.productCount ?? 0,
                    conditions: c.conditions || [],
                    conditionMatch: c.conditionMatch,
                }))
            );

            setPagination({
                total: meta.total ?? list.length,
                page: meta.page ?? page,
                limit: meta.limit ?? limit,
                totalPages: meta.totalPages ?? 1,
                hasNextPage: meta.hasNextPage ?? false,
                hasPreviousPage: meta.hasPreviousPage ?? false,
            });
        } catch (error) {
            if (axios.isCancel?.(error)) return;
            console.error("Failed to fetch categories:", error);
            setCategories([]);
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
    }, [page, limit, searchFromUrl]);

    // ---- Refetch whenever URL params change ----
    useEffect(() => {
        const controller = new AbortController();
        fetchCategories(controller.signal);
        return () => controller.abort();
    }, [fetchCategories]);

    // ---- Called by the table after create/delete ----
    const refresh = useCallback(() => {
        fetchCategories();
    }, [fetchCategories]);

    // ---- URL param helper (merges) ----
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
        if (!pagination.hasPreviousPage) return;
        updateParams({ page: page - 1 });
    };

    const handleNextPage = () => {
        if (!pagination.hasNextPage) return;
        updateParams({ page: page + 1 });
    };

    // ---- Selection ----
    const allVisibleIds = useMemo(
        () => categories.map((c) => c.id).filter(Boolean),
        [categories]
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
    const total = pagination.total ?? categories.length;
    const startIndex = total > 0 ? (page - 1) * limit + 1 : 0;
    const endIndex = Math.min(page * limit, total);
    const totalPages = pagination.totalPages ?? 1;

    return (
        <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                        Categories
                    </h2>
                    <p className="text-sm text-gray-500">Manage all book categories.</p>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <form onSubmit={handleSearchSubmit} className="flex-1 sm:w-72">
                        <input
                            type="search"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search by name or handle..."
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </form>

                    <Link
                        to={`/${import.meta.env.VITE_ADMIN}/categories/add`}
                        className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                    >
                        Add Category
                    </Link>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                {selectedIds.length > 0 && (
                    <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between text-xs text-gray-600">
                        <span>{selectedIds.length} category(s) selected</span>
                        <button
                            className="text-blue-600 hover:underline"
                            onClick={() => setSelectedIds([])}
                        >
                            Clear selection
                        </button>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <CategoryTable
                        isAllSelected={isAllSelected}
                        toggleSelectAll={toggleSelectAll}
                        paginatedCategories={categories}
                        selectedIds={selectedIds}
                        toggleSelect={toggleSelect}
                        onMutate={refresh}
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
                                ? `Showing ${startIndex}–${endIndex} of ${total} categories`
                                : "Showing 0 of 0 categories"}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 justify-end">
                        <button
                            onClick={handlePrevPage}
                            disabled={!pagination.hasPreviousPage || loading}
                            className={`px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 ${
                                !pagination.hasPreviousPage || loading
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
                            className={`px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 ${
                                !pagination.hasNextPage || loading
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

export default Category;