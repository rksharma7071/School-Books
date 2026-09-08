import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User, Permission } from "../models/user.model.js";
import { ApiError, handleError } from "../utils/apiError.js";

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select("-password -otp -otpExpiry").lean();
        res.json(users);
    } catch (error) {
        handleError(error, req, res);
    }
};

export const createNewUser = async (req, res) => {
    try {
        const { username, email, password, first_name, last_name, role } = req.body;

        const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] }).lean();
        if (existing) throw new ApiError(409, "Email or username already in use");

        const hashedPassword = await bcrypt.hash(password, 10);
        const created = await User.create({
            username,
            email: email.toLowerCase(),
            password: hashedPassword,
            first_name,
            last_name,
            role: ["customer", "author", "admin"].includes(role) ? role : "customer",
        });

        const user = created.toObject();
        delete user.password;
        res.status(201).json({ message: "User created successfully", user });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password -otp -otpExpiry").lean();
        res.json(user);
    } catch (error) {
        handleError(error, req, res);
    }
};

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, first_name, last_name, role } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid user id");

        const user = await User.findById(id);
        if (!user) throw new ApiError(404, "User not found");

        if (username) user.username = username;
        if (email) user.email = email;
        if (first_name) user.first_name = first_name;
        if (last_name) user.last_name = last_name;
        if (role && req.user?.role === "admin") user.role = role;

        const updated = await user.save();
        const obj = updated.toObject();
        delete obj.password;
        res.json({ status: "success", user: obj });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid user id");

        const deleted = await User.findByIdAndDelete(id);
        if (!deleted) throw new ApiError(404, "User not found");
        res.json({ status: "success", message: "User deleted successfully" });
    } catch (error) {
        handleError(error, req, res);
    }
};

const permissionFields = ["createUser", "updateUser", "deleteUser", "readUser", "createProduct", "updateProduct", "deleteProduct", "readProduct"];
const toBool = (v) => v === true || v === "true" || v === 1 || v === "1";

export const updatePermission = async (req, res) => {
    try {
        const body = req.body;
        const userId = body.userId || req.params.id;

        if (!userId) throw new ApiError(400, "userId is required");
        if (!mongoose.Types.ObjectId.isValid(userId)) throw new ApiError(400, "Invalid userId format");

        const updateFields = {};
        permissionFields.forEach((k) => {
            if (body[k] !== undefined && body[k] !== null) updateFields[k] = toBool(body[k]);
        });

        const permission = await Permission.findOneAndUpdate(
            { userId },
            { $set: updateFields, $setOnInsert: { userId } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        ).lean();

        res.status(200).json({ message: "Permission saved successfully", permission });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getAllPermissions = async (req, res) => {
    try {
        const permission = await Permission.find({}).lean();
        res.json(permission);
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getPermissionById = async (req, res) => {
    try {
        const userId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(userId)) throw new ApiError(400, "Invalid User ID format");

        const permission = await Permission.findOne({ userId }).lean();
        if (!permission) throw new ApiError(404, "Permission not found for this user");
        res.status(200).json(permission);
    } catch (error) {
        handleError(error, req, res);
    }
};