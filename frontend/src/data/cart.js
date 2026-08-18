import axios from "axios";
import api from "../utils/api.js";

const API = import.meta.env.VITE_API;

export const getMyCart = async () => {
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

export const getMyCartDirect = async () => {
    try {
        const token = localStorage.getItem("token");
        
        const { data } = await axios.get(`${API}/api/cart/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        
        return data;
    } catch (error) {
        if (error.response?.status === 404) {
            return { items: [], total: 0 };
        }
        throw error;
    }
};

export const getCart = getMyCart;

export const getCartByUserId = async (userId) => {
    try {
        const token = localStorage.getItem("token");
        
        const { data } = await axios.get(`${API}/api/cart/${userId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        
        return data;
    } catch (error) {
        if (error.response?.status === 404) {
            return { items: [], total: 0 };
        }
        throw error;
    }
};

export const getCartById = async ({ params }) => {
    const { data } = await axios.get(`${API}/api/cart/${params.id}`);
    return data;
};

export const clearMyCart = async () => {
    const token = localStorage.getItem("token");
    
    const { data } = await axios.delete(`${API}/api/cart/clear`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    
    return data;
};

export const clearUserCart = async (userId) => {
    const token = localStorage.getItem("token");
    
    const { data } = await axios.delete(`${API}/api/cart/clear/${userId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    
    return data;
};