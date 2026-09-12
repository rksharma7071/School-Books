import axios from "axios";

const API_URL = import.meta.env.VITE_API;

const api = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        
        const publicEndpoints = ['/api/auth/login', '/api/auth/signup', '/api/auth/request-otp'];
        const isPublicEndpoint = publicEndpoints.some(endpoint => 
            config.url?.includes(endpoint)
        );
        
        if (token && !isPublicEndpoint) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            
            const currentPath = window.location.pathname;
            if (!currentPath.includes('/login') && !currentPath.includes('/register') && !currentPath.includes('/reset-password')) {
                window.location.href = '/login';
            }
        }
        
        if (error.response?.status === 403) {
            console.error('Access forbidden:', error.response?.data?.message);
        }
        
        if (error.response?.status === 404) {
            console.error('Resource not found:', error.config?.url);
        }
        
        return Promise.reject(error);
    }
);

export default api;
