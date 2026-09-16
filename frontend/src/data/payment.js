import axios from "axios";
import api from "../utils/api.js";

const emptyPage = (page = 1, limit = 20) => ({
    data: [],
    pagination: {
        total: 0,
        page,
        limit,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
    },
});

const getPayment = async ({ request } = {}) => {
    try {
        const url = new URL(request?.url ?? window.location.href);
        const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
        const limit = Math.max(1, Number(url.searchParams.get("limit")) || 20);
        const search = url.searchParams.get("search") || "";
        const status = url.searchParams.get("status") || "";

        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (search) params.set("search", search);
        if (status) params.set("status", status);

        const { data } = await api.get(
            `/api/payment?${params.toString()}`,
            { signal: request?.signal }
        );

        // Backwards-compatible: if the backend still returns a plain array,
        // wrap it in the paginated shape so the component works either way.
        if (Array.isArray(data)) {
            return {
                data,
                pagination: {
                    total: data.length,
                    page: 1,
                    limit: data.length || limit,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPreviousPage: false,
                },
            };
        }

        const list = Array.isArray(data?.data) ? data.data : [];
        const meta = data?.meta ?? {};

        return {
            data: list,
            pagination: {
                total: meta.total ?? list.length,
                page: meta.page ?? page,
                limit: meta.limit ?? limit,
                totalPages:
                    meta.totalPages ??
                    Math.max(1, Math.ceil((meta.total ?? list.length) / limit)),
                hasNextPage: meta.hasNextPage ?? false,
                hasPreviousPage: meta.hasPreviousPage ?? false,
            },
        };
    } catch (error) {
        if (axios.isCancel?.(error)) return emptyPage();
        console.error("Failed to fetch payments:", error.message);
        return emptyPage();
    }
};

const getPaymentById = async ({ params, request } = {}) => {
    try {
        const { data } = await api.get(`/api/payment/${params.id}`, {
            signal: request?.signal,
        });
        return data?.data ?? data;
    } catch (error) {
        if (axios.isCancel?.(error)) return null;
        console.error("Failed to fetch payment by ID:", error.message);
        throw new Response("Payment not found", {
            status: error.response?.status || 500,
        });
    }
};


export { getPayment, getPaymentById };
