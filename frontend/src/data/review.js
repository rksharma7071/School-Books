import axios from "axios";

export const getReview = async () => {
    try {
        const res = await axios.get(`${import.meta.env.VITE_API}/api/review`);
        const book = res?.data || {};
        return book;
    } catch (error) {
        console.error("Edit User Error:", error);

        throw error?.response?.data || { message: "Failed to fetch user data" };
    }
};

export const getReview1 = async () => {
    try {
        const [usersRes, booksRes, reviewRes] = await Promise.all([
            axios.get(`${import.meta.env.VITE_API}/api/user`),
            axios.get(`${import.meta.env.VITE_API}/api/book`),
            axios.get(`${import.meta.env.VITE_API}/api/review`),
        ]);

        const users = usersRes.data;
        const books = booksRes.data.data;
        const reviews = reviewRes.data.review;

        const updatedReviews = reviews.map((review) => {
            const book = books.find((book) => book._id === review.bookId);
            const user = users.find((user) => user._id === review.userId);

            return {
                ...review,
                book,
                user,
            };
        });
        return updatedReviews;
    } catch (error) {
        console.error("Get Review Error:", error);
        throw (
            error?.response?.data || { message: "Failed to fetch review data" }
        );
    }
};
