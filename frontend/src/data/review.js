import api from "../utils/api.js";
import axios from "axios";

const getReview = async (params = {}) => {
    try {
        const res = await api.get(`/api/review`, { params });
        return res?.data || {};
    } catch (error) {
        console.error("Get Review Error:", error);
        throw error?.response?.data || { message: "Failed to fetch review data" };
    }
};

const getReview1 = async (params = {}) => {
    const data = await getReview(params);
    return data?.data || [];
};




const getReviewData = async ({ request } = {}) => {
    try {
        const url = new URL(request?.url ?? window.location.href);
        const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
        const limit = Math.max(1, Number(url.searchParams.get("limit")) || 20);
        const search = url.searchParams.get("search") ?? "";
        const approved = url.searchParams.get("approved") ?? "";
        const rating = url.searchParams.get("rating") ?? "";
        const verifiedPurchase = url.searchParams.get("verifiedPurchase") ?? "";
        const reported = url.searchParams.get("reported") ?? "";
        const sortBy = url.searchParams.get("sortBy") ?? "createdAt";
        const sortOrder = url.searchParams.get("sortOrder") ?? "desc";

        const token = localStorage.getItem("token");

        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        params.set("sortBy", sortBy);
        params.set("sortOrder", sortOrder);
        if (search) params.set("search", search);
        if (approved !== "") params.set("approved", approved);
        if (rating !== "") params.set("rating", rating);
        if (verifiedPurchase !== "") params.set("verifiedPurchase", verifiedPurchase);
        if (reported !== "") params.set("reported", reported);

        const { data } = await axios.get(
            `${import.meta.env.VITE_API}/api/review?${params.toString()}`,
            {
                headers: { Authorization: `Bearer ${token}` },
                signal: request?.signal,
            }
        );

        const reviews = Array.isArray(data?.data) ? data.data : [];
        const meta = data?.meta ?? {};

        return {
            data: reviews,
            approvedAverageRating: data?.approvedAverageRating ?? 0,
            pagination: {
                total: meta.total ?? reviews.length,
                page: meta.page ?? page,
                limit: meta.limit ?? limit,
                totalPages: meta.totalPages ?? Math.max(1, Math.ceil((meta.total ?? reviews.length) / limit)),
                hasNextPage: meta.hasNextPage ?? (meta.page ?? page) * limit < (meta.total ?? reviews.length),
                hasPreviousPage: meta.hasPreviousPage ?? (meta.page ?? page) > 1,
            },
        };
    } catch (error) {
        if (axios.isCancel?.(error)) {
            return {
                data: [],
                approvedAverageRating: 0,
                pagination: { total: 0, page: 1, limit: 20, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
            };
        }
        console.error("Get Review Error:", error);
        return {
            data: [],
            approvedAverageRating: 0,
            pagination: { total: 0, page: 1, limit: 20, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
        };
    }
};

export { getReview, getReview1, getReviewData };