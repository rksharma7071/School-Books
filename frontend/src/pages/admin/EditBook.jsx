import React, { useEffect, useState } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import axios from "axios";
import BookImages from "../../components/admin/BookImages";

function EditBook() {
    const [imageMeta, setImageMeta] = useState({
        removedPublicIds: [],
        order: [],
    });

    const loadedBook = useLoaderData();
    const navigate = useNavigate();

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
        description: "",
        isActive: true,
    });

    const [images, setImages] = useState([]);

    useEffect(() => {
        if (loadedBook) {
            setForm({
                name: loadedBook.name || "",
                author: loadedBook.author || "",
                subject: loadedBook.subject || "",
                category: loadedBook.category?._id || loadedBook.category || "",
                classLevel: loadedBook.classLevel || "",
                isbn: loadedBook.isbn || "",
                language: loadedBook.language || "",
                price: loadedBook.price || "",
                cost: loadedBook.cost || "",
                publisher: loadedBook.publisher || "",
                stockQty: loadedBook.stockQty || "",
                description: loadedBook.description || "",
                isActive: loadedBook.isActive ? true : false,
            });
        }
    }, [loadedBook]);

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
                if (value !== "" && value !== undefined && value !== null) {
                    formData.append(key, value);
                }
            });

            imageMeta.removedPublicIds.forEach((id) =>
                formData.append("removeImagePublicIds[]", id)
            );

            if (imageMeta.order.length > 0) {
                formData.append("imagesOrder", JSON.stringify(imageMeta.order));
            }

            images.forEach((file) => {
                formData.append("images", file);
            });

            await axios.patch(`/api/book/${loadedBook._id}`, formData);

            alert("Book updated successfully!");
            navigate(`/${import.meta.env.VITE_ADMIN}/books`);
            
        } catch (error) {
            console.error("Edit Book Error:", error);
            alert(error.response?.data?.message || "Failed to update book");
        }
    };


    return (
        <div className="max-w-7xl mx-auto space-y-4">
            <div className="mb-4">
                <h2 className="text-2xl font-semibold text-gray-900">Edit Book</h2>
                <p className="text-sm text-gray-500">Update the book details below.</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white">
                <form
                    onSubmit={handleSubmit}
                    className="max-w-5xl mx-auto p-6 space-y-6"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <Input label="Book Name" name="name" value={form.name} onChange={handleChange} required />
                        <Input label="Author" name="author" value={form.author} onChange={handleChange} required />
                        <Input label="Subject" name="subject" value={form.subject} onChange={handleChange} />
                        <Input label="Class Level" name="classLevel" type="number" value={form.classLevel} onChange={handleChange} />
                        <Input label="ISBN" name="isbn" value={form.isbn} onChange={handleChange} />
                        <Input label="Language" name="language" value={form.language} onChange={handleChange} />
                        <Input label="Category" name="category" value={form.category} onChange={handleChange} />
                        <Input label="Price (₹)" name="price" type="number" value={form.price} onChange={handleChange} />
                        <Input label="Cost Price (₹)" name="cost" type="number" value={form.cost} onChange={handleChange} />
                        <Input label="Publisher" name="publisher" value={form.publisher} onChange={handleChange} />
                        <Input label="Stock Quantity" name="stockQty" type="number" value={form.stockQty} onChange={handleChange} />

                        <div className="md:col-span-2">
                            <BookImages
                                existingImages={loadedBook.images || []}
                                onImagesChange={setImages}
                                onMetaChange={setImageMeta}
                            />

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
                                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <label className="flex items-center gap-2 md:col-span-2">
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={form.isActive}
                                onChange={handleChange}
                            />
                            <span className="text-sm">Is Active</span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                    >
                        Update Book
                    </button>
                </form>
            </div>
        </div>
    );
}

function Input({ label, name, value, onChange, type = "text", required }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                name={name}
                value={value}
                onChange={onChange}
                type={type}
                required={required}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
        </div>
    );
}

export default EditBook;
