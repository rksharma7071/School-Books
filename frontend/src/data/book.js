import axios from "axios";

export const getBookById = async ({ params }) => {
    try {
        const res = await axios.get(`/api/book/${params.id}`);
        const book = res?.data?.data || {};
        return book;
    } catch (error) {
        console.error("Edit User Error:", error);

        throw error?.response?.data || { message: "Failed to fetch user data" };
    }
};
