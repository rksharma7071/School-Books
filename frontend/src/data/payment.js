import axios from "axios";

const getPayment = async () => {
    try {
        const { data } = await axios.get("/api/payment");        
        return data ?? [];
    } catch (error) {
        console.error("Failed to fetch payment:", error);
        return [];
    }
};

const getPaymentById = async ({ params }) => {
    try {
        const { data } = await axios.get(`/api/payment/${params.id}`);
        return data ?? {};
    } catch (error) {
        console.error("Failed to fetch payment:", error);
        return {};
    }
};

export { getPayment, getPaymentById };
