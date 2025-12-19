import mongoose from "mongoose";
import { User, Permission } from "../models/user.model.js";

async function handleGetAllUsers(req, res) {
    const users = await User.find({});
    return res.json(users);
}

async function handleCreateNewUser(req, res) {
    try {
        const body = req.body;

        if (
            !body.username ||
            !body.email ||
            !body.password ||
            !body.first_name ||
            !body.last_name ||
            !body.role
        ) {
            return res.status(400).json({ message: "All fields are required..." });
        }

        const result = await User.create({
            username: body.username,
            email: body.email,
            password: body.password,
            first_name: body.first_name,
            last_name: body.last_name,
            role: "author",
        });

        return res
            .status(201)
            .json({ message: "User created successfully", user: result });
    } catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

async function handleGetUserUinsgId(req, res) {
    const user = await User.findById(req.params.id);
    return res.json(user);
}

async function handleUpdateUserUsingId(req, res) {
    try {
        const { id } = req.params;
        const { username, email, first_name, last_name, role } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (username) user.username = username;
        if (email) user.email = email;
        if (first_name) user.first_name = first_name;
        if (last_name) user.last_name = last_name;
        if (role) user.role = role;

        const updatedUser = await user.save();

        return res.json({
            status: "success",
            user: {
                id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                first_name: updatedUser.first_name,
                last_name: updatedUser.last_name,
                role: updatedUser.role,
                createdAt: updatedUser.createdAt,
                updatedAt: updatedUser.updatedAt,
            },
        });
    } catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

async function handleDeleteUserUsingId(req, res) {
    await User.findByIdAndDelete(req.params.id);
    return res.json({
        status: "success",
        message: "User deleted successfully",
    });
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
    try {
        const body = req.body;
        const userId = body.userId;

        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid userId format" });
        }

        const updateFields = {};
        permissionFields.forEach((k) => {
            if (body[k] !== undefined && body[k] !== null) {
                updateFields[k] = toBool(body[k]);
            }
        });
        const existing = await Permission.findOne({ userId }).lean();

        if (existing) {
            if (Object.keys(updateFields).length === 0) {
                return res
                    .status(400)
                    .json({ message: "No permission fields provided to update" });
            }

            const updated = await Permission.findOneAndUpdate(
                { userId },
                { $set: updateFields },
                { new: true }
            ).lean();

            return res.status(200).json({
                message: "Permission updated successfully",
                permission: updated,
            });
        }

        const payload = { userId };
        permissionFields.forEach((k) => {
            if (updateFields[k] !== undefined) {
                payload[k] = updateFields[k];
            } else if (body[k] !== undefined && body[k] !== null) {
                payload[k] = toBool(body[k]);
            } else {
                payload[k] = false;
            }
        });

        const created = await Permission.create(payload);

        return res.status(201).json({
            message: "Permission created successfully",
            permission: created,
        });
    } catch (error) {
        console.error("handleUpdatePermission error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

async function handleAllPermission(req, res) {
    const permission = await Permission.find({});
    return res.json(permission);
}

async function handleGetPermissionUsingId(req, res) {
    try {
        const userId = req.params.id;

        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

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
    } catch (error) {
        console.error("Error fetching permission:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}



export {
    handleGetAllUsers,
    handleCreateNewUser,
    handleGetUserUinsgId,
    handleUpdateUserUsingId,
    handleDeleteUserUsingId,
    handleGetPermissionUsingId,
    handleUpdatePermission,
    handleAllPermission,
};
