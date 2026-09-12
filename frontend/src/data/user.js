import axios from "axios";

const editUser = async ({ params }) => {
    try {
        const [userRes, permisssionRes] = await Promise.all([
            axios.get(`${import.meta.env.VITE_API}/api/user/${params.id}`),
            axios.get(`${import.meta.env.VITE_API}/api/user/permission/${params.id}`),
        ]);
        return {
            user: userRes.data,
            permission: permisssionRes.data,
        };
    } catch (error) {
        console.error("Edit User Error:", error);

        throw error?.response?.data || { message: "Failed to fetch user data" };
    }
};


export {
    editUser
}
