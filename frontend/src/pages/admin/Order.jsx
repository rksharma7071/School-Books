import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useLoaderData } from "react-router-dom";
import { getOrder } from "../../data/order.js";
import OrderTable from "../../components/admin/OrderTable.jsx";

function Order() {
    const loader = useLoaderData();

    const [orders, setOrders] = useState(loader || []);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedIds, setSelectedIds] = useState([]);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setOrders(loader || []);
    }, [loader]);

    const refresh = useCallback(async () => {
        setRefreshing(true);
        try {
            const data = await getOrder();
            setOrders(data || []);
            setSelectedIds([]);
        } finally {
            setRefreshing(false);
        }
    }, []);

    const filteredOrders = useMemo(() => {
        const term = search.trim().toLowerCase();

        return orders.filter((order) => {
            if (statusFilter !== "all" && order.status !== statusFilter) {
                return false;
            }

            if (!term) return true;

            const customer = order.user
                ? `${order.user.first_name || ""} ${order.user.last_name || ""} ${
                      order.user.email || ""
                  }`.toLowerCase()
                : "";

            return (
                String(order.orderNumber).includes(term) ||
                order.status?.toLowerCase().includes(term) ||
                String(order.total).includes(term) ||
                order.paymentId?.toLowerCase().includes(term) ||
                customer.includes(term)
            );
        });
    }, [orders, search, statusFilter]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredOrders.length / rowsPerPage)
    );

    const paginatedOrder = useMemo(() => {
        const safePage = Math.min(currentPage, totalPages);
        const start = (safePage - 1) * rowsPerPage;
        return filteredOrders.slice(start, start + rowsPerPage);
    }, [filteredOrders, currentPage, rowsPerPage, totalPages]);

    const allVisibleIds = paginatedOrder.map((o) => o._id);
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
            setSelectedIds((prev) =>
                prev.filter((id) => !allVisibleIds.includes(id))
            );
        } else {
            setSelectedIds((prev) =>
                Array.from(new Set([...prev, ...allVisibleIds]))
            );
        }
    };

    const handlePaginationChange = (e) => {
        setRowsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const handlePrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
    const handleNextPage = () =>
        setCurrentPage((p) => Math.min(totalPages, p + 1));

    const startIndex =
        filteredOrders.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
    const endIndex = Math.min(currentPage * rowsPerPage, filteredOrders.length);

    return (
        <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                        Orders
                    </h2>
                    <p className="text-sm text-gray-500">
                        Track and fulfil customer orders.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2 w-full sm:w-auto bg-white">
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All statuses</option>
                        <option value="in progress">In Progress</option>
                        <option value="fulfilled">Fulfilled</option>
                        <option value="unfulfilled">Unfulfilled</option>
                        <option value="cancelled">Cancelled</option>
                    </select>

                    <input
                        type="search"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Search by order #, customer, total..."
                        className="flex-1 sm:w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <button
                        onClick={refresh}
                        disabled={refreshing}
                        className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </button>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                {selectedIds.length > 0 && (
                    <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between text-xs text-gray-600">
                        <span>{selectedIds.length} order(s) selected</span>
                        <button
                            className="text-blue-600 hover:underline"
                            onClick={() => setSelectedIds([])}
                        >
                            Clear selection
                        </button>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <OrderTable
                        isAllSelected={isAllSelected}
                        toggleSelectAll={toggleSelectAll}
                        paginatedOrder={paginatedOrder}
                        selectedIds={selectedIds}
                        toggleSelect={toggleSelect}
                    />
                </div>

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
                            {filteredOrders.length > 0
                                ? `Showing ${startIndex}–${endIndex} of ${filteredOrders.length} orders`
                                : "Showing 0 of 0 orders"}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 justify-end">
                        <button
                            onClick={handlePrevPage}
                            disabled={currentPage === 1}
                            className={`px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 ${
                                currentPage === 1
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                            }`}
                        >
                            Prev
                        </button>
                        <span>
                            Page{" "}
                            <span className="font-semibold text-gray-700">
                                {Math.min(currentPage, totalPages)}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-gray-700">
                                {totalPages}
                            </span>
                        </span>
                        <button
                            onClick={handleNextPage}
                            disabled={currentPage >= totalPages}
                            className={`px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 ${
                                currentPage >= totalPages
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                            }`}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Order;
