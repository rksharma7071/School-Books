import axios from "axios";

const getOrder = async () => {
    try {
        const { data } = await axios.get(
            `${import.meta.env.VITE_API}/api/order`
        );
        const [orderRes, usersRes, booksRes] = await Promise.all([
            axios.get(`${import.meta.env.VITE_API}/api/order`),
            axios.get(`${import.meta.env.VITE_API}/api/user`),
            axios.get(`${import.meta.env.VITE_API}/api/book`),
        ]);
        const orders = orderRes.data.data || orderRes.data;
        const users = usersRes.data.data || usersRes.data;
        const books = booksRes.data.data;

        const updatedOrders = orders.map((order) => {
            const user = users.find((u) => u._id === order.userId._id);
            const itemsWithBooks = order.items.map((item) => {
                const book = books.find((b) => b._id === item.bookId._id);
                return { ...item, book };
            });

            return {
                ...order,
                user,
                items: itemsWithBooks,
            };
        });

        return updatedOrders ?? [];
    } catch (error) {
        console.error("Failed to fetch order:", error);
        return [];
    }
};

const getOrderById = async ({ params }) => {
    try {
        const [orderRes, usersRes, booksRes] = await Promise.all([
            axios.get(`${import.meta.env.VITE_API}/api/order/${params.id}`),
            axios.get(`${import.meta.env.VITE_API}/api/user`),
            axios.get(`${import.meta.env.VITE_API}/api/book`),
        ]);

        const order = orderRes.data?.data || orderRes.data;
        const users = usersRes.data?.data || usersRes.data;
        const books = booksRes.data?.data;

        const user = users.find((u) => u._id === (order.userId?._id || order.userId));

        const itemsWithBooks = order.items.map((item) => {
            const book = books.find((b) => b._id === (item.bookId?._id || item.bookId));
            return { ...item, book };
        });
        
        return {
            ...order,
            user,
            items: itemsWithBooks,
        };
    } catch (error) {
        console.error("Failed to fetch order by ID:", error);
        return {};
    }
};

export { getOrder, getOrderById };
