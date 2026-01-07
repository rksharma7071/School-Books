import React, { useState } from "react";
import axios from "axios";
import ImageGridManager from "../../components/admin/ImageGridManager.jsx";
import { useNavigate } from "react-router-dom";

function AddBook() {
    const [form, setForm] = useState({
        name: "",
        author: "",
        subject: "",
        category: "",
        classLevel: "",
        isbn: "",
        language: "",
        price: "",
        cost: "",
        publisher: "",
        stockQty: "",
        coverImage: "",
        description: "",
        isActive: true,
    });
    const [images, setImages] = useState([]);
    const navigate = useNavigate();


    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const formData = new FormData();

            Object.entries(form).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== "") {
                    formData.append(key, value);
                }
            });

            images.forEach((file) => {
                formData.append("images", file);
            });

            for (const [k, v] of formData.entries()) {
                if (k !== "images") console.log(k, "=>", v);
            }

            const res = await axios.post(`${import.meta.env.VITE_API}/api/book`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            navigate(`/${import.meta.env.VITE_ADMIN}/books`)
            
            setForm({
                name: "",
                author: "",
                subject: "",
                category: "",
                classLevel: "",
                isbn: "",
                language: "",
                price: "",
                cost: "",
                publisher: "",
                stockQty: "",
                coverImage: "",
                description: "",
                isActive: true,
            });
            setImages([]);
        } catch (err) {
            console.error("❌ Error creating book:", err);
            alert(
                err.response?.data?.message ||
                "Failed to create book. Check console for details."
            );
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                        Add Book
                    </h2>
                    <p className="text-sm text-gray-500">
                        Fill in the details of the book below.
                    </p>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <form
                        onSubmit={handleSubmit}
                        className="max-w-5xl mx-auto bg-white p-6 space-y-6"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Book Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    type="text"
                                    placeholder="Mathematics Class 10"
                                    required
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Author <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="author"
                                    value={form.author}
                                    onChange={handleChange}
                                    type="text"
                                    placeholder="R.D. Sharma"
                                    required
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Subject
                                </label>
                                <input
                                    name="subject"
                                    value={form.subject}
                                    onChange={handleChange}
                                    type="text"
                                    placeholder="Mathematics"
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Class Level
                                </label>
                                <input
                                    name="classLevel"
                                    value={form.classLevel}
                                    onChange={handleChange}
                                    type="number"
                                    placeholder="10"
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    ISBN
                                </label>
                                <input
                                    name="isbn"
                                    value={form.isbn}
                                    onChange={handleChange}
                                    type="text"
                                    placeholder="9789324195132"
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Language
                                </label>
                                <input
                                    name="language"
                                    value={form.language}
                                    onChange={handleChange}
                                    type="text"
                                    placeholder="English / Hindi"
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Category
                                </label>
                                <input
                                    name="category"
                                    value={form.category}
                                    onChange={handleChange}
                                    type="text"
                                    placeholder="Category ID or Name"
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Price (₹)
                                </label>
                                <input
                                    name="price"
                                    value={form.price}
                                    onChange={handleChange}
                                    type="number"
                                    placeholder="Selling price"
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Cost Price (₹)
                                </label>
                                <input
                                    name="cost"
                                    value={form.cost}
                                    onChange={handleChange}
                                    type="number"
                                    placeholder="Cost price"
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Publisher
                                </label>
                                <input
                                    name="publisher"
                                    value={form.publisher}
                                    onChange={handleChange}
                                    type="text"
                                    placeholder="Dhanpat Rai Publications"
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Stock Quantity
                                </label>
                                <input
                                    name="stockQty"
                                    value={form.stockQty}
                                    onChange={handleChange}
                                    type="number"
                                    placeholder="120"
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Image grid */}
                            <div className="md:col-span-2">
                                <ImageGridManager onImagesChange={setImages} />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    rows="4"
                                    placeholder="Write a brief description about the book..."
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                ></textarea>
                            </div>

                            <div className="flex items-center gap-2 md:col-span-2">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={form.isActive}
                                    onChange={handleChange}
                                    className="h-4 w-4"
                                />
                                <label className="text-sm text-gray-700">Is Active</label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                        >
                            Save Book
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AddBook;
