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

const getUsersData = async () => {

}

export {
    editUser,
    getUsersData
}