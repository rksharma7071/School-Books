import axios from 'axios';
import { MdDelete } from 'react-icons/md';
import { RiEdit2Fill } from 'react-icons/ri';
import { BookContext } from '../context/School';
import { useContext } from 'react';

function BookTable({ isAllSelected, toggleSelectAll, toggleSelect, paginatedBooks, selectedIds }) {
    const { user } = useContext(BookContext);
    const role = user?.role;
    // console.log("BookTable:", role);

    // console.log("paginatedBooks: ", paginatedBooks);

    const deleteBook = async (id) => {
        try {
            if (confirm("Do you want to delete this Book!")) {
                const res = await axios.delete(`/api/book/${id}`);
                // console.log("Delete Book", res.data);
                alert("Book has been deleted successfully!")
            }
        } catch (error) {
            console.error("Delete error:", error);
        }
    };


    return (
        <table className="min-w-full text-sm">
            <thead>
                <tr>
                    <th className="px-4 py-3 text-left">
                        <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} className="h-4 w-4 rounded border-gray-300" />
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700"></th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Title</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Author</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Category</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Price (₹)</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Stock</th>
                    {role != "student" && <th className="px-4 py-3 text-right font-semibold text-gray-700">Actions</th>}
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
                            <tr key={book.id} className="border-t border-gray-100 hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleSelect(book.id)}
                                        className="h-4 w-4 rounded border-gray-300"
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200">
                                        <img
                                            src={book.coverImage}
                                            alt={book.title}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                    </div>
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
                                                : book.stock > 5 ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700")
                                        }
                                    >{book.stock} in stock</span>
                                </td>
                                {role != "student" &&
                                    <td className="px-4 py-3 text-right">
                                        <button className="text-lg text-blue-600 hover:underline mr-3"><RiEdit2Fill /></button>
                                        <button className="text-lg text-red-600 hover:underline" onClick={() => deleteBook(book.id)}><MdDelete /></button>
                                    </td>
                                }
                            </tr>
                        );
                    })
                )}
            </tbody>
        </table >
    )
}

export default BookTable