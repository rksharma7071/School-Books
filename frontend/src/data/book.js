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

    const { data } = await api.get(`/api/book?${params.toString()}`);
    return data;
};

const getBookById = async ({ params }) => {
    const { data } = await api.get(`/api/book/${params.id}`);
    return data?.data || null;
};

const getBookBySlug = async ({ params }) => {
    const { data } = await api.get(`/api/book/${params.slug}`);
    return data?.data || null;
};

export {
    getBooks,
    getBookById,
    getBookBySlug
}