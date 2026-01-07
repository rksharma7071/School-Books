import axios from 'axios';
import { MdDelete } from 'react-icons/md';
import { RiEdit2Fill } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import { BookContext } from '../../context/School.jsx';
import { useContext } from 'react';

function UserTable({ isAllSelected, toggleSelectAll, toggleSelect, paginatedUsers, selectedIds }) {
    const navigate = useNavigate();
    const { user } = useContext(BookContext);
    const role = user?.role;
    const deleteUser = async (id) => {
        try {
            if (window.confirm("Do you want to delete this User?")) {
                const res = await axios.delete(`${import.meta.env.VITE_API}/api/user/${id}`);
                alert("User has been deleted successfully!")
            }
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    const editUser = async (id) => {
        navigate(`/edit-user/${id}`)
    }


    return (
        <table className="min-w-full text-sm">
            <thead>
                <tr>
                    <th className="px-4 py-3 text-left"><input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} className="h-4 w-4 rounded border-gray-300 hover:cursor-pointer" /></th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Username</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">First Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Last Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Role</th>
                    {role != "student" && <th className="px-4 py-3 text-right font-semibold text-gray-700">Actions</th>}
                </tr>
            </thead>
            <tbody>
                {paginatedUsers.length === 0 ? (
                    <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-gray-500">No users found.</td>
                    </tr>
                ) : (
                    paginatedUsers.filter((user) => user.role != "admin").map((user) => {
                        const isSelected = selectedIds.includes(user._id);
                        return (
                            <tr key={user._id} className="border-t border-gray-100 hover:bg-gray-50">
                                <td className="px-4 py-3"><input type="checkbox" checked={isSelected} onChange={() => toggleSelect(user._id)} className="h-4 w-4 rounded border-gray-300 hover:cursor-pointer" /></td>
                                <td className="px-4 py-3 text-gray-900 font-medium">{user.username}</td>
                                <td className="px-4 py-3 text-gray-700">{user.first_name}</td>
                                <td className="px-4 py-3 text-gray-700">{user.last_name}</td>
                                <td className="px-4 py-3 text-gray-700">{user.email}</td>
                                <td className="px-4 py-3 text-gray-700">{user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase() : ""}</td>
                                {role != "student" && <td className="px-4 py-3 text-right">
                                    <button className="text-lg text-blue-600 hover:cursor-pointer mr-3" onClick={() => editUser(user._id)}><RiEdit2Fill /></button>
                                    <button className="text-lg text-red-600 hover:cursor-pointer" onClick={() => deleteUser(user._id)}><MdDelete /></button>
                                </td>}
                            </tr>
                        );
                    })
                )}
            </tbody>
        </table>
    )
}

export default UserTable