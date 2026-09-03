import mongoose from "mongoose";
import { Address } from "../models/user.model.js";
import { asyncHandler, ApiError } from "../middlewares/asyncHandler.js";

export const getAddresses = asyncHandler(async (req, res) => {
    const addresses = await Address.find().sort({ createdAt: -1 }).lean();
    res.status(200).json(addresses);
});

export const createAddress = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { fullName, phone, address, city, state, pincode, country = "India", isDefault = false } = req.body;

    if (!fullName || !phone || !address || !city || !state || !pincode) {
        throw new ApiError(400, "All required fields must be provided");
    }

    if (isDefault) {
        await Address.updateMany({ userId }, { isDefault: false });
    }

    const newAddress = await Address.create({
        userId,
        fullName,
        phone,
        address,
        city,
        state,
        pincode,
        country,
        isDefault,
    });

    res.status(201).json({ message: "Address created successfully.", address: newAddress });
});

export const getAddressByUserId = asyncHandler(async (req, res) => {
    const { id: userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid userId");
    }

    if (req.user.role !== "admin" && String(userId) !== String(req.user.id)) {
        throw new ApiError(403, "You can only view your own addresses");
    }

    const addresses = await Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 }).lean();
    res.status(200).json({ message: "Addresses fetched successfully", addresses });
});

export const getAddressById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid address id");
    }

    const address = await Address.findById(id).lean();
    if (!address) throw new ApiError(404, "Address not found");

    if (req.user.role !== "admin" && String(address.userId) !== String(req.user.id)) {
        throw new ApiError(403, "Access denied. You can only view your own addresses.");
    }

    res.status(200).json({ message: "Address fetched successfully", address });
});

export const updateAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid address id");
    }

    const address = await Address.findById(id);
    if (!address) throw new ApiError(404, "Address not found");

    if (req.user.role !== "admin" && String(address.userId) !== String(req.user.id)) {
        throw new ApiError(403, "Access denied. You can only update your own addresses.");
    }

    const { fullName, phone, address: addressLine, city, state, pincode, country, isDefault } = req.body;

    if (fullName !== undefined) address.fullName = fullName;
    if (phone !== undefined) address.phone = phone;
    if (addressLine !== undefined) address.address = addressLine;
    if (city !== undefined) address.city = city;
    if (state !== undefined) address.state = state;
    if (pincode !== undefined) address.pincode = pincode;
    if (country !== undefined) address.country = country;

    if (isDefault !== undefined) {
        if (isDefault === true) {
            await Address.updateMany({ userId: address.userId }, { isDefault: false });
        }
        address.isDefault = isDefault;
    }

    const result = await address.save();
    res.status(200).json({ message: "Address updated successfully", address: result });
});

export const deleteAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid address id");
    }

    const address = await Address.findById(id);
    if (!address) throw new ApiError(404, "Address not found");

    if (req.user.role !== "admin" && String(address.userId) !== String(req.user.id)) {
        throw new ApiError(403, "Access denied. You can only delete your own addresses.");
    }

    if (address.isDefault) {
        await Address.findOneAndUpdate(
            { userId: address.userId, _id: { $ne: id } },
            { $set: { isDefault: true } },
            { sort: { createdAt: 1 } }
        );
    }

    await Address.findByIdAndDelete(id);
    res.status(200).json({ message: "Address deleted successfully" });
});