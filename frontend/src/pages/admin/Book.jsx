import React, { useState, useMemo, useEffect, useContext } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import BookTable from "../../components/admin/BookTable.jsx";
import { BookContext } from "../../context/School.jsx";

function Book() {
    const { setToastConfig, setShowToast } = useContext(BookContext);

    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState([]);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const controller = new AbortController();

        const fetchBooks = async () => {
            try {
                setLoading(true);

                const res = await axios.get(`${import.meta.env.VITE_API}/api/product`);

                const apiBooks = res.data.data || [];

                setBooks(
                    apiBooks.map((b) => {
                        const classes = [
                            ...new Set(
                                (b.variants || [])
                                    .map((v) => v.options?.Class)
                                    .filter(Boolean)
                            ),
                        ];
                        const mediums = [
                            ...new Set(
                                (b.variants || [])
                                    .map((v) => v.options?.Medium)
                                    .filter(Boolean)
                            ),
                        ];
                        const editions = [
                            ...new Set(
                                (b.variants || [])
                                    .map((v) => v.options?.Edition)
                                    .filter(Boolean)
                            ),
                        ];

                        return {
                            id: b._id,
                            title: b.title,
                            handle: b.handle,
                            description: b.description,
                            category:
                                classes.length > 0
                                    ? `Class ${classes.join(", ")}`
                                    : "N/A",
                            price: b.minPrice ?? 0,
                            maxPrice: b.maxPrice ?? 0,
                            stock: b.totalInventory ?? b.inventory_quantity ?? 0,
                            inventoryStatus: b.inventoryStatus ?? "in_stock",
                            coverImage: b.images?.[0] ?? "",
                            isActive: b.isActive,
                            variantCount: b.variants?.length ?? 0,
                            classes,
                            mediums,
                            editions,
                            variants: b.variants || [],
                            options: b.options || [],
                        };
                    })
                );
            } catch (error) {
                if (axios.isCancel(error)) return;

                console.error("Error fetching books:", error.message);
                setToastConfig({
                    type: "error",
                    message: "Failed to load books. Please refresh the page.",
                });
                setShowToast(true);
            } finally {
                setLoading(false);
            }
        };

        fetchBooks();
        return () => controller.abort();
    }, [setToastConfig, setShowToast]);

    const filteredBooks = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return books;

        return books.filter(
            (b) =>
                b.title?.toLowerCase().includes(term) ||
                b.handle?.toLowerCase().includes(term) ||
                b.category?.toLowerCase().includes(term) ||
                b.classes?.some((c) => c.toLowerCase().includes(term)) ||
                b.mediums?.some((m) => m.toLowerCase().includes(term)) ||
                b.editions?.some((e) => e.toLowerCase().includes(term))
        );
    }, [books, search]);

    const totalPages = Math.max(1, Math.ceil(filteredBooks.length / rowsPerPage));

    const paginatedBooks = useMemo(() => {
        const safePage = Math.min(currentPage, totalPages);
        const start = (safePage - 1) * rowsPerPage;
        return filteredBooks.slice(start, start + rowsPerPage);
    }, [filteredBooks, currentPage, rowsPerPage, totalPages]);

    const allVisibleIds = paginatedBooks.map((b) => b.id);
    const isAllSelected =
        allVisibleIds.length > 0 &&
        allVisibleIds.every((id) => selectedIds.includes(id));

    const toggleSelect = (id) => {
        setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds((prev) => prev.filter((id) => !allVisibleIds.includes(id)));
        } else {
            setSelectedIds((prev) => Array.from(new Set([...prev, ...allVisibleIds])));
        }
    };

    const handlePaginationChange = (e) => {
        setRowsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const handlePrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
    const handleNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

    const startIndex = filteredBooks.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
    const endIndex = Math.min(currentPage * rowsPerPage, filteredBooks.length);

    return (
        <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Books</h2>
                    <p className="text-sm text-gray-500">Manage all school books and inventory.</p>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Search by title, class, medium, edition..."
                        className="flex-1 sm:w-72 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Link
                        to={`/${import.meta.env.VITE_ADMIN}/book/add`}
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
                    {loading ? (
                        <div className="p-4 space-y-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-12 bg-gray-100 rounded animate-pulse"
                                />
                            ))}
                        </div>
                    ) : (
                        <BookTable
                            isAllSelected={isAllSelected}
                            toggleSelectAll={toggleSelectAll}
                            paginatedBooks={paginatedBooks}
                            selectedIds={selectedIds}
                            toggleSelect={toggleSelect}
                        />
                    )}
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
                            {filteredBooks.length > 0
                                ? `Showing ${startIndex}–${endIndex} of ${filteredBooks.length} books`
                                : "Showing 0 of 0 books"}
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

export default Book;