import React, { useContext } from 'react'
import { BookContext } from '../../context/School';
import { Link } from 'react-router-dom';

function PaymentTable({ isAllSelected, toggleSelectAll, toggleSelect, paginatedPayment, selectedIds }) {
    const { user } = useContext(BookContext);
    const role = user?.role;

    return (
        <table className="min-w-full text-sm">
            <thead>
                <tr>
                    <th className="px-4 py-3 text-left"><input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} className="h-4 w-4 rounded border-gray-300 hover:cursor-pointer" /></th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Order Id</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Provider</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Amount</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Transaction Id</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Status</th>
                </tr>
            </thead>
            <tbody>
                {paginatedPayment.length === 0 ? (
                    <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-gray-500">No payment found.</td>
                    </tr>
                ) : (
                    paginatedPayment.map((payment) => {
                        const isSelected = selectedIds.includes(payment._id);
                        return (
                            <tr key={payment._id} className="border-t border-gray-100 hover:bg-gray-50">
                                <td className="px-4 py-3"><input type="checkbox" checked={isSelected} onChange={() => toggleSelect(discount._id)} className="h-4 w-4 rounded border-gray-300 hover:cursor-pointer" /></td>
                                <td className="px-4 py-3 text-gray-900 font-medium">
                                    <Link to={payment._id}>{payment?.orderId}</Link>
                                </td>
                                <td className="px-4 py-3 text-gray-700">{payment?.provide}</td>
                                <td className="px-4 py-3 text-gray-700">{payment?.amount}</td>
                                <td className="px-4 py-3 text-gray-700">{payment?.transactionId}</td>

                                <td className="px-4 py-3">
                                    <span
                                        className={`px-3 py-1 rounded-full text-sm font-medium ${payment.status ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}
                                    >
                                        {payment.status == "paid" ? "Paid" : "Faild"}
                                    </span>
                                </td>
                            </tr>
                        );
                    })
                )}
            </tbody>
        </table>
    )
}

export default PaymentTable