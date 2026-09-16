import axios from "axios";

const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const getProfile = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) throw new Error("User not authenticated");

    try {
        const [userRes, addressRes, orderRes] = await Promise.all([
            axios.get(`${import.meta.env.VITE_API}/api/user/${userId}`, {
                headers: authHeaders(),
            }),
            axios.get(`${import.meta.env.VITE_API}/api/address/user/${userId}`, {
                headers: authHeaders(),
            }),
            axios.get(`${import.meta.env.VITE_API}/api/order/my-orders`, {
                headers: authHeaders(),
            }),
        ]);

        const user = userRes.data?.user ?? userRes.data?.data ?? userRes.data;
        const address = addressRes.data?.data ?? addressRes.data?.addresses ?? [];
        const order = Array.isArray(orderRes.data?.data) ? orderRes.data.data : [];

        return { user, address, order };
    } catch (error) {
        console.error("Profile fetch error:", error);
        throw new Response("Failed to load profile", {
            status: error.response?.status || 500,
        });
    }
};

export const getOrderById = async ({ params } = {}) => {
    try {
        if (!params?.id) throw new Error("Missing order id");

        const { data } = await axios.get(
            `${import.meta.env.VITE_API}/api/order/${params.id}`,
            { headers: authHeaders() }
        );

        return data?.data ?? data ?? null;
    } catch (error) {
        if (error.response?.status === 404) return null;
        console.error("Get order error:", error);
        throw new Response("Order not found", {
            status: error.response?.status || 500,
        });
    }
};

export const getAddressById = async ({ params } = {}) => {
    try {
        if (!params?.id) throw new Error("Missing address id");

        const { data } = await axios.get(
            `${import.meta.env.VITE_API}/api/address/${params.id}`,
            { headers: authHeaders() }
        );

        return data?.data ?? data ?? null;
    } catch (error) {
        if (error.response?.status === 404) return null;
        console.error("Get address error:", error);
        throw new Response("Address not found", {
            status: error.response?.status || 500,
        });
    }
};