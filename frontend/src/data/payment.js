import axios from "axios";

const API = import.meta.env.VITE_API;

const getPayment = async ({ request } = {}) => {
    try {
        const { data } = await axios.get(`${API}/api/payment`, {
            signal: request?.signal,
        });
        return data || [];
    } catch (error) {
        if (axios.isCancel(error)) return [];
        console.error("Failed to fetch payments:", error.message);
        return [];
    }
};

const getPaymentById = async ({ params, request } = {}) => {
    try {
        const { data } = await axios.get(`${API}/api/payment/${params.id}`, {
            signal: request?.signal,
        });
        return data;
    } catch (error) {
        if (axios.isCancel(error)) return null;
        console.error("Failed to fetch payment by ID:", error.message);

        throw new Response("Payment not found", {
            status: error.response?.status || 500,
        });
    }
};

export { getPayment, getPaymentById };