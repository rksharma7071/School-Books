import api from "../utils/api.js";

const getReview = async () => {
    try {
        const res = await api.get(`/api/review`);
        return res?.data || {};
    } catch (error) {
        console.error("Get Review Error:", error);
        throw error?.response?.data || { message: "Failed to fetch review data" };
    }
};

const getReview1 = async () => {
    try {
        const [usersRes, booksRes, reviewRes] = await Promise.all([
            api.get(`/api/user`),
            api.get(`/api/book`),
            api.get(`/api/review`),
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
        throw error?.response?.data || { message: "Failed to fetch review data" };
    }
};


export {
    getReview,
    getReview1
}