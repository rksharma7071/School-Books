import axios from "axios";
import { useContext, useEffect, useMemo, useState } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import { BookContext } from "../../context/School.jsx";
import CartItem from "../../components/frontend/CartItem.jsx";

function FCart() {
    const {
        user,
        cartItems,
        setCartItems,
        setToastConfig,
        setShowToast,
        setUpdate,
    } = useContext(BookContext);
    const navigate = useNavigate();

    const loader = useLoaderData();

    // ---- Seed state from loader once ----
    useEffect(() => {
        const items = Array.isArray(loader?.items) ? loader.items : [];
        setCartItems(items);
    }, [loader, setCartItems]);

    // Always keep cartItems as an array
    const items = Array.isArray(cartItems) ? cartItems : [];
    const [busyItemId, setBusyItemId] = useState(null);

    // ---- Derived totals (prefer loader values when available) ----
    const { totalItems, totalAmount } = useMemo(() => {
        if (
            loader?.totalItems != null &&
            loader?.subtotal != null &&
            items === loader.items
        ) {
            return { totalItems: loader.totalItems, totalAmount: loader.subtotal };
        }

        return items.reduce(
            (acc, item) => {
                acc.totalItems += item.quantity;
                acc.totalAmount += item.lineTotal ?? 0;
                return acc;
            },
            { totalItems: 0, totalAmount: 0 }
        );
    }, [items, loader]);

    // ---- Helpers ----
    const authHeaders = () => ({
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    });

    const syncFromResponse = (data) => {
        if (Array.isArray(data?.data?.items)) {
            setCartItems(data.data.items);
        }
    };

    const getMaxQty = (item) =>
        item.product?.variant?.inventory_quantity ?? 0;

    const getUnitPrice = (item) =>
        item.product?.variant?.price ?? item.product?.price ?? 0;

    // ---- Set quantity to an absolute value ----
    const setQuantity = async (itemId, newQty) => {
        if (!user) return;

        const item = items.find((i) => i.itemId === itemId);
        if (!item) return;

        const max = getMaxQty(item);
        const clamped = Math.max(1, Math.min(newQty, max || 1));

        if (clamped === item.quantity) return;

        const prevItems = items;

        // optimistic
        setCartItems((prev) =>
            prev.map((i) =>
                i.itemId === itemId
                    ? {
                        ...i,
                        quantity: clamped,
                        lineTotal: getUnitPrice(i) * clamped,
                    }
                    : i
            )
        );

        setBusyItemId(itemId);

        try {
            const { data } = await axios.patch(
                `${import.meta.env.VITE_API}/api/cart/items/${itemId}`,
                { quantity: clamped },
                { headers: authHeaders() }
            );
            syncFromResponse(data);
        } catch (error) {
            console.error("Quantity update failed:", error);
            // rollback
            setCartItems(prevItems);
            setToastConfig({
                type: "error",
                title: "Update failed",
                message:
                    error.response?.data?.message ||
                    "Could not update quantity. Please try again.",
            });
            setShowToast(true);
        } finally {
            setBusyItemId(null);
        }
    };

    // ---- +/- buttons ----
    const updateQuantity = (itemId, delta) => {
        const item = items.find((i) => i.itemId === itemId);
        if (!item) return;

        const max = getMaxQty(item);
        const next = item.quantity + delta;

        if (delta === -1 && item.quantity === 1) return;
        if (delta === 1 && max && item.quantity >= max) return;

        setQuantity(itemId, next);
    };

    // ---- Typed input ----
    const updateQuantityByInput = (itemId, value) => {
        const parsed = Number(value);
        if (Number.isNaN(parsed)) return;
        setQuantity(itemId, parsed);
    };

    // ---- Remove ----
    const removeItemFromCart = async (itemId) => {
        if (!user) return;

        const item = items.find((i) => i.itemId === itemId);
        if (!item) return;

        const prevItems = items;

        setCartItems((prev) => prev.filter((i) => i.itemId !== itemId));
        setBusyItemId(itemId);

        try {
            const { data } = await axios.delete(
                `${import.meta.env.VITE_API}/api/cart/items/${itemId}`,
                { headers: authHeaders() }
            );
            syncFromResponse(data);
            setToastConfig({
                type: "info",
                title: "Removed from cart",
                message: "The product has been removed from your cart.",
            });
        } catch (error) {
            console.error("Remove item failed:", error);
            setCartItems(prevItems); // rollback
            setToastConfig({
                type: "error",
                title: "Action failed",
                message:
                    error.response?.data?.message ||
                    "Unable to remove the item. Please try again.",
            });
        } finally {
            setBusyItemId(null);
            setShowToast(true);
        }
    };

    const handleCheckout = () => {
        navigate("/checkout");
    };

    // Bump a context flag so other parts of the app re-read the cart
    useEffect(() => {
        setUpdate?.((prev) => !prev);
    }, [items.length, setUpdate]);

    if (items.length === 0) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <p className="text-gray-500 text-lg">🛒 Your cart is empty</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 py-10">
            <div className="max-w-6xl mx-auto px-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">My Cart</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        {items.map((item) => (
                            <CartItem
                                key={item.itemId}
                                item={item}
                                busy={busyItemId === item.itemId}
                                updateQuantityByInput={updateQuantityByInput}
                                updateQuantity={updateQuantity}
                                removeItemFromCart={removeItemFromCart}
                            />
                        ))}
                    </div>

                    <div className="bg-white rounded-xl border border-gray-300 shadow-sm p-5 h-fit">
                        <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

                        <div className="flex justify-between text-sm mb-2">
                            <span>Total Items</span>
                            <span>{totalItems}</span>
                        </div>

                        <div className="flex justify-between text-sm mb-4">
                            <span>Total Amount</span>
                            <span className="font-semibold">₹{totalAmount}</span>
                        </div>

                        <button
                            className="w-full bg-blue-900 hover:bg-blue-950 text-white py-2 rounded-lg font-medium transition"
                            onClick={handleCheckout}
                        >
                            Proceed to Checkout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FCart;