import { createContext, useEffect, useState } from "react";
import { getMyCart } from "../data/cart.js";
import api from "../utils/api.js";

const BookContext = createContext(null);

const BookProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [cartItems, setCartItems] = useState([]);
    const [search, setSearch] = useState("");
    const [update, setUpdate] = useState(false);

    const [showToast, setShowToast] = useState(false);
    const [toastConfig, setToastConfig] = useState({
        type: "success",
        title: "",
        message: "",
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getUserData = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                setUser(null);
                setLoading(false);
                return;
            }

            try {
                const res = await api.get("/api/auth/me");

                const currentUser =
                    res.data?.user ||
                    res.data?.data ||
                    res.data;

                // console.log("School Book:", currentUser);

                if (currentUser) {
                    setUser(currentUser);
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error("Authentication Error:", error);
                if (error.response?.status === 401) {
                    localStorage.removeItem("token");
                }

                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        getUserData();
    }, []);

    const adminLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
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

    // console.log("School User: ", user);
    

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

                update,
                setUpdate,

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

export {
    BookContext,
    BookProvider,
};