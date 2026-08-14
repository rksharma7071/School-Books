import React from "react";
import { Link } from "react-router-dom";

function PaymentTable({
    isAllSelected,
    toggleSelectAll,
    toggleSelect,
    paginatedPayment,
    selectedIds,
}) {
    const statusStyles = {
        paid: "bg-green-100 text-green-700",
        pending: "bg-yellow-100 text-yellow-700",
        failed: "bg-red-100 text-red-700",
        refunded: "bg-blue-100 text-blue-700",
    };

    const capitalize = (s = "") => s.charAt(0).toUpperCase() + s.slice(1);

    return (
        <table className="min-w-full text-sm">
            <thead>
                <tr>
                    <th className="px-4 py-3 text-left">
                        <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={toggleSelectAll}
                            className="h-4 w-4 rounded border-gray-300 hover:cursor-pointer"
                        />
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Transaction Id
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Provider
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Amount
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Order
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Status
                    </th>
                </tr>
            </thead>
            <tbody>
                {paginatedPayment.length === 0 ? (
                    <tr>
                        <td
                            colSpan={6}
                            className="px-4 py-6 text-center text-gray-500"
                        >
                            No payment found.
                        </td>
                    </tr>
                ) : (
                    paginatedPayment.map((payment) => {
                        const isSelected = selectedIds.includes(payment._id);

                        return (
                            <tr
                                key={payment._id}
                                className="border-t border-gray-100 hover:bg-gray-50"
                            >
                                <td className="px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleSelect(payment._id)}
                                        className="h-4 w-4 rounded border-gray-300 hover:cursor-pointer"
                                    />
                                </td>

                                <td className="px-4 py-3 text-gray-700 font-medium">
                                    <Link
                                        to={payment._id}
                                        className="hover:underline"
                                    >
                                        {payment.transactionId}
                                    </Link>
                                </td>

                                <td className="px-4 py-3 text-gray-700">
                                    {capitalize(payment.provider)}
                                </td>

                                <td className="px-4 py-3 text-gray-700">
                                    ₹{payment.amount}
                                </td>

                                <td className="px-4 py-3 text-gray-900">
                                    {payment.order
                                        ? `#${payment.order.orderNumber}`
                                        : "—"}
                                </td>

                                <td className="px-4 py-3">
                                    <span
                                        className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyles[payment.status] ||
                                            "bg-gray-200 text-gray-600"
                                            }`}
                                    >
                                        {capitalize(payment.status)}
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

export default PaymentTable;