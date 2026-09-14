import axios from "axios";
import { MdDelete } from "react-icons/md";
import { RiEdit2Fill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { BookContext } from "../../context/School.jsx";
import { useContext } from "react";

function UserTable({
    isAllSelected,
    toggleSelectAll,
    toggleSelect,
    paginatedUsers,
    selectedIds,
    render,
    setRender,
}) {
    const navigate = useNavigate();
    const { setToastConfig, setShowToast } = useContext(BookContext);

    const deleteUser = async (id) => {
        if (!window.confirm("Do you want to delete this User?")) return;

        try {
            await axios.delete(`${import.meta.env.VITE_API}/api/user/${id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });

            setToastConfig({
                type: "success",
                message: "User has been deleted successfully!",
            });
            setShowToast(true);
            setRender(!render);
        } catch (error) {
            setToastConfig({
                type: "error",
                message: error.response?.data?.message || "Failed to delete user. Please try again.",
            });
            setShowToast(true);
        }
    };

    const editUser = (id) => {
        navigate(`/${import.meta.env.VITE_ADMIN}/users/edit/${id}`);
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
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Role</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Actions</th>
                </tr>
            </thead>
            <tbody>
                {paginatedUsers.length === 0 ? (
                    <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-gray-500">No users found.</td>
                    </tr>
                ) : (
                    paginatedUsers.map((user) => {
                        const isSelected = selectedIds.includes(user._id);
                        const roleLabel = user.role
                            ? user.role.charAt(0).toUpperCase() +
                            user.role.slice(1).toLowerCase()
                            : "";

                        return (
                            <tr
                                key={user._id}
                                className="border-t border-gray-100 hover:bg-gray-50"
                            >
                                <td className="px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleSelect(user._id)}
                                        className="h-4 w-4 rounded border-gray-300 hover:cursor-pointer"
                                    />
                                </td>
                                <td className="px-4 py-3 text-gray-700">{user.name}</td>
                                <td className="px-4 py-3 text-gray-700">{user.email}</td>
                                <td className="px-4 py-3 text-gray-700">{roleLabel}</td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        className="text-lg text-blue-600 hover:cursor-pointer mr-3"
                                        onClick={() => editUser(user._id)}
                                    >
                                        <RiEdit2Fill />
                                    </button>
                                    <button
                                        className="text-lg text-red-600 hover:cursor-pointer"
                                        onClick={() => deleteUser(user._id)}
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

export default UserTable;