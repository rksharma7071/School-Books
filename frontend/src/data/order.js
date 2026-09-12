import api from "../utils/api.js";

const normalizeOrder = (order) => ({
    ...order,
    user: order.userId || null,
    items: (order.items || []).map((item) => ({
        ...item,
        book: item.bookId || null,
    })),
});

const getOrder = async ({ request } = {}) => {
    try {
        const { data } = await api.get(`/api/order`, {
            signal: request?.signal,
        });
        return (data || []).map(normalizeOrder);
    } catch (error) {
        if (axios.isCancel(error)) return [];
        console.error("Failed to fetch orders:", error.message);
        return [];
    }
};

const getOrderById = async ({ params, request } = {}) => {
    try {
        const { data } = await api.get(`/api/order/${params.id}`, {
            signal: request?.signal,
        });
        return normalizeOrder(data);
    } catch (error) {
        if (axios.isCancel(error)) return null;
        console.error("Failed to fetch order by ID:", error.message);

        throw new Response("Order not found", {
            status: error.response?.status || 500,
        });
    }
};

export { getOrder, getOrderById };
