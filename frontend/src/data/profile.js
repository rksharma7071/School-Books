import axios from "axios";

const getProfile = async () => {
    const user = JSON.parse(localStorage.getItem("user"));

    const [userRes, addressRes, permisssionRes, orderRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API}/api/user/${user.id}`),
        axios.get(`${import.meta.env.VITE_API}/api/address/user/${user.id}`),
        axios.get(`${import.meta.env.VITE_API}/api/user/permission/`),
        axios.get(`${import.meta.env.VITE_API}/api/order`),
    ]);

    const allOrder = orderRes.data.filter(
        (order) => order.userId._id == user.id
    );

    return {
        user: userRes.data,
        address: addressRes.data.addresses,
        permission: permisssionRes.data,
        order: allOrder,
    };
};

export default getProfile;
