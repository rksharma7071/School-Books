import axios from "axios";

const getOrder = async () => {
    try {
        const { data } = await axios.get(`${import.meta.env.VITE_API}/api/order`);
        // console.log("getOrder: ", data);
        return data ?? [];
    } catch (error) {
        console.error("Failed to fetch order:", error);
        return [];
    }
};

const getOrderById = async ({ params }) => {
    try {
        const { data } = await axios.get(`${import.meta.env.VITE_API}/api/order/${params.id}`);
        // console.log("getOrderById: ", data);
        return data ?? {};
    } catch (error) {
        console.error("Failed to fetch order:", error);
        return {};
    }
};

export { getOrder, getOrderById };
