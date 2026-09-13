import React, { useContext } from "react";
import { MdDelete } from "react-icons/md";
import { RiEdit2Fill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BookContext } from "../../context/School.jsx";

function CategoryTable({
    isAllSelected,
    toggleSelectAll,
    toggleSelect,
    paginatedCategories,
    selectedIds,
    render,
    setRender,
}) {
    const navigate = useNavigate();
    const { setToastConfig, setShowToast } = useContext(BookContext);

    const deleteCategory = async (id, name) => {
        if (!window.confirm(`Do you want to delete category "${name}"?`)) return;

        try {

            await axios.delete(
                `${import.meta.env.VITE_API}/api/categories/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            setToastConfig({
                type: "success",
                message: "Category deleted successfully.",
            });
            setShowToast(true);

            setRender(!render);
        } catch (error) {
            setToastConfig({
                type: "error",
                message:
                    error.response?.data?.message ||
                    "Failed to delete category.",
            });
            setShowToast(true);
        }
    };

    const editCategory = (id) => {
        navigate(`/${import.meta.env.VITE_ADMIN}/category/edit/${id}`);
    };

    return (
        <table className="min-w-full text-sm">
            <thead>
                <tr>
                    <th className="px-4 py-3 text-left">
                        <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={toggleSelectAll}
                            className="h-4 w-4 rounded border-gray-300 hover:cursor-pointer"
                        />
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Name
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Handle
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Type
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Products
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Status
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">
                        Actions
                    </th>
                </tr>
            </thead>
            <tbody>
                {paginatedCategories.length === 0 ? (
                    <tr>
                        <td
                            colSpan={7}
                            className="px-4 py-6 text-center text-gray-500"
                        >
                            No categories found.
                        </td>
                    </tr>
                ) : (
                    paginatedCategories.map((category) => {
                        const isSelected = selectedIds.includes(category.id);

                        return (
                            <tr
                                key={category.id}
                                className="border-t border-gray-100 hover:bg-gray-50"
                            >
                                <td className="px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() =>
                                            toggleSelect(category.id)
                                        }
                                        className="h-4 w-4 rounded border-gray-300 hover:cursor-pointer"
                                    />
                                </td>

                                <td className="px-4 py-3 text-gray-900 font-medium">
                                    {category.name}
                                </td>

                                <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                                    {category.handle}
                                </td>

                                <td className="px-4 py-3">
                                    <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${category.type === "automatic"
                                            ? "bg-purple-50 text-purple-700"
                                            : "bg-blue-50 text-blue-700"
                                            }`}
                                    >
                                        {category.type === "automatic"
                                            ? "Automatic"
                                            : "Manual"}
                                    </span>
                                </td>

                                <td className="px-4 py-3 text-gray-700">
                                    {category.productCount ?? 0}
                                </td>

                                <td className="px-4 py-3">
                                    <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${category.isActive
                                            ? "bg-green-50 text-green-700"
                                            : "bg-gray-100 text-gray-600"
                                            }`}
                                    >
                                        {category.isActive
                                            ? "Active"
                                            : "Inactive"}
                                    </span>
                                </td>

                                <td className="px-4 py-3 text-right">
                                    <button
                                        className="text-lg text-blue-600 hover:cursor-pointer mr-3"
                                        onClick={() =>
                                            editCategory(category.id)
                                        }
                                        title="Edit"
                                    >
                                        <RiEdit2Fill />
                                    </button>
                                    <button
                                        className="text-lg text-red-600 hover:cursor-pointer"
                                        onClick={() =>
                                            deleteCategory(
                                                category.id,
                                                category.name
                                            )
                                        }
                                        title="Delete"
                                    >
                                        <MdDelete />
                                    </button>
                                </td>
                            </tr>
                        );
                    })
                )}
            </tbody>
        </table>
    );
}

export default CategoryTable;