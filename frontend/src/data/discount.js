import axios from "axios";

const getDiscount = async () => {
    try {
        const { data } = await axios.get(`${import.meta.env.VITE_API}/api/discount`);
        // console.log("getDiscount: ", data ?? []);

        return data ?? [];
    } catch (error) {
        console.error("Failed to fetch discounts:", error);
        return [];
    }
};

const getDiscountById = async ({ params }) => {
    try {
        const { data } = await axios.get(`${import.meta.env.VITE_API}/api/discount/${params.id}`);
        // console.log("getDiscountById: ", data ?? []);
        return data ?? {};
    } catch (error) {
        console.error("Failed to fetch discounts:", error);
        return {};
    }
};

export { getDiscount, getDiscountById };
