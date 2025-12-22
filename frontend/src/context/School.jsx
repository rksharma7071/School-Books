import { createContext, useEffect, useState } from "react";
import { getBook } from "../data/book";
import { getCartById } from "../data/cart";
import axios from "axios";

export const BookContext = createContext("");

export const BookProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [books, setBooks] = useState([]);
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const addToCart = async (cartItems) => {
    try {
      const payload = {
        userId: user.id,
        items: cartItems,
      };
      console.log("payload: ", payload);

      const res = await axios.post("/api/cart", payload);

      setCartItems(res.data.cart.items);

      return res.data;
    } catch (error) {
      console.error("Error Add to Cart:", error);
    }
  };

  useEffect(() => {
    if (!user || cartItems.length === 0) return;

    addToCart(cartItems);
  }, [cartItems]);


  const adminLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const data = await getBook();
        const cartItems = await getCartById({ params: { id: user.id } });

        setBooks(data.data);
        setCartItems(cartItems);
      } catch (err) {
        console.error("Error: ", err.message);
      }
    };

    fetchBooks();
  }, [user]);

  return (
    <BookContext.Provider value={{ user, setUser, adminLogout, search, setSearch, books, cartItems, setCartItems, addToCart }}>
      {children}
    </BookContext.Provider>
  );
};
