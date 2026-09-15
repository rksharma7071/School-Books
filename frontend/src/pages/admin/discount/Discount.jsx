import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Link, useLoaderData, useSearchParams, useRevalidator } from "react-router-dom";
import DiscountTable from "../../../components/admin/DiscountTable.jsx";
import { getDiscount } from "../../../data/discount.js";

function Discount() {
  const loader = useLoaderData();
  const revalidator = useRevalidator();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.max(1, Number(searchParams.get("limit")) || 20);

  const discounts = Array.isArray(loader?.data) ? loader.data : [];
  const meta = loader?.meta ?? { total: 0, page, limit, totalPages: 1 };

  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    if (meta.totalPages && page > meta.totalPages) {
      const next = new URLSearchParams(searchParams);
      next.set("page", String(meta.totalPages));
      setSearchParams(next, { replace: true });
    }
  }, [meta.totalPages, page, searchParams, setSearchParams]);

  const filteredDiscounts = useMemo(() => {
    const term = (search || "").trim().toLowerCase();
    if (!term) return discounts;
    return discounts.filter((d) =>
      String(d.discount_code ?? "").toLowerCase().includes(term)
    );
  }, [discounts, search]);

  const allVisibleIds = filteredDiscounts.map((d) => d.id || d._id).filter(Boolean);
  const isAllSelected =
    allVisibleIds.length > 0 &&
    allVisibleIds.every((id) => selectedIds.includes(id));

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => prev.filter((id) => !allVisibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...allVisibleIds])));
    }
  };

  const handlePaginationChange = (e) => {
    const value = Number(e.target.value);
    const next = new URLSearchParams(searchParams);
    next.set("limit", String(value));
    next.set("page", "1");
    setSearchParams(next);
  };

  const handlePrevPage = () => {
    if (page <= 1) return;
    const next = new URLSearchParams(searchParams);
    next.set("page", String(page - 1));
    setSearchParams(next);
  };

  const handleNextPage = () => {
    if (page >= meta.totalPages) return;
    const next = new URLSearchParams(searchParams);
    next.set("page", String(page + 1));
    setSearchParams(next);
  };

  const startIndex = meta.total === 0 ? 0 : (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, meta.total);

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Discount</h2>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value) }}
            placeholder="Search by discount code..."
            className="flex-1 sm:w-72 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Link
            to={`/${import.meta.env.VITE_ADMIN}/discounts/add`}
            className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            Add Discount
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {selectedIds.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
            <span>{selectedIds.length} discount(s) selected</span>
            <button
              className="text-blue-600 hover:underline"
              onClick={() => setSelectedIds([])}
            >
              Clear selection
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <DiscountTable
            render={revalidator.state !== "idle"}
            setRender={() => revalidator.revalidate()}
            isAllSelected={isAllSelected}
            toggleSelectAll={toggleSelectAll}
            paginatedDiscount={filteredDiscounts}
            selectedIds={selectedIds}
            toggleSelect={toggleSelect}
          />
        </div>

        <div className="border-t border-gray-100 px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={limit}
              onChange={handlePaginationChange}
              className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5 rows</option>
              <option value={10}>10 rows</option>
              <option value={20}>20 rows</option>
              <option value={30}>30 rows</option>
            </select>
            <span className="hidden sm:inline">
              {meta.total > 0 ? `Showing ${startIndex}–${endIndex} of ${meta.total} discounts` : "Showing 0 of 0 discounts"}
            </span>
          </div>

          <div className="flex items-center gap-3 justify-end">
            <button
              onClick={handlePrevPage}
              disabled={page === 1}
              className={`px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 ${page === 1 ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Prev
            </button>
            <span>
              Page{" "}
              <span className="font-semibold text-gray-700">{page}</span> of{" "}
              <span className="font-semibold text-gray-700">{meta.totalPages}</span>
            </span>
            <button
              onClick={handleNextPage}
              disabled={page >= meta.totalPages}
              className={`px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 ${page >= meta.totalPages ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Discount;