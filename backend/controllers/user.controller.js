import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User, Permission } from "../models/user.model.js";
import { asyncHandler, ApiError } from "../middlewares/asyncHandler.js";

export const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({}).select("-password -otp -otpExpiry").lean();
    res.json(users);
});

export const createNewUser = asyncHandler(async (req, res) => {
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
        role: ["customer", "author", "admin"].includes(role) ? role : "author",
    });

    const user = created.toObject();
    delete user.password;
    res.status(201).json({ message: "User created successfully", user });
});

export const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select("-password -otp -otpExpiry").lean();
    res.json(user);
});

export const updateUser = asyncHandler(async (req, res) => {
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
});

export const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid user id");

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) throw new ApiError(404, "User not found");
    res.json({ status: "success", message: "User deleted successfully" });
});

const permissionFields = ["createUser", "updateUser", "deleteUser", "readUser", "createBook", "updateBook", "deleteBook", "readBook"];
const toBool = (v) => v === true || v === "true" || v === 1 || v === "1";

export const updatePermission = asyncHandler(async (req, res) => {
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
});

export const getAllPermissions = asyncHandler(async (req, res) => {
    const permission = await Permission.find({}).lean();
    res.json(permission);
});

export const getPermissionById = asyncHandler(async (req, res) => {
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new ApiError(400, "Invalid User ID format");

    const permission = await Permission.findOne({ userId }).lean();
    if (!permission) throw new ApiError(404, "Permission not found for this user");
    res.status(200).json(permission);
});