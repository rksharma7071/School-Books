import axios from "axios";

const editUser = async ({ params }) => {
    try {
        const [userRes, permisssionRes] = await Promise.all([
            axios.get(`${import.meta.env.VITE_API}/api/user/${params.id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            }),
            // axios.get(`${import.meta.env.VITE_API}/api/user/permission/${params.id}`, {
            //     headers: { 
            // Authorization: `Bearer ${localStorage.getItem("token")}` 
            // },
            // }),
        ]);
        return {
            user: userRes.data.user
            // permission: permisssionRes.data,
        };
    } catch (error) {
        console.error("Edit User Error:", error);

        throw error?.response?.data || { message: "Failed to fetch user data" };
    }
};

const getUsersData = async ({ request } = {}) => {
    try {
        const url = new URL(request?.url ?? window.location.href);
        const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
        const limit = Math.max(1, Number(url.searchParams.get("limit")) || 20);
        const search = url.searchParams.get("search") ?? "";

        const token = localStorage.getItem("token");

        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (search) params.set("search", search);

        const { data } = await axios.get(
            `${import.meta.env.VITE_API}/api/user?${params.toString()}`,
            {
                headers: { Authorization: `Bearer ${token}` },
                signal: request?.signal,
            }
        );

        // support multiple response shapes
        const users = Array.isArray(data?.users)
            ? data.users
            : Array.isArray(data?.data)
                ? data.data
                : [];

        const meta = data?.pagination ?? data?.meta ?? {};

        return {
            data: users,
            pagination: {
                total: meta.total ?? users.length,
                page: meta.page ?? page,
                limit: meta.limit ?? limit,
                totalPages: meta.totalPages ?? Math.max(1, Math.ceil((meta.total ?? users.length) / limit)),
                hasNextPage: meta.hasNextPage ?? (meta.page ?? page) * limit < (meta.total ?? users.length),
                hasPreviousPage: meta.hasPreviousPage ?? (meta.page ?? page) > 1,
            },
        };
    } catch (error) {
        if (axios.isCancel?.(error)) {
            return {
                data: [],
                pagination: { total: 0, page: 1, limit: 20, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
            };
        }
        console.error("Failed to fetch users:", error);
        return {
            data: [],
            pagination: { total: 0, page: 1, limit: 20, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
        };
    }
};


export {
    editUser,
    getUsersData
}