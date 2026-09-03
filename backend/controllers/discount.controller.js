import mongoose from "mongoose";
import { Discount } from "../models/discount.model.js";
import { asyncHandler, ApiError } from "../middlewares/asyncHandler.js";

export const getAllDiscount = asyncHandler(async (req, res) => {
    const discount = await Discount.find({}).lean();
    res.status(200).json(discount || []);
});

export const getDiscountById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid Discount ID");
    const discount = await Discount.findById(id).lean();
    if (!discount) throw new ApiError(404, "Discount not found");
    res.status(200).json(discount);
});

export const createDiscount = asyncHandler(async (req, res) => {
    const { discount_code, discount_type, amount, starts_at, ends_at, usage_limit, active } = req.body;
    if (!discount_code || !discount_type || amount === undefined) throw new ApiError(400, "discount_code, discount_type and amount are required");
    if (!["percentage", "fixed_amount"].includes(discount_type)) throw new ApiError(400, "discount_type must be percentage or fixed_amount");

    const existing = await Discount.findOne({ discount_code: discount_code.toUpperCase() }).lean();
    if (existing) throw new ApiError(409, "Discount code already exists");

    const discount = await Discount.create({ discount_code, discount_type, amount, starts_at, ends_at, usage_limit, active });
    res.status(201).json({ message: "Discount successfully created", discount });
});

export const updateDiscount = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid Discount ID");

    const discount = await Discount.findById(id);
    if (!discount) throw new ApiError(404, "Discount not found");

    Object.keys(req.body).forEach((key) => {
        if (req.body[key] !== undefined) discount[key] = req.body[key];
    });

    await discount.save();
    res.status(200).json({ message: "Discount code updated successfully", discount });
});

export const deleteDiscount = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid Discount ID");
    const discount = await Discount.findByIdAndDelete(id);
    if (!discount) throw new ApiError(404, "Discount not found");
    res.status(200).json({ message: "Discount deleted successfully" });
});

export const applyDiscount = asyncHandler(async (req, res) => {
    const { code, amount } = req.body;
    if (!code || amount === undefined) throw new ApiError(400, "Discount code and amount are required");

    const discount = await Discount.findOne({ discount_code: String(code).toUpperCase(), active: true });
    if (!discount) throw new ApiError(404, "Invalid or inactive discount code");

    const now = new Date();
    if (discount.starts_at && now < discount.starts_at) throw new ApiError(400, "Discount not active yet");
    if (discount.ends_at && now > discount.ends_at) throw new ApiError(400, "Discount has expired");
    if (discount.usage_limit != null && discount.used_count >= discount.usage_limit) throw new ApiError(400, "Discount usage limit reached");

    let discountAmount = discount.discount_type === "fixed_amount" ? discount.amount : Math.round((amount * discount.amount) / 100);
    discountAmount = Math.min(discountAmount, amount);

    res.status(200).json({ discountAmount, discountCode: discount.discount_code });
});