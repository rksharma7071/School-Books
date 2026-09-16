import axios from "axios";

const API = import.meta.env.VITE_API;


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

export const getCart = async (arg = {}) => {
    const isLoaderArg = arg && (arg.request !== undefined || arg.params !== undefined);
    const signal = isLoaderArg ? arg.request?.signal : undefined;

    let page = 1;
    let limit = 20;

    if (isLoaderArg) {
        const url = new URL(arg.request?.url ?? window.location.href);
        page = Math.max(1, Number(url.searchParams.get("page")) || 1);
        limit = Math.max(1, Number(url.searchParams.get("limit")) || 20);
    } else {
        page = Math.max(1, Number(arg.page) || 1);
        limit = Math.max(1, Number(arg.limit) || 20);
    }

    try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));

        const { data } = await axios.get(
            `${API}/api/cart?${params.toString()}`,
            {
                headers: authHeaders(),
                signal,
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
        if (axios.isCancel?.(error)) return emptyPage(page, limit);

        if ([401, 403].includes(error.response?.status)) {
            return emptyPage(page, limit);
        }

        console.error("Get Cart Error:", error);
        throw new Response("Failed to fetch carts", {
            status: error.response?.status || 500,
        });
    }
};

export const getCartById = async ({ params, request } = {}) => {
    try {
        if (!params?.id) {
            throw new Response("Cart not found", { status: 400 });
        }

        const { data } = await axios.get(
            `${API}/api/cart/${params.id}`,
            {
                signal: request?.signal,
                headers: authHeaders(),
            }
        );

        // Backend returns { success, data: { id, userId, items, totalItems, subtotal, user, createdAt, updatedAt } }
        return data?.data ?? null;
    } catch (error) {
        if (axios.isCancel?.(error)) return null;

        if (error.response?.status === 404) return null;

        console.error("Failed to fetch cart by id:", error.message);
        throw new Response("Cart not found", {
            status: error.response?.status || 500,
        });
    }
};

export const getMyCart = async () => {
    try {
        const { data } = await axios.get(`${API}/api/cart/me`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        return data?.data || { items: [], totalItems: 0, subtotal: 0 };
    } catch (error) {
        if (error.response?.status === 404) {
            return { items: [], totalItems: 0, subtotal: 0 };
        }
        throw error;
    }
};

export const getCartByUserId = async (userId) => {
    try {
        const { data } = await axios.get(`${API}/api/cart/${userId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        return data?.data || { items: [], totalItems: 0, subtotal: 0 };
    } catch (error) {
        if (error.response?.status === 404) {
            return { items: [], totalItems: 0, subtotal: 0 };
        }
        throw error;
    }
};

export const deleteCart = async (cartId) => {
    const { data } = await axios.delete(`${API}/api/cart/${cartId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    return data;
};

export const clearMyCart = async () => {
    const { data } = await axios.delete(`${API}/api/cart/clear`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    return data;
};

export const clearUserCart = async (userId) => {
    const { data } = await axios.delete(`${API}/api/cart/clear/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    return data;
};

export const getCartData = async ({ request } = {}) => {
    try {
        const token = localStorage.getItem("token");

        if (!token) {
            return {
                id: null,
                userId: null,
                items: [],
                totalItems: 0,
                subtotal: 0,
            };
        }

        const { data } = await axios.get(
            `${import.meta.env.VITE_API}/api/cart/me`,
            {
                headers: { Authorization: `Bearer ${token}` },
                signal: request?.signal,
            }
        );

        return data?.data ?? {
            id: null,
            userId: null,
            items: [],
            totalItems: 0,
            subtotal: 0,
        };
    } catch (error) {
        if (axios.isCancel?.(error)) {
            return {
                id: null,
                userId: null,
                items: [],
                totalItems: 0,
                subtotal: 0,
            };
        }

        if ([401, 403].includes(error.response?.status)) {
            return {
                id: null,
                userId: null,
                items: [],
                totalItems: 0,
                subtotal: 0,
            };
        }

        console.error("Get Cart Error:", error);
        throw new Response("Failed to fetch cart", {
            status: error.response?.status || 500,
        });
    }
};