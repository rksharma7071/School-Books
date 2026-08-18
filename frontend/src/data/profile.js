// frontend/src/data/profile.js
import axios from "axios";
import api from "../utils/api.js"; // ✅ Import centralized API

const API = import.meta.env.VITE_API;

const getProfile = async () => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user?.id) {
        throw new Error("User not authenticated");
    }

    try {
        const [userRes, addressRes, orderRes] = await Promise.all([
            api.get(`/api/user/${user.id}`),
            api.get(`/api/address/user/${user.id}`),
            api.get(`/api/order/my-orders`),
        ]);

        return {
            user: userRes.data,
            address: addressRes.data.addresses,
            order: orderRes.data.data || [],
            permission: {},
        };
    } catch (error) {
        console.error("Profile fetch error:", error);
        throw error;
    }
};

export default getProfile;