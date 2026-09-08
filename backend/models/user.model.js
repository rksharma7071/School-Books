import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, index: true },
    createUser: { type: Boolean, default: false },
    updateUser: { type: Boolean, default: false },
    deleteUser: { type: Boolean, default: false },
    readUser: { type: Boolean, default: false },
    createProduct: { type: Boolean, default: false },
    updateProduct: { type: Boolean, default: false },
    deleteProduct: { type: Boolean, default: false },
    readProduct: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true, select: false },
        first_name: { type: String, trim: true },
        last_name: { type: String, trim: true },
        role: { type: String, enum: ["customer", "author", "admin"], default: "customer" },
        otp: { type: String, default: null, select: false },
        otpExpiry: { type: Date, default: null, select: false },
        resetToken: { type: String, select: false },
        resetTokenExpiry: { type: Date, select: false },
    },
    { timestamps: true }
);

const addressSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
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