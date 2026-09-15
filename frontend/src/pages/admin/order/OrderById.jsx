import React, { useContext, useState, useMemo } from "react";
import axios from "axios";
import { Link, useLoaderData, useNavigate } from "react-router-dom";
import { BookContext } from "../../../context/School.jsx";
import InputField from "../../../components/UI/InputField.jsx";

const STATUS_TRANSITIONS = {
    "in progress": ["unfulfilled", "fulfilled"],
    unfulfilled: ["fulfilled"],
    fulfilled: [],
    cancelled: [],
};

const SHIPMENT_TRANSITIONS = {
    pending: ["shipped", "cancelled"],
    shipped: ["delivered", "cancelled"],
    delivered: [],
    cancelled: [],
};

function OrderById() {
    const loaderOrder = useLoaderData();
    const { setToastConfig, setShowToast } = useContext(BookContext);
    const [order, setOrder] = useState(loaderOrder);
    const [updating, setUpdating] = useState(false);
    const navigate = useNavigate();

    const isCancelled = order.status === "cancelled";
    const isFulfilled = order.status === "fulfilled";

    const [selectedStatus, setSelectedStatus] = useState(order.status);
    const [shipment, setShipment] = useState({
        carrier: order.shipment?.carrier || "",
        tracking_number: order.shipment?.tracking_number || "",
        status: order.shipment?.status || "pending",
    });

    // Backend shipping_address is an OBJECT now
    const shipping = order.shipping_address || {};
    const billing = order.billing_address || {};

    const allowedNextStatuses = useMemo(() => {
        return [order.status, ...(STATUS_TRANSITIONS[order.status] || [])];
    }, [order.status]);

    const allowedNextShipmentStatuses = useMemo(() => {
        const current = order.shipment?.status || "pending";
        return [current, ...(SHIPMENT_TRANSITIONS[current] || [])];
    }, [order.shipment?.status]);

    const handleShipmentChange = (e) => {
        setShipment((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const statusStyles = {
        fulfilled: "bg-green-100 text-green-700",
        "in progress": "bg-yellow-100 text-yellow-700",
        unfulfilled: "bg-red-100 text-red-700",
        cancelled: "bg-red-100 text-red-700",
    };

    const statusLabel = {
        fulfilled: "Fulfilled",
        "in progress": "In Progress",
        unfulfilled: "Unfulfilled",
        cancelled: "Cancelled",
    };

    const updateOrderDetails = async () => {
        if (isCancelled || isFulfilled) return;

        const originalShipment = {
            carrier: order.shipment?.carrier || "",
            tracking_number: order.shipment?.tracking_number || "",
            status: order.shipment?.status || "pending",
        };

        const statusChanged = selectedStatus !== order.status;
        const shipmentChanged =
            shipment.carrier !== originalShipment.carrier ||
            shipment.tracking_number !== originalShipment.tracking_number ||
            shipment.status !== originalShipment.status;

        if (!statusChanged && !shipmentChanged) {
            setToastConfig({ type: "info", message: "No changes to update." });
            setShowToast(true);
            return;
        }

        const payload = {};
        if (statusChanged) payload.status = selectedStatus;
        if (shipmentChanged) {
            payload.shipment = {
                carrier: shipment.carrier,
                tracking_number: shipment.tracking_number,
                status: shipment.status,
            };
        }

        try {
            setUpdating(true);

            const { data } = await axios.patch(
                `${import.meta.env.VITE_API}/api/order/${order._id}`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            // Backend returns { success, message, data }
            const updated = data?.data || data?.order || data;
            setOrder(updated);
            setSelectedStatus(updated.status);
            setShipment({
                carrier: updated.shipment?.carrier || "",
                tracking_number: updated.shipment?.tracking_number || "",
                status: updated.shipment?.status || "pending",
            });

            setToastConfig({ type: "success", message: "Order updated successfully" });
            setShowToast(true);
        } catch (error) {
            setToastConfig({
                type: "error",
                message: error.response?.data?.message || "Failed to update order",
            });
            setShowToast(true);
        } finally {
            setUpdating(false);
        }
    };

    const cancelOrder = async () => {
        if (isCancelled || isFulfilled) return;
        if (!window.confirm("Are you sure you want to cancel this order?")) return;

        try {
            setUpdating(true);
            const { data } = await axios.post(
                `${import.meta.env.VITE_API}/api/order/${order._id}/cancel`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            const updated = data?.data || data;
            setOrder(updated);
            setSelectedStatus(updated.status);

            setToastConfig({
                type: "success",
                message: "Order cancelled successfully. Inventory restored.",
            });
            setShowToast(true);
        } catch (error) {
            setToastConfig({
                type: "error",
                message: error.response?.data?.message || "Failed to cancel order",
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
                    <p className="text-sm text-gray-500">
                        Placed on{" "}
                        {new Date(order.placed_at || order.createdAt).toLocaleString()}
                    </p>
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
                    <p className="text-sm">
                        {order.cancellationReason || "This order has been cancelled. No further updates are allowed."}
                    </p>
                </div>
            )}

            <span
                className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${statusStyles[order.status] || "bg-gray-100 text-gray-700"}`}
            >
                {statusLabel[order.status] || order.status}
            </span>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="border border-gray-300 rounded-xl p-4 bg-white">
                    <h3 className="font-semibold mb-2">Shipping Address</h3>
                    <p className="text-sm leading-6">
                        <b>{shipping.fullName}</b>
                        <br />
                        {shipping.phone}
                        <br />
                        {shipping.address}
                        {shipping.landmark ? `, ${shipping.landmark}` : ""}
                        <br />
                        {shipping.city}, {shipping.state} - {shipping.pincode}
                        <br />
                        {shipping.country}
                    </p>
                </div>

                <div className="border border-gray-300 rounded-xl p-4 bg-white">
                    <h3 className="font-semibold mb-2">Billing Address</h3>
                    <p className="text-sm leading-6">
                        <b>{billing.fullName}</b>
                        <br />
                        {billing.phone}
                        <br />
                        {billing.address}
                        {billing.landmark ? `, ${billing.landmark}` : ""}
                        <br />
                        {billing.city}, {billing.state} - {billing.pincode}
                        <br />
                        {billing.country}
                    </p>
                </div>
            </div>

            <div className="border border-gray-300 rounded-xl bg-white p-4 space-y-4">
                <h3 className="font-semibold">Order & Shipment</h3>

                <div>
                    <label className="text-sm font-medium">Order Status</label>
                    <select
                        value={selectedStatus}
                        disabled={isCancelled || isFulfilled}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm ${
                            isCancelled || isFulfilled
                                ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                                : "border-gray-300"
                        }`}
                    >
                        {allowedNextStatuses.map((s) => (
                            <option key={s} value={s}>
                                {statusLabel[s] || s}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                        Only valid transitions from "{order.status}" are shown.
                    </p>
                </div>

                {!isCancelled && (
                    <div className="grid gap-3">
                        <div>
                            <label className="text-sm font-medium">Shipment Status</label>
                            <select
                                name="status"
                                value={shipment.status}
                                disabled={isCancelled || isFulfilled}
                                onChange={handleShipmentChange}
                                className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm ${
                                    isCancelled || isFulfilled
                                        ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                                        : "border-gray-300"
                                }`}
                            >
                                {allowedNextShipmentStatuses.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <InputField
                            name="carrier"
                            placeholder="Carrier (e.g. Blue Dart, Delhivery)"
                            value={shipment.carrier}
                            onChange={handleShipmentChange}
                            disabled={isCancelled || isFulfilled}
                        />
                        <InputField
                            name="tracking_number"
                            placeholder="Tracking Number / AWB"
                            value={shipment.tracking_number}
                            onChange={handleShipmentChange}
                            disabled={isCancelled || isFulfilled}
                        />
                    </div>
                )}

                <button
                    onClick={updateOrderDetails}
                    disabled={updating || isCancelled || isFulfilled}
                    className={`w-full py-2 rounded-lg text-sm font-medium ${
                        updating || isCancelled || isFulfilled
                            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                >
                    {isCancelled
                        ? "Order Cancelled"
                        : isFulfilled
                        ? "Order Fulfilled"
                        : updating
                        ? "Updating..."
                        : "Update Order"}
                </button>

                {!isCancelled && !isFulfilled && (
                    <button
                        onClick={cancelOrder}
                        disabled={updating}
                        className="w-full py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        {updating ? "Cancelling..." : "Cancel Order"}
                    </button>
                )}
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
                        {order.items.map((item, i) => {
                            // productId is populated → object; fall back to snapshot fields
                            const product = item.productId;
                            const title =
                                (product && typeof product === "object"
                                    ? product.title
                                    : null) || item.productName;
                            const handle =
                                product && typeof product === "object"
                                    ? product.handle
                                    : null;

                            return (
                                <tr key={i} className="border-t">
                                    <td className="px-4 py-2">
                                        {handle ? (
                                            <Link
                                                className="text-blue-600 hover:underline"
                                                to={`/products/${handle}`}
                                            >
                                                {title}
                                            </Link>
                                        ) : (
                                            <span>{title}</span>
                                        )}
                                        {item.variantSku && (
                                            <div className="text-xs text-gray-500">
                                                SKU: {item.variantSku}
                                            </div>
                                        )}
                                    </td>
                                    <td className="text-center">{item.quantity}</td>
                                    <td className="text-center">₹{item.unit_price}</td>
                                    <td className="text-center">₹{item.total_price}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="border border-gray-300 rounded-xl bg-white p-4">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{order.subtotal}</span>
                </div>
                <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>₹{order.shipping}</span>
                </div>
                <div className="flex justify-between">
                    <span>Tax</span>
                    <span>₹{order.tax}</span>
                </div>
                <div className="flex justify-between text-green-700">
                    <span>Discount</span>
                    <span>-₹{order.discount}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>₹{order.total}</span>
                </div>
            </div>

            <div className="border border-gray-300 rounded-xl bg-white p-4">
                <h3 className="font-semibold">Payment</h3>
                <p className="text-sm">
                    Payment ID: <b>{order.paymentId || "Not paid"}</b>
                </p>
                <p className="text-sm">
                    Verified: <b>{order.paymentVerified ? "Yes" : "No"}</b>
                </p>
            </div>
        </div>
    );
}

export default OrderById;