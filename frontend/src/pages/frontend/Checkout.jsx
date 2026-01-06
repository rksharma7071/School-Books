import axios from "axios";
import React, { useContext, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { BookContext } from "../../context/School.jsx";
import InputField from "../../components/UI/InputField.jsx";
import Button from "../../components/UI/Button.jsx";

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
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">Checkout</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT — Shipping Details */}
                <div className="lg:col-span-2 bg-white border border-gray-300 rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-6">Shipping Details</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField name="name" placeholder="Full Name" value={shipping.name} onChange={handleChange} />
                        <InputField name="phone" placeholder="Phone Number" value={shipping.phone} onChange={handleChange} />
                        <InputField name="address" placeholder="Address" value={shipping.address} onChange={handleChange} className="col-span-2" />
                        <InputField name="city" placeholder="City" value={shipping.city} onChange={handleChange} />
                        <InputField name="state" placeholder="State" value={shipping.state} onChange={handleChange} />
                        <InputField name="pincode" placeholder="Pincode" value={shipping.pincode} onChange={handleChange} />
                    </div>
                </div>

                {/* RIGHT — Order Summary */}
                <div className="bg-white border border-gray-300 rounded-xl p-6 h-fit sticky top-6">
                    <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

                    <div className="space-y-3">
                        {cartItems.map((item) => (
                            <div
                                key={item.bookId}
                                className="flex justify-between text-sm"
                            >
                                <span className="text-gray-700">
                                    {item.book.name} × {item.quantity}
                                </span>
                                <span className="font-medium">
                                    ₹{item.book.price * item.quantity}
                                </span>
                            </div>
                        ))}
                    </div>

                    <hr className="my-4 border-gray-300" />

                    {/* Total */}
                    <div className="flex justify-between font-semibold text-lg mb-6">
                        <span>Total</span>
                        <span>
                            ₹{cartItems.reduce(
                                (total, item) => total + item.book.price * item.quantity,
                                0
                            )}
                        </span>
                    </div>

                    {/* <button
                        onClick={createOrder}
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-60"
                    >{loading ? "Processing..." : "Pay Now"}</button> */}
                    <Button children={loading ? "Processing..." : "Pay Now"} variant={"secondary"} disabled={loading} onClick={createOrder} />
                    {/* <Button children={loading ? "Processing..." : "Pay Now"} variant={"primary"} disabled={loading} onClick={createOrder} /> */}
                </div>
            </div>
        </div >

    );
}

export default Checkout;
