import api from "../utils/api.js";

const API = import.meta.env.VITE_API;

const getProfile = async () => {
    const userId = localStorage.getItem("userId");
    console.log("user", userId);

    if (!userId) {
        throw new Error("User not authenticated");
    }

    try {
        const [userRes, addressRes, orderRes] = await Promise.all([
            api.get(`/api/user/${userId}`),
            api.get(`/api/address/user/${userId}`),
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
