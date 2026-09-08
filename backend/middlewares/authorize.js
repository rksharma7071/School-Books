import mongoose from "mongoose";
import { Address, Permission } from "../models/user.model.js";
import { Cart } from "../models/cart.model.js";
import { Review } from "../models/review.model.js";

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: "You are not authorized to perform this action" });
        }

        next();
    };
};

const selfOrAdmin = (paramName = "id") => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }

        const requestedUserId = req.params[paramName];

        if (req.user.role === "admin") {
            return next();
        }

        if (String(req.user.id) !== String(requestedUserId)) {
            return res.status(403).json({ success: false, message: "You are not authorized to access this resource" });
        }

        next();
    };
};

const authorizePermission = (permissionField) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, message: "Authentication required" });
            }

            if (req.user.role === "admin") {
                return next();
            }

            const permission = await Permission.findOne({ userId: req.user.id }).lean();
            if (!permission || !permission[permissionField]) {
                return res.status(403).json({ success: false, message: "You do not have permission to perform this action" });
            }

            next();
        } catch (error) {
            return res.status(500).json({ success: false, message: "Error verifying permission" });
        }
    };
};

const verifyAddressOwnership = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid address ID" });
        }

        const address = await Address.findById(id);
        if (!address) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }

        req.address = address;

        if (req.user.role !== "admin" && String(address.userId) !== String(req.user.id)) {
            return res.status(403).json({ success: false, message: "Access denied. You can only access your own addresses." });
        }

        next();
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error verifying address ownership" });
    }
};

const verifyCartOwnership = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid cart ID" });
        }

        const cart = await Cart.findById(id);
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        req.cart = cart;

        if (req.user.role !== "admin" && String(cart.userId) !== String(req.user.id)) {
            return res.status(403).json({ success: false, message: "Access denied. You can only access your own cart." });
        }

        next();
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error verifying cart ownership" });
    }
};

const verifyReviewOwnership = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid review ID" });
        }

        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        req.review = review;

        if (req.user.role !== "admin" && String(review.userId) !== String(req.user.id)) {
            return res.status(403).json({ success: false, message: "Access denied. You can only access your own reviews." });
        }

        next();
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error verifying review ownership" });
    }
};

export {
    authorize,
    selfOrAdmin,
    authorizePermission,
    verifyAddressOwnership,
    verifyCartOwnership,
    verifyReviewOwnership,
};