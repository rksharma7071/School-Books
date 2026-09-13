import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("userId");

            const currentPath = window.location.pathname;
            if (!currentPath.includes("/login") &&
                !currentPath.includes("/register") &&
                !currentPath.includes("/reset-password")) {
                window.location.href = "/login";
            }
        }

        if (error.response?.status === 403) {
            console.error("Access forbidden:", error.response?.data?.message);
        }

        if (error.response?.status === 404) {
            console.error("Resource not found:", error.config?.url);
        }

        return Promise.reject(error);
    }
);

export default api;
