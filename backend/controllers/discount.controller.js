import mongoose from "mongoose";
import { Discount } from "../models/discount.model.js";

async function getAllDiscount(req, res) {
    try {
        const discount = await Discount.find({});
        return res.status(200).json(discount || []);
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

async function getDiscountById(req, res) {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid Discount ID" });
    }

    const discount = await Discount.findById(id);
    if (!discount) {
        return res.status(404).json({ message: "Discount not found" });
    }
    return res.status(200).json(discount);
}

async function createDiscount(req, res) {
    try {
        const {
            discount_code,
            discount_type,
            amount,
            starts_at,
            ends_at,
            usage_limit,
            active,
        } = req.body;

        if (!discount_code || !discount_type || amount === undefined) {
            return res
                .status(400)
                .json({
                    message: "discount_code, discount_type and amount are required",
                });
        }

        const existingDiscount = await Discount.findOne({ discount_code });
        if (existingDiscount) {
            return res
                .status(409)
                .json({ message: "Discount code already exists" });
        }

        const discount = await Discount.create({
            discount_code,
            discount_type,
            amount,
            starts_at,
            ends_at,
            usage_limit,
            active,
        });

        return res
            .status(201)
            .json({ message: "Discount successfully created", discount });
    } catch (error) {
        console.error("Discount create error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

async function updateDiscount(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid Discount ID" });
        }

        const discount = await Discount.findById(id);
        if (!discount) {
            return res.status(404).json({ message: "Discount not found" });
        }

        Object.keys(req.body).forEach((key) => {
            if (req.body[key] !== undefined) {
                discount[key] = req.body[key];
            }
        });

        await discount.save();

        return res.status(200).json({
            message: "Discount code updated successfully",
            discount
        });
    } catch (error) {
        console.error("Discount update error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

async function deleteDiscount(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid Discount ID" });
        }

        const discount = await Discount.findByIdAndDelete(id);
        if (!discount) {
            return res.status(404).json({ message: "Discount not found" });
        }

        return res.status(200).json({ message: "Discount deleted successfully" });
    } catch (error) {
        console.error("Discount delete error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export {
    getAllDiscount,
    getDiscountById,
    createDiscount,
    updateDiscount,
    deleteDiscount,
};
