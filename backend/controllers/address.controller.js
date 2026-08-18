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
        const userId = req.user.id; // ✅ Use authenticated user ID
        const {
            fullName,
            phone,
            address,
            city,
            state,
            pincode,
            country = "India",
            isDefault = false,
        } = req.body; // ✅ Removed userId from body

        if (
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

        // ✅ If setting as default, unset other defaults for this user
        if (isDefault) {
            await Address.updateMany(
                { userId },
                { $set: { isDefault: false } }
            );
        }

        const newAddress = await Address.create({
            userId, // ✅ Use authenticated user ID
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

        // ✅ Verify user is requesting their own addresses or is admin
        if (
            req.user.role !== "admin" &&
            String(userId) !== String(req.user.id)
        ) {
            return res.status(403).json({
                success: false,
                message: "You can only view your own addresses",
            });
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

        // ✅ Verify ownership
        if (
            req.user.role !== "admin" &&
            String(address.userId) !== String(req.user.id)
        ) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You can only view your own addresses.",
            });
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

async function updateAddress(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid address id" });
        }

        const address = await Address.findById(id);
        if (!address) {
            return res.status(404).json({ message: "Address not found" });
        }

        // ✅ Verify ownership before updating
        if (
            req.user.role !== "admin" &&
            String(address.userId) !== String(req.user.id)
        ) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You can only update your own addresses.",
            });
        }

        const {
            fullName,
            phone,
            address: addressLine,
            city,
            state,
            pincode,
            country,
            isDefault,
        } = req.body;

        // Update fields
        if (fullName !== undefined) address.fullName = fullName;
        if (phone !== undefined) address.phone = phone;
        if (addressLine !== undefined) address.address = addressLine;
        if (city !== undefined) address.city = city;
        if (state !== undefined) address.state = state;
        if (pincode !== undefined) address.pincode = pincode;
        if (country !== undefined) address.country = country;

        // Handle default address logic
        if (isDefault !== undefined) {
            if (isDefault === true) {
                // Unset other defaults for this user
                await Address.updateMany(
                    { userId: address.userId },
                    { isDefault: false }
                );
            }
            address.isDefault = isDefault;
        }

        const result = await address.save();

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

        // ✅ First check if address exists and belongs to user
        const address = await Address.findById(id);
        if (!address) {
            return res.status(404).json({ message: "Address not found" });
        }

        // ✅ Verify ownership before deletion
        if (
            req.user.role !== "admin" &&
            String(address.userId) !== String(req.user.id)
        ) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You can only delete your own addresses.",
            });
        }

        // If this was the default address, set another as default
        if (address.isDefault) {
            const nextAddress = await Address.findOneAndUpdate(
                { userId: address.userId, _id: { $ne: id } },
                { $set: { isDefault: true } },
                { sort: { createdAt: 1 } }
            );
        }

        await Address.findByIdAndDelete(id);

        return res.status(200).json({
            message: "Address deleted successfully",
        });
    } catch (error) {
        console.error("Delete address error:", error);
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