import axios from "axios";

const API = import.meta.env.VITE_API;

export const getCart = async () => {
    const { data } = await axios.get(`${API}/api/cart`);
    return data;
};

export const getCartById = async ({ params }) => {
    const { data } = await axios.get(`${API}/api/cart/${params.id}`);
    return data;
};