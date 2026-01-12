import axios from "axios";

const getAddress = async () => {
    const user = JSON.parse(localStorage.getItem("user"));

    try {
        const res = await axios.get(
            `${import.meta.env.VITE_API}/api/address/user/${user.id}`
        );
        console.log("Get Address: ", res.data);

        return res.data.address;
    } catch (error) {}
    return addressRes.data.address;
};

const getAddressById = async ({ params }) => {
    const { id } = params;

    try {
        const res = await axios.get(
            `${import.meta.env.VITE_API}/api/address/${id}`
        );

        return res.data.address;
    } catch (error) {
        throw new Response(
            error.response?.data?.message || "Failed to load address",
            { status: error.response?.status || 500 }
        );
    }
};

export { getAddress, getAddressById };
