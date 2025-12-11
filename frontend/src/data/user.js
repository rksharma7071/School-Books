import axios from "axios";

export const editUser = async ({ params }) => {
    try {
        const res = await axios.get(`/api/user/${params.id}`);
        return res.data || {};
    } catch (error) {
        // console.log("Edit User Error: ", error);
        return error;
    }
};
