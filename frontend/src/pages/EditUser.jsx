import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLoaderData } from "react-router-dom";

function EditUser() {
    const loaderData = useLoaderData();
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);

    const [form, setForm] = useState({
        username: "",
        first_name: "",
        last_name: "",
        email: "",
        role: "customer",
    });

    const [error, setError] = useState("");

    useEffect(() => {
        const load = async () => {
            setLoadingUser(true);
            try {
                if (loaderData && (loaderData.username || loaderData.email || loaderData._id || loaderData.id)) {
                    const u = loaderData.username ? loaderData : (loaderData.user ?? loaderData);
                    setUser(u);
                } else if (loaderData) {
                    const id = typeof loaderData === "string" || typeof loaderData === "number"
                        ? loaderData
                        : loaderData.id;
                    if (!id) throw new Error("Invalid loader data for user.");
                    const res = await axios.get(`/api/user/${id}`);
                    setUser(res.data);
                } else {
                    setUser(null);
                }
            } catch (err) {
                console.error("Failed to load user:", err);
                setError(err.response?.data?.message || err.message || "Failed to load user");
            } finally {
                setLoadingUser(false);
            }
        };

        load();
    }, [loaderData]);

    useEffect(() => {
        if (user) {
            setForm({
                username: user.username ?? "",
                first_name: user.first_name ?? "",
                last_name: user.last_name ?? "",
                email: user.email ?? "",
                role: user.role ?? "customer",
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const uid = (user && (user._id || user.id)) || (typeof loaderData === "string" || typeof loaderData === "number" ? loaderData : loaderData?.id);
            if (!uid) {
                throw new Error("User id not found.");
            }

            const payload = {
                username: form.username,
                first_name: form.first_name,
                last_name: form.last_name,
                email: form.email,
                role: form.role,
            };
            // console.log("payload: ", { payload, uid });

            const res = await axios.patch(`/api/user/${uid}`, payload);

            alert("User updated successfully!");

            const updated = res.data.user || payload;
            // console.log("updated: ", updated);

            setUser(updated);
            setForm({
                username: updated.username ?? payload.username,
                first_name: updated.first_name ?? payload.first_name,
                last_name: updated.last_name ?? payload.last_name,
                email: updated.email ?? payload.email,
                role: updated.role ?? payload.role,
            });

        } catch (err) {
            console.error("Error updating user:", err);
            setError(err.response?.data?.message || err.message || "Failed to update user");
        }
    };

    if (loadingUser) {
        return <div className="max-w-7xl mx-auto p-6">Loading user...</div>;
    }

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

export default EditUser;
