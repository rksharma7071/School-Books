import axios from "axios";

const getPayment = async () => {
    try {
        const [orderRes, paymentRes, userRes] = await Promise.all([
            axios.get(`${import.meta.env.VITE_API}/api/order`),
            axios.get(`${import.meta.env.VITE_API}/api/payment`),
            axios.get(`${import.meta.env.VITE_API}/api/user`),
        ]);
        const orders = orderRes.data.data || orderRes.data;
        const payments = paymentRes.data.data || paymentRes.data;
        const users = userRes.data.data || userRes.data;

        const updatedPayment = payments.map((payment) => {
            const order = orders.find((order) => order._id === payment.orderId);
            const user = users.find((user) => user._id === order.userId._id);
            return {
                ...payment,
                order,
                user,
            };
        });
        return updatedPayment ?? [];
    } catch (error) {
        console.error("Failed to fetch payment:", error);
        return [];
    }
};

const getPaymentById = async ({ params }) => {
    try {
        const [paymentRes, orderRes, userRes] = await Promise.all([
            axios.get(`${import.meta.env.VITE_API}/api/payment/${params.id}`),
            axios.get(`${import.meta.env.VITE_API}/api/order`),
            axios.get(`${import.meta.env.VITE_API}/api/user`),
        ]);

        const payment = paymentRes.data?.data || paymentRes.data;
        const orders = orderRes.data?.data || orderRes.data;
        const users = userRes.data?.data || userRes.data;

        const order = orders.find((o) => o._id === payment.orderId);

        const user = users.find(
            (u) => u._id === (order?.userId?._id || order?.userId)
        );

        return {
            ...payment,
            order,
            user,
        };
    } catch (error) {
        console.error("Failed to fetch payment by ID:", error);
        return {};
    }
};

export { getPayment, getPaymentById };
