import React from 'react'
import axios from 'axios'
import { useLoaderData, Link, useNavigate } from 'react-router-dom'

function OrderDetails() {
    const order = useLoaderData()
    const navigate = useNavigate()

    const statusStyles = {
        "in progress": 'bg-blue-100 text-blue-700 border-blue-200',
        "fulfilled": 'bg-green-100 text-green-700 border-green-200',
        "unfulfilled": 'bg-red-100 text-red-700 border-red-200',
        "cancelled": 'bg-red-100 text-red-700 border-red-200',
    }

    const handleCancelOrder = async () => {
        const confirmCancel = window.confirm(
            "Are you sure you want to cancel this order?"
        )

        if (!confirmCancel) return

        try {
            await axios.patch(
                `${import.meta.env.VITE_API}/api/order/${order._id}`,
                { status: "cancelled" }
            )

            alert("Order cancelled successfully")
            navigate("/profile/orders")
        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Failed to cancel order"
            )
        }
    }

    const capitalizeWords = (text = '') =>
        text.replace(/\b\w/g, char => char.toUpperCase())

    const decodeAddress = (address = '') =>
        decodeURIComponent(address).replace(/\+/g, ' ')

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-semibold">
                        Order #{order.orderNumber}
                    </h2>
                    <p className="text-sm text-gray-500">
                        Placed on {new Date(order.createdAt).toDateString()}
                    </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border
                        ${statusStyles[order.status] ||
                            'bg-gray-100 text-gray-700 border-gray-200'}`}
                    >
                        {capitalizeWords(order.status)}
                    </span>

                    {(order.status === "in progress" ||
                        order.status === "unfulfilled") && (
                            <button
                                onClick={handleCancelOrder}
                                className="text-sm text-red-600 hover:underline"
                            >
                                Cancel Order
                            </button>
                        )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoCard title="Shipping Address">
                        <p>{decodeAddress(order.shipping_address)}</p>
                    </InfoCard>

                    <InfoCard title="Payment Information">
                        <p><b>Payment ID:</b> {order.paymentId}</p>
                        <p><b>Email:</b> {order.user?.email}</p>
                        <p><b>Status:</b> Paid</p>
                    </InfoCard>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-4">Items</h3>

                <div className="space-y-4">
                    {order.items.map((item, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-4 border border-gray-300 rounded-lg p-4"
                        >
                            <img
                                src={item.book.coverImage}
                                alt={item.book.name}
                                className="w-20 h-24 object-cover rounded"
                            />

                            <div className="flex-1">
                                <p className="font-medium">{item.book.name}</p>
                                <p className="text-sm text-gray-500">
                                    Qty: {item.quantity}
                                </p>
                                <p className="text-sm text-gray-500">
                                    ₹{item.unit_price} each
                                </p>
                            </div>

                            <p className="font-semibold">
                                ₹{item.total_price}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="max-w-md ml-auto border border-gray-300 rounded-lg p-4 space-y-2">
                <SummaryRow label="Subtotal" value={order.subtotal} />
                <SummaryRow label="Shipping" value={order.shipping} />
                <SummaryRow label="Tax" value={order.tax} />
                <SummaryRow label="Discount" value={`-₹${order.discount}`} />
                <hr className="border-gray-300" />
                <SummaryRow label="Total" value={`₹${order.total}`} bold />
            </div>

            <Link
                to="/profile/orders"
                className="inline-block text-blue-600 hover:underline"
            >
                ← Back to Orders
            </Link>
        </div>
    )
}

function InfoCard({ title, children }) {
    return (
        <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="font-semibold mb-2">{title}</h4>
            <div className="text-sm text-gray-600 space-y-1">
                {children}
            </div>
        </div>
    )
}

function SummaryRow({ label, value, bold }) {
    return (
        <div className="flex justify-between text-sm">
            <span className={bold ? 'font-semibold' : ''}>{label}</span>
            <span className={bold ? 'font-semibold' : ''}>{value}</span>
        </div>
    )
}

export default OrderDetails
