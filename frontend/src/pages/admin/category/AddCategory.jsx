import React, { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BookContext } from "../../../context/School.jsx";
import ImageGridManager from "../../../components/admin/ImageGridManager.jsx";

const slugify = (str) =>
  String(str || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const FIELD_OPTIONS = [
  { value: "title", label: "Title" },
  { value: "description", label: "Description" },
  { value: "price", label: "Price" },
  { value: "compareAtPrice", label: "Compare At Price" },
  { value: "tag", label: "Tag" },
  { value: "inventory", label: "Inventory" },
  { value: "status", label: "Status (active/inactive)" },
  { value: "isbn", label: "ISBN" },
  { value: "categories", label: "Category IDs" },
];

const OPERATOR_OPTIONS = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not equals" },
  { value: "contains", label: "Contains" },
  { value: "not_contains", label: "Does not contain" },
  { value: "starts_with", label: "Starts with" },
  { value: "ends_with", label: "Ends with" },
  { value: "greater_than", label: "Greater than" },
  { value: "greater_than_or_equal", label: "Greater than or equal" },
  { value: "less_than", label: "Less than" },
  { value: "less_than_or_equal", label: "Less than or equal" },
  { value: "in", label: "In (comma-separated)" },
  { value: "not_in", label: "Not in (comma-separated)" },
];

const emptyCondition = () => ({
  field: "title",
  operator: "contains",
  value: "",
});

function AddCategory() {
  const navigate = useNavigate();
  const { setToastConfig, setShowToast } = useContext(BookContext);

  const [form, setForm] = useState({
    name: "",
    handle: "",
    description: "",
    type: "manual",
    conditionMatch: "all",
    isActive: true,
    sortOrder: 0,
  });

  const [conditions, setConditions] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);

  const [previewProducts, setPreviewProducts] = useState([]);
  const [previewTotal, setPreviewTotal] = useState(0);
  const [previewLoading, setPreviewLoading] = useState(false);

  const token = localStorage.getItem("token");
  const previewHandle = useMemo(
    () => form.handle.trim() || slugify(form.name),
    [form.handle, form.name]
  );

  useEffect(() => {
    const fetchProducts = async () => {
      setProductsLoading(true);
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API}/api/product`,
          {
            params: { all: "true", limit: 50 },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const list = res.data?.data || [];
        setProducts(
          list.map((p) => ({
            id: p._id,
            title: p.title,
            handle: p.handle,
            image:
              p.image?.url ||
              p.images?.[0]?.url ||
              "",
            minPrice: p.minPrice ?? 0,
          }))
        );
      } catch (err) {
        console.error("Failed to load products:", err);
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, [token]);

  useEffect(() => {
    if (form.type !== "automatic" || conditions.length === 0) {
      setPreviewProducts([]);
      setPreviewTotal(0);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const parsed = conditions
          .map((c) => ({
            field: c.field,
            operator: c.operator,
            value: coerceConditionValue(c),
          }))
          .filter((c) => c.value !== "" && c.value !== null);

        if (parsed.length === 0) {
          setPreviewProducts([]);
          setPreviewTotal(0);
          setPreviewLoading(false);
          return;
        }

        const res = await axios.post(
          `${import.meta.env.VITE_API}/api/categories/preview-matches`,
          {
            conditionMatch: form.conditionMatch,
            conditions: parsed,
            limit: 12,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          }
        );

        setPreviewProducts(res.data?.data?.products || []);
        setPreviewTotal(res.data?.data?.total || 0);
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.error("Preview failed:", err);
        }
      } finally {
        setPreviewLoading(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    form.type,
    form.conditionMatch,
    JSON.stringify(conditions),
    token,
  ]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev, [name]: type === "checkbox" ? checked : value,
    }));
    if (name === "type" && value === "automatic") {
      setSelectedProductIds([]);
    }
  };

  const addCondition = () => setConditions((prev) => [...prev, emptyCondition()]);

  const updateCondition = (index, key, value) =>
    setConditions((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [key]: value } : c))
    );

  const removeCondition = (index) =>
    setConditions((prev) => prev.filter((_, i) => i !== index));

  const coerceConditionValue = (cond) => {
    const { field, operator, value } = cond;
    if (operator === "in" || operator === "not_in") {
      return String(value)
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    }
    if (
      ["price", "compareAtPrice", "inventory"].includes(field) &&
      [
        "equals",
        "not_equals",
        "greater_than",
        "greater_than_or_equal",
        "less_than",
        "less_than_or_equal",
      ].includes(operator)
    ) {
      const num = Number(value);
      return Number.isNaN(num) ? value : num;
    }
    return value;
  };

  const toggleProduct = (id) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) =>
        p.title?.toLowerCase().includes(term) ||
        p.handle?.toLowerCase().includes(term)
    );
  }, [products, productSearch]);

  const selectedProducts = useMemo(
    () => products.filter((p) => selectedProductIds.includes(p.id)),
    [products, selectedProductIds]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);

      if (!form.name.trim()) throw new Error("Category name is required");

      let finalConditions = [];
      if (form.type === "automatic") {
        if (conditions.length === 0) {
          throw new Error("Automatic categories require at least one condition");
        }
        for (let i = 0; i < conditions.length; i++) {
          const c = conditions[i];
          if (!c.field || !c.operator) {
            throw new Error(`Condition ${i + 1} is incomplete`);
          }
          if (c.value === "" || c.value === null || c.value === undefined) {
            throw new Error(`Condition ${i + 1} is missing a value`);
          }
        }
        finalConditions = conditions.map((c) => ({
          field: c.field,
          operator: c.operator,
          value: coerceConditionValue(c),
        }));
      }

      const payload = {
        name: form.name.trim(),
        handle: previewHandle,
        description: form.description.trim(),
        type: form.type,
        conditionMatch: form.conditionMatch,
        conditions: finalConditions,
        products: form.type === "manual" ? selectedProductIds : [],
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder) || 0,
      };

      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (typeof value === "object") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });

      if (images.length > 0) {
        formData.append("image", images[0]);
      }

      await axios.post(
        `${import.meta.env.VITE_API}/api/categories`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setToastConfig({ type: "success", message: "Category created successfully." });
      setShowToast(true);
      navigate(`/${import.meta.env.VITE_ADMIN}/categories`);
    } catch (error) {
      console.error("❌ Error creating category:", error);
      setToastConfig({
        type: "error",
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to create category.",
      });
      setShowToast(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="mb-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Add Category</h2>
        <p className="text-sm text-gray-500">
          Create a manual or automatic category with conditions.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 space-y-6"
        >
          {/* ----- basic info ----- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                type="text"
                placeholder="Mathematics"
                required
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Handle</label>
              <input
                name="handle"
                value={form.handle || previewHandle}
                onChange={handleChange}
                type="text"
                placeholder={previewHandle || ""}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="3"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="manual">Manual</option>
                <option value="automatic">Automatic</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Sort Order</label>
              <input
                name="sortOrder"
                value={form.sortOrder}
                onChange={handleChange}
                type="number"
                min="0"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          </div>

          {/* ----- manual product picker ----- */}
          {form.type === "manual" && (
            <div className="border-t pt-4 border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">
                  Products ({selectedProductIds.length} selected)
                </h3>
                {selectedProductIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedProductIds([])}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Clear selection
                  </button>
                )}
              </div>

              <input
                type="search"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* selected chips */}
              {selectedProducts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedProducts.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700"
                    >
                      {p.title}
                      <button
                        type="button"
                        onClick={() => toggleProduct(p.id)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="max-h-72 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                {productsLoading ? (
                  <p className="p-4 text-sm text-gray-500">
                    Loading products…
                  </p>
                ) : filteredProducts.length === 0 ? (
                  <p className="p-4 text-sm text-gray-500">
                    No products found.
                  </p>
                ) : (
                  filteredProducts.map((p) => {
                    const checked = selectedProductIds.includes(
                      p.id
                    );
                    return (
                      <label
                        key={p.id}
                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleProduct(p.id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        {p.image ? (
                          <img
                            src={p.image}
                            alt=""
                            className="h-9 w-9 rounded object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded bg-gray-100 border border-gray-200" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">
                            {p.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {p.handle}
                            {p.minPrice
                              ? ` · ₹${p.minPrice}`
                              : ""}
                          </p>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ----- automatic conditions ----- */}
          {form.type === "automatic" && (
            <div className="border-t pt-4 border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">
                  Conditions
                </h3>
                <button
                  type="button"
                  onClick={addCondition}
                  className="text-sm text-blue-600 hover:underline"
                >
                  + Add condition
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Match
                </label>
                <select
                  name="conditionMatch"
                  value={form.conditionMatch}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">ALL conditions (AND)</option>
                  <option value="any">ANY condition (OR)</option>
                </select>
              </div>

              {conditions.length === 0 && (
                <p className="text-sm text-gray-500">
                  No conditions yet. Add at least one.
                </p>
              )}

              <div className="space-y-2">
                {conditions.map((cond, i) => (
                  <div
                    key={i}
                    className="flex flex-wrap gap-2 items-center border border-gray-200 rounded-lg p-2"
                  >
                    <select
                      value={cond.field}
                      onChange={(e) =>
                        updateCondition(i, "field", e.target.value)
                      }
                      className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
                    >
                      {FIELD_OPTIONS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={cond.operator}
                      onChange={(e) =>
                        updateCondition(i, "operator", e.target.value)
                      }
                      className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
                    >
                      {OPERATOR_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>

                    <input
                      value={cond.value}
                      onChange={(e) =>
                        updateCondition(i, "value", e.target.value)
                      }
                      placeholder="value"
                      className="flex-1 min-w-[140px] border border-gray-300 rounded-lg px-2 py-1 text-sm"
                    />

                    <button
                      type="button"
                      onClick={() => removeCondition(i)}
                      className="text-red-500 text-xs hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              {/* ----- live preview ----- */}
              <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-gray-700">
                    Matching products
                  </h4>
                  <span className="text-xs text-gray-500">
                    {previewLoading
                      ? "Checking…"
                      : `${previewTotal} match${previewTotal === 1 ? "" : "es"
                      }`}
                  </span>
                </div>

                {previewProducts.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    {conditions.length === 0
                      ? "Add conditions to preview matches."
                      : previewLoading
                        ? "Checking matches…"
                        : "No products match the current conditions."}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {previewProducts.map((p) => (
                      <span
                        key={p.id}
                        className="inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 px-3 py-1 text-xs text-gray-700"
                      >
                        {p.image ? (
                          <img
                            src={p.image}
                            alt=""
                            className="h-5 w-5 rounded object-cover"
                          />
                        ) : null}
                        {p.title}
                      </span>
                    ))}
                    {previewTotal > previewProducts.length && (
                      <span className="text-xs text-gray-500 self-center">
                        +{previewTotal - previewProducts.length} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500">
                Note: products are assigned automatically by
                conditions — <code>category.products</code> stays empty.
              </p>
            </div>
          )}

          {/* ----- image ----- */}
          <div className="border-t pt-4 border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Image</h3>
            <ImageGridManager onImagesChange={setImages} />
            <p className="mt-2 text-xs text-gray-500">
              Only the first uploaded image is used as the category image.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-2 rounded-lg text-sm font-medium text-white ${submitting
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
              }`}
          >
            {submitting ? "Creating…" : "Save Category"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddCategory;