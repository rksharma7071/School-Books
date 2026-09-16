import axios from "axios";

const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
});

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

export const getOrder = async ({ request } = {}) => {
    try {
        const url = new URL(request?.url ?? window.location.href);

        const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
        const limit = Math.max(1, Number(url.searchParams.get("limit")) || 20);
        const search = url.searchParams.get("search") || "";
        const status = url.searchParams.get("status") || "";
        const from = url.searchParams.get("from") || "";
        const to = url.searchParams.get("to") || "";

        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (search) params.set("search", search);
        if (status && status !== "all") params.set("status", status);
        if (from) params.set("from", from);
        if (to) params.set("to", to);

        const { data } = await axios.get(
            `${import.meta.env.VITE_API}/api/order?${params.toString()}`,
            {
                headers: authHeaders(),
                signal: request?.signal,
            }
        );

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

        // 401/403 → treat as empty, don't crash the route
        if ([401, 403].includes(error.response?.status)) {
            return emptyPage();
        }

        console.error("Get Order Error:", error);
        throw new Response("Failed to fetch orders", {
            status: error.response?.status || 500,
        });
    }
};

export const getOrderById = async ({ params, request } = {}) => {
    try {
        const { data } = await axios.get(
            `${import.meta.env.VITE_API}/api/order/${params.id}`,
            {
                signal: request?.signal,
                headers: authHeaders(),
            }
        );
        return data?.data ?? null;
    } catch (error) {
        if (axios.isCancel(error)) return null;
        console.error("Failed to fetch order by ID:", error.message);
        throw new Response("Order not found", {
            status: error.response?.status || 500,
        });
    }
};