import axios from "axios";
import api from "../utils/api.js";

const API = import.meta.env.VITE_API;

const getMyCart = async () => {
    try {
        const token = localStorage.getItem("token");

        const { data } = await api.get(`/api/cart/me`);
        return data;
    } catch (error) {
        if (error.response?.status === 404) {
            return { items: [], total: 0 };
        }
        throw error;
    }
};

const getMyCartDirect = async () => {
    try {
        const { data } = await axios.get(`${API}/api/cart/me`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });

        return data;
    } catch (error) {
        if (error.response?.status === 404) {
            return { items: [], total: 0 };
        }
        throw error;
    }
};

const getCart = getMyCart;

const getCartByUserId = async (userId) => {
    try {
        const { data } = await axios.get(`${API}/api/cart/${userId}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });

        return data;
    } catch (error) {
        if (error.response?.status === 404) {
            return { items: [], total: 0 };
        }
        throw error;
    }
};

const getCartById = async ({ params }) => {
    const { data } = await axios.get(`${API}/api/cart/${params.id}`);
    return data;
};

const clearMyCart = async () => {
    const { data } = await axios.delete(`${API}/api/cart/clear`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
        }
    });

    return data;
};

const clearUserCart = async (userId) => {
    const token = localStorage.getItem("token");

    const { data } = await axios.delete(`${API}/api/cart/clear/${userId}`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
        }
    });

    return data;
};

export {
    getMyCart,
    getMyCartDirect,
    getCart,
    getCartByUserId,
    getCartById,
    clearMyCart,
    clearUserCart
}
