import axios from "axios";
import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookContext } from "../../context/School.jsx";
import CartItem from "../../components/frontend/CartItem.jsx";
import { getCartById } from "../../data/cart.js";

function FCart() {
    const { user, cartItems, setCartItems, setToastConfig, setShowToast, update, setUpdate, loading, setLoading } = useContext(BookContext);
    const navigate = useNavigate();

    const { totalItems, totalAmount } = useMemo(() => {
        return cartItems.reduce(
            (acc, item) => {
                acc.totalItems += item.quantity;
                acc.totalAmount += item.quantity * item.book?.price;
                return acc;
            },
            { totalItems: 0, totalAmount: 0 }
        );
    }, [cartItems]);

    const updateQuantity = async (bookId, delta) => {
        if (!user) return;
        const item = cartItems.find((i) => i.bookId === bookId);
        if (!item) return;

        if (delta === -1 && item.quantity === 1) return;

        if (delta === 1 && item.quantity >= item.book.stockQty) return;
        setCartItems((prev) =>
            prev.map((i) =>
                i.bookId === bookId ? { ...i, quantity: i.quantity + delta } : i
            )
        );
        try {
            await axios.post(`${import.meta.env.VITE_API}/api/cart`, {
                userId: user.id,
                bookId,
                quantity: delta,
            });
        } catch (error) {
            console.error("Quantity update failed:", error);
        }
    };

    const updateQuantityByInput = async (bookId, value) => {
        if (!user) return;

        const item = cartItems.find((i) => i.bookId === bookId);
        if (!item) return;

        let newQty = Number(value);

        if (isNaN(newQty)) return;

        newQty = Math.max(1, Math.min(newQty, item.book.stockQty));

        const delta = newQty - item.quantity;

        if (delta === 0) return;

        setCartItems((prev) =>
            prev.map((i) =>
                i.bookId === bookId ? { ...i, quantity: newQty } : i
            )
        );

        try {
            await axios.post(`${import.meta.env.VITE_API}/api/cart`, {
                userId: user.id,
                bookId,
                quantity: delta,
            });
        } catch (error) {
            console.error("Quantity input update failed:", error);
        }
    };

    const removeItemFromCart = async (bookId) => {
        if (!user) return;

        const item = cartItems.find(i => i.bookId === bookId);
        if (!item) return;

        setCartItems(prev =>
            prev.filter(i => i.bookId !== bookId)
        );

        try {
            await axios.post(`${import.meta.env.VITE_API}/api/cart`, {
                userId: user.id,
                bookId,
                quantity: -item.quantity,
            });
            setToastConfig({
                type: "info",
                title: "Removed from cart",
                message: "The product has been removed from your cart.",
            });
        } catch (error) {
            console.error("Remove item failed:", error);
            setToastConfig({
                type: "error",
                title: "Action failed",
                message: "Unable to remove the item. Please try again.",
            });
        } finally {
            setShowToast(true);
        }
    };

    useEffect(() => {
        setUpdate(prev => !prev);
    }, []);

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                setLoading(true)
                const items = await getCartById({ params: { id: user.id || user._id } });
                setCartItems(items);
            } catch (err) {
                console.error("Error: ", err.message);
            } finally {
                setLoading(false)
            }
        };

        fetchBooks();
    }, [user, update]);

    const handleCheckout = () => {
        navigate('/checkout')
    }

    if (cartItems.length === 0) {
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
                        {cartItems.map((item) => (
                            <CartItem key={String(item.bookId)} item={item} updateQuantityByInput={updateQuantityByInput} updateQuantity={updateQuantity} removeItemFromCart={removeItemFromCart} />
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

                        <button className="w-full bg-blue-900 hover:bg-blue-950 text-white py-2 rounded-lg font-medium transition" onClick={handleCheckout}>Proceed to Checkout</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FCart;
