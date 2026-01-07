import axios from "axios";

export const getCart = async () => {
    try {
        const [usersRes, booksRes, cartRes] = await Promise.all([
            axios.get("/api/user"),
            axios.get("/api/book"),
            axios.get("/api/cart"),
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
        console.log("getCart:", updatedCarts);

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

        const cart = carts.find((cart) => cart.userId === id);

        if (!cart) {
            return [];
        }
        console.log("getCartById:", cart.items);
        return cart.items;
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
