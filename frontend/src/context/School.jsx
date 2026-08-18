// frontend/src/context/School.jsx
import { createContext, useEffect, useState } from "react";
import { getMyCart } from "../data/cart.js";

export const BookContext = createContext(null);

const API = import.meta.env.VITE_API;

export const BookProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [cartItems, setCartItems] = useState([]);
    const [search, setSearch] = useState("");
    
    // ✅ Add this state
    const [update, setUpdate] = useState(false);

    const [showToast, setShowToast] = useState(false);
    const [toastConfig, setToastConfig] = useState({
        type: "success",
        title: "",
        message: "",
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch {
            localStorage.removeItem("user");
            localStorage.removeItem("token");
        }
    }, []);

    const adminLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setCartItems([]);
    };

    const fetchUserCart = async (userId) => {
        if (!userId) {
            setCartItems([]);
            return;
        }

        try {
            const cart = await getMyCart();
            setCartItems(cart?.items || []);
        } catch (error) {
            if (error.response?.status === 404) {
                setCartItems([]);
                return;
            }
            console.error("Failed to fetch cart:", error);
            setCartItems([]);
        }
    };

    useEffect(() => {
        if (!user?.id && !user?._id) {
            setCartItems([]);
            return;
        }
        const userId = user?.id || user?._id;
        fetchUserCart(userId);
    }, [user?.id, user?._id]);

    const refreshCart = async () => {
        const userId = user?.id || user?._id;
        if (!userId) return;
        await fetchUserCart(userId);
    };

    // ✅ Add update to context value
    return (
        <BookContext.Provider
            value={{
                user,
                setUser,
                cartItems,
                setCartItems,
                refreshCart,
                search,
                setSearch,
                update,          // ✅ Add this
                setUpdate,       // ✅ Add this
                adminLogout,
                loading,
                setLoading,
                toastConfig,
                setToastConfig,
                showToast,
                setShowToast,
            }}
        >
            {children}
        </BookContext.Provider>
    );
};