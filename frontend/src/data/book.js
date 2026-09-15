import axios from "axios";
import api from "../utils/api.js";

const getBooks = async ({ request } = {}) => {
    try {
        const url = new URL(request?.url ?? window.location.href);
        const token = localStorage.getItem("token");

        const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
        const limit = Math.max(1, Number(url.searchParams.get("limit")) || 20);

        const { data } = await axios.get(
            `${import.meta.env.VITE_API}/api/product${url.search}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                signal: request?.signal,
            }
        );
        console.log("data", data);

        return {
            data: data?.data ?? [],
            pagination: data?.pagination ?? {
                total: 0,
                page,
                limit,
                totalPages: 0,
                hasNextPage: false,
                hasPreviousPage: false,
            },
        };
    } catch (error) {
        if (axios.isCancel(error)) {
            return { data: [], pagination: {} };
        }

        console.error("Failed to fetch books:", error);

        return { data: [], pagination: {} };
    }
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

const getBooksData = async ({ request } = {}) => {
    try {
        const url = new URL(request?.url ?? window.location.href);
        const token = localStorage.getItem("token");

        const { data } = await axios.get(
            `${import.meta.env.VITE_API}/api/product${url.search}`,
            {
                headers: { Authorization: `Bearer ${token}` },
                signal: request?.signal,
            }
        );

        const pagination = data?.pagination ?? {};
        return {
            data: Array.isArray(data?.data) ? data.data : [],
            pagination: {
                total: pagination.total ?? 0,
                page: pagination.page ?? Number(url.searchParams.get("page")),
                limit: pagination.limit ?? Number(url.searchParams.get("limit")),
                totalPages: pagination.totalPages ?? 1,
                hasNextPage: pagination.hasNextPage ?? false,
                hasPreviousPage: pagination.hasPreviousPage ?? false,
            },
        };
    } catch (error) {
        if (axios.isCancel(error)) {
            return { data: [], pagination: {} };
        }
        console.error("Failed to fetch books:", error);
        return { data: [], pagination: {} };
    }
};
// const getBooksData = async () => {
//     const token = localStorage.getItem("token");

//     const res = await axios.get(`${import.meta.env.VITE_API}/api/product`, {
//         params: { all: "true", limit: 500 },
//         headers: token ? { Authorization: `Bearer ${token}` } : undefined,
//     });

//     const apiBooks = res.data?.data || [];

//     return apiBooks.map((b) => {
//         const classes = [
//             ...new Set(
//                 (b.variants || [])
//                     .map((v) => v.options?.class || v.options?.Class)
//                     .filter(Boolean)
//             ),
//         ];
//         const mediums = [
//             ...new Set(
//                 (b.variants || [])
//                     .map((v) => v.options?.medium || v.options?.Medium)
//                     .filter(Boolean)
//             ),
//         ];
//         const editions = [
//             ...new Set(
//                 (b.variants || [])
//                     .map((v) => v.options?.edition || v.options?.Edition)
//                     .filter(Boolean)
//             ),
//         ];

//         return {
//             id: b._id,
//             title: b.title,
//             handle: b.handle,
//             description: b.description,
//             category:
//                 classes.length > 0 ? `Class ${classes.join(", ")}` : "N/A",
//             price: b.minPrice ?? 0,
//             maxPrice: b.maxPrice ?? 0,
//             stock: b.totalInventory ?? b.inventory_quantity ?? 0,
//             inventoryStatus: b.inventoryStatus ?? "in_stock",
//             coverImage: b.image?.url || b.images?.[0]?.url || "",
//             isActive: b.isActive,
//             variantCount: b.variants?.length ?? 0,
//             classes,
//             mediums,
//             editions,
//             variants: b.variants || [],
//             options: b.options || [],
//         };
//     });
// };

export {
    getBooks,
    getBookById,
    getBookByHandle,
    editBookLoader,
    getBooksData
}
