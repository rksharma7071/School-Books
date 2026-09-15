import axios from "axios";

const getDiscount = async ({ request } = {}) => {
    try {
        const url = new URL(request?.url ?? window.location.href);
        const page = Number(url.searchParams.get("page")) || 1;
        const limit = Number(url.searchParams.get("limit")) || 20;

        const token = localStorage.getItem("token");

        const { data } = await axios.get(
            `${import.meta.env.VITE_API}/api/discount`,
            {
                params: { page, limit },
                headers: { Authorization: `Bearer ${token}` },
                signal: request?.signal,
            }
        );

        return {
            data: Array.isArray(data?.data) ? data.data : [],
            meta: data?.meta ?? {
                total: 0,
                page,
                limit,
                totalPages: 1,
                hasNextPage: false,
                hasPreviousPage: false,
            },
        };
    } catch (error) {
        console.error("Failed to fetch discounts:", error);
        return {
            data: [],
            meta: { total: 0, page: 1, limit: 20, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
        };
    }
};

const getDiscountById = async ({ params } = {}) => {
    try {
        if (!params?.id) return {};
        const token = localStorage.getItem("token");
        const { data } = await axios.get(
            `${import.meta.env.VITE_API}/api/discount/${params.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return data?.data ?? data ?? {};
    } catch (error) {
        console.error("Failed to fetch discount by id:", error);
        return {};
    }
};

export { getDiscount, getDiscountById };