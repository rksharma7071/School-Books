import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import api from "../utils/api.js";
import axios from "axios";

const ProtectedLogin = () => {
    const token = localStorage.getItem("token");

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const res = await axios.get(`${import.meta.env.VITE_API}/api/auth/me`);

                const currentUser =
                    res.data?.data ||
                    res.data?.user ||
                    res.data;

                setUser(currentUser);
            } catch (error) {
                console.error("Authentication Error:", error);
                localStorage.removeItem("userId");
                localStorage.removeItem("token");
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [token]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!token || !user) {
        return <Outlet />;
    }

    if (user.role === "admin") {
        return (
            <Navigate
                to={`/${import.meta.env.VITE_ADMIN}`}
                replace
            />
        );
    }

    return <Navigate to="/profile" replace />;
};

export default ProtectedLogin;