import { createContext, useEffect, useState } from "react";

export const BookContext = createContext("");

export const BookProvider = ({ children }) => {
  const name = "Retesh Kumar Sharma";

  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const adminLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    // window.location.href = "/login";
  };

  return (
    <BookContext.Provider value={{ name, user, setUser, adminLogout }}>
      {children}
    </BookContext.Provider>
  );
};
