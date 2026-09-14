import axios from "axios";
import api from "../utils/api.js";

const getCategorys = async ({
    page = 1,
    limit = 12,
    search = "",
    category = "",
    author = "",
    subject = "",
    language = "",
    classLevel = "",
    minPrice = "",
    maxPrice = "",
    sortBy = "createdAt",
    sortOrder = "desc",
} = {}) => {
    const params = new URLSearchParams();

    params.set("page", page);
    params.set("limit", limit);
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

const getCategoriesData = async () => {
    const token = localStorage.getItem("token");

    const res = await axios.get(
        `${import.meta.env.VITE_API}/api/categories/admin`,
        {
            params: {
                includeInactive: true,
                limit: 100,
            },
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    const apiCategories = res.data?.data || [];

    return apiCategories.map((category) => ({
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
};


export { getCategorys, getCategoryById, getCategoryByHandle, editCategoryLoader, getCategoriesData }