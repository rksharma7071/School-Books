import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import PermissionForm from "../../components/admin/PermissionForm.jsx";
import { BookContext } from "../../context/School.jsx";

function AddUser() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "customer",
    });
    const { setToastConfig, setShowToast } = useContext(BookContext);

    const [user, setUser] = useState({
        createUser: false,
        updateUser: false,
        deleteUser: false,
        readUser: false,
        createBook: false,
        updateBook: false,
        deleteBook: false,
        readBook: false,
    });

    const [error, setError] = useState("");

    useEffect(() => {
        if (form.name) {
            const base = `${form.name}`
                .toLowerCase()
                .replace(/\s/g, "");

            const random = Math.floor(100 + Math.random() * 900);
            setForm((prev) => ({ ...prev }));
        }
    }, [form.name]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const res = await axios.post(`${import.meta.env.VITE_API}/api/auth/signup`, form);
            user.userId = res.data?.user?.id;
            const payload = {
                userId: res.data?.user?.id,
                ...user
            }
            const res1 = await axios.post(`${import.meta.env.VITE_API}/api/user/permission`, payload);

            setToastConfig({ type: "success", message: "User created successfully." });
            setShowToast(true);
            setForm({
                name: "",
                email: "",
                password: "",
                role: "",
            });
            setUser({
                createUser: false,
                updateUser: false,
                deleteUser: false,
                readUser: false,
                createBook: false,
                updateBook: false,
                deleteBook: false,
                readBook: false,
            })
        } catch (error) {
            console.error("Error creating user:", error);
            setToastConfig({
                type: "error",
                message: error.response?.data?.message || "Failed to create discount. Check console for details.",
            });
            setShowToast(true);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                        Add User
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
                                <label className="block text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
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
                                <label className="block text-sm font-medium text-gray-700">Password <span className="text-red-500">*</span></label>
                                <input
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    type="password"
                                    required
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
                        <PermissionForm user={user} setUser={setUser} />
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                        >
                            Submit
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AddUser;
