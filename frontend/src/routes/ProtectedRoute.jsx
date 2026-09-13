import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { BookContext } from "../context/School.jsx";

const ProtectedRoute = () => {
    const { user, loading } = useContext(BookContext);
    const token = localStorage.getItem("token");

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!token || user?.role !== "admin") {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;