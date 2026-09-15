import axios from 'axios';
import { MdDelete } from 'react-icons/md';
import { RiEdit2Fill } from 'react-icons/ri';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { BookContext } from '../../context/School.jsx';
import { getImageUrl } from '../../data/file.js';

function BookTable({ isAllSelected, toggleSelectAll, toggleSelect, paginatedBooks, selectedIds }) {
    const { user } = useContext(BookContext);
    const role = user?.role;
    const navigate = useNavigate();
    const { setToastConfig, setShowToast } = useContext(BookContext);

    const deleteBook = async (id) => {
        try {
            if (confirm("Do you want to delete this Book?")) {

                const res = await axios.delete(`${import.meta.env.VITE_API}/api/product/${id}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                setToastConfig({
                    type: "success",
                    message: "Book has been deleted successfully.",
                });
                setShowToast(true);
            }
        } catch (error) {
            setToastConfig({
                type: "error",
                message: error.response?.data?.message || "Failed to update book. Please try again.",
            });
            setShowToast(true);
        }
    };

    console.log("paginatedBooks: ", paginatedBooks);



    const editBook = async (id) => {
        navigate(`/${import.meta.env.VITE_ADMIN}/books/edit/${id}`)
    }

    const colCount = role !== "student" ? 8 : 7;

    const getImage = (book) =>
        book.images?.[0]?.url || "/no-image.png";

    const getInventoryLabel = (book) => {
        const qty = book.totalInventory ?? book.inventory_quantity ?? 0;
        return `${qty} in stock`;
    };

    const getStockClass = (book) => {
        const status = book.inventoryStatus;
        if (status === "out_of_stock") return "bg-red-50 text-red-700";
        if (status === "low_stock") return "bg-yellow-50 text-yellow-700";
        if (status === "in_stock") return "bg-green-50 text-green-700";

        // fallback if inventoryStatus missing
        const qty = book.totalInventory ?? book.inventory_quantity ?? 0;
        if (qty >= 10) return "bg-green-50 text-green-700";
        if (qty > 5) return "bg-yellow-50 text-yellow-700";
        return "bg-red-50 text-red-700";
    };

    const formatPrice = (book) => {
        const min = book.minPrice;
        const max = book.maxPrice;

        if (min == null && max == null) return "—";
        if (min != null && max != null && min !== max) return `₹${min} – ₹${max}`;
        return `₹${min ?? max}`;
    };
    return (
        // <table className="min-w-full text-sm">
        //     <thead>
        //         <tr>
        //             <th className="px-4 py-3 text-left">
        //                 <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} className="h-4 w-4 rounded border-gray-300" />
        //             </th>
        //             <th className="px-4 py-3 text-left font-semibold text-gray-700"></th>
        //             <th className="px-4 py-3 text-left font-semibold text-gray-700">Title</th>
        //             <th className="px-4 py-3 text-left font-semibold text-gray-700">Author</th>
        //             <th className="px-4 py-3 text-left font-semibold text-gray-700">Category</th>
        //             <th className="px-4 py-3 text-left font-semibold text-gray-700">Price (₹)</th>
        //             <th className="px-4 py-3 text-left font-semibold text-gray-700">Stock</th>
        //             {role != "student" && <th className="px-4 py-3 text-right font-semibold text-gray-700">Actions</th>}
        //         </tr>
        //     </thead>
        //     <tbody>
        //         {paginatedBooks.length === 0 ? (
        //             <tr>
        //                 <td colSpan={7} className="px-4 py-6 text-center text-gray-500">No books found.</td>
        //             </tr>
        //         ) : (
        //             paginatedBooks.map((book, index) => {
        //                 const isSelected = selectedIds.includes(book.id);
        //                 return (
        //                     <tr key={index} className="border-t border-gray-100 hover:bg-gray-50">
        //                         <td className="px-4 py-3">
        //                             <input
        //                                 type="checkbox"
        //                                 checked={isSelected}
        //                                 onChange={() => toggleSelect(book.id)}
        //                                 className="h-4 w-4 rounded border-gray-300"
        //                             />
        //                         </td>
        //                         <td className="px-4 py-3">
        //                             <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200">
        //                                 <img
        //                                     src={book.coverImage || "/no-image.png"}
        //                                     alt={book.title}
        //                                     className="w-full h-full object-cover"
        //                                     loading="lazy"
        //                                 />
        //                             </div>
        //                         </td>
        //                         <td className="px-4 py-3 text-gray-900 font-medium cursor-pointer" onClick={() => editBook(book._id)}>{book.title}</td>
        //                         <td className="px-4 py-3 text-gray-700">{book.author}</td>
        //                         <td className="px-4 py-3 text-gray-700">{book.category}</td>
        //                         <td className="px-4 py-3 text-gray-700">{book.price}</td>
        //                         <td className="px-4 py-3">
        //                             <span
        //                                 className={
        //                                     "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium " +
        //                                     (book.stock >= 10
        //                                         ? "bg-green-50 text-green-700"
        //                                         : book.stock > 5 ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700")
        //                                 }
        //                             >{book.stock} in stock</span>
        //                         </td>
        //                         {role != "student" &&
        //                             <td className="px-4 py-3 text-right">
        //                                 <button className="text-lg text-blue-600 mr-3 hover:underline hover:cursor-pointer " onClick={() => editBook(book.id)}><RiEdit2Fill /></button>
        //                                 <button className="text-lg text-red-600 hover:underline hover:cursor-pointer" onClick={() => deleteBook(book.id)}><MdDelete /></button>
        //                             </td>
        //                         }
        //                     </tr>
        //                 );
        //             })
        //         )}
        //     </tbody>
        // </table >
        <table className="min-w-full text-sm">
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
                    <th className="px-4 py-3 text-left font-semibold text-gray-700"></th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Title</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Categories</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Variants</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Price (₹)</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Stock</th>
                    {role !== "student" && (
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">Actions</th>
                    )}
                </tr>
            </thead>

            <tbody>
                {paginatedBooks.length === 0 ? (
                    <tr>
                        <td colSpan={colCount} className="px-4 py-6 text-center text-gray-500">
                            No books found.
                        </td>
                    </tr>
                ) : (
                    paginatedBooks.map((book) => {
                        const rowId = book._id || book.id;
                        const isSelected = selectedIds.includes(rowId);

                        return (
                            <tr key={rowId} className="border-t border-gray-100 hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleSelect(rowId)}
                                        className="h-4 w-4 rounded border-gray-300"
                                    />
                                </td>

                                <td className="px-4 py-3">
                                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200">
                                        <img
                                            src={getImage(book)}
                                            alt={book.title}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                    </div>
                                </td>

                                <td
                                    className="px-4 py-3 text-gray-900 font-medium cursor-pointer"
                                    onClick={() => editBook?.(rowId)}
                                >
                                    {book.title}
                                    {book.isActive === false && (
                                        <span className="ml-2 text-xs text-red-500">(inactive)</span>
                                    )}
                                </td>

                                <td className="px-4 py-3 text-gray-700">
                                    {book.categories?.length
                                        ? book.categories.join(", ")
                                        : "—"}
                                </td>

                                <td className="px-4 py-3 text-gray-700">
                                    {Array.isArray(book.variants) && book.variants.length > 0
                                        ? `${book.variants.length}`
                                        : "—"}
                                </td>

                                <td className="px-4 py-3 text-gray-700">
                                    {formatPrice(book)}
                                </td>

                                <td className="px-4 py-3">
                                    <span
                                        className={
                                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium " +
                                            getStockClass(book)
                                        }
                                    >
                                        {getInventoryLabel(book)}
                                    </span>
                                </td>

                                {role !== "student" && (
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            className="text-lg text-blue-600 mr-3 hover:underline hover:cursor-pointer"
                                            onClick={() => editBook?.(rowId)}
                                        >
                                            <RiEdit2Fill />
                                        </button>
                                        <button
                                            className="text-lg text-red-600 hover:underline hover:cursor-pointer"
                                            onClick={() => deleteBook?.(rowId)}
                                        >
                                            <MdDelete />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        );
                    })
                )}
            </tbody>
        </table>
    )
}

export default BookTable
