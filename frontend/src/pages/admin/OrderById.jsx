import React from "react";
import { useState } from "react";
import { Link, useLoaderData, useNavigate } from "react-router-dom";

function OrderById() {
    const [shipping, setShipping] = useState({
        name: "", phone: "", address: "", city: "", state: "", pincode: ""
    })
    const order = useLoaderData();
    const navigate = useNavigate();
    const decoded = decodeURIComponent(order.shipping_address);
    const parts = decoded.split(" ");
    const name = parts[0];
    const phone = parts[1];
    const pincode = parts.pop();
    const state = parts.pop();
    const city = parts.pop();
    const address = parts.slice(2).join(" ");

    const statusStyles = {
        fulfilled: "bg-green-100 text-green-700",
        pending: "bg-yellow-100 text-yellow-700",
        cancelled: "bg-red-100 text-red-700",
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900">Order #{order.orderNumber}</h2>
                    <p className="text-sm text-gray-500">Placed on {new Date(order.placed_at).toLocaleString()}</p>
                </div>
                <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Back</button>
            </div>

            <div>
                <span
                    className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${statusStyles[order.status]}`}
                >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* <div className="border border-gray-300 rounded-xl p-4 bg-white">
                    <h3 className="font-semibold mb-2">Shipping Address</h3>
                    <p className="text-sm text-gray-700">{order.shipping_address}</p>
                </div> */}
                <div className="border border-gray-300 rounded-xl p-4 bg-white">
                    <h3 className="font-semibold mb-2">Shipping Address</h3>
                    <p className="text-sm text-gray-700 leading-6">
                        <span className="font-medium">{name}</span><br />
                        {phone}<br />
                        {address}<br />
                        {city}, {state} - {pincode}
                    </p>
                </div>

                {/* <div className="border border-gray-300 rounded-xl p-4 bg-white">
                    <h3 className="font-semibold mb-2">Billing Address</h3>
                    <p className="text-sm text-gray-700">{order.billing_address}</p>
                </div> */}
                <div className="border border-gray-300 rounded-xl bg-white p-4">
                    <h3 className="font-semibold mb-2">Payment</h3>
                    <p className="text-sm text-gray-700">
                        Payment ID: <span className="font-medium">{order.paymentId}</span>
                    </p>
                </div>
            </div>

            <div className="border border-gray-300 rounded-xl bg-white overflow-hidden">
                <h3 className="font-semibold p-4 border-b border-gray-300">Order Items</h3>
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                        <tr>
                            <th className="px-4 py-2 text-left">Book</th>
                            <th className="px-4 py-2">Qty</th>
                            <th className="px-4 py-2">Unit Price</th>
                            <th className="px-4 py-2">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map((item) => (
                            <tr key={item.bookId} className="border-t border-gray-300">
                                <td className="px-4 py-2"><Link to={`/products/${item.bookId._id}`}>{item.bookId.name}</Link></td>
                                <td className="px-4 py-2 text-center">{item.quantity}</td>
                                <td className="px-4 py-2 text-center">₹{item.unit_price}</td>
                                <td className="px-4 py-2 text-center">₹{item.total_price}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="border border-gray-300 rounded-xl bg-white p-4 space-y-2">
                <h3 className="font-semibold mb-2">Price Summary</h3>
                <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>₹{order.subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>₹{order.shipping}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>₹{order.tax}</span>
                </div>
                <div className="flex justify-between text-sm text-green-700">
                    <span>Discount</span>
                    <span>-₹{order.discount}</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-gray-300 pt-2">
                    <span>Total</span>
                    <span>₹{order.total}</span>
                </div>
            </div>

            {/* <div className="border border-gray-300 rounded-xl bg-white p-4">
                <h3 className="font-semibold mb-2">Payment</h3>
                <p className="text-sm text-gray-700">
                    Payment ID: <span className="font-medium">{order.paymentId}</span>
                </p>
            </div> */}

            {order.shipment && (
                <div className="border border-gray-300 rounded-xl bg-white p-4">
                    <h3 className="font-semibold mb-2">Shipment</h3>
                    <div className="text-sm space-y-1">
                        <p>Carrier: {order.shipment.carrier || "—"}</p>
                        <p>Tracking No: {order.shipment.tracking_number || "—"}</p>
                        <p>Status: {order.shipment.status}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default OrderById;
