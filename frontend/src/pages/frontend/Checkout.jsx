import axios from "axios";
import React, { useContext, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BookContext } from "../../context/School.jsx";
import InputField from "../../components/UI/InputField.jsx";
import Button from "../../components/UI/Button.jsx";

function Checkout() {
    const { user, cartItems, setCartItems, setToastConfig, setShowToast } = useContext(BookContext);

    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [shipping, setShipping] = useState({
        name: user?.name || "",
        phone: user?.phone || "",
        address: "",
        city: "",
        state: "",
        pincode: "",
    });

    const [coupon, setCoupon] = useState("");
    const [discountAmount, setDiscountAmount] = useState(0);
    const [discountLoading, setDiscountLoading] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState(null);

    const handleChange = (e) => {
        setShipping({ ...shipping, [e.target.name]: e.target.value });
    };

    const validateShipping = () => shipping.name && shipping.phone && shipping.address && shipping.city && shipping.state && shipping.pincode;

    const clearCart = async () => {
        await axios.delete(`${import.meta.env.VITE_API}/api/cart/clear/${user.id}`);
        setCartItems([]);
    };

    const deleteOrder = async (orderId) => {
        await axios.delete(`${import.meta.env.VITE_API}/api/order/${orderId}`);
    };

    const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.book.price * item.quantity, 0),
        [cartItems]
    );

    const shippingCharge = 50;
    const tax = 0;

    const total = subtotal + shippingCharge + tax - discountAmount;

    const applyCoupon = async () => {
        if (!coupon) return;

        setDiscountLoading(true);
        try {
            // console.log("data: ",{ code: coupon, amount: subtotal });
            const { data } = await axios.post(`${import.meta.env.VITE_API}/api/discount/apply`,{ code: coupon, amount: subtotal });
            
            setDiscountAmount(data.discountAmount);
            setAppliedCoupon(coupon);

            setToastConfig({
                type: "success",
                message: `Coupon applied! You saved ₹${data.discountAmount}`,
            });
            setShowToast(true);
        } catch (error) {
            setDiscountAmount(0);
            setAppliedCoupon(null);

            setToastConfig({
                type: "error",
                message:
                    error.response?.data?.message || "Invalid coupon code",
            });
            setShowToast(true);
        } finally {
            setDiscountLoading(false);
        }
    };

    const createOrder = async () => {
        if (!validateShipping()) {
            setToastConfig({ type: "error", message: "Please fill all shipping details" });
            setShowToast(true);
            return;
        }

        setLoading(true);

        try {
            const orderRes = await axios.post(`${import.meta.env.VITE_API}/api/order`,
                {
                    userId: user.id,
                    items: cartItems.map((item) => ({
                        bookId: item.bookId,
                        quantity: item.quantity,
                    })),
                    shipping: shippingCharge,
                    tax,
                    discount: discountAmount,
                    coupon: appliedCoupon,
                    shipping_address: `${shipping.name}%20${shipping.phone}%20${shipping.address}%20${shipping.city}%20${shipping.state}%20${shipping.pincode}`,
                    billing_address: `${shipping.name}%20${shipping.phone}%20${shipping.address}%20${shipping.city}%20${shipping.state}%20${shipping.pincode}`,
                }
            );

            const order = orderRes.data;

            const razorpayRes = await axios.post(
                `${import.meta.env.VITE_API}/api/razorpay/create-order`,
                { orderId: order._id }
            );

            openRazorpay(razorpayRes.data.razorpayOrder, order._id);
        } catch (error) {
            setToastConfig({ type: "error", message: "Checkout failed" });
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
            order_id: razorpayOrder.id,

            handler: async function (response) {
                try {
                    await axios.post(
                        `${import.meta.env.VITE_API}/api/razorpay/verify-payment`,
                        {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            orderId,
                        }
                    );

                    await clearCart();
                    setToastConfig({
                        type: "success",
                        message: "Payment successful!",
                    });
                    setShowToast(true);
                    navigate("/");
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
                ondismiss: async () => {
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

        new window.Razorpay(options).open();
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">Checkout</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

                <div className="bg-white border border-gray-300 rounded-xl p-6 sticky top-6 h-fit">
                    <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

                    {cartItems.map((item) => (
                        <div key={item.bookId} className="flex justify-between text-sm">
                            <span>{item.book.name} × {item.quantity}</span>
                            <span>₹{item.book.price * item.quantity}</span>
                        </div>
                    ))}

                    <div className="mt-4">
                        <label className="text-sm font-medium">Discount Code</label>
                        <div className="flex gap-2 mt-2">
                            <input
                                value={coupon}
                                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                                disabled={appliedCoupon}
                                placeholder="Enter coupon"
                                className="w-full rounded-md border border-gray-300 bg-gray-50 text-sm px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-3 focus:ring-blue-500/20 transition-all"
                            />
                            <button
                                onClick={applyCoupon}
                                disabled={discountLoading || appliedCoupon}
                                className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 bg-gradient-to-r from-blue-900 to-blue-950 text-white shadow-md hover:from-blue-950 hover:to-blue-900 hover:shadow-md"
                            >
                                {discountLoading ? "Applying..." : "Apply"}
                            </button>
                            {/* <Button children={discountLoading ? "Applying..." : "Apply"} variant={"primary"} disabled={discountLoading || appliedCoupon} onClick={applyCoupon} className='' /> */}
                        </div>
                    </div>

                    <hr className="my-4 border-gray-300" />

                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal}</span></div>
                        <div className="flex justify-between"><span>Shipping</span><span>₹{shippingCharge}</span></div>
                        {discountAmount > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>Discount</span><span>-₹{discountAmount}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between font-semibold text-lg mt-4">
                        <span>Total</span><span>₹{total}</span>
                    </div>

                    <Button
                        children={loading ? "Processing..." : "Pay Now"}
                        variant="secondary"
                        disabled={loading}
                        onClick={createOrder}
                    />
                </div>
            </div>
        </div>
    );
}

export default Checkout;
