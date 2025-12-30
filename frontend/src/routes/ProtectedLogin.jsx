import { Navigate, Outlet } from "react-router-dom";

const ProtectedLogin = () => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    if (token || user) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedLogin;
