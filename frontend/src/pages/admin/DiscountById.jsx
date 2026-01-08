import axios from "axios";
import React, { useState, useContext } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import { BookContext } from "../../context/School.jsx";

const formatDateTimeLocal = (date) => {
    if (!date) return "";
    return new Date(date).toISOString().slice(0, 16);
};

function DiscountById() {
    const loader = useLoaderData();
    const navigate = useNavigate();
    // const [error, setError] = useState("");
    const { setToastConfig, setShowToast } = useContext(BookContext);
    const [form, setForm] = useState({
        discount_code: loader.discount_code || "",
        discount_type: loader.discount_type || "percentage",
        amount: loader.amount || 0,
        starts_at: formatDateTimeLocal(loader.starts_at),
        ends_at: formatDateTimeLocal(loader.ends_at),
        usage_limit: loader.usage_limit ?? "",
        active: loader.active ?? false,
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: name === "active" ? value === "true" : ["amount", "usage_limit"].includes(name) ? Number(value) : value, }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (new Date(form.ends_at) <= new Date(form.starts_at)) {
                setToastConfig({
                    type: "error",
                    message: "End date must be greater than start date",
                });
                setShowToast(true);
                return;
            }

            const payload = {
                ...form,
                usage_limit: form.usage_limit === "" ? null : form.usage_limit,
            };

            const res = await axios.patch(`${import.meta.env.VITE_API}/api/discount/${loader._id}`, form);
            setToastConfig({
                type: "success",
                message: "Discount updated successfully",
            });
            setShowToast(true);
            navigate(`/${import.meta.env.VITE_ADMIN}/discount/${loader._id}`)
        } catch (error) {
            console.error("Error updating discount:", error);
            setToastConfig({
                type: "error",
                message:
                    error.response?.data?.message ||
                    "Failed to update discount. Please try again.",
            });
            setShowToast(true);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                        Edit Discount
                    </h2>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <form
                        onSubmit={handleSubmit}
                        className="max-w-5xl mx-auto bg-white p-6 space-y-6"
                    >
                        {/* {error && (
                            <div className="bg-red-100 text-red-700 p-2 rounded text-sm">
                                {error}
                            </div>
                        )} */}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Discount Code */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Discount Code *
                                </label>
                                <input
                                    name="discount_code"
                                    value={form.discount_code}
                                    onChange={handleChange}
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Discount Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Discount Type *
                                </label>
                                <select
                                    name="discount_type"
                                    value={form.discount_type}
                                    onChange={handleChange}
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="percentage">Percentage</option>
                                    <option value="fixed_amount">Fixed Amount</option>
                                </select>
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Amount *
                                </label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={form.amount}
                                    onChange={handleChange}
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Start Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Start Date *
                                </label>
                                <input
                                    type="datetime-local"
                                    name="starts_at"
                                    value={form.starts_at}
                                    onChange={handleChange}
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* End Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    End Date *
                                </label>
                                <input
                                    type="datetime-local"
                                    name="ends_at"
                                    value={form.ends_at}
                                    onChange={handleChange}
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Usage Limit */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Usage Limit
                                </label>
                                <input
                                    type="number"
                                    name="usage_limit"
                                    value={form.usage_limit}
                                    onChange={handleChange}
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Status *
                                </label>
                                <select
                                    name="active"
                                    value={String(form.active)}
                                    onChange={handleChange}
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="true">Active</option>
                                    <option value="false">Draft</option>
                                </select>
                            </div>
                        </div>

                        <button className="w-full bg-blue-600 text-white py-2 rounded">
                            Update Discount
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default DiscountById;
