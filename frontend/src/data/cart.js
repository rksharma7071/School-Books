import axios from "axios";

export const getCart = async () => {
    try {
        const [usersRes, booksRes, cartRes] = await Promise.all([
            axios.get(`${import.meta.env.VITE_API}/api/user`),
            axios.get(`${import.meta.env.VITE_API}/api/book`),
            axios.get(`${import.meta.env.VITE_API}/api/cart`),
        ]);

        const users = usersRes.data;
        const books = booksRes.data.data;
        const carts = cartRes.data;

        const updatedCarts = carts.map((cart) => {
            const user = users.find((user) => user._id === cart.userId);

            const itemsWithBooks = cart.items.map((item) => {
                const book = books.find((book) => book._id === item.bookId);

                return {
                    ...item,
                    book,
                };
            });

            return {
                ...cart,
                user,
                items: itemsWithBooks,
            };
        });

        return updatedCarts;
    } catch (error) {
        console.error("Get Cart Error:", error);
        throw error?.response?.data || { message: "Failed to fetch cart data" };
    }
};

export const getCartById = async ({ params }) => {
    try {
        const id = params.id;
        const carts = await getCart();
        const cart = carts.find((cart) => cart._id === id || cart.userId === id);
        if (!cart) {
            return [];
        }
        return cart;
    } catch (error) {
        console.error("Get Cart By Id Error:", error);
        throw (
            error?.response?.data ||
            error || {
                message: "Failed to fetch cart data",
            }
        );
    }
};
