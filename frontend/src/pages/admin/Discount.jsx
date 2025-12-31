import React, { useState, useMemo, useEffect } from "react";
import { useLoaderData } from "react-router-dom";
import DiscountTable from "../../components/admin/DiscountTable.jsx";
import { getDiscount } from "../../data/discount.js";

function Discount() {
  const loader = useLoaderData();
  const [discounts, setDiscounts] = useState(loader || []);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [render, setRender] = useState(false);

  useEffect(() => {
    async function fetchDiscount() {
      const data = await getDiscount();
      setDiscounts(data);
      setRender(false);
    }

    if (render) {
      fetchDiscount();
    }
  }, [render]);

  const filteredDiscounts = useMemo(() => {
    const term = search?.toLowerCase();
    return discounts.filter((discount) => discount.discount_code?.toLowerCase().includes(term));
  }, [discounts, search]);

  const totalPages = Math.max(1, Math.ceil(filteredDiscounts.length / rowsPerPage));

  const paginatedDiscount = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * rowsPerPage;
    return filteredDiscounts.slice(start, start + rowsPerPage);
  }, [filteredDiscounts, currentPage, rowsPerPage, totalPages]);

  const allVisibleIds = paginatedDiscount.map((b) => b._id || b._id);
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
    setRowsPerPage(value);
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const startIndex = filteredDiscounts.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endIndex = Math.min(currentPage * rowsPerPage, filteredDiscounts.length);

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Discount</h2>
          {/* <p className="text-sm text-gray-500">Manage all school books and inventory.</p> */}
        </div>

        <div className="flex gap-2 w-full sm:w-auto bg-white">
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by title, author, category..."
            className="flex-1 sm:w-72 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {/* <Link to={'/add-book'} className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">+ Add Book</Link> */}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {selectedIds.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
            <span>{selectedIds.length} Review(s) selected</span>
            <button
              className="text-blue-600 hover:underline"
              onClick={() => setSelectedIds([])}
            >
              Clear selection
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <DiscountTable render={render} setRender={setRender} isAllSelected={isAllSelected} toggleSelectAll={toggleSelectAll} paginatedDiscount={paginatedDiscount} selectedIds={selectedIds} toggleSelect={toggleSelect} />
        </div>

        {/* Pagination footer */}
        <div className="border-t border-gray-100 px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={handlePaginationChange}
              className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5 rows</option>
              <option value={10}>10 rows</option>
              <option value={20}>20 rows</option>
              <option value={30}>30 rows</option>
            </select>
            <span className="hidden sm:inline">
              {filteredDiscounts.length > 0
                ? `Showing ${startIndex}–${endIndex} of ${filteredDiscounts.length} books`
                : "Showing 0 of 0 books"}
            </span>
          </div>

          <div className="flex items-center gap-3 justify-end">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className={`px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Prev
            </button>
            <span>
              Page{" "}
              <span className="font-semibold text-gray-700">{Math.min(currentPage, totalPages)}</span>{" "}
              of{" "}
              <span className="font-semibold text-gray-700">{totalPages}</span>
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className={`px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 ${currentPage >= totalPages? "opacity-50 cursor-not-allowed": ""}`}
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
