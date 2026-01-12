import React, { useContext, useState } from "react";
import axios from "axios";
import InputField from "../../components/UI/InputField";
import { BookContext } from "../../context/School";

function ResetPassword() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const { setToastConfig, setShowToast } = useContext(BookContext);

    const [form, setForm] = useState({
        email: "",
        otp: "",
        password: "",
        confirmPassword: "",
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const requestOTP = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await axios.post(
                `${import.meta.env.VITE_API}/api/auth/request-otp`,
                { email: form.email }
            );

            setToastConfig({
                type: "success",
                message: "OTP sent successfully to your email",
            });
            setShowToast(true);

            setStep(2);
        } catch (error) {
            setToastConfig({
                type: "error",
                message:
                    error.response?.data?.message ||
                    "Failed to send OTP. Please try again.",
            });
            setShowToast(true);
        } finally {
            setLoading(false);
        }
    };

    /* =====================
       STEP 2: VERIFY OTP
    ===================== */
    const verifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await axios.post(
                `${import.meta.env.VITE_API}/api/auth/verify-otp`,
                {
                    email: form.email,
                    otp: form.otp,
                }
            );

            setToastConfig({
                type: "success",
                message: "OTP verified successfully",
            });
            setShowToast(true);

            setStep(3);
        } catch (error) {
            setToastConfig({
                type: "error",
                message:
                    error.response?.data?.message ||
                    "Invalid or expired OTP",
            });
            setShowToast(true);
        } finally {
            setLoading(false);
        }
    };

    /* =====================
       STEP 3: RESET PASSWORD
    ===================== */
    const resetPassword = async (e) => {
        e.preventDefault();

        if (form.password !== form.confirmPassword) {
            setToastConfig({
                type: "error",
                message: "New password and confirm password do not match",
            });
            setShowToast(true);
            return;
        }

        setLoading(true);

        try {
            await axios.post(
                `${import.meta.env.VITE_API}/api/auth/reset-password`,
                {
                    email: form.email,
                    password: form.password,
                }
            );

            setToastConfig({
                type: "success",
                message: "Password reset successfully. Please login again.",
            });
            setShowToast(true);

            setTimeout(() => {
                window.location.href = "/login";
            }, 1500);
        } catch (error) {
            setToastConfig({
                type: "error",
                message:
                    error.response?.data?.message ||
                    "Failed to reset password. Please try again.",
            });
            setShowToast(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center bg-slate-100 p-20">
            <div className="bg-white w-full max-w-md p-6 rounded-xl shadow">

                <h2 className="text-xl font-semibold mb-6 text-center">
                    Reset Password
                </h2>

                {/* STEP 1: EMAIL */}
                {step === 1 && (
                    <form onSubmit={requestOTP} className="space-y-4">
                        <InputField
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                            value={form.email}
                            onChange={handleChange}
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-2.5 rounded-md font-medium hover:bg-blue-700 transition disabled:opacity-60"
                        >
                            {loading ? "Sending OTP..." : "Send OTP"}
                        </button>
                    </form>
                )}

                {/* STEP 2: OTP */}
                {step === 2 && (
                    <form onSubmit={verifyOTP} className="space-y-4">
                        <InputField
                            name="otp"
                            placeholder="Enter OTP"
                            value={form.otp}
                            onChange={handleChange}
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-2.5 rounded-md font-medium hover:bg-blue-700 transition disabled:opacity-60"
                        >
                            {loading ? "Verifying..." : "Verify OTP"}
                        </button>
                    </form>
                )}

                {/* STEP 3: NEW PASSWORD */}
                {step === 3 && (
                    <form onSubmit={resetPassword} className="space-y-4">
                        <InputField
                            type="password"
                            name="password"
                            placeholder="New Password"
                            value={form.password}
                            onChange={handleChange}
                        />

                        <InputField
                            type="password"
                            name="confirmPassword"
                            placeholder="Confirm New Password"
                            value={form.confirmPassword}
                            onChange={handleChange}
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-2.5 rounded-md font-medium hover:bg-blue-700 transition disabled:opacity-60"
                        >
                            {loading ? "Updating..." : "Reset Password"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default ResetPassword;
