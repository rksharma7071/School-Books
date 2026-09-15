import axios from "axios";
import api from "../utils/api.js";

const getBooks = async ({
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

const getBookById = async ({ params }) => {
    try {
        const { data } = await api.get(`/api/product/${params.id}`);
        console.log("Get Book By Id", data.data);
        return data?.data || null;
    } catch (error) {
        console.error("Error fetching book by ID:", error);
        return null;
    }
};

const getBookByHandle = async ({ params }) => {
    try {
        const { data } = await api.get(`/api/product/${params.handle}`);
        // console.log("Get Book By Handle: ", data.data);
        return data?.data || null;
    } catch (error) {
        console.error("Error fetching book by handle:", error);
        return null;
    }
};

const editBookLoader = async ({ params }) => {
    const token = localStorage.getItem("token");
    const res = await axios.get(
        `${import.meta.env.VITE_API}/api/product/admin/${params.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data.data;
};

const getBooksData = async () => {
    const token = localStorage.getItem("token");

    const res = await axios.get(`${import.meta.env.VITE_API}/api/product`, {
        params: { all: "true", limit: 500 },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    const apiBooks = res.data?.data || [];

    return apiBooks.map((b) => {
        const classes = [
            ...new Set(
                (b.variants || [])
                    .map((v) => v.options?.class || v.options?.Class)
                    .filter(Boolean)
            ),
        ];
        const mediums = [
            ...new Set(
                (b.variants || [])
                    .map((v) => v.options?.medium || v.options?.Medium)
                    .filter(Boolean)
            ),
        ];
        const editions = [
            ...new Set(
                (b.variants || [])
                    .map((v) => v.options?.edition || v.options?.Edition)
                    .filter(Boolean)
            ),
        ];

        return {
            id: b._id,
            title: b.title,
            handle: b.handle,
            description: b.description,
            category:
                classes.length > 0 ? `Class ${classes.join(", ")}` : "N/A",
            price: b.minPrice ?? 0,
            maxPrice: b.maxPrice ?? 0,
            stock: b.totalInventory ?? b.inventory_quantity ?? 0,
            inventoryStatus: b.inventoryStatus ?? "in_stock",
            coverImage: b.image?.url || b.images?.[0]?.url || "",
            isActive: b.isActive,
            variantCount: b.variants?.length ?? 0,
            classes,
            mediums,
            editions,
            variants: b.variants || [],
            options: b.options || [],
        };
    });
};

export {
    getBooks,
    getBookById,
    getBookByHandle,
    editBookLoader,
    getBooksData
}
