import axios from "axios";

const getPayment = async () => {
    try {
        const { data } = await axios.get(`${import.meta.env.VITE_API}/api/payment`);
        // console.log("getPayment: ", data);
        return data ?? [];
    } catch (error) {
        console.error("Failed to fetch payment:", error);
        return [];
    }
};

const getPaymentById = async ({ params }) => {
    try {
        const { data } = await axios.get(`${import.meta.env.VITE_API}/api/payment/${params.id}`);
        // console.log("getPaymentById: ", data);
        return data ?? {};
    } catch (error) {
        console.error("Failed to fetch payment:", error);
        return {};
    }
};

export { getPayment, getPaymentById };
