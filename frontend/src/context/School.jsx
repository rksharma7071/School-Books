import { createContext, useEffect, useState } from "react";
import { getBook } from "../data/book.js";
import { getCart, getCartById } from "../data/cart.js";
import axios from "axios";

export const BookContext = createContext("");

export const BookProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [books, setBooks] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [carts, setCarts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [update, setUpdate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastConfig, setToastConfig] = useState({ type: "success", title: "", message: "" });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser)
      setUser(JSON.parse(storedUser));
  }, []);

  const adminLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  useEffect(() => {

  }, [toastConfig, toastConfig])
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true)
        const items = await getCartById({ params: { id: user.id } });
        setCartItems(items);
      } catch (err) {
        console.error("Error: ", err.message);
      } finally {
        setLoading(false)
      }
    };

    fetchBooks();
  }, [user, update]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true)
        const bookData = await axios.get("/api/book");
        const cartData = await axios.get("/api/cart");
        const orderData = await axios.get("/api/order");
        const userData = await axios.get("/api/user");
        const discountData = await axios.get("/api/discount");
        const paymentData = await axios.get("/api/payment");
        const reviewData = await axios.get("/api/review");

        setBooks(bookData.data.data);
        setCarts(cartData.data)
        setOrders(orderData.data)
        setUsers(userData.data)
        setDiscounts(discountData.data)
        setPayments(paymentData.data)
        setReviews(reviewData.data)

        // console.log("Book Provider: ", { books, carts, orders, users, discounts, payments, reviews });
        // console.log("VITE_ADMIN:", import.meta.env.VITE_ADMIN);
        // console.log("VITE_API: ", import.meta.env.VITE_API);

      } catch (err) {
        console.error("Error: ", err.message);
      } finally {
        setLoading(false)
      }
    };

    fetchBooks();
  }, []);


  return (
    <BookContext.Provider value={{
      toastConfig, update, setUpdate, setToastConfig, showToast, setShowToast, user, setUser,
      adminLogout, carts, search, setSearch, books, cartItems, setCartItems, orders, users, discounts,
      payments, reviews, loading, setLoading
    }}>
      {children}
    </BookContext.Provider>
  );
};
