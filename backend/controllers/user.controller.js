import User from "../models/user.model.js";

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
            return res.status(400).json({ msg: "All fields are required..." });
        }

        const result = await User.create({
            username: body.username,
            email: body.email,
            password: body.password,
            first_name: body.first_name,
            last_name: body.last_name,
            role: "author",
        });

        console.log("Result: ", result);
        return res
            .status(201)
            .json({ msg: "User created successfully", user: result });
    } catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({ msg: "Internal Server Error" });
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
            return res.status(404).json({ msg: "User not found" });
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
        return res.status(500).json({ msg: "Internal Server Error" });
    }
}

async function handleDeleteUserUsingId(req, res) {
    await User.findByIdAndDelete(req.params.id);
    return res.json({
        status: "success",
        message: "User deleted successfully",
    });
}

export {
    handleGetAllUsers,
    handleCreateNewUser,
    handleGetUserUinsgId,
    handleUpdateUserUsingId,
    handleDeleteUserUsingId,
};
