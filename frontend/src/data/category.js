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


export { getCategorys, getCategoryById, getCategoryByHandle, editCategoryLoader, getCategoriesData }