import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLoaderData } from "react-router-dom";
import PermissionForm from "../../components/admin/PermissionForm.jsx";

function EditUser() {
    const { user: loadedUser, permission: loadedPermission } = useLoaderData();

    const [form, setForm] = useState({
        username: "",
        first_name: "",
        last_name: "",
        email: "",
        role: "customer",
    });

    let [permission, setPermission] = useState({
        userId: loadedUser._id,
        createUser: false,
        readUser: false,
        updateUser: false,
        deleteUser: false,
        createBook: false,
        readBook: false,
        updateBook: false,
        deleteBook: false,
    });

    const [error, setError] = useState("");

    useEffect(() => {
        if (loadedUser) {
            setForm({
                username: loadedUser.username ?? "",
                first_name: loadedUser.first_name ?? "",
                last_name: loadedUser.last_name ?? "",
                email: loadedUser.email ?? "",
                role: loadedUser.role ?? "customer",
            });
        }
    }, [loadedUser]);

    useEffect(() => {
        if (loadedPermission) {
            setPermission({
                createUser: !!loadedPermission.createUser,
                readUser: !!loadedPermission.readUser,
                updateUser: !!loadedPermission.updateUser,
                deleteUser: !!loadedPermission.deleteUser,
                createBook: !!loadedPermission.createBook,
                readBook: !!loadedPermission.readBook,
                updateBook: !!loadedPermission.updateBook,
                deleteBook: !!loadedPermission.deleteBook,
            });
        }
    }, [loadedPermission]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const userId = loadedUser._id || loadedUser.id;
            console.log({ userId, ...permission });

            await axios.patch(`/api/user/${userId}`, form);
            await axios.patch(`/api/user/permission/${userId}`, { userId, ...permission });

            alert("User and permissions updated successfully!");
        } catch (err) {
            console.log("err", err);

            setError(err.message || "Update failed");
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                        Edit User
                    </h2>
                </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto bg-white p-6 space-y-6">

                        {error && (
                            <div className="bg-red-100 text-red-700 p-2 rounded text-sm">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">First Name <span className="text-red-500">*</span></label>
                                <input
                                    name="first_name"
                                    value={form.first_name}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                <input
                                    name="last_name"
                                    value={form.last_name}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Username <span className="text-red-500">*</span></label>
                                <input
                                    name="username"
                                    value={form.username}
                                    onChange={handleChange}
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
                                <input
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    type="email"
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Role</label>
                                <select
                                    name="role"
                                    value={form.role}
                                    onChange={handleChange}
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 "
                                >
                                    <option value="customer">Customer</option>
                                    <option value="admin">Admin</option>
                                    <option value="student">Student</option>
                                </select>
                            </div>
                        </div>

                        <PermissionForm user={permission} setUser={setPermission} />

                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-2 rounded-lg"
                        >
                            Update User
                        </button>
                    </form>
                </div>
            </div>
        </div >
    );
}

export default EditUser;
