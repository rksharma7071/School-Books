import axios from "axios";

const API = import.meta.env.VITE_API;

export const getBook = async () => {
    const { data } = await axios.get(`${API}/api/book`);
    return data;
};

export const getBookById = async ({ params }) => {
    const [bookRes, reviewRes] = await Promise.all([
        axios.get(`${API}/api/book/${params.id}`),
        axios.get(`${API}/api/review/book/${params.id}`),
    ]);

    return {
        ...bookRes.data.data,
        review: reviewRes.data.reviews || [],
    };
};