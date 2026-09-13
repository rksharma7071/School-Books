import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import { BookContext } from "../context/School.jsx";

const ProtectedLogin = () => {
    const { user, loading } = useContext(BookContext);
    const token = localStorage.getItem("token");

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