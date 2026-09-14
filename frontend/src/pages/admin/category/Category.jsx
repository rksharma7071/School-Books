import React, { useState, useMemo, useContext } from "react";
import { Link, useLoaderData, useRevalidator } from "react-router-dom";
import CategoryTable from "../../../components/admin/CategoryTable.jsx";
import { BookContext } from "../../../context/School.jsx";

function Category() {
    const { setToastConfig, setShowToast } = useContext(BookContext);

    // 👇 Data comes from the loader — no useEffect, no loading state
    const categoryLoaderData = useLoaderData();
    const categories = categoryLoaderData || [];

    const revalidator = useRevalidator();

    const [search, setSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState([]);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const filteredCategories = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return categories;
        return categories.filter(
            (category) =>
                category.name?.toLowerCase().includes(term) ||
                category.handle?.toLowerCase().includes(term)
        );
    }, [categories, search]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredCategories.length / rowsPerPage)
    );

    const paginatedCategories = useMemo(() => {
        const safePage = Math.min(currentPage, totalPages);
        const start = (safePage - 1) * rowsPerPage;
        return filteredCategories.slice(start, start + rowsPerPage);
    }, [filteredCategories, currentPage, rowsPerPage, totalPages]);

    const allVisibleIds = paginatedCategories.map((category) => category.id);
    const isAllSelected =
        allVisibleIds.length > 0 &&
        allVisibleIds.every((id) => selectedIds.includes(id));

    const toggleSelect = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds((prev) =>
                prev.filter((id) => !allVisibleIds.includes(id))
            );
        } else {
            setSelectedIds((prev) =>
                Array.from(new Set([...prev, ...allVisibleIds]))
            );
        }
    };

    const handlePaginationChange = (e) => {
        setRowsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const handlePrevPage = () =>
        setCurrentPage((page) => Math.max(1, page - 1));
    const handleNextPage = () =>
        setCurrentPage((page) => Math.min(totalPages, page + 1));

    const startIndex =
        filteredCategories.length === 0
            ? 0
            : (currentPage - 1) * rowsPerPage + 1;
    const endIndex = Math.min(
        currentPage * rowsPerPage,
        filteredCategories.length
    );

    return (
        <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                        Categories
                    </h2>
                    <p className="text-sm text-gray-500">
                        Manage all book categories.
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
                        placeholder="Search by name or handle..."
                        className="flex-1 sm:w-72 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
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
                        paginatedCategories={paginatedCategories}
                        selectedIds={selectedIds}
                        toggleSelect={toggleSelect}
                        // 👇 pass revalidator instead of render/setRender
                        onMutate={revalidator.revalidate}
                    />
                </div>

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
                            {filteredCategories.length > 0
                                ? `Showing ${startIndex}–${endIndex} of ${filteredCategories.length} categories`
                                : "Showing 0 of 0 categories"}
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

export default Category;