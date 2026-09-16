import React from "react";
import { Link } from "react-router-dom";

function OrderTable({
    isAllSelected,
    toggleSelectAll,
    toggleSelect,
    paginatedOrder = [],
    selectedIds = [],
}) {
    const statusMap = {
        fulfilled: {
            label: "Fulfilled",
            className: "bg-green-100 text-green-700",
        },
        "in progress": {
            label: "In Progress",
            className: "bg-yellow-100 text-yellow-700",
        },
        unfulfilled: {
            label: "Unfulfilled",
            className: "bg-gray-100 text-gray-700",
        },
        cancelled: {
            label: "Cancelled",
            className: "bg-red-100 text-red-700",
        },
    };

    const getCustomerName = (order) => {
        if (order.billing_address?.fullName)
            return order.billing_address.fullName;

        if (order.userId && typeof order.userId === "object")
            return order.userId.name || order.userId.email || "—";

        return "—";
    };

    const columns = 5;

    return (
        <table className="min-w-full text-sm">
            <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 text-left w-10">
                        <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={toggleSelectAll}
                            className="h-4 w-4 rounded border-gray-300 hover:cursor-pointer"
                        />
                    </th>
                    <th className="p-2 text-left font-semibold text-gray-700">Order</th>
                    <th className="p-2 text-left font-semibold text-gray-700">Customer</th>
                    <th className="p-2 text-left font-semibold text-gray-700">Total</th>
                    <th className="p-2 text-left font-semibold text-gray-700">Status</th>
                </tr>
            </thead>

            <tbody>
                {paginatedOrder.length === 0 ? (
                    <tr>
                        <td colSpan={columns} className="px-4 py-6 text-center text-gray-500">No orders found.</td>
                    </tr>
                ) : (
                    paginatedOrder.map((order) => {
                        const isSelected = selectedIds.includes(order._id);

                        return (
                            <tr key={order._id} className="border-t border-gray-100 hover:bg-gray-50">
                                <td className="px-4">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleSelect(order._id)}
                                        className="h-4 w-4 rounded border-gray-300 hover:cursor-pointer"
                                    />
                                </td>

                                <td className="p-2 font-semibold text-gray-800">
                                    <Link
                                        to={`${order._id}`}
                                        className="hover:text-blue-600 hover:underline"
                                    >
                                        #{order.orderNumber}
                                    </Link>
                                    <p className="text-xs text-gray-400 font-normal mt-0.5">
                                        {new Date(order.createdAt).toLocaleDateString()}
                                    </p>
                                </td>

                                <td className="p-2 text-gray-700">
                                    <p className="font-medium">
                                        {getCustomerName(order)}
                                    </p>
                                    {order.userId?.email && (
                                        <p className="text-xs text-gray-400">
                                            {order.userId.email}
                                        </p>
                                    )}
                                </td>

                                <td className="p-2 text-gray-900 font-medium tabular-nums">
                                    ₹{Number(order.total ?? 0).toFixed(2)}
                                </td>

                                <td className="p-2">
                                    <span
                                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusMap[order.status]?.className ||
                                            "bg-gray-100 text-gray-700"
                                            }`}
                                    >
                                        {statusMap[order.status]?.label ||
                                            order.status ||
                                            "Unknown"}
                                    </span>
                                </td>
                            </tr>
                        );
                    })
                )}
            </tbody>
        </table>
    );
}

export default OrderTable;