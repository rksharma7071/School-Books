import axiosInstance from "../utils/axiosConfig.js";

const API = import.meta.env.VITE_API;

const createRazorpayOrder = async (orderId) => {
    const response = await axiosInstance.post(
        `${API}/api/razorpay/create-order`,
        { orderId }
    );
    return response.data;
};

const verifyRazorpayPayment = async (paymentData) => {
    const response = await axiosInstance.post(
        `${API}/api/razorpay/verify-payment`,
        paymentData
    );
    return response.data;
};

export {
    createRazorpayOrder,
    verifyRazorpayPayment
}