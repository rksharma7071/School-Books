import React, { useContext, useState } from "react";
import axios from "axios";
import { Link, useLoaderData, useNavigate } from "react-router-dom";
import { BookContext } from "../../context/School.jsx";

function OrderById() {
    const loaderOrder = useLoaderData();
    const { setToastConfig, setShowToast } = useContext(BookContext);
    const [order, setOrder] = useState(loaderOrder);
    const [updating, setUpdating] = useState(false);
    const navigate = useNavigate();
    const [selectedStatus, setSelectedStatus] = useState(order.status);
    const decoded = decodeURIComponent(order.shipping_address);
    const parts = decoded.split(" ");
    const name = parts[0];
    const phone = parts[1];
    const pincode = parts.pop();
    const state = parts.pop();
    const city = parts.pop();
    const address = parts.slice(2).join(" ");
    const [shipment, setShipment] = useState({
        carrier: order.shipment?.carrier || "",
        tracking_number: order.shipment?.tracking_number || "",
        status: order.shipment?.status || "pending",
    });
    const handleShipmentChange = (e) => {
        setShipment({ ...shipment, [e.target.name]: e.target.value });
    };
    const statusStyles = {
        "fulfilled": "bg-green-100 text-green-700",
        "in progress": "bg-yellow-100 text-yellow-700",
        "unfulfilled": "bg-red-100 text-red-700",
    };

    const updateOrderDetails = async () => {
        const statusChanged = selectedStatus !== order.status;
        const shipmentChanged =
            JSON.stringify(shipment) !== JSON.stringify(order.shipment || {});

        if (!statusChanged && !shipmentChanged) return;

        try {
            setUpdating(true);

            const { data } = await axios.patch(
                `${import.meta.env.VITE_API}/api/order/${order._id}`,
                {
                    status: selectedStatus,
                    shipment,
                }
            );

            let message = "Order updated successfully";

            if (statusChanged && shipmentChanged) {
                message = "Order status and shipment details updated";
            } else if (statusChanged) {
                message = "Order status updated successfully";
            } else if (shipmentChanged) {
                message = "Shipment details updated successfully";
            }

            setToastConfig({
                type: "success",
                message,
            });
            setShowToast(true);
            setOrder({ ...order, status: selectedStatus });

        } catch (error) {
            console.error("Order update failed", error);

            setToastConfig({
                type: "error",
                message:
                    error.response?.data?.message ||
                    "Failed to update order. Please try again.",
            });
            setShowToast(true);
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                        Order #{order.orderNumber}
                    </h2>
                    <p className="text-sm text-gray-500">
                        Placed on {new Date(order.placed_at).toLocaleString()}
                    </p>
                </div>
                <button
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                    Back
                </button>
            </div>

            {/* Status + Update */}
            <div className="flex items-center gap-4">
                <span
                    className={`px-4 py-1 rounded-full text-sm font-medium ${statusStyles[order.status]}`}
                >
                    {order.status === "fulfilled" ? "Fulfilled" :
                        order.status === "in progress" ? "In Progress" : "Unfulfilled"}
                </span>
            </div>


            {/* Address + Status */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="border border-gray-300 rounded-xl p-4 bg-white">
                    <h3 className="font-semibold mb-2">Shipping Address</h3>
                    <p className="text-sm text-gray-700 leading-6">
                        <span className="font-medium">{name}</span><br />
                        {phone}<br />
                        {address}<br />
                        {city}, {state} - {pincode}
                    </p>
                </div>

                {/* Order Status Update */}
                <div className="border border-gray-300 rounded-xl bg-white p-4 space-y-4">
                    <h3 className="font-semibold">Order & Shipment</h3>

                    {/* Status */}
                    <div>
                        <label className="text-sm font-medium">Order Status</label>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        >
                            <option value="fulfilled">Fulfilled</option>
                            <option value="unfulfilled">Unfulfilled</option>
                            <option value="in progress">In Progress</option>
                        </select>
                    </div>

                    {/* Shipment */}
                    {/* <div className="grid grid-cols-1 gap-3">
                        <div>
                            <label className="text-sm font-medium">Carrier</label>
                            <input
                                name="carrier"
                                value={shipment.carrier}
                                onChange={handleShipmentChange}
                                placeholder="Blue Dart / Delhivery"
                                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Tracking Number</label>
                            <input
                                name="tracking_number"
                                value={shipment.tracking_number}
                                onChange={handleShipmentChange}
                                placeholder="AWB / Tracking ID"
                                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Shipment Status</label>
                            <select
                                name="status"
                                value={shipment.status}
                                onChange={handleShipmentChange}
                                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="pending">Pending</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div> */}
                    {selectedStatus == "fulfilled" && (
                        <div className="grid grid-cols-1 gap-3">
                            <div>
                                <label className="text-sm font-medium">Carrier</label>
                                <input
                                    name="carrier"
                                    value={shipment.carrier}
                                    onChange={handleShipmentChange}
                                    placeholder="Blue Dart / Delhivery"
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Tracking Number</label>
                                <input
                                    name="tracking_number"
                                    value={shipment.tracking_number}
                                    onChange={handleShipmentChange}
                                    placeholder="AWB / Tracking ID"
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Shipment Status</label>
                                <select
                                    name="status"
                                    value={shipment.status}
                                    onChange={handleShipmentChange}
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        onClick={updateOrderDetails}
                        disabled={updating}
                        className={`w-full py-2 rounded-lg text-sm font-medium transition
            ${updating
                                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                    >
                        {updating ? "Updating..." : "Update Order"}
                    </button>
                </div>
            </div>

            {/* Order Items */}
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
                        {order.items.map((item, index) => (
                            <tr key={index} className="border-t border-gray-300">
                                <td className="px-4 py-2">
                                    <Link
                                        className="text-blue-600 hover:underline"
                                        to={`/products/${item.bookId._id}`}
                                    >
                                        {item.bookId.name}
                                    </Link>
                                </td>
                                <td className="px-4 py-2 text-center">{item.quantity}</td>
                                <td className="px-4 py-2 text-center">₹{item.unit_price}</td>
                                <td className="px-4 py-2 text-center">₹{item.total_price}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Price Summary */}
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
            <div className="border border-gray-300 rounded-xl bg-white p-4">
                <h3 className="font-semibold mb-2">Payment</h3>
                <p className="text-sm text-gray-700">
                    Payment ID: <span className="font-medium">{order.paymentId}</span>
                </p>
            </div>
            {/* Shipment */}
            {/* {order.shipment && (
                <div className="border border-gray-300 rounded-xl bg-white p-4">
                    <h3 className="font-semibold mb-2">Shipment</h3>
                    <div className="text-sm space-y-1">
                        <p>Carrier: {order.shipment.carrier || "—"}</p>
                        <p>Tracking No: {order.shipment.tracking_number || "—"}</p>
                        <p>Status: {order.shipment.status}</p>
                    </div>
                </div>
            )} */}
        </div>
    );
}

export default OrderById;
