import React, { useContext, useState } from "react";
import axios from "axios";
import { BookContext } from "../../context/School";
import { useNavigate } from 'react-router-dom';

function Checkout() {
    const { user, cartItems, setCartItems, setToastConfig, setShowToast } = useContext(BookContext);
    const [loading, setLoading] = useState(false);
    const [createdOrderId, setCreatedOrderId] = useState(null);
    const navigate = useNavigate();
    const [shipping, setShipping] = useState({
        name: user?.name || "",
        phone: user?.phone || "",
        address: "",
        city: "",
        state: "",
        pincode: "",
    });

    const handleChange = (e) => {
        setShipping({ ...shipping, [e.target.name]: e.target.value });
    };

    const clearCart = async () => {
        try {
            await axios.delete(`/api/cart/clear/${user.id}`);
            setCartItems([]);
            console.log("Cart cleared after payment");
        } catch (error) {
            console.error("Failed to clear cart", error);
        }
    };

    const deleteOrder = async (orderId) => {
        try {
            await axios.delete(`/api/order/${orderId}`);
            console.log("Order deleted:", orderId);
        } catch (err) {
            console.error("Failed to delete order", err);
        }
    };

    const validateShipping = () => {
        return (
            shipping.name &&
            shipping.phone &&
            shipping.address &&
            shipping.city &&
            shipping.state &&
            shipping.pincode
        );
    };

    const createOrder = async () => {
        if (!validateShipping()) {
            setToastConfig({
                type: "error",
                message: "Please fill all shipping details",
            });
            setShowToast(true);
            return;
        }

        setLoading(true);

        try {
            // 1️⃣ Create Order
            console.log({
                userId: user.id,
                items: cartItems.map((item) => ({
                    bookId: item.bookId,
                    quantity: item.quantity,
                })),
                shipping: 50,
                tax: 0,
                discount: 0,
                shipping_address: `${shipping}`,
                billing_address: `${shipping}`,
            });

            const orderRes = await axios.post("/api/order", {
                userId: user.id,
                items: cartItems.map((item) => ({
                    bookId: item.bookId,
                    quantity: item.quantity,
                })),
                shipping: 50,
                tax: 0,
                discount: 0,
                shipping_address: `${shipping}`,
                billing_address: `${shipping}`,
            });

            const order = orderRes.data;
            console.log("order: ", order);
            setCreatedOrderId(order._id);
            const razorpayRes = await axios.post("/api/razorpay/create-order", { orderId: order._id });
            console.log("razorpayRes", razorpayRes);

            openRazorpay(razorpayRes.data.razorpayOrder, order._id);
        } catch (error) {
            console.error("Checkout error:", error);
            setToastConfig({
                type: "error",
                message: "Checkout failed",
            });
            setShowToast(true);
        } finally {
            setLoading(false);
        }
    };

    const openRazorpay = (razorpayOrder, orderId) => {
        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: razorpayOrder.amount,
            currency: "INR",
            name: "School Book",
            description: "Order Payment",
            order_id: razorpayOrder.orderNumber,

            handler: async function (response) {
                try {
                    await axios.post("/api/razorpay/verify-payment", {
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        orderId,
                    });

                    // ✅ Clear cart after successful payment
                    await clearCart();

                    setToastConfig({
                        type: "success",
                        message: "Payment Successful! Cart cleared.",
                    });
                    setShowToast(true);
                    navigate('/')
                } catch (error) {
                    await deleteOrder(orderId);

                    setToastConfig({
                        type: "error",
                        message: "Payment verification failed",
                    });
                    setShowToast(true);
                }
            },


            modal: {
                ondismiss: async function () {
                    // ❌ User closed payment window
                    await deleteOrder(orderId);

                    setToastConfig({
                        type: "error",
                        message: "Payment cancelled",
                    });
                    setShowToast(true);
                },
            },

            prefill: {
                name: shipping.name,
                email: user.email,
                contact: shipping.phone,
            },
            theme: { color: "#3399cc" },
        };

        const rzp = new window.Razorpay(options);

        // ❌ Payment failure event
        rzp.on("payment.failed", async function () {
            await deleteOrder(orderId);

            setToastConfig({
                type: "error",
                message: "Payment failed",
            });
            setShowToast(true);
        });

        rzp.open();
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Checkout</h1>

            {/* Shipping Details */}
            <div className="bg-white border border-gray-300 rounded-lg p-4 mb-6">
                <h2 className="font-semibold mb-4">Shipping Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input name="name" placeholder="Full Name" value={shipping.name} onChange={handleChange} className="border border-gray-300 p-2 rounded" />
                    <input name="phone" placeholder="Phone Number" value={shipping.phone} onChange={handleChange} className="border border-gray-300 p-2 rounded" />
                    <input name="address" placeholder="Address" value={shipping.address} onChange={handleChange} className="border border-gray-300 p-2 rounded col-span-2" />
                    <input name="city" placeholder="City" value={shipping.city} onChange={handleChange} className="border border-gray-300 p-2 rounded" />
                    <input name="state" placeholder="State" value={shipping.state} onChange={handleChange} className="border border-gray-300 p-2 rounded" />
                    <input name="pincode" placeholder="Pincode" value={shipping.pincode} onChange={handleChange} className="border border-gray-300 p-2 rounded" />
                </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white border border-gray-300 rounded-lg p-4">
                <h2 className="font-semibold mb-4">Order Summary</h2>

                {cartItems.map((item) => (
                    <div key={item.bookId} className="flex justify-between mb-2">
                        <span>{item.book.name} × {item.quantity}</span>
                        <span>₹{item.book.price * item.quantity}</span>
                    </div>
                ))}
            </div>

            <button
                onClick={createOrder}
                disabled={loading}
                className="mt-6 w-full bg-blue-600 text-white px-6 py-3 rounded"
            >
                {loading ? "Processing..." : "Pay Now"}
            </button>
        </div>
    );
}

export default Checkout;
