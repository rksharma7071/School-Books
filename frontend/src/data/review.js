import api from "../utils/api.js";

const getReview = async (params = {}) => {
    try {
        const res = await api.get(`/api/review`, { params });
        return res?.data || {};
    } catch (error) {
        console.error("Get Review Error:", error);
        throw error?.response?.data || { message: "Failed to fetch review data" };
    }
};

const getReview1 = async (params = {}) => {
    const data = await getReview(params);
    return data?.data || [];
};

export { getReview, getReview1 };