// frontend/src/pages/frontend/MyOrders.jsx
import React from 'react'
import { Link, useLoaderData } from 'react-router-dom'

function MyOrders() {
    const { user, permission, order, address } = useLoaderData() || {}
    
    const statusStyles = {
        "in progress": 'bg-blue-100 text-blue-700 border-blue-200',
        "fulfilled": 'bg-green-100 text-green-700 border-green-200',
        "unfulfilled": 'bg-red-100 text-red-700 border-red-200',
        "cancelled": 'bg-red-100 text-red-700 border-red-200',
    }

    const capitalizeWords = (text = '') => text.replace(/\b\w/g, char => char.toUpperCase())
    
    // ✅ order is now an array from the new endpoint
    const orders = order || [];
    
    return (
        <div>
            <h3 className="text-xl font-semibold mb-6">My Orders</h3>

            {orders.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {orders.map((item) => (
                        <div
                            key={item._id}
                            className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="font-semibold text-gray-800">Order #{item.orderNumber}</p>
                                    <p className="text-sm text-gray-500">{new Date(item.createdAt).toDateString()}</p>
                                </div>

                                <span
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border
                                    ${statusStyles[item.status?.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-200'}`}
                                >
                                    {capitalizeWords(item.status)}
                                </span>
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm text-gray-600">Items: <span className="font-medium">{item.items?.length || 0}</span></p>
                            </div>

                            <div className="flex justify-between items-center mt-4">
                                <p className="text-lg font-bold text-gray-900">₹{item.total}</p>

                                <Link to={item._id} className="text-sm font-medium text-blue-600 hover:underline">View Details →</Link>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500">No orders found</p>
            )}
        </div>
    )
}

export default MyOrders