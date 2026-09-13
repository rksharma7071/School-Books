import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User, Permission } from "../models/user.model.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLES = ["customer", "admin"];
const STATUSES = ["active", "blocked", "suspended"];

const SAFE_SELECT =
    "-password -otp -otpExpiry -otpAttempts -otpLastSentAt " +
    "-resetToken -resetTokenExpiry -emailVerificationToken " +
    "-emailVerificationTokenExpiry -emailVerificationSentAt -tokenVersion";

const PERMISSIONS = [
    "createUser",
    "updateUser",
    "deleteUser",
    "readUser",
    "createProduct",
    "updateProduct",
    "deleteProduct",
    "readProduct",
];

const publicUser = (user) => ({
    id: user._id,
    email: user.email,
    name: user.name,
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

        const allowedSort = [
            "createdAt",
            "updatedAt",
            "email",
            "role",
            "status",
        ];

        if (!allowedSort.includes(sortBy)) {
            return res.status(400).json({ success: false, message: "Invalid sortBy field" });
        }

        if (role && !ROLES.includes(role)) {
            return res.status(400).json({ success: false, message: "Invalid role" })
        }

        if (status && !STATUSES.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" })
        }

        const filter = {};

        if (role) filter.role = role;
        if (status) filter.status = status;

        if (emailVerified !== undefined) {
            filter.emailVerified = emailVerified === "true";
        }

        if (search) {
            filter.$or = ["email", "name"].map(
                (field) => ({
                    [field]: { $regex: search, $options: "i" },
                })
            );
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .select(SAFE_SELECT)
                .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .lean(),

            User.countDocuments(filter),
        ]);

        res.json({
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
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

export const getUserStats = async (req, res) => {
    try {
        const [roles, statuses, verification, totalUsers] = await Promise.all([
            User.aggregate([
                { $group: { _id: "$role", count: { $sum: 1 } } },
            ]),
            User.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } },
            ]),
            User.aggregate([
                { $group: { _id: "$emailVerified", count: { $sum: 1 } } },
            ]),
            User.countDocuments(),
        ]);

        const count = (data) =>
            Object.fromEntries(data.map((item) => [item._id, item.count]));

        const role = count(roles);
        const status = count(statuses);
        const verified = count(verification);

        res.json({
            success: true,
            stats: {
                totalUsers,

                customers: role.customer || 0,
                authors: role.author || 0,
                admins: role.admin || 0,

                activeUsers: status.active || 0,
                blockedUsers: status.blocked || 0,
                suspendedUsers: status.suspended || 0,

                verifiedUsers: verified.true || 0,
                unverifiedUsers: verified.false || 0,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

export const createNewUser = async (req, res) => {
    try {
        const {
            email,
            password,
            name,
            role = "customer",
            status = "active",
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "email and password are required" })
        }

        const normalizedEmail = email.toLowerCase().trim();

        if (!EMAIL_RE.test(normalizedEmail)) {
            return res.status(400).json({ success: false, message: "Invalid email format" })
        }

        if (password.length < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters" })
        }

        if (!ROLES.includes(role)) {
            return res.status(400).json({ success: false, message: "Invalid role" })
        }

        if (!STATUSES.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" })
        }

        const exists = await User.findOne({
            $or: [
                { email: normalizedEmail }
            ],
        });

        if (exists) {
            return res.status(400).json({ success: false, message: "Email is already registered." })
        }

        const user = await User.create({
            email: normalizedEmail,
            password: await bcrypt.hash(password, 10),
            name,
            role,
            status,
        });

        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: publicUser(user),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};


export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid user id" })
        }

        const user = await User.findById(id)
            .select(SAFE_SELECT)
            .lean();

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" })
        }

        res.json({
            success: true,
            user,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};


export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid user id" })
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" })
        }

        const { email, name, role, status } = req.body;

        const isAdmin = req.user?.role === "admin";
        console.log(req.user?.role);

        const isSelf = String(user._id) === String(req.user.id);

        if (email !== undefined) {
            const normalizedEmail = String(email).toLowerCase().trim();

            if (!EMAIL_RE.test(normalizedEmail)) {
                return res.status(400).json({ success: false, message: "Invalid email format" })
            }

            const exists = await User.findOne({
                email: normalizedEmail,
                _id: { $ne: id },
            });

            if (exists) {
                return res.status(409).json({ success: false, message: "Email is already registered." })
            }

            if (normalizedEmail !== user.email) {
                user.emailVerified = false;
                user.emailVerifiedAt = null;
            }

            user.email = normalizedEmail;
        }

        if (name !== undefined) {
            user.name = name;
        }

        if (role !== undefined) {
            if (!isAdmin) {
                return res.status(403).json({ success: false, message: "Only admins can change roles" })
            }

            if (!ROLES.includes(role)) {
                return res.status(400).json({ success: false, message: "Invalid role" })
            }

            if (isSelf && user.role === "admin" && role !== "admin") {
                const adminCount = await User.countDocuments({ role: "admin" });

                if (adminCount <= 1) {
                    return res.status(400).json({ success: false, message: "Cannot remove the last admin's role" })
                }
            }

            user.role = role;
        }

        if (status !== undefined) {
            if (!isAdmin) {
                return res.status(403).json({ success: false, message: "Only admins can change account status" })
            }

            if (!STATUSES.includes(status)) {
                return res.status(400).json({ success: false, message: "Invalid status" })
            }

            if (isSelf && status !== "active") {
                return res.status(400).json({ success: false, message: "You cannot change your own account status" })
            }

            user.status = status;

            if (status !== "active") {
                user.tokenVersion = (user.tokenVersion || 0) + 1;
            }
        }

        await user.save();

        res.json({
            success: true,
            user: publicUser(user),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};


export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid user id" })
        }

        if (String(id) === String(req.user.id)) {
            return res.status(400).json({ success: false, message: "You cannot delete your own account" })
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" })
        }

        if (user.role === "admin") {
            const adminCount = await User.countDocuments({
                role: "admin",
            });

            if (adminCount <= 1) {
                return res.status(400).json({ success: false, message: "Cannot delete the last remaining admin" })
            }
        }

        await Promise.all([
            User.findByIdAndDelete(id),
            Permission.deleteOne({ userId: id }),
        ]);

        res.json({
            success: true,
            message: "User deleted successfully",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};


export const updatePermission = async (req, res) => {
    try {
        const userId = req.body.userId || req.params.id;

        if (!userId) {
            return res.status(400).json({ success: false, message: "userId is required" })
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: "Invalid userId format" })
        }

        const user = await User.findById(userId).lean();

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" })
        }

        const updates = {};

        PERMISSIONS.forEach((key) => {
            if (req.body[key] !== undefined) {
                updates[key] = [true, "true", 1, "1"].includes(req.body[key]);
            }
        });

        const permission = await Permission.findOneAndUpdate(
            { userId },
            {
                $set: updates,
                $setOnInsert: { userId },
            },
            {
                new: true,
                upsert: true,
            }
        ).lean();

        res.json({
            success: true,
            message: "Permission saved successfully",
            permission,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};


export const getAllPermissions = async (req, res) => {
    try {
        const permissions = await Permission.find().lean();

        res.json({
            success: true,
            permissions,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};


export const getPermissionById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid user ID" })
        }

        const permission = await Permission.findOne({ userId: id }).lean();

        if (!permission) {
            return res.status(404).json({ success: false, message: "Permission not found for this user" })
        }

        res.json({
            success: true,
            permission,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};