import axios from "axios";
import { getReview1 } from "./review";

export const getBook = async () => {
    try {
        const res = await axios.get(`/api/book`);
        console.log("getBook", res.data);
        return res.data;
    } catch (error) {
        console.error("Edit User Error:", error);

        throw error?.response?.data || { message: "Failed to fetch user data" };
    }
};

export const getBookById = async ({ params }) => {
    try {
        const res = await axios.get(`/api/book/${params.id}`);
        const book = res?.data?.data || {};
        const data = await getReview1();
        const review = data.filter((element) => element.bookId == book._id);
        book.review = review;
        console.log("getBookById", book);
        return book;
    } catch (error) {
        console.error("Edit User Error:", error);
        throw error?.response?.data || { message: "Failed to fetch user data" };
    }
};
