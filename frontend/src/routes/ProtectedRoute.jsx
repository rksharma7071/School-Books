import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import axios from "axios";

const ProtectedRoute = () => {
    const token = localStorage.getItem("token");

    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_API}/api/auth/me`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const user = res.data?.data || res.data?.user || res.data;

                if (user?.role === "admin") {
                    setIsAdmin(true);
                } else {
                    localStorage.removeItem("token");
                }
            } catch (error) {
                console.log("Authentication Error:", error);
                localStorage.removeItem("token");
            } finally {
                setLoading(false);
            }
        };

        verifyToken();
    }, [token]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!token || !isAdmin) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;