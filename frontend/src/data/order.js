import axios from "axios";

const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const getOrder = async (params = {}) => {
    try {
        const { data } = await axios.get(
            `${import.meta.env.VITE_API}/api/order`,
            {
                params, headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            }
        );
        return data?.data || [];
    } catch (error) {
        console.error("Get Order Error:", error);
        throw error?.response?.data || { message: "Failed to fetch orders" };
    }
};

export const getOrderById = async ({ params, request } = {}) => {
    try {
        const { data } = await axios.get(
            `${import.meta.env.VITE_API}/api/order/${params.id}`,
            {
                signal: request?.signal,
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            }
        );
        return data?.data || null;
    } catch (error) {
        if (axios.isCancel(error)) return null;

        console.error("Failed to fetch order by ID:", error.message);

        throw new Response("Order not found", {
            status: error.response?.status || 500,
        });
    }
};