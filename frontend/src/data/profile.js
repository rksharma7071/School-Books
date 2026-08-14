import axios from "axios";

const API = import.meta.env.VITE_API;

const getProfile = async () => {
    const user = JSON.parse(localStorage.getItem("user"));

    const [userRes, addressRes, orderRes] = await Promise.all([
        axios.get(`${API}/api/user/${user.id}`),
        axios.get(`${API}/api/address/user/${user.id}`),
        axios.get(`${API}/api/order`, { params: { userId: user.id } }),
    ]);

    return {
        user: userRes.data,
        address: addressRes.data.addresses,
        order: orderRes.data,
        permission: {},
    };
};

export default getProfile;