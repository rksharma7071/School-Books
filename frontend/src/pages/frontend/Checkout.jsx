import axios from "axios";
import React, { useContext, useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookContext } from "../../context/School.jsx";
import InputField from "../../components/UI/InputField.jsx";
import Button from "../../components/UI/Button.jsx";
import {
    createRazorpayOrder,
    verifyRazorpayPayment,
} from "../../data/razorpay.js";

function Checkout() {
    const { user, cartItems, setCartItems, setToastConfig, setShowToast } = useContext(BookContext);

    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [razorpayReady, setRazorpayReady] = useState(false);

    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);

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

    const authHeaders = () => ({
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    });

    useEffect(() => {
        if (window.Razorpay) {
            setRazorpayReady(true);
            return;
        }
        const existing = document.querySelector(
            'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
        );
        if (existing) {
            existing.addEventListener("load", () => setRazorpayReady(true));
            return;
        }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => setRazorpayReady(true);
        script.onerror = () => {
            console.error("Razorpay SDK failed to load");
            setRazorpayReady(false);
        };
        document.body.appendChild(script);
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { data } = await axios.get(
                    `${import.meta.env.VITE_API}/api/address/my?limit=100`,
                    { headers: authHeaders() }
                );
                const list = Array.isArray(data?.data) ? data.data : [];
                if (cancelled) return;
                setSavedAddresses(list);

                const def = list.find((a) => a.isDefault) || list[0];
                if (def) {
                    applyAddress(def);
                }
            } catch (error) {
                if (!cancelled)
                    console.error("Failed to load addresses:", error);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!cartItems || cartItems.length === 0) {
            const t = setTimeout(() => {
                if (!cartItems || cartItems.length === 0) navigate("/cart");
            }, 50);
            return () => clearTimeout(t);
        }
    }, [cartItems, navigate]);

    const applyAddress = (addr) => {
        setShipping({
            name: addr.fullName || "",
            phone: addr.phone || "",
            address: addr.address || "",
            city: addr.city || "",
            state: addr.state || "",
            pincode: addr.pincode || "",
        });
        setSelectedAddressId(addr._id || addr.id || null);
    };

    const handleChange = (e) => {
        setSelectedAddressId(null);
        setShipping((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const validateShipping = () => {
        const { name, phone, address, city, state, pincode } = shipping;
        if (!name || !phone || !address || !city || !state || !pincode)
            return false;
        if (!/^\d{6}$/.test(pincode)) return false;
        return true;
    };

    const unitPriceOf = (item) => item?.product?.variant?.price ?? item?.product?.price ?? 0;

    const subtotal = useMemo(() => {
        return (cartItems || []).reduce((sum, item) => {
            const line = item.lineTotal ?? unitPriceOf(item) * item.quantity;
            return sum + (Number.isFinite(line) ? line : 0);
        }, 0);
    }, [cartItems]);

    const shippingCharge = subtotal > 0 ? 50 : 0;
    const tax = 0;
    const total = Math.max(0, subtotal + shippingCharge + tax - discountAmount);

    const applyCoupon = async () => {
        if (!coupon) return;
        setDiscountLoading(true);
        try {
            const { data } = await axios.post(
                `${import.meta.env.VITE_API}/api/discount/apply`,
                { code: coupon, amount: subtotal },
                { headers: authHeaders() }
            );
            const amount = data?.discountAmount ?? data?.data?.discountAmount ?? 0;
            setDiscountAmount(amount);
            setAppliedCoupon(coupon);
            setToastConfig({ type: "success", message: `Coupon applied! You saved ₹${amount}` });
            setShowToast(true);
        } catch (error) {
            setDiscountAmount(0);
            setAppliedCoupon(null);
            setToastConfig({ type: "error", message: error.response?.data?.message || "Invalid coupon code" });
            setShowToast(true);
        } finally {
            setDiscountLoading(false);
        }
    };

    const ensureAddressId = async () => {
        if (selectedAddressId) return selectedAddressId;

        const { data } = await axios.post(
            `${import.meta.env.VITE_API}/api/address`,
            {
                fullName: shipping.name,
                phone: shipping.phone,
                address: shipping.address,
                city: shipping.city,
                state: shipping.state,
                pincode: shipping.pincode,
                country: "India",
                type: "home",
                isDefault: savedAddresses.length === 0,
            },
            { headers: authHeaders() }
        );

        const newId = data?.data?._id ?? data?._id;
        if (!newId) throw new Error("Failed to save shipping address");
        return newId;
    };

    // ---------- Create order ----------
    const createOrder = async () => {
        if (!validateShipping()) {
            setToastConfig({ type: "error", message: "Please fill all shipping details (pincode must be 6 digits)" });
            setShowToast(true);
            return;
        }
        if (!razorpayReady) {
            setToastConfig({ type: "error", message: "Payment gateway is still loading. Please try again." });
            setShowToast(true);
            return;
        }

        setLoading(true);

        try {
            const shippingAddressId = await ensureAddressId();

            const payload = {
                shippingAddressId,
                billingSameAsShipping: true,
                coupon: appliedCoupon || undefined,
            };

            const orderRes = await axios.post(
                `${import.meta.env.VITE_API}/api/order`,
                payload,
                { headers: authHeaders() }
            );

            const order = orderRes.data?.data ?? orderRes.data?.order ?? orderRes.data;

            if (!order?._id) {
                throw new Error("Order creation did not return an order id");
            }

            const rpRes = await createRazorpayOrder(order._id);
            const razorpayOrder = rpRes?.razorpayOrder ?? rpRes?.data ?? rpRes;

            if (!razorpayOrder?.id) {
                throw new Error("Razorpay order was not created");
            }

            openRazorpay(razorpayOrder, order._id);
        } catch (error) {
            console.error("Order creation error:", error);
            setToastConfig({ type: "error", message: error.response?.data?.message || error.message || "Checkout failed" });
            setShowToast(true);
        } finally {
            setLoading(false);
        }
    };

    // ---------- Razorpay modal ----------
    const openRazorpay = (razorpayOrder, orderId) => {
        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency || "INR",
            name: "School Book",
            description: "Order Payment",
            order_id: razorpayOrder.id,

            handler: async function (response) {
                try {
                    await verifyRazorpayPayment({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        orderId,
                    });

                    setCartItems([]);
                    setToastConfig({ type: "success", message: "Payment successful!" });
                    setShowToast(true);
                    navigate("/profile/orders");
                } catch (error) {
                    console.error("Payment verification failed:", error);
                    setToastConfig({ type: "error", message: error.response?.data?.message || "Payment verification failed" });
                    setShowToast(true);
                }
            },

            modal: {
                ondismiss: async () => {
                    try {
                        await axios.post(
                            `${import.meta.env.VITE_API}/api/order/${orderId}/cancel`,
                            { reason: "Payment cancelled by user" },
                            { headers: authHeaders() }
                        );
                    } catch (err) {
                        console.error("Failed to cancel order:", err);
                    }
                    setToastConfig({ type: "error", message: "Payment cancelled" });
                    setShowToast(true);
                },
            },

            prefill: {
                name: shipping.name,
                email: user?.email || "",
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
                {/* Shipping */}
                <div className="lg:col-span-2 bg-white border border-gray-300 rounded-xl p-6 space-y-6">
                    {/* Saved addresses */}
                    {savedAddresses.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold mb-3 text-gray-700">Saved Addresses</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {savedAddresses.map((a) => {
                                    const id = a._id || a.id;
                                    const selected = selectedAddressId === id;
                                    return (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => applyAddress(a)}
                                            className={`text-left p-4 rounded-lg border transition ${selected
                                                ? "border-blue-600 bg-blue-50 ring-2 ring-blue-500/20"
                                                : "border-gray-200 hover:border-gray-300"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold text-sm text-gray-900">{a.fullName}</p>
                                                {a.isDefault && (
                                                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">Default</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-600 mt-1">{a.phone}</p>
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.address}, {a.city}, {a.state} -{" "}{a.pincode}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div>
                        <h2 className="text-lg font-semibold mb-4">
                            {savedAddresses.length > 0 ? "Or enter a new address" : "Shipping Details"}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField name="name" placeholder="Full Name" value={shipping.name} onChange={handleChange} />
                            <InputField name="phone" placeholder="Phone Number" value={shipping.phone} onChange={handleChange} />
                            <InputField name="address" placeholder="Address" value={shipping.address} onChange={handleChange} className="col-span-2" />
                            <InputField name="city" placeholder="City" value={shipping.city} onChange={handleChange} />
                            <InputField name="state" placeholder="State" value={shipping.state} onChange={handleChange} />
                            <InputField name="pincode" placeholder="Pincode (6 digits)" value={shipping.pincode} onChange={handleChange} />
                        </div>
                    </div>
                </div>

                {/* Summary */}
                <div className="bg-white border border-gray-300 rounded-xl p-6 sticky top-6 h-fit">
                    <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

                    {(cartItems || []).map((item) => {
                        const name = item?.product?.name ?? "Product";
                        const unitPrice = unitPriceOf(item);
                        const lineTotal = item.lineTotal ?? unitPrice * item.quantity;
                        const options = item?.product?.variant?.options ? Object.values(item.product.variant.options).join(" / ") : "";

                        return (
                            <div key={item.itemId || item.variantId} className="flex justify-between text-sm py-1.5 border-b border-gray-100 last:border-0">
                                <div className="min-w-0 pr-2">
                                    <p className="truncate font-medium text-gray-800">{name}</p>
                                    {options && (
                                        <p className="text-xs text-gray-500 truncate">{options}</p>
                                    )}
                                    <p className="text-xs text-gray-400">Qty: {item.quantity} × ₹{unitPrice}</p>
                                </div>
                                <span className="whitespace-nowrap font-medium text-gray-900">₹{lineTotal}</span>
                            </div>
                        );
                    })}

                    <div className="mt-4">
                        <label className="text-sm font-medium">Discount Code</label>
                        <div className="flex gap-2 mt-2">
                            <input
                                value={coupon}
                                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                                disabled={!!appliedCoupon}
                                placeholder="Enter coupon"
                                className="w-full rounded-md border border-gray-300 bg-gray-50 text-sm px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-3 focus:ring-blue-500/20 transition-all"
                            />
                            <button
                                onClick={applyCoupon}
                                disabled={discountLoading || !!appliedCoupon}
                                className="px-4 py-2 rounded-lg text-sm transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 bg-gradient-to-r from-blue-900 to-blue-950 text-white shadow-md hover:from-blue-950 hover:to-blue-900"
                            >
                                {discountLoading
                                    ? "Applying..."
                                    : appliedCoupon ? "Applied" : "Apply"}
                            </button>
                        </div>
                    </div>

                    <hr className="my-4 border-gray-300" />

                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Shipping</span>
                            <span>₹{shippingCharge}</span>
                        </div>
                        {discountAmount > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>Discount</span>
                                <span>-₹{discountAmount}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between font-semibold text-lg mt-4">
                        <span>Total</span>
                        <span>₹{total.toFixed(2)}</span>
                    </div>

                    <Button
                        variant="secondary"
                        disabled={loading || !razorpayReady}
                        onClick={createOrder}
                    >
                        {loading
                            ? "Processing..."
                            : !razorpayReady ? "Loading payment..." : "Pay Now"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default Checkout;