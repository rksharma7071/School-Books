import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookContext } from "../../../context/School.jsx"
import StatusMessage from "../../../components/frontend/StatusMessage.jsx";

function Register() {
    const navigate = useNavigate();
    const { showToast, toastConfig, setToastConfig, setShowToast } = useContext(BookContext);

    const [form, setForm] = useState({
        email: "",
        password: "",
        name: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const registerAdmin = async () => {
        try {
            setLoading(true);
            setError("");

            await axios.post(`${import.meta.env.VITE_API}/api/auth/signup`, form);
            setToastConfig({
                type: "success",
                message: "Verfication email sent! Please check your inbox to verify your account.",
            });
            setShowToast(true);
            navigate("/login", { replace: true });
        } catch (error) {
            setError(error.response?.data?.message || "Registration failed");
            setToastConfig({
                type: "error",
                message: error.response?.data?.messages || "Registration failed",
            });
            setShowToast(true);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        registerAdmin();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <>
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-800 via-blue-900 to-blue-950">
                <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8">

                    {/* Title */}
                    <div className="text-center mb-6">
                        <h2 className="text-3xl font-bold text-gray-800">SchoolBook</h2>
                        <p className="text-gray-500 text-sm mt-1">
                            Create your admin account
                        </p>
                    </div>

                    {/* ERROR MESSAGE */}
                    {error && (
                        <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <input
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                type="text"
                                required
                                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                type="email"
                                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                // placeholder="admin@example.com"
                                required
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
                                // placeholder="••••••••"
                                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        {/* Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full text-white py-2 rounded-lg text-sm font-semibold transition 
                        ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
                        >
                            {loading ? "Creating Account..." : "Register"}
                        </button>

                        <div className="text-center text-sm">
                            <span
                                onClick={() => navigate("/login")}
                                className="text-blue-600 hover:underline cursor-pointer"
                            >
                                Already have an account? Login
                            </span>
                        </div>
                    </form>

                    {/* Footer */}
                    <p className="text-center text-sm text-gray-500 mt-6">
                        © {new Date().getFullYear()} ZynexIT Solutions
                    </p>

                </div>
            </div>
            {showToast && (
                <StatusMessage
                    type={toastConfig.type}
                    title={toastConfig.title}
                    message={toastConfig.message}
                    onClose={() => setShowToast(false)}
                />
            )}
        </>
    );
}

export default Register;
