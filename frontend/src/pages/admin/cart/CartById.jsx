import React, { useContext } from "react";
import axios from "axios";
import { MdDelete } from "react-icons/md";
import { useLoaderData, useNavigate } from "react-router-dom";
import { BookContext } from "../../../context/School.jsx";

function CartById() {
    const cart = useLoaderData();
    const navigate = useNavigate();
    const { setToastConfig, setShowToast } = useContext(BookContext);

    // Backend already computes lineTotal and subtotal
    const items = cart.items || [];
    const totalAmount = cart.subtotal ?? items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);

    // `cart.user` is populated only on the admin list route.
    // On the single-cart route we only have `userId`, so fall back gracefully.
    const customer = cart.user || null;

    const onDelete = async () => {
        if (!window.confirm("Do you want to delete this cart?")) return;

        try {
            await axios.delete(`${import.meta.env.VITE_API}/api/cart/${cart.id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            setToastConfig({
                type: "success",
                message: "Cart has been deleted successfully!",
            });
            setShowToast(true);
            navigate(`/${import.meta.env.VITE_ADMIN}/cart`);
        } catch (error) {
            setToastConfig({
                type: "error",
                message:
                    error.response?.data?.message ||
                    error?.message ||
                    "Cart Delete Error",
            });
            setShowToast(true);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-5 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                        {customer?.name || `User ${cart.userId}`}
                    </h2>
                    {customer?.email && (
                        <p className="text-sm text-gray-500">{customer.email}</p>
                    )}
                    {cart.totalItems != null && (
                        <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                            {cart.totalItems} item(s)
                        </span>
                    )}
                </div>

                <div className="text-right">
                    <p className="text-xs text-gray-500">Cart Total</p>
                    <p className="text-2xl font-bold text-gray-900">
                        ₹{totalAmount}
                    </p>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700">
                        Cart Items ({items.length})
                    </h3>
                </div>

                {items.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-500">
                        This cart is empty.
                    </div>
                ) : (
                    <div className="divide-y">
                        {items.map((item) => {
                            const product = item.product;
                            const variant = product?.variant;

                            return (
                                <div
                                    key={item.itemId}
                                    className="flex gap-5 p-5 items-center"
                                >
                                    {product?.image ? (
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-20 h-28 object-cover rounded-md border border-gray-200"
                                        />
                                    ) : (
                                        <div className="w-20 h-28 rounded-md border border-gray-200 bg-gray-50 flex items-center justify-center text-xs text-gray-400">
                                            No image
                                        </div>
                                    )}

                                    <div className="flex-1">
                                        <h4 className="text-sm font-semibold text-gray-900">
                                            {product?.name || "Unknown product"}
                                        </h4>

                                        {variant?.options && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                {Object.entries(variant.options)
                                                    .map(([k, v]) => `${k}: ${v}`)
                                                    .join(" • ")}
                                            </p>
                                        )}

                                        <div className="mt-2 flex gap-4 text-xs text-gray-600">
                                            <span>Qty: {item.quantity}</span>
                                            <span>₹{product?.price ?? 0} each</span>
                                            {!item.available && (
                                                <span className="text-red-600 font-medium">
                                                    Unavailable
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-gray-900">
                                            ₹{item.lineTotal ?? 0}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                    Created at {cart.createdAt ? new Date(cart.createdAt).toLocaleString() : "—"}
                </p>

                <button
                    onClick={onDelete}
                    className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                    <MdDelete />
                    Delete Cart
                </button>
            </div>
        </div>
    );
}

export default CartById;