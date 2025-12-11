import mongoose, { mongo } from "mongoose";

const permissionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createUser: { type: Boolean, default: false },
    updateUser: { type: Boolean, default: false },
    deleteUser: { type: Boolean, default: false },
    readUser: { type: Boolean, default: false },
    createBook: { type: Boolean, default: false },
    updateBook: { type: Boolean, default: false },
    deleteBook: { type: Boolean, default: false },
    readBook: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        first_name: { type: String },
        last_name: { type: String },
        role: { type: String, default: "customer" },
        otp: { type: String },
        otpExpiry: { type: Date },
    },
    { timestamps: true }
);

const Permission = mongoose.model("Permission", permissionSchema);
const User = mongoose.model("User", userSchema);

export { User, Permission };
