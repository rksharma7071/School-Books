import React, { useContext } from 'react'
import { BookContext } from '../../context/School';
import { Link } from 'react-router-dom';


function OrderTable({ isAllSelected, toggleSelectAll, toggleSelect, paginatedOrder, selectedIds }) {
    const { user } = useContext(BookContext);
    const role = user?.role;
    // console.log("paginatedOrder: ", paginatedOrder);

    return (
        <table className="min-w-full text-sm">
            <thead>
                <tr>
                    <th className="px-4 py-3 text-left"><input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} className="h-4 w-4 rounded border-gray-300 hover:cursor-pointer" /></th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Order Id</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">User Id</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Total Price</th>
                    {/* <th className="px-4 py-3 text-left font-semibold text-gray-700">Payment</th> */}
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                </tr>
            </thead>
            <tbody>
                {paginatedOrder.length === 0 ? (
                    <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-gray-500">No order found.</td>
                    </tr>
                ) : (
                    paginatedOrder.map((order) => {
                        const isSelected = selectedIds.includes(order._id);
                        return (
                            <tr key={order._id} className="border-t border-gray-100 hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(order._id)} className="h-4 w-4 rounded border-gray-300 hover:cursor-pointer" />
                                </td>
                                <td className="px-4 py-3">
                                    {/* <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(order._id)} className="h-4 w-4 rounded border-gray-300 hover:cursor-pointer" /> */}
                                    <Link to={`${order._id}`} >{order.orderNumber}</Link>
                                </td>
                                <td className="px-4 py-3 text-gray-900 font-medium">{order?.userId}</td>
                                <td className="px-4 py-3 text-gray-900 font-medium">₹{order?.total}</td>
                                {/* <td className="px-4 py-3 text-gray-700">{order?.paymentId}</td> */}
                                <td className="px-4 py-3">
                                    <span
                                        className={`px-3 py-1 rounded-full text-sm font-medium ${order.status === "fulfilled" ? "bg-green-100 text-green-700" :
                                            order.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                                            }`}
                                    >
                                        {order.status === "fulfilled" ? "Fulfilled" : order.status === "pending" ? "Pending" : "Cancelled"}
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

export default OrderTable