import mongoose from "mongoose";
import { Address } from "../models/user.model.js";

async function getAddresses(req, res) {
    try {
        const addresses = await Address.find().sort({ createdAt: -1 });
        return res.status(200).json(addresses);
    } catch (error) {
        console.error("Get addresses error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

async function createAddress(req, res) {
    try {
        const {
            userId,
            fullName,
            phone,
            address,
            city,
            state,
            pincode,
            country = "India",
            isDefault = false,
        } = req.body;

        if (
            !userId ||
            !fullName ||
            !phone ||
            !address ||
            !city ||
            !state ||
            !pincode
        ) {
            return res
                .status(400)
                .json({ message: "All required fields must be provided" });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid userId" });
        }
        if (isDefault) {
            await Address.updateMany(
                { userId },
                { $set: { isDefault: false } }
            );
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

        return res.status(201).json({
            message: "Address created successfully.",
            address: newAddress,
        });
    } catch (error) {
        console.log("Create address error: ", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

async function getAddressByUserId(req, res) {
    try {
        const { id: userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid userId" });
        }

        const addresses = await Address.find({ userId }).sort({
            isDefault: -1,
            createdAt: -1,
        });

        return res.status(200).json({
            message: "Addresses fetched successfully",
            addresses,
        });
    } catch (error) {
        console.error("Get address by user error:", error);
        return res.status(500).json({
            message: "Internal Server Error",
        });
    }
}

async function updateAddress(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid address id" });
        }

        const myaddress = await Address.findById(id);
        if (!myaddress) {
            return res.status(404).json({ message: "Address not found" });
        }

        const {
            fullName,
            phone,
            address,
            city,
            state,
            pincode,
            country,
            isDefault,
        } = req.body;

        if (fullName !== undefined) myaddress.fullName = fullName;
        if (phone !== undefined) myaddress.phone = phone;
        if (address !== undefined) myaddress.address = address;
        if (city !== undefined) myaddress.city = city;
        if (state !== undefined) myaddress.state = state;
        if (pincode !== undefined) myaddress.pincode = pincode;
        if (country !== undefined) myaddress.country = country;

        if (isDefault !== undefined) {
            if (isDefault === true) {
                await Address.updateMany(
                    { userId: myaddress.userId },
                    { isDefault: false }
                );
            }
            myaddress.isDefault = isDefault;
        }

        const result = await myaddress.save();

        return res.status(200).json({
            message: "Address updated successfully",
            address: result,
        });
    } catch (error) {
        console.error("Error updating address:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

async function deleteAddress(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid address id" });
        }

        const address = await Address.findByIdAndDelete(id);
        if (!address) {
            return res.status(404).json({ message: "Address not found" });
        }
        return res.status(200).json({
            message: "Address deleted successfully",
        });
    } catch (error) {
        console.error("Delete address error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

async function getAddressById(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid address id" });
        }

        const address = await Address.findById(id);

        if (!address) {
            return res.status(404).json({ message: "Address not found" });
        }

        return res.status(200).json({
            message: "Address fetched successfully",
            address,
        });
    } catch (error) {
        console.error("Get address by id error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export {
    getAddresses,
    createAddress,
    getAddressByUserId,
    updateAddress,
    deleteAddress,
    getAddressById,
};
