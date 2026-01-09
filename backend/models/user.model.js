import mongoose from "mongoose";

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

const addressSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        fullName: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        address: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true },
        state: { type: String, required: true, trim: true },
        pincode: { type: String, required: true, trim: true },
        country: { type: String, default: "India" },
        isDefault: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const Permission = mongoose.model("Permission", permissionSchema);
const User = mongoose.model("User", userSchema);
const Address = mongoose.model("Address", addressSchema);

export { User, Permission, Address };
