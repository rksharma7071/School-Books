import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User, Permission } from "../models/user.model.js";
import { ApiError, handleError } from "../utils/apiError.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,30}$/;
const VALID_ROLES = ["customer", "author", "admin"];
const VALID_STATUSES = ["active", "blocked", "suspended"];
const SORT_WHITELIST = ["createdAt", "updatedAt", "username", "email", "role", "status"];

const SAFE_SELECT =
    "-password -otp -otpExpiry -otpAttempts -otpLastSentAt -resetToken -resetTokenExpiry -emailVerificationToken -emailVerificationTokenExpiry -emailVerificationSentAt -tokenVersion";

const publicUser = (user) => ({
    id: user._id,
    username: user.username,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
});

export const getAllUsers = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            role,
            status,
            emailVerified,
            sortBy = "createdAt",
            sortOrder = "desc",
        } = req.query;

        const pageNum = Math.max(1, Number(page) || 1);
        const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));

        if (!SORT_WHITELIST.includes(sortBy)) {
            throw new ApiError(400, `Invalid sortBy field. Allowed: ${SORT_WHITELIST.join(", ")}`);
        }

        const filter = {};

        if (role !== undefined) {
            if (!VALID_ROLES.includes(role)) throw new ApiError(400, `Invalid role. Allowed: ${VALID_ROLES.join(", ")}`);
            filter.role = role;
        }

        if (status !== undefined) {
            if (!VALID_STATUSES.includes(status)) throw new ApiError(400, `Invalid status. Allowed: ${VALID_STATUSES.join(", ")}`);
            filter.status = status;
        }

        if (emailVerified !== undefined) {
            filter.emailVerified = emailVerified === "true" || emailVerified === true;
        }

        if (search) {
            filter.$or = [
                { username: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { first_name: { $regex: search, $options: "i" } },
                { last_name: { $regex: search, $options: "i" } },
            ];
        }

        const sortOrderValue = sortOrder === "asc" ? 1 : -1;

        const [users, total] = await Promise.all([
            User.find(filter)
                .select(SAFE_SELECT)
                .sort({ [sortBy]: sortOrderValue })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .lean(),
            User.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            users,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getUserStats = async (req, res) => {
    try {
        const [roleStats, statusStats, verificationStats, totalUsers] = await Promise.all([
            User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
            User.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
            User.aggregate([{ $group: { _id: "$emailVerified", count: { $sum: 1 } } }]),
            User.countDocuments({}),
        ]);

        const roleCounts = Object.fromEntries(roleStats.map((r) => [r._id, r.count]));
        const statusCounts = Object.fromEntries(statusStats.map((s) => [s._id, s.count]));
        const verificationCounts = Object.fromEntries(verificationStats.map((v) => [String(v._id), v.count]));

        res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                customers: roleCounts.customer || 0,
                authors: roleCounts.author || 0,
                admins: roleCounts.admin || 0,
                activeUsers: statusCounts.active || 0,
                blockedUsers: statusCounts.blocked || 0,
                suspendedUsers: statusCounts.suspended || 0,
                verifiedUsers: verificationCounts.true || 0,
                unverifiedUsers: verificationCounts.false || 0,
            },
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const createNewUser = async (req, res) => {
    try {
        const { username, email, password, first_name, last_name, role, status } = req.body;

        if (!username || !email || !password) throw new ApiError(400, "Username, email and password are required");
        if (!USERNAME_RE.test(username)) throw new ApiError(400, "Username must be 3-30 characters (letters, numbers, . _ -)");
        if (!EMAIL_RE.test(email)) throw new ApiError(400, "Invalid email format");
        if (String(password).length < 8) throw new ApiError(400, "Password must be at least 8 characters");

        const normalizedEmail = email.toLowerCase().trim();

        const existing = await User.findOne({ $or: [{ email: normalizedEmail }, { username }] }).lean();
        if (existing) throw new ApiError(409, "Email or username already in use");

        if (role !== undefined && !VALID_ROLES.includes(role)) {
            throw new ApiError(400, `Invalid role. Allowed: ${VALID_ROLES.join(", ")}`);
        }
        if (status !== undefined && !VALID_STATUSES.includes(status)) {
            throw new ApiError(400, `Invalid status. Allowed: ${VALID_STATUSES.join(", ")}`);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const created = await User.create({
            username,
            email: normalizedEmail,
            password: hashedPassword,
            first_name,
            last_name,
            role: role || "customer",
            status: status || "active",
        });

        res.status(201).json({ success: true, message: "User created successfully", user: publicUser(created) });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid user id");

        const user = await User.findById(id).select(SAFE_SELECT).lean();
        if (!user) throw new ApiError(404, "User not found");

        res.status(200).json({ success: true, user });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid user id");

        const { username, email, first_name, last_name, role, status } = req.body;
        const isAdmin = req.user?.role === "admin";

        const user = await User.findById(id);
        if (!user) throw new ApiError(404, "User not found");

        if (username !== undefined) {
            if (!USERNAME_RE.test(username)) throw new ApiError(400, "Username must be 3-30 characters (letters, numbers, . _ -)");
            const existing = await User.findOne({ username, _id: { $ne: id } }).lean();
            if (existing) throw new ApiError(409, "Username already in use");
            user.username = username;
        }

        if (email !== undefined) {
            const normalizedEmail = String(email).toLowerCase().trim();
            if (!EMAIL_RE.test(normalizedEmail)) throw new ApiError(400, "Invalid email format");
            const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: id } }).lean();
            if (existing) throw new ApiError(409, "Email already in use");
            if (normalizedEmail !== user.email) {
                user.emailVerified = false;
                user.emailVerifiedAt = null;
            }
            user.email = normalizedEmail;
        }

        if (first_name !== undefined) user.first_name = first_name;
        if (last_name !== undefined) user.last_name = last_name;

        if (role !== undefined) {
            if (!isAdmin) throw new ApiError(403, "Only admins can change roles");
            if (!VALID_ROLES.includes(role)) throw new ApiError(400, `Invalid role. Allowed: ${VALID_ROLES.join(", ")}`);

            if (String(user._id) === String(req.user.id) && user.role === "admin" && role !== "admin") {
                const adminCount = await User.countDocuments({ role: "admin" });
                if (adminCount <= 1) throw new ApiError(400, "Cannot remove the last admin's role");
            }
            user.role = role;
        }

        if (status !== undefined) {
            if (!isAdmin) throw new ApiError(403, "Only admins can change account status");
            if (!VALID_STATUSES.includes(status)) throw new ApiError(400, `Invalid status. Allowed: ${VALID_STATUSES.join(", ")}`);
            if (String(user._id) === String(req.user.id) && status !== "active") {
                throw new ApiError(400, "You cannot change your own account status");
            }
            user.status = status;
            if (status !== "active") {
                user.tokenVersion = (user.tokenVersion || 0) + 1;
            }
        }

        await user.save();

        res.json({ status: "success", user: publicUser(user) });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid user id");

        if (String(id) === String(req.user.id)) {
            throw new ApiError(400, "You cannot delete your own account");
        }

        const user = await User.findById(id);
        if (!user) throw new ApiError(404, "User not found");

        if (user.role === "admin") {
            const adminCount = await User.countDocuments({ role: "admin" });
            if (adminCount <= 1) throw new ApiError(400, "Cannot delete the last remaining admin");
        }

        await User.findByIdAndDelete(id);
        await Permission.deleteOne({ userId: id });

        res.json({ status: "success", message: "User deleted successfully" });
    } catch (error) {
        handleError(error, req, res);
    }
};

const permissionFields = [
    "createUser",
    "updateUser",
    "deleteUser",
    "readUser",
    "createProduct",
    "updateProduct",
    "deleteProduct",
    "readProduct",
];
const toBool = (v) => v === true || v === "true" || v === 1 || v === "1";

export const updatePermission = async (req, res) => {
    try {
        const body = req.body;
        const userId = body.userId || req.params.id;

        if (!userId) throw new ApiError(400, "userId is required");
        if (!mongoose.Types.ObjectId.isValid(userId)) throw new ApiError(400, "Invalid userId format");

        const targetUser = await User.findById(userId).lean();
        if (!targetUser) throw new ApiError(404, "User not found");

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
        res.json({ success: true, permissions: permission });
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
        res.status(200).json({ success: true, permission });
    } catch (error) {
        handleError(error, req, res);
    }
};