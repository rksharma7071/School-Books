import React, { useContext } from 'react'
import { MdDelete } from 'react-icons/md';
import { RiEdit2Fill } from 'react-icons/ri';
import { BookContext } from '../../context/School.jsx';

function CategoryTable({ isAllSelected, toggleSelectAll, toggleSelect, paginatedCategories, selectedIds }) {
    const { user } = useContext(BookContext);
    const role = user?.role;

    return (
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
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Title</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Total Books</th>

                </tr>
            </thead>
            <tbody>
                {paginatedCategories.length === 0 ? (
                    <tr>
                        <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                            No categories found.
                        </td>
                    </tr>
                ) : (
                    paginatedCategories.map((book) => {
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

                                <td className="px-4 py-3 text-gray-900 font-medium">{book.name}</td>
                                <td className="px-4 py-3 text-gray-900 font-medium">{book.totalBooks}</td>
                            </tr>
                        );
                    })
                )}
            </tbody>
        </table>
    )
}

export default CategoryTable