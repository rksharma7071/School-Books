import axios from "axios";
import React, { useContext, useState } from "react";
import { BookContext } from "../../../context/School";

function AddDiscount() {
    const [form, setForm] = useState({
        discount_code: "",
        discount_type: "percentage",
        amount: "",
        starts_at: "",
        ends_at: "",
        usage_limit: "",
        active: true,
    });
    const { setToastConfig, setShowToast } = useContext(BookContext);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value, type } = e.target;

        setForm((prev) => ({ ...prev, [name]: name === "active" ? value === "true" : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const res = await axios.post(`${import.meta.env.VITE_API}/api/discount`, form);
            setToastConfig({
                type: "success",
                message: "Discount created successfully.",
            });
            setShowToast(true);

            setForm({
                discount_code: "",
                discount_type: "percentage",
                amount: "",
                starts_at: "",
                ends_at: "",
                usage_limit: "",
                active: true,
            });
        } catch (error) {
            console.error("Error creating discount:", error);
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
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Add Discount</h2>
                </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <form onSubmit={handleSubmit} className="bg-white p-6 space-y-6">
                        {error && (<div className="bg-red-100 text-red-700 p-2 rounded text-sm">{error}</div>)}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Discount Code <span className="text-red-500">*</span></label>
                                <input
                                    name="discount_code"
                                    value={form.discount_code}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Discount Type <span className="text-red-500">*</span></label>
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

                            <div>
                                <label className="text-sm font-medium">Amount <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={form.amount}
                                    onChange={handleChange}
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Start Date <span className="text-red-500">*</span></label>
                                <input
                                    type="datetime-local"
                                    name="starts_at"
                                    value={form.starts_at}
                                    onChange={handleChange}
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">End Date <span className="text-red-500">*</span></label>
                                <input
                                    type="datetime-local"
                                    name="ends_at"
                                    value={form.ends_at}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Usage Limit <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    name="usage_limit"
                                    value={form.usage_limit}
                                    onChange={handleChange}
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Status <span className="text-red-500">*</span></label>
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

export default AddDiscount;
