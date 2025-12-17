import axios from "axios";

const getDiscount = async () => {
    try {
        const { data } = await axios.get("/api/discount");
        return data ?? [];
    } catch (error) {
        console.error("Failed to fetch discounts:", error);
        return [];
    }
};

const getDiscountById = ({ params }) => {
    console.log("Params:", params);

    return [];
};

export { getDiscount, getDiscountById };
