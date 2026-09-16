// data/product.js
import axios from "axios";
import api from "../utils/api.js";

const searchProductsLoader = async ({ request } = {}) => {
  try {
    const url = new URL(request?.url ?? window.location.href);
    const q = url.searchParams.get("q") ?? "";
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const limit = Math.max(1, Number(url.searchParams.get("limit")) || 20);

    if (!q || q.trim().length < 2) {
      return {
        query: q,
        data: [],
        pagination: { total: 0, page: 1, limit, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
      };
    }

    const { data } = await axios.get(
      `${import.meta.env.VITE_API}/api/product`,
      {
        params: { search: q, page, limit },
        signal: request?.signal,
      }
    );

    const list = Array.isArray(data?.data) ? data.data : [];
    const meta = data?.pagination ?? data?.meta ?? {};

    return {
      query: q,
      data: list,
      pagination: {
        total: meta.total ?? list.length,
        page: meta.page ?? page,
        limit: meta.limit ?? limit,
        totalPages: meta.totalPages ?? Math.max(1, Math.ceil((meta.total ?? list.length) / limit)),
        hasNextPage: meta.hasNextPage ?? false,
        hasPreviousPage: meta.hasPreviousPage ?? false,
      },
    };
  } catch (error) {
    if (axios.isCancel?.(error)) return { query: "", data: [], pagination: {} };
    console.error("Search failed:", error);
    return { query: "", data: [], pagination: {} };
  }
};

const getProducts = async ({ request } = {}) => {
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

const getProductById = async ({ params }) => {
  try {
    const { data } = await api.get(`/api/product/${params.id}`);
    console.log("Get Book By Id", data.data);
    return data?.data || null;
  } catch (error) {
    console.error("Error fetching book by ID:", error);
    return null;
  }
};

const getProductByHandle = async ({ params }) => {
  try {
    const { data } = await api.get(`/api/product/${params.handle}`);
    return data?.data || null;
  } catch (error) {
    console.error("Error fetching book by handle:", error);
    return null;
  }
};

const editProductLoader = async ({ params }) => {
  const token = localStorage.getItem("token");
  const res = await axios.get(
    `${import.meta.env.VITE_API}/api/product/admin/${params.id}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data.data;
};

const getProductsData = async ({ request } = {}) => {
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

export {
  searchProductsLoader,
  getProducts,
  getProductById,
  getProductByHandle,
  editProductLoader,
  getProductsData
}
