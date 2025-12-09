import React, { useState, useMemo } from "react";
import { RiEdit2Fill } from "react-icons/ri";
import { MdDelete } from "react-icons/md";

const initialBooks = [
    { id: 1, title: "Mathematics Grade 6", author: "R.S. Aggarwal", category: "Math", price: 350, stock: 25 },
    { id: 2, title: "Science Essentials 7", author: "NCERT", category: "Science", price: 290, stock: 18 },
    { id: 3, title: "English Grammar Plus", author: "Wren & Martin", category: "English", price: 320, stock: 10 },
    { id: 4, title: "Social Studies Guide", author: "NCERT", category: "Social Science", price: 260, stock: 30 },
    { id: 5, title: "Physics Fundamentals 8", author: "H.C. Verma", category: "Science", price: 340, stock: 22 },
    { id: 6, title: "Advanced Chemistry 9", author: "Pradeep Publications", category: "Science", price: 390, stock: 14 },
    { id: 7, title: "Perfect Maths Practice 7", author: "R.D. Sharma", category: "Math", price: 310, stock: 8 },
    { id: 8, title: "World History for Beginners", author: "David Thomas", category: "Social Science", price: 280, stock: 19 },
    { id: 9, title: "Atlas for Students", author: "Oxford", category: "Geography", price: 450, stock: 12 },
    { id: 10, title: "Environmental Studies 5", author: "NCERT", category: "EVS", price: 210, stock: 28 },
    { id: 11, title: "Hindi Vyakaran Saral 6", author: "Lakshmi Publications", category: "Hindi", price: 180, stock: 26 },
    { id: 12, title: "Marigold English Reader 4", author: "NCERT", category: "English", price: 240, stock: 15 },
    { id: 13, title: "Computer Basics for Kids", author: "TechBooks", category: "Computer", price: 300, stock: 20 },
    { id: 14, title: "Biology Life Processes 9", author: "NCERT", category: "Biology", price: 360, stock: 11 },
    { id: 15, title: "Algebra & Geometry 10", author: "R.S. Aggarwal", category: "Math", price: 410, stock: 9 },
    { id: 16, title: "Civics – Understanding Citizenship", author: "Pearson", category: "Social Science", price: 330, stock: 13 },
    { id: 17, title: "Indian Economy Basics", author: "Ramesh Singh", category: "Economics", price: 380, stock: 7 },
    { id: 18, title: "GK Smart Kids 6", author: "Dreamland", category: "General Knowledge", price: 150, stock: 34 },
    { id: 19, title: "Moral Values & Ethics 5", author: "Evergreen", category: "Moral Science", price: 200, stock: 21 },
    { id: 20, title: "English Literature Classics", author: "Scholastic", category: "English", price: 450, stock: 6 },
    { id: 21, title: "Reasoning Skills Workbook", author: "Education Hub", category: "Reasoning", price: 260, stock: 16 },
    { id: 22, title: "Geography Earth & Space 8", author: "NCERT", category: "Geography", price: 310, stock: 18 },
    { id: 23, title: "Python for Beginners", author: "CodeLab", category: "Computer", price: 500, stock: 5 },
    { id: 24, title: "Storybook – Jungle Adventures", author: "Asha Malhotra", category: "Stories", price: 190, stock: 29 },
];

function AddBook() {
    const [books] = useState(initialBooks);
    const [search, setSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState([]);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Filtered list
    const filteredBooks = useMemo(() => {
        const term = search.toLowerCase();
        return books.filter(
            (b) =>
                b.title.toLowerCase().includes(term) ||
                b.author.toLowerCase().includes(term) ||
                b.category.toLowerCase().includes(term)
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

    const startIndex =
        filteredBooks.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
    const endIndex = Math.min(currentPage * rowsPerPage, filteredBooks.length);

    return (
        <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Add Books</h2>
                    <p className="text-sm text-gray-500">Manage all school books and inventory.</p>
                </div>

                {/* <div className="flex gap-2 w-full sm:w-auto bg-white focus:outline-none">
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
                    <button className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">+ Add Book</button>
                </div> */}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                {selectedIds.length > 0 && (
                    <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                        <span>{selectedIds.length} book(s) selected</span>
                        <button
                            className="text-blue-600 hover:underline"
                            onClick={() => setSelectedIds([])}
                        >Clear selection</button>
                    </div>
                )}

                <div className="overflow-x-auto">
                    {/* <table className="min-w-full text-sm">
                        <thead>
                            <tr>
                                <th className="px-4 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={toggleSelectAll}
                                        className="h-4 w-4 rounded border-gray-300"
                                    />
                                </th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Title</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Author</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Category</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Price (₹)</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Stock</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedBooks.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-6 text-center text-gray-500">No books found.</td>
                                </tr>
                            ) : (
                                paginatedBooks.map((book) => {
                                    const isSelected = selectedIds.includes(book.id);
                                    return (
                                        <tr
                                            key={book.id}
                                            className="border-t border-gray-100 hover:bg-gray-50"
                                        >
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelect(book.id)}
                                                    className="h-4 w-4 rounded border-gray-300"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-gray-900 font-medium">{book.title}</td>
                                            <td className="px-4 py-3 text-gray-700">{book.author}</td>
                                            <td className="px-4 py-3 text-gray-700">{book.category}</td>
                                            <td className="px-4 py-3 text-gray-700">{book.price}</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={
                                                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium " +
                                                        (book.stock >= 10
                                                            ? "bg-green-50 text-green-700"
                                                            : book.stock > 5
                                                                ? "bg-yellow-50 text-yellow-700"
                                                                : "bg-red-50 text-red-700")
                                                    }
                                                >{book.stock} in stock</span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button className="text-lg text-blue-600 hover:underline mr-3"><RiEdit2Fill /></button>
                                                <button className="text-lg text-red-600 hover:underline"><MdDelete /></button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table> */}
                    <div>
                      <form>
                        
                      </form>
                    </div>
                </div>

                {/* Pagination footer */}
                {/* <div className="border-t border-gray-100 px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500">
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
                        >Prev</button>
                        <span>
                            Page{" "}
                            <span className="font-semibold text-gray-700">{Math.min(currentPage, totalPages)}</span>
                            {" "}
                            of{" "}
                            <span className="font-semibold text-gray-700">{totalPages}</span>
                        </span>
                        <button
                            onClick={handleNextPage}
                            disabled={currentPage >= totalPages}
                            className={`px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 ${currentPage >= totalPages ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                        >Next</button>
                    </div>
                </div> */}
            </div>
        </div>
    );
}

export default AddBook;
