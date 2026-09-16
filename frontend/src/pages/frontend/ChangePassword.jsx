import React, { useContext, useState } from 'react'
import { FiLock } from 'react-icons/fi'
import PasswordField from '../../components/UI/PasswordField'
import { BookContext } from '../../context/School';
import axios from 'axios';
import Button from '../../components/UI/Button';

function ChangePassword() {
    const { user, cartItems, setCartItems, setToastConfig, setShowToast } = useContext(BookContext);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    })

    const [show, setShow] = useState({
        old: false,
        new: false,
        confirm: false,
    })

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        if (form.newPassword !== form.confirmPassword) {
            setToastConfig({ type: "error", message: "New password and confirm password do not match" });
            setShowToast(true);
            setLoading(false);
            return;
        }

        try {
            const res = await axios.post(
                `${import.meta.env.VITE_API}/api/auth/change-password`,
                {
                    email: user.email,
                    oldPassword: form.oldPassword,
                    newPassword: form.newPassword,
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    }
                }
            );

            setToastConfig({
                type: "success",
                message: res.data?.message || "Password updated successfully",
            });
            setShowToast(true);
            setLoading(false);

            setForm({
                oldPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        } catch (error) {
            setToastConfig({
                type: "error",
                message: error.response?.data?.message || "Failed to change password. Please try again.",
            });
            setShowToast(true);
        }
    };

    return (
        <div className="max-w-md mx-auto">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <FiLock />
                Change Password
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">

                <PasswordField
                    label="Current Password"
                    name="oldPassword"
                    value={form.oldPassword}
                    onChange={handleChange}
                    show={show.old}
                    toggle={() => setShow({ ...show, old: !show.old })}
                />

                <PasswordField
                    label="New Password"
                    name="newPassword"
                    value={form.newPassword}
                    onChange={handleChange}
                    show={show.new}
                    toggle={() => setShow({ ...show, new: !show.new })}
                />

                <PasswordField
                    label="Confirm New Password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    show={show.confirm}
                    toggle={() => setShow({ ...show, confirm: !show.confirm })}
                />

                {/* <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
                >
                    Update Password
                </button> */}
                <Button type={"submit"} children={loading ? "updating..." : "Update Password"} variant={"primary"} disabled={loading} className='' />
            </form>

            <p className="text-xs text-gray-500 mt-4">
                Password must be at least 8 characters long and contain a mix of letters and numbers.
            </p>
        </div>
    )
}

export default ChangePassword
