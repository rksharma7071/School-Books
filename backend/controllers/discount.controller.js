import mongoose from "mongoose";
import { Discount } from "../models/discount.model.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

const getAllDiscount = asyncHandler(async (req, res) => {
    const discount = await Discount.find({}).lean();
    return res.status(200).json(discount || []);
});

const getDiscountById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid Discount ID" });
    }
    const discount = await Discount.findById(id).lean();
    if (!discount) return res.status(404).json({ message: "Discount not found" });
    return res.status(200).json(discount);
});

const createDiscount = asyncHandler(async (req, res) => {
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
        return res.status(400).json({
            message: "discount_code, discount_type and amount are required",
        });
    }
    if (!["percentage", "fixed_amount"].includes(discount_type)) {
        return res
            .status(400)
            .json({ message: "discount_type must be percentage or fixed_amount" });
    }

    const existing = await Discount.findOne({
        discount_code: discount_code.toUpperCase(),
    }).lean();
    if (existing) {
        return res.status(409).json({ message: "Discount code already exists" });
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
});

const updateDiscount = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid Discount ID" });
    }

    const discount = await Discount.findById(id);
    if (!discount) return res.status(404).json({ message: "Discount not found" });

    Object.keys(req.body).forEach((key) => {
        if (req.body[key] !== undefined) discount[key] = req.body[key];
    });

    await discount.save();
    return res
        .status(200)
        .json({ message: "Discount code updated successfully", discount });
});

const deleteDiscount = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid Discount ID" });
    }
    const discount = await Discount.findByIdAndDelete(id);
    if (!discount) return res.status(404).json({ message: "Discount not found" });
    return res.status(200).json({ message: "Discount deleted successfully" });
});

const applyDiscount = asyncHandler(async (req, res) => {
    const { code, amount } = req.body;
    if (!code || amount === undefined) {
        return res
            .status(400)
            .json({ message: "Discount code and amount are required" });
    }

    const discount = await Discount.findOne({
        discount_code: String(code).toUpperCase(),
        active: true,
    });
    if (!discount) {
        return res
            .status(404)
            .json({ message: "Invalid or inactive discount code" });
    }

    const now = new Date();
    if (discount.starts_at && now < discount.starts_at) {
        return res.status(400).json({ message: "Discount not active yet" });
    }
    if (discount.ends_at && now > discount.ends_at) {
        return res.status(400).json({ message: "Discount has expired" });
    }
    
    if (
        discount.usage_limit !== null &&
        discount.usage_limit !== undefined &&
        discount.used_count >= discount.usage_limit
    ) {
        return res.status(400).json({ message: "Discount usage limit reached" });
    }

    let discountAmount = 0;
    if (discount.discount_type === "fixed_amount") {
        discountAmount = discount.amount;
    } else if (discount.discount_type === "percentage") {
        discountAmount = Math.round((amount * discount.amount) / 100);
    }
    discountAmount = Math.min(discountAmount, amount);

    return res.status(200).json({
        discountAmount,
        discountCode: discount.discount_code,
    });
});

export {
    getAllDiscount,
    getDiscountById,
    createDiscount,
    updateDiscount,
    deleteDiscount,
    applyDiscount,
};
