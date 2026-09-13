import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useLoaderData } from "react-router-dom";
// import PermissionForm from "../../components/admin/PermissionForm.jsx";
import { BookContext } from "../../context/School.jsx";

function EditUser() {
    const { user } = useLoaderData();
    const { setToastConfig, setShowToast } = useContext(BookContext);

    const [form, setForm] = useState({
        name: "",
        email: "",
        role: "customer",
    });

    // let [permission, setPermission] = useState({
    //     userId: user._id,
    //     createUser: false,
    //     readUser: false,
    //     updateUser: false,
    //     deleteUser: false,
    //     createBook: false,
    //     readBook: false,
    //     updateBook: false,
    //     deleteBook: false,
    // });

    const [error, setError] = useState("");

    useEffect(() => {
        if (user) {
            setForm({
                name: user.name ?? "",
                email: user.email ?? "",
                role: user.role ?? "customer",
            });
        }
    }, [user]);

    // console.log("form: ", user);
    // console.log("user: ", user.user);

    // useEffect(() => {
    //     if (loadedPermission) {
    //         setPermission({
    //             createUser: !!loadedPermission.createUser,
    //             readUser: !!loadedPermission.readUser,
    //             updateUser: !!loadedPermission.updateUser,
    //             deleteUser: !!loadedPermission.deleteUser,
    //             createBook: !!loadedPermission.createBook,
    //             readBook: !!loadedPermission.readBook,
    //             updateBook: !!loadedPermission.updateBook,
    //             deleteBook: !!loadedPermission.deleteBook,
    //         });
    //     }
    // }, [loadedPermission]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const userId = user._id || user.id;
            await axios.patch(`${import.meta.env.VITE_API}/api/user/${userId}`, form,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );
            setToastConfig({
                type: "success",
                message: "User updated successfully!",
            });
            setShowToast(true);
        } catch (error) {
            console.log("error", error);
            setToastConfig({
                type: "error",
                message: error.message || "Update failed",
            });
            setShowToast(true);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Edit User</h2>
                </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto bg-white p-6 space-y-6">

                        {error && (
                            <div className="bg-red-100 text-red-700 p-2 rounded text-sm">{error}</div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 w-full border border-gray-300 rounded-lg text-gray-900 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>


                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
                                <input
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    type="email"
                                    disabled
                                    className="mt-1 w-full border bg-gray-100 border-gray-300 rounded-lg text-gray-900 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Role</label>
                                <select
                                    name="role"
                                    value={form.role}
                                    onChange={handleChange}
                                    className="mt-1 w-full border border-gray-300 rounded-lg text-gray-900 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 "
                                >
                                    <option value="customer">Customer</option>
                                    <option value="admin">Admin</option>
                                    {/* <option value="student">Student</option> */}
                                </select>
                            </div>
                        </div>

                        {/* <PermissionForm user={permission} setUser={setPermission} /> */}

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
