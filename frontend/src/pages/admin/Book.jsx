import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import BookTable from "../../components/admin/BookTable.jsx";
import { Link } from "react-router-dom";

function Book() {
    const [books, setBooks] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState([]);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const res = await axios.get("/api/book");
                const apiBooks = res.data.data || [];

                const mapped = apiBooks.map((b) => ({
                    id: b._id,
                    title: b.name,
                    author: b.author,
                    category: b.subject || "N/A",
                    price: b.price,
                    stock: b.stockQty ?? 0,
                    coverImage: b.coverImage ?? "",
                }));

                setBooks(mapped);
            } catch (error) {
                console.error("Error fetching books:", error.message);
            }
        };

        fetchBooks();
    }, []);

    const filteredBooks = useMemo(() => {
        const term = search.toLowerCase();
        return books.filter(
            (b) =>
                b.title?.toLowerCase().includes(term) ||
                b.author?.toLowerCase().includes(term) ||
                b.category?.toLowerCase().includes(term)
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
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds((prev) => prev.filter((id) => !allVisibleIds.includes(id)));
        } else {
            setSelectedIds((prev) => Array.from(new Set([...prev, ...allVisibleIds])));
        }
    };

    const handlePaginationChange = (e) => {
        const value = Number(e.target.value);
        setRowsPerPage(value);
        setCurrentPage(1);
    };

    const handlePrevPage = () => {
        setCurrentPage((prev) => Math.max(1, prev - 1));
    };

    const handleNextPage = () => {
        setCurrentPage((prev) => Math.min(totalPages, prev + 1));
    };

    const startIndex = filteredBooks.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
    const endIndex = Math.min(currentPage * rowsPerPage, filteredBooks.length);

    return (
        <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Books</h2>
                    <p className="text-sm text-gray-500">Manage all school books and inventory.</p>
                </div>

                <div className="flex gap-2 w-full sm:w-auto bg-white">
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Search by title, author, category..."
                        className="flex-1 sm:w-72 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Link to={`/${import.meta.env.VITE_ADMIN}/add-book`} className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">Add Book</Link>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                {selectedIds.length > 0 && (
                    <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                        <span>{selectedIds.length} book(s) selected</span>
                        <button
                            className="text-blue-600 hover:underline"
                            onClick={() => setSelectedIds([])}
                        >
                            Clear selection
                        </button>
                    </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto">
                    <BookTable isAllSelected={isAllSelected} toggleSelectAll={toggleSelectAll} paginatedBooks={paginatedBooks} selectedIds={selectedIds} toggleSelect={toggleSelect} />
                </div>

                {/* Pagination footer */}
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
                            className={`px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
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
