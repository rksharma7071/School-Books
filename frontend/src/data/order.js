import axios from "axios";

const getOrder = async () => {
    try {
        const { data } = await axios.get("/api/order");
        // console.log("data: ",data);
        return data ?? [];
    } catch (error) {
        console.error("Failed to fetch order:", error);
        return [];
    }
};

const getOrderById = async ({ params }) => {
    try {
        const { data } = await axios.get(`/api/order/${params.id}`);
        return data ?? {};
    } catch (error) {
        console.error("Failed to fetch order:", error);
        return {};
    }
};

export { getOrder, getOrderById };
