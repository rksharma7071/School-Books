import React, { useContext, useMemo, useState } from "react";
import axios from "axios";
import ImageGridManager from "../../../components/admin/ImageGridManager.jsx";
import { useNavigate } from "react-router-dom";
import { BookContext } from "../../../context/School.jsx";

const slugify = (str) =>
    String(str || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

const cartesian = (options) => {
    if (!options.length) return [];
    return options.reduce(
        (acc, option) => {
            const next = [];
            for (const combo of acc) {
                for (const value of option.values) {
                    next.push({ ...combo, [option.name]: value });
                }
            }
            return next;
        },
        [{}]
    );
};

const emptyVariant = (options) => ({
    sku: "",
    price: "",
    cost: "",
    compareAtPrice: "",
    inventory_quantity: "",
    isActive: true,
    options,
});

function AddBook() {
    const navigate = useNavigate();
    const { setToastConfig, setShowToast } = useContext(BookContext);

    const [form, setForm] = useState({
        title: "",
        handle: "",
        description: "",
        isbn: "",
        isActive: true,
    });

    const [options, setOptions] = useState([]);

    const [variants, setVariants] = useState([]);
    const [images, setImages] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const updateOptionName = (index, name) =>
        setOptions((prev) =>
            prev.map((opt, i) => (i === index ? { ...opt, name } : opt))
        );

    const updateOptionValue = (optIndex, valIndex, value) =>
        setOptions((prev) =>
            prev.map((opt, i) => {
                if (i !== optIndex) return opt;
                const values = [...opt.values];
                values[valIndex] = value;
                return { ...opt, values };
            })
        );

    const addOptionValue = (optIndex) =>
        setOptions((prev) =>
            prev.map((opt, i) =>
                i === optIndex ? { ...opt, values: [...opt.values, ""] } : opt
            )
        );

    const removeOptionValue = (optIndex, valIndex) =>
        setOptions((prev) =>
            prev.map((opt, i) => {
                if (i !== optIndex) return opt;
                return {
                    ...opt,
                    values: opt.values.filter((_, vi) => vi !== valIndex),
                };
            })
        );

    const addOption = () => setOptions((prev) => [...prev, { name: "", values: [""] }]);

    const removeOption = (index) => setOptions((prev) => prev.filter((_, i) => i !== index));

    const generatedCombos = useMemo(() => {
        const cleaned = options
            .map((opt) => ({
                name: opt.name.trim().toLowerCase(),
                values: opt.values.map((v) => v.trim()).filter(Boolean),
            }))
            .filter((opt) => opt.name && opt.values.length > 0);

        if (cleaned.length === 0) return [];
        return cartesian(cleaned);
    }, [options]);

    React.useEffect(() => {
        setVariants((prev) => {
            const byKey = new Map(
                prev.map((v) => [JSON.stringify(v.options), v])
            );
            return generatedCombos.map((combo) => {
                const key = JSON.stringify(combo);
                return byKey.get(key) || emptyVariant(combo);
            });
        });
    }, [generatedCombos]);

    const updateVariantField = (index, field, value) =>
        setVariants((prev) =>
            prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
        );

    const previewHandle = useMemo(
        () => form.handle.trim() || slugify(form.title),
        [form.handle, form.title]
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;

        try {
            setSubmitting(true);

            const cleanedOptions = options
                .map((opt) => ({
                    name: opt.name.trim().toLowerCase(),
                    values: opt.values.map((v) => v.trim()).filter(Boolean),
                }))
                .filter((opt) => opt.name && opt.values.length > 0);

            if (cleanedOptions.length === 0) {
                throw new Error("At least one option is required");
            }
            if (variants.length === 0) {
                throw new Error("At least one variant is required");
            }

            for (let i = 0; i < variants.length; i++) {
                const v = variants[i];
                const price = Number(v.price);
                const compareAt =
                    v.compareAtPrice === "" || v.compareAtPrice === undefined
                        ? undefined
                        : Number(v.compareAtPrice);
                if (compareAt !== undefined && compareAt < price) {
                    throw new Error(
                        `Variant ${i + 1}: compareAtPrice (${compareAt}) must be >= price (${price})`
                    );
                }
            }

            const payload = {
                title: form.title.trim(),
                handle: form.handle.trim() || previewHandle,
                description: form.description.trim(),
                isbn: form.isbn.trim(),
                isActive: form.isActive,
                options: cleanedOptions,
                variants: variants.map((variant) => ({
                    ...(variant.sku ? { sku: variant.sku.trim() } : {}),
                    options: variant.options,
                    price: Number(variant.price),
                    cost: Number(variant.cost) || 0,
                    ...(variant.compareAtPrice !== "" &&
                        variant.compareAtPrice !== undefined
                        ? { compareAtPrice: Number(variant.compareAtPrice) }
                        : {}),
                    inventory_quantity: Number(variant.inventory_quantity) || 0,
                    isActive: variant.isActive !== false,
                })),
            };

            const formData = new FormData();
            formData.append("payload", JSON.stringify(payload));
            images.forEach((file) => formData.append("images", file));

            await axios.post(
                `${import.meta.env.VITE_API}/api/product`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            setToastConfig({ type: "success", message: "Book created successfully." });
            setShowToast(true);
            navigate(`/${import.meta.env.VITE_ADMIN}/books`);
        } catch (error) {
            console.error("❌ Error creating book:", error);
            setToastConfig({
                type: "error",
                message:
                    error.response?.data?.message ||
                    error.message ||
                    "Failed to create book.",
            });
            setShowToast(true);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Add Book</h2>
                    <p className="text-sm text-gray-500">Fill in the details and define options + variants below.</p>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <form onSubmit={handleSubmit} className="bg-white p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                type="text"
                                placeholder="Mathematics Class 6"
                                required
                                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Handle/slug</label>
                            <input
                                name="handle"
                                value={form.handle || previewHandle}
                                onChange={handleChange}
                                type="text"
                                placeholder="auto-generated from title"
                                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">ISBN</label>
                            <input
                                name="isbn"
                                value={form.isbn}
                                onChange={handleChange}
                                type="text"
                                placeholder="9789324195132"
                                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={form.isActive}
                                onChange={handleChange}
                                className="h-4 w-4"
                            />
                            <label className="text-sm text-gray-700">Is Active</label>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                rows="3"
                                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <ImageGridManager onImagesChange={setImages} />
                        </div>
                    </div>

                    {/* options */}
                    <div className="border-t pt-4 border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-gray-800">
                                Options <span className="text-red-500">*</span>
                            </h3>
                            <button
                                type="button"
                                onClick={addOption}
                                className="text-sm text-blue-600 hover:underline"
                            >
                                + Add option
                            </button>
                        </div>

                        <div className="space-y-4">
                            {options.map((opt, oi) => (
                                <div key={oi} className="border border-gray-200 rounded-lg p-3 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <input
                                            value={opt.name}
                                            onChange={(e) => updateOptionName(oi, e.target.value)}
                                            placeholder="Option name (e.g. class)"
                                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        {options.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeOption(oi)}
                                                className="text-red-500 text-xs hover:underline"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {opt.values.map((val, vi) => (
                                            <div key={vi} className="flex items-center gap-1">
                                                <input
                                                    value={val}
                                                    onChange={(e) => updateOptionValue(oi, vi, e.target.value)}
                                                    placeholder="value"
                                                    className="border border-gray-300 rounded-lg px-2 py-1 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                {opt.values.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeOptionValue(oi, vi)}
                                                        className="text-red-400 text-xs"
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => addOptionValue(oi)}
                                            className="text-xs text-blue-600 hover:underline"
                                        >
                                            + value
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t pt-4 border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-800 mb-3">Variants ({variants.length})</h3>

                        {variants.length === 0 ? (
                            <p className="text-sm text-gray-500">Add at least one option with values to generate variants.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-500 border-b border-gray-300">
                                            <th className="py-2 pr-3">Options</th>
                                            <th className="py-2 pr-3">SKU</th>
                                            <th className="py-2 pr-3">Price *</th>
                                            <th className="py-2 pr-3">Cost</th>
                                            <th className="py-2 pr-3">Compare At</th>
                                            <th className="py-2 pr-3">Stock *</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {variants.map((variant, vi) => (
                                            <tr key={vi} className="border-b border-gray-200">
                                                <td className="py-2 pr-3 text-gray-700">
                                                    {Object.entries(variant.options)
                                                        .map(([k, val]) => `${k}=${val}`)
                                                        .join(", ")}
                                                </td>
                                                <td className="py-2 pr-3">
                                                    <input
                                                        value={variant.sku}
                                                        onChange={(e) => updateVariantField(vi, "sku", e.target.value)}
                                                        placeholder="auto"
                                                        className="border border-gray-300 rounded-lg px-2 py-1 text-sm w-32"
                                                    />
                                                </td>
                                                <td className="py-2 pr-3">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={variant.price}
                                                        onChange={(e) => updateVariantField(vi, "price", e.target.value)}
                                                        className="border border-gray-300 rounded-lg px-2 py-1 text-sm w-24"
                                                        required
                                                    />
                                                </td>
                                                <td className="py-2 pr-3">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={variant.cost}
                                                        onChange={(e) => updateVariantField(vi, "cost", e.target.value)}
                                                        className="border border-gray-300 rounded-lg px-2 py-1 text-sm w-24"
                                                    />
                                                </td>
                                                <td className="py-2 pr-3">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={variant.compareAtPrice}
                                                        onChange={(e) => updateVariantField(vi, "compareAtPrice", e.target.value)}
                                                        className="border border-gray-300 rounded-lg px-2 py-1 text-sm w-24"
                                                    />
                                                </td>
                                                <td className="py-2 pr-3">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        value={variant.inventory_quantity}
                                                        onChange={(e) => updateVariantField(vi, "inventory_quantity", e.target.value)}
                                                        className="border border-gray-300 rounded-lg px-2 py-1 text-sm w-24"
                                                        required
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className={`w-full py-2 rounded-lg text-sm font-medium text-white ${submitting
                            ? "bg-blue-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700"
                            }`}
                    >
                        {submitting ? "Creating…" : "Save Book"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default AddBook;