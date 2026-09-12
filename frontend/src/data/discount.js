import api from "../utils/api.js";

const getDiscount = async () => {
    try {
        const { data } = await api.get(`/api/discount`);
        return data ?? [];
    } catch (error) {
        console.error("Failed to fetch discounts:", error);
        return [];
    }
};

const getDiscountById = async ({ params }) => {
    try {
        const { data } = await api.get(`/api/discount/${params.id}`);
        return data ?? {};
    } catch (error) {
        console.error("Failed to fetch discounts:", error);
        return {};
    }
};

export { getDiscount, getDiscountById };
