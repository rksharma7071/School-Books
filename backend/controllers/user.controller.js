import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User, Permission } from "../models/user.model.js";
import bcrypt from "bcrypt";

async function handleGetAllUsers(req, res) {
    const users = await User.find({})
        .select("-password -otp -otpExpiry")
        .lean();
    return res.json(users);
}

async function handleCreateNewUser(req, res) {
    const { username, email, password, first_name, last_name, role } = req.body;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(body.password, salt);

        const result = await User.create({
            username: body.username,
            email: body.email,
            password: hashedPassword,
            first_name: body.first_name,
            last_name: body.last_name,
            role: "author",
        });

    const existing = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { username }],
    }).lean();
    if (existing) {
        return res
            .status(409)
            .json({ message: "Email or username already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const created = await User.create({
        username,
        email,
        password: hashedPassword,
        first_name,
        last_name,
        role: ["customer", "author", "admin"].includes(role) ? role : "author",
    });

    const obj = created.toObject();
    delete obj.password;
    return res
        .status(201)
        .json({ message: "User created successfully", user: obj });
}

async function handleGetUserUinsgId(req, res) {
    const user = await User.findById(req.params.id)
        .select("-password -otp -otpExpiry")
        .lean();
    return res.json(user);
}

async function handleUpdateUserUsingId(req, res) {
    const { id } = req.params;
    const { username, email, first_name, last_name, role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (username) user.username = username;
    if (email) user.email = email;
    if (first_name) user.first_name = first_name;
    if (last_name) user.last_name = last_name;
    if (role && req.user?.role === "admin") user.role = role;

    const updated = await user.save();
    const obj = updated.toObject();
    delete obj.password;

    return res.json({ status: "success", user: obj });
}

async function handleDeleteUserUsingId(req, res) {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid user id" });
    }
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "User not found" });
    return res.json({ status: "success", message: "User deleted successfully" });
}

const permissionFields = [
    "createUser",
    "updateUser",
    "deleteUser",
    "readUser",
    "createBook",
    "updateBook",
    "deleteBook",
    "readBook",
];

const toBool = (v) => v === true || v === "true" || v === 1 || v === "1";

async function handleUpdatePermission(req, res) {
    const body = req.body;
    const userId = body.userId || req.params.id;

    if (!userId) return res.status(400).json({ message: "userId is required" });
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid userId format" });
    }

    const updateFields = {};
    permissionFields.forEach((k) => {
        if (body[k] !== undefined && body[k] !== null) {
            updateFields[k] = toBool(body[k]);
        }
    });

    const permission = await Permission.findOneAndUpdate(
        { userId },
        { $set: updateFields, $setOnInsert: { userId } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return res.status(200).json({
        message: "Permission saved successfully",
        permission,
    });
}

async function handleAllPermission(req, res) {
    const permission = await Permission.find({}).lean();
    return res.json(permission);
}

async function handleGetPermissionUsingId(req, res) {
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid User ID format" });
    }
    const permission = await Permission.findOne({ userId }).lean();
    if (!permission) {
        return res
            .status(404)
            .json({ message: "Permission not found for this user" });
    }
    return res.status(200).json(permission);
}

const wGetAllUsers = asyncHandler(handleGetAllUsers);
const wCreateNewUser = asyncHandler(handleCreateNewUser);
const wGetUserUinsgId = asyncHandler(handleGetUserUinsgId);
const wUpdateUserUsingId = asyncHandler(handleUpdateUserUsingId);
const wDeleteUserUsingId = asyncHandler(handleDeleteUserUsingId);
const wGetPermissionUsingId = asyncHandler(handleGetPermissionUsingId);
const wUpdatePermission = asyncHandler(handleUpdatePermission);
const wAllPermission = asyncHandler(handleAllPermission);

export {
    wGetAllUsers as handleGetAllUsers,
    wCreateNewUser as handleCreateNewUser,
    wGetUserUinsgId as handleGetUserUinsgId,
    wUpdateUserUsingId as handleUpdateUserUsingId,
    wDeleteUserUsingId as handleDeleteUserUsingId,
    wGetPermissionUsingId as handleGetPermissionUsingId,
    wUpdatePermission as handleUpdatePermission,
    wAllPermission as handleAllPermission,
};
