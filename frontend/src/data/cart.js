import axios from "axios";

const API = import.meta.env.VITE_API;

export const getCart = async (arg = {}) => {
    const isLoaderArg = arg && (arg.params !== undefined || arg.request !== undefined);

    const queryParams = isLoaderArg ? {} : (arg || {});
    const signal = isLoaderArg ? arg.request?.signal : undefined;

    try {
        const { data } = await axios.get(`${API}/api/cart`, {
            params: queryParams,
            signal,
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        return data?.data || [];
    } catch (error) {
        if (axios.isCancel(error)) return [];

        console.error("Get Cart Error:", error);
        throw new Response("Failed to fetch carts", {
            status: error.response?.status || 500,
        });
    }
};

export const getCartById = async ({ params, request } = {}) => {
    try {
        const { data } = await axios.get(`${API}/api/cart/${params.id}`, {
            signal: request?.signal,
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        return data?.data || { items: [], totalItems: 0, subtotal: 0 };
    } catch (error) {
        if (axios.isCancel(error)) return null;

        if (error.response?.status === 404) {
            return { items: [], totalItems: 0, subtotal: 0 };
        }

        console.error("Failed to fetch cart by id:", error.message);
        throw new Response("Cart not found", {
            status: error.response?.status || 500,
        });
    }
};

export const getMyCart = async () => {
    try {
        const { data } = await axios.get(`${API}/api/cart/me`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        return data?.data || { items: [], totalItems: 0, subtotal: 0 };
    } catch (error) {
        if (error.response?.status === 404) {
            return { items: [], totalItems: 0, subtotal: 0 };
        }
        throw error;
    }
};

export const getCartByUserId = async (userId) => {
    try {
        const { data } = await axios.get(`${API}/api/cart/${userId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        return data?.data || { items: [], totalItems: 0, subtotal: 0 };
    } catch (error) {
        if (error.response?.status === 404) {
            return { items: [], totalItems: 0, subtotal: 0 };
        }
        throw error;
    }
};

export const deleteCart = async (cartId) => {
    const { data } = await axios.delete(`${API}/api/cart/${cartId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    return data;
};

export const clearMyCart = async () => {
    const { data } = await axios.delete(`${API}/api/cart/clear`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    return data;
};

export const clearUserCart = async (userId) => {
    const { data } = await axios.delete(`${API}/api/cart/clear/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    return data;
};