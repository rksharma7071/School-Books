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
    if (!user) return;

    const fetchCart = async () => {
      try {
        setLoading(true);
        const cart = await getCartById({
          params: { id: user.id || user._id }
        });
        
        setCartItems(cart?.items || []);
      } catch (error) {
        console.error("Error fetching cart:", error);
        setCartItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [user, update]);



  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true)
        const bookData = await axios.get(`${import.meta.env.VITE_API}/api/book`);
        const cartData = await axios.get(`${import.meta.env.VITE_API}/api/cart`);
        const orderData = await axios.get(`${import.meta.env.VITE_API}/api/order`);
        const userData = await axios.get(`${import.meta.env.VITE_API}/api/user`);
        const discountData = await axios.get(`${import.meta.env.VITE_API}/api/discount`);
        const paymentData = await axios.get(`${import.meta.env.VITE_API}/api/payment`);
        const reviewData = await axios.get(`${import.meta.env.VITE_API}/api/review`);

        setBooks(bookData.data.data);
        setCarts(cartData.data)
        setOrders(orderData.data)
        setUsers(userData.data)
        setDiscounts(discountData.data)
        setPayments(paymentData.data)
        setReviews(reviewData.data)
      } catch (error) {
        console.error("Error: ", error.message);
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
