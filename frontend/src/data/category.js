import axios from "axios";
import api from "../utils/api.js";

const getCategorys = async ({ request } = {}) => {
    const url = new URL(request?.url ?? window.location.href);

    const params = new URLSearchParams();


    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const limit = Math.max(1, Number(url.searchParams.get("limit")) || 20);

    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);

    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (author) params.set("author", author);
    if (subject) params.set("subject", subject);
    if (language) params.set("language", language);
    if (classLevel) params.set("classLevel", classLevel);
    if (minPrice !== "") params.set("minPrice", minPrice);
    if (maxPrice !== "") params.set("maxPrice", maxPrice);

    const { data } = await api.get(`/api/product?${params.toString()}`);
    return data;
};

const getCategoryById = async ({ params }) => {
    const { data } = await api.get(`/api/categories/${params.id}`);
    console.log("Get Category By Id", data.data);

    return data?.data || null;
};

const getCategoryByHandle = async ({ params }) => {
    const { data } = await api.get(`/api/product/${params.handle}`);
    console.log("Get Category By Handle: ", data.data);

    return data?.data || null;
};

const editCategoryLoader = async ({ params }) => {
    try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
            `${import.meta.env.VITE_API}/api/categories/admin/${params.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        // console.log("Edit Category Loader Response:", res.data);
        return res.data.data;
    } catch (error) {
        console.error("Error fetching category by ID:", error);
        return null;
    }
};

const getCategoriesData = async ({ request } = {}) => {
    try {
        const url = new URL(request?.url ?? window.location.href);
        const token = localStorage.getItem("token");

        url.searchParams.set("includeInactive", "true");

        const { data } = await axios.get(
            `${import.meta.env.VITE_API}/api/categories/admin?${url.searchParams.toString()}`,
            {
                headers: { Authorization: `Bearer ${token}` },
                signal: request?.signal,
            }
        );

        const list = Array.isArray(data?.data) ? data.data : [];

        const categories = list.map((category) => ({
            id: category.id || category._id,
            name: category.name,
            handle: category.handle,
            description: category.description,
            image: category.image,
            type: category.type,
            isActive: category.isActive,
            sortOrder: category.sortOrder,
            productCount: category.productCount ?? 0,
            conditions: category.conditions || [],
            conditionMatch: category.conditionMatch,
        }));

        const pagination = data?.pagination ?? data?.pagination ?? {};
        const page = Number(url.searchParams.get("page")) || 1;
        const limit = Number(url.searchParams.get("limit")) || 20;

        return {
            data: categories,
            pagination: {
                total: pagination.total ?? categories.length,
                page: pagination.page ?? page,
                limit: pagination.limit ?? limit,
                totalPages: pagination.totalPages ?? 1,
                hasNextPage: pagination.hasNextPage ?? false,
                hasPreviousPage: pagination.hasPreviousPage ?? false,
            },
        };
    } catch (error) {
        if (axios.isCancel?.(error)) {
            return {
                data: [],
                pagination: { total: 0, page: 1, limit: 20, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
            };
        }
        console.error("Failed to fetch categories:", error);
        return {
            data: [],
            pagination: { total: 0, page: 1, limit: 20, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
        };
    }
};

const getCategories = async ({ request } = {}) => {
    try {
        const url = new URL(request?.url ?? window.location.href);

        const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
        const limit = Math.max(1, Number(url.searchParams.get("limit")) || 20);
        const search = url.searchParams.get("search") ?? "";
        const sortBy = url.searchParams.get("sortBy") ?? "sortOrder";
        const sortOrder = url.searchParams.get("sortOrder") ?? "asc";

        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        params.set("sortBy", sortBy);
        params.set("sortOrder", sortOrder);
        if (search) params.set("search", search);

        const { data } = await axios.get(
            `${import.meta.env.VITE_API}/api/categories?${params.toString()}`,
            { signal: request?.signal }
        );

        const list = Array.isArray(data?.data) ? data.data : [];

        const categories = list.map((c) => ({
            id: c.id || c._id,
            name: c.name,
            handle: c.handle,
            description: c.description,
            image: c.image,
            type: c.type,
            isActive: c.isActive,
            sortOrder: c.sortOrder,
            productCount: c.productCount ?? 0,
            conditionMatch: c.conditionMatch,
        }));

        const meta = data?.pagination ?? {};

        return {
            data: categories,
            pagination: {
                total: meta.total ?? categories.length,
                page: meta.page ?? page,
                limit: meta.limit ?? limit,
                totalPages:
                    meta.totalPages ??
                    Math.max(1, Math.ceil((meta.total ?? categories.length) / limit)),
                hasNextPage: meta.hasNextPage ?? false,
                hasPreviousPage: meta.hasPreviousPage ?? false,
            },
        };
    } catch (error) {
        if (axios.isCancel?.(error)) {
            return {
                data: [],
                pagination: {
                    total: 0,
                    page: 1,
                    limit: 20,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPreviousPage: false,
                },
            };
        }
        console.error("Failed to fetch categories:", error);
        return {
            data: [],
            pagination: {
                total: 0,
                page: 1,
                limit: 20,
                totalPages: 1,
                hasNextPage: false,
                hasPreviousPage: false,
            },
        };
    }
};

const getCategoryProducts = async ({ params, request } = {}) => {
    try {
        const handle = params?.handle;
        if (!handle) {
            return {
                category: null,
                products: [],
                pagination: { total: 0, page: 1, limit: 20, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
            };
        }


        const url = new URL(request?.url ?? window.location.href);
        const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
        const limit = Math.max(1, Number(url.searchParams.get("limit")) || 20);
        const sortBy = url.searchParams.get("sortBy") ?? "createdAt";
        const sortOrder = url.searchParams.get("sortOrder") ?? "desc";

        const params2 = new URLSearchParams();
        params2.set("page", String(page));
        params2.set("limit", String(limit));
        params2.set("sortBy", sortBy);
        params2.set("sortOrder", sortOrder);

        const { data } = await axios.get(
            `${import.meta.env.VITE_API}/api/categories/${handle}/products?${params2.toString()}`,
            { signal: request?.signal }
        );

        const d = data?.data ?? {};

        return {
            category: d.category ?? null,
            products: Array.isArray(d.products) ? d.products : [],
            pagination: {
                total: d.pagination?.total ?? 0,
                page: d.pagination?.page ?? page,
                limit: d.pagination?.limit ?? limit,
                totalPages: d.pagination?.totalPages ?? 1,
                hasNextPage: d.pagination?.hasNextPage ?? false,
                hasPreviousPage: d.pagination?.hasPreviousPage ?? false,
            },
        };
    } catch (error) {
        if (axios.isCancel?.(error)) {
            return {
                category: null,
                products: [],
                pagination: { total: 0, page: 1, limit: 20, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
            };
        }

        // 404 → let the component show "category not found"
        if (error.response?.status === 404) {
            return {
                category: null,
                products: [],
                pagination: { total: 0, page: 1, limit: 20, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
                notFound: true,
            };
        }

        console.error("Failed to fetch category products:", error);
        throw new Response("Failed to load category products", {
            status: error.response?.status || 500,
        });
    }
};

export { getCategorys, getCategoryById, getCategoryByHandle, editCategoryLoader, getCategoriesData, getCategories, getCategoryProducts }