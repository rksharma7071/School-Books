import React, { useContext, useState } from "react";
import axios from "axios";
import { Link, useLoaderData, useNavigate } from "react-router-dom";
import { BookContext } from "../../context/School.jsx";
import InputField from "../../components/UI/InputField.jsx";

function OrderById() {
    const loaderOrder = useLoaderData();
    const { setToastConfig, setShowToast } = useContext(BookContext);
    const [order, setOrder] = useState(loaderOrder);
    const [updating, setUpdating] = useState(false);
    const navigate = useNavigate();
    const [selectedStatus, setSelectedStatus] = useState(order.status);

    const isCancelled = order.status === "cancelled";

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
        fulfilled: "bg-green-100 text-green-700",
        "in progress": "bg-yellow-100 text-yellow-700",
        unfulfilled: "bg-red-100 text-red-700",
        cancelled: "bg-red-100 text-red-700",
    };

    const updateOrderDetails = async () => {
        if (isCancelled) return;

        const statusChanged = selectedStatus !== order.status;
        const shipmentChanged =
            JSON.stringify(shipment) !== JSON.stringify(order.shipment || {});

        if (!statusChanged && !shipmentChanged) return;

        try {
            setUpdating(true);

            const { data } = await axios.patch(
                `${import.meta.env.VITE_API}/api/order/${order._id}`,
                { status: selectedStatus, shipment }
            );

            setOrder(data.order || data);

            setToastConfig({
                type: "success",
                message: "Order updated successfully",
            });
            setShowToast(true);
        } catch (error) {
            setToastConfig({
                type: "error",
                message:
                    error.response?.data?.message ||
                    "Failed to update order",
            });
            setShowToast(true);
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold">Order #{order.orderNumber}</h2>
                    <p className="text-sm text-gray-500">Placed on {new Date(order.placed_at).toLocaleString()}</p>
                </div>

                <button
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                    Back
                </button>
            </div>

            {isCancelled && (
                <div className="border border-red-300 bg-red-50 text-red-700 rounded-lg p-4">
                    <h3 className="font-semibold">Order Cancelled</h3>
                    <p className="text-sm">This order has been cancelled. No further updates are allowed.</p>
                </div>
            )}

            <span
                className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${statusStyles[order.status]}`}
            >
                {order.status === "fulfilled"
                    ? "Fulfilled"
                    : order.status === "in progress"
                        ? "In Progress"
                        : order.status === "cancelled"
                            ? "Cancelled"
                            : "Unfulfilled"}
            </span>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="border border-gray-300 rounded-xl p-4 bg-white">
                    <h3 className="font-semibold mb-2">Shipping Address</h3>
                    <p className="text-sm leading-6">
                        <b>{name}</b><br />
                        {phone}<br />
                        {address}<br />
                        {city}, {state} - {pincode}
                    </p>
                </div>

                <div className="border border-gray-300 rounded-xl bg-white p-4 space-y-4">
                    <h3 className="font-semibold">Order & Shipment</h3>

                    <div>
                        <label className="text-sm font-medium">Order Status</label>
                        <select
                            value={selectedStatus}
                            disabled={isCancelled}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className={`mt-1 w-full border  rounded-lg px-3 py-2 text-sm
                                ${isCancelled
                                    ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                                    : "border-gray-300"}`}
                        >
                            <option value="fulfilled">Fulfilled</option>
                            <option value="unfulfilled">Unfulfilled</option>
                            <option value="in progress">In Progress</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    {!isCancelled && selectedStatus === "fulfilled" && (
                        <div className="grid gap-3">
                            {/* <input name="carrier" value={shipment.carrier} onChange={handleShipmentChange} placeholder="Carrier" className="border px-3 py-2 rounded-lg" /> */}
                            {/* <input name="tracking_number" value={shipment.tracking_number} onChange={handleShipmentChange} placeholder="Tracking Number" className="border px-3 py-2 rounded-lg" /> */}
                            <InputField name="carrier" placeholder="Carrier (e.g. Blue Dart, Delhivery)" value={shipment.carrier} onChange={handleShipmentChange} disabled={isCancelled} />
                            <InputField name="tracking_number" placeholder="Tracking Number / AWB" value={shipment.tracking_number} onChange={handleShipmentChange} disabled={isCancelled} />
                        </div>
                    )}

                    <button
                        onClick={updateOrderDetails}
                        disabled={updating || isCancelled}
                        className={`w-full py-2 rounded-lg text-sm font-medium
                            ${(updating || isCancelled)
                                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-700"}`}
                    >
                        {isCancelled ? "Order Cancelled" : updating ? "Updating..." : "Update Order"}
                    </button>
                </div>
            </div>

            <div className="border border-gray-300 rounded-xl bg-white overflow-hidden">
                <h3 className="font-semibold p-4 border-b">Order Items</h3>
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left">Book</th>
                            <th className="px-4 py-2">Qty</th>
                            <th className="px-4 py-2">Price</th>
                            <th className="px-4 py-2">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map((item, i) => (
                            <tr key={i} className="border-t">
                                <td className="px-4 py-2">
                                    <Link
                                        className="text-blue-600 hover:underline"
                                        to={`/products/${item.bookId._id}`}
                                    >
                                        {item.bookId.name}
                                    </Link>
                                </td>
                                <td className="text-center">{item.quantity}</td>
                                <td className="text-center">₹{item.unit_price}</td>
                                <td className="text-center">₹{item.total_price}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="border border-gray-300 rounded-xl bg-white p-4">
                <div className="flex justify-between"><span>Subtotal</span><span>₹{order.subtotal}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span>₹{order.shipping}</span></div>
                <div className="flex justify-between"><span>Tax</span><span>₹{order.tax}</span></div>
                <div className="flex justify-between text-green-700"><span>Discount</span><span>-₹{order.discount}</span></div>
                <hr className="my-2" />
                <div className="flex justify-between font-semibold"><span>Total</span><span>₹{order.total}</span></div>
            </div>

            <div className="border border-gray-300 rounded-xl bg-white p-4">
                <h3 className="font-semibold">Payment</h3>
                <p className="text-sm">Payment ID: <b>{order.paymentId}</b></p>
            </div>
        </div>
    );
}

export default OrderById;
