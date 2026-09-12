import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { BookContext } from "../../context/School.jsx";

function Login() {
    const { user, setUser, setToastConfig, setShowToast } = useContext(BookContext);

    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const loginAdmin = async () => {
        try {
            setLoading(true);
            setError("");

            const res = await axios.post(`${import.meta.env.VITE_API}/api/auth/login`, form);
            console.log("Login Response: ",res);
            
            const { token, user } = res.data;

            setUser(user);

            localStorage.setItem("token", token);
            localStorage.setItem("userId", user.id);
            setToastConfig({
                type: "success",
                message: "Welcome back! You have logged in successfully.",
            });
            setShowToast(true);
            if (user.role == "admin") {
                navigate(`/${import.meta.env.VITE_ADMIN}`, { replace: true });
            } else {
                navigate(`/`, { replace: true });
            }


        } catch (error) {
            setError(error.response?.data?.message || "Invalid email or password");
            setToastConfig({
                type: "error",
                message: error.response?.data?.message || "Update failed",
            });
            setShowToast(true);            
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        loginAdmin();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({ ...prev, [name]: value }));
    };
    useEffect(() => {
        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user"));

        if (token || user) {
            navigate("/")
        }
    }, [])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-800 via-blue-900 to-blue-950">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8">

                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-800">SchoolBook</h2>
                    <p className="text-gray-500 text-sm mt-1">Sign in to access the dashboard</p>
                </div>

                {error && (<div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">{error}</div>)}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            type="email"
                            required
                            placeholder="admin@example.com"
                            className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            type="password"
                            required
                            placeholder="••••••••"
                            className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2">
                            {/* <input type="checkbox" className="rounded border-gray-300" /> */}
                            {/* Remember me */}
                        </label>
                        <Link to="/reset-password" className="text-blue-600 hover:underline cursor-pointer">Reset password?</Link>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full text-white py-2 rounded-lg text-sm font-semibold transition 
                        ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
                    >{loading ? "Logging in..." : "Login"}</button>
                    <div className="text-center text-sm">
                        <span
                            onClick={() => navigate("/register")}
                            className="text-blue-600 hover:underline cursor-pointer"
                        >
                            New user? Register here
                        </span>
                    </div>
                </form>

                <p className="text-center text-sm text-gray-500 mt-6">© {new Date().getFullYear()} ZynexIT Solutions</p>
            </div>
        </div>
    );
}

export default Login;
