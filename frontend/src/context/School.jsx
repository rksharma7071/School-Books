import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { getCartById } from "../data/cart.js";

export const BookContext = createContext(null);

const API = import.meta.env.VITE_API;

export const BookProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [books, setBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [address, setAddress] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [update, setUpdate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastConfig, setToastConfig] = useState({
    type: "success",
    title: "",
    message: "",
  });

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    axios
      .get(`${API}/api/book`, { signal: controller.signal })
      .then(({ data }) => setBooks(data.data || []))
      .catch((e) => {
        if (!axios.isCancel(e)) console.error("Books fetch failed:", e.message);
      })
      .finally(() => setBooksLoading(false));

    return () => controller.abort();
  }, []);

  const userId = user?.id || user?._id || null;

  useEffect(() => {
    if (!userId) {
      setCartItems([]);
      return;
    }

    let active = true;

    getCartById({ params: { id: userId } })
      .then((cart) => {
        if (active) setCartItems(cart?.items || []);
      })
      .catch(() => {
        if (active) setCartItems([]);
      });

    return () => {
      active = false;
    };
  }, [userId, update]);

  useEffect(() => {
    if (!userId) {
      setAddress(null);
      return;
    }

    const controller = new AbortController();

    axios
      .get(`${API}/api/address/user/${userId}`, { signal: controller.signal })
      .then(({ data }) =>
        setAddress(data.addresses?.find((a) => a.isDefault) || null)
      )
      .catch(() => setAddress(null));

    return () => controller.abort();
  }, [userId, update]);

  const adminLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setCartItems([]);
    setAddress(null);
  }, []);

  const value = useMemo(
    () => ({ user, setUser, adminLogout,  books, setBooks, booksLoading, cartItems, setCartItems, address, setAddress, loading, setLoading, update, setUpdate, toastConfig, setToastConfig, showToast, setShowToast, }),
    [ user, adminLogout, books, booksLoading, cartItems, address, loading, update, toastConfig, showToast ]
  );

  return <BookContext.Provider value={value}>{children}</BookContext.Provider>;
};