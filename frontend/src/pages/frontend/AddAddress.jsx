import React, { useContext, useState } from "react";
import axios from "axios";
import InputField from "../../components/UI/InputField";
import { BookContext } from "../../context/School";
import { useNavigate } from "react-router-dom";

function AddAddress() {
    const navigate = useNavigate();
    const { user, setToastConfig, setShowToast } = useContext(BookContext);

    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        fullName: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
        isDefault: false,
    });

    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};

        if (!form.fullName.trim()) newErrors.fullName = "Full name is required";
        if (!form.phone.trim()) newErrors.phone = "Phone number is required";
        if (!form.address.trim()) newErrors.address = "Address is required";
        if (!form.city.trim()) newErrors.city = "City is required";
        if (!form.state.trim()) newErrors.state = "State is required";
        if (!form.pincode.trim()) newErrors.pincode = "Pincode is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setForm({
            ...form,
            [name]: type === "checkbox" ? checked : value,
        });

        // Clear field error while typing
        if (errors[name]) {
            setErrors({ ...errors, [name]: "" });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);

        try {
            // ✅ userId is NOT sent - it will be taken from req.user.id on the server
            await axios.post(
                `${import.meta.env.VITE_API}/api/address`,
                form, // ✅ No userId in the request body
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            setToastConfig({
                type: "success",
                message: "Address added successfully",
            });
            setShowToast(true);

            navigate("/profile/address");
        } catch (error) {
            setToastConfig({
                type: "error",
                message:
                    error.response?.data?.message ||
                    "Failed to add address",
            });
            setShowToast(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h3 className="text-xl font-semibold mb-6">Add New Address</h3>

            <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
                <Field error={errors.fullName}>
                    <InputField
                        name="fullName"
                        placeholder="Full Name"
                        value={form.fullName}
                        onChange={handleChange}
                    />
                </Field>

                <Field error={errors.phone}>
                    <InputField
                        name="phone"
                        placeholder="Phone Number"
                        value={form.phone}
                        onChange={handleChange}
                    />
                </Field>

                <Field error={errors.address} className="sm:col-span-2">
                    <InputField
                        name="address"
                        placeholder="Street Address"
                        value={form.address}
                        onChange={handleChange}
                        textarea
                        rows={3}
                        className="sm:col-span-2"
                    />
                </Field>

                <Field error={errors.city}>
                    <InputField
                        name="city"
                        placeholder="City"
                        value={form.city}
                        onChange={handleChange}
                    />
                </Field>

                <Field error={errors.state}>
                    <InputField
                        name="state"
                        placeholder="State"
                        value={form.state}
                        onChange={handleChange}
                    />
                </Field>

                <Field error={errors.pincode}>
                    <InputField
                        name="pincode"
                        placeholder="Pincode"
                        value={form.pincode}
                        onChange={handleChange}
                    />
                </Field>

                <InputField
                    name="country"
                    value={form.country}
                    disabled
                />

                <div className="sm:col-span-2 flex items-center gap-2 mt-2">
                    <input
                        type="checkbox"
                        name="isDefault"
                        checked={form.isDefault}
                        onChange={handleChange}
                        className="h-4 w-4"
                    />
                    <label className="text-sm text-gray-700">
                        Set as default address
                    </label>
                </div>

                <div className="sm:col-span-2 flex gap-4 mt-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition disabled:opacity-60"
                    >
                        {loading ? "Saving..." : "Save Address"}
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/profile/address")}
                        className="px-6 py-2 rounded-md border border-gray-300 hover:bg-gray-100"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}

function Field({ children, error, className = "" }) {
    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            {children}
            {error && (
                <span className="text-xs text-red-500">{error}</span>
            )}
        </div>
    );
}

export default AddAddress;