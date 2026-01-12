import React, { useContext, useEffect, useState } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import axios from "axios";
import InputField from "../../components/UI/InputField";
import { BookContext } from "../../context/School";

function EditAddress() {
  const navigate = useNavigate();
  const { setToastConfig, setShowToast } = useContext(BookContext);

  const address = useLoaderData() || {};

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

  useEffect(() => {
    if (address) {
      setForm({
        fullName: address.fullName || "",
        phone: address.phone || "",
        address: address.address || "",
        city: address.city || "",
        state: address.state || "",
        pincode: address.pincode || "",
        country: address.country || "India",
        isDefault: address.isDefault || false,
      });
    }
  }, [address]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm({ ...form, [name]: type === "checkbox" ? checked : value });

    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await axios.patch(`${import.meta.env.VITE_API}/api/address/${address._id}`, form);

      setToastConfig({
        type: "success",
        message: "Address updated successfully",
      });
      setShowToast(true);

      navigate("/profile/address");
    } catch (error) {
      setToastConfig({
        type: "error",
        message:
          error.response?.data?.message || "Failed to update address",
      });
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  if (!address) {
    return <p className="text-gray-500">Loading address...</p>;
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-6">Edit Address</h3>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <Field name="fullName" placeholder="Full Name" value={form.fullName} onChange={handleChange} error={errors.fullName} />
        <Field name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} error={errors.phone} />
        <Field name="address" placeholder="Street Address" value={form.address} onChange={handleChange} textarea rows={3} className="sm:col-span-2" error={errors.address} />
        <Field name="city" placeholder="City" value={form.city} onChange={handleChange} error={errors.city} />
        <Field name="state" placeholder="State" value={form.state} onChange={handleChange} error={errors.state} />
        <Field name="pincode" placeholder="Pincode" value={form.pincode} onChange={handleChange} error={errors.pincode} />
        <InputField name="country" value={form.country} disabled />

        <div className="sm:col-span-2 flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            name="isDefault"
            id="defaultAddress"
            checked={form.isDefault}
            onChange={handleChange}
            className="h-4 w-4"
          />
          <label className="text-sm text-gray-700" htmlFor="defaultAddress">
            Set as default address
          </label>
        </div>

        <div className="sm:col-span-2 flex gap-4 mt-6">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? "Updating..." : "Update Address"}
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

function Field({ error, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      <InputField {...props} />
      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}
    </div>
  );
}

export default EditAddress;
