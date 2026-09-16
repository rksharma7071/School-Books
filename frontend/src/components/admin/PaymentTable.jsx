import React from "react";
import { Link } from "react-router-dom";

function PaymentTable({
    isAllSelected,
    toggleSelectAll,
    toggleSelect,
    paginatedPayment = [],
    selectedIds = [],
}) {
    const statusStyles = {
        paid: "bg-green-100 text-green-700",
        pending: "bg-yellow-100 text-yellow-700",
        failed: "bg-red-100 text-red-700",
        refunded: "bg-blue-100 text-blue-700",
    };

    const providerLabel = {
        stripe: "Stripe",
        paypal: "PayPal",
        razorpay: "Razorpay",
        shopify_payments: "Shopify Payments",
    };

    const capitalize = (s = "") =>
        s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

    const columns = 6;

    return (
        <table className="min-w-full text-sm">
            <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="p-2 text-left w-10">
                        <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={toggleSelectAll}
                            className="h-4 w-4 rounded border-gray-300 hover:cursor-pointer"
                        />
                    </th>
                    <th className="p-2 text-left font-semibold text-gray-700">Transaction ID</th>
                    <th className="p-2 text-left font-semibold text-gray-700">Provider</th>
                    <th className="p-2 text-left font-semibold text-gray-700">Amount</th>
                    <th className="p-2 text-left font-semibold text-gray-700">Order</th>
                    <th className="p-2 text-left font-semibold text-gray-700">Status</th>
                </tr>
            </thead>

            <tbody>
                {paginatedPayment.length === 0 ? (
                    <tr>
                        <td colSpan={columns} className="px-4 py-6 text-center text-gray-500">No payments found.</td>
                    </tr>
                ) : (
                    paginatedPayment.map((payment) => {
                        const rowId = payment._id || payment.id;
                        const isSelected = selectedIds.includes(rowId);

                        return (
                            <tr
                                key={rowId}
                                className="border-t border-gray-100 hover:bg-gray-50"
                            >
                                <td className="p-2">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleSelect(rowId)}
                                        className="h-4 w-4 rounded border-gray-300 hover:cursor-pointer"
                                    />
                                </td>

                                <td className="p-2 font-medium text-gray-800">
                                    <Link
                                        to={`${rowId}`}
                                        className="hover:text-blue-600 hover:underline"
                                    >
                                        {payment.transactionId || "—"}
                                    </Link>
                                </td>

                                <td className="p-2 text-gray-700">
                                    {providerLabel[payment.provider] || capitalize(payment.provider) || "—"}
                                </td>

                                <td className="p-2 text-gray-700 tabular-nums">
                                    ₹{Number(payment.amount ?? 0).toFixed(2)}
                                </td>

                                <td className="p-2 text-gray-900">
                                    {payment.order?.orderNumber ? `#${payment.order.orderNumber}` : "—"}
                                </td>

                                <td className="p-2">
                                    <span
                                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusStyles[payment.status] || "bg-gray-200 text-gray-600"}`}
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