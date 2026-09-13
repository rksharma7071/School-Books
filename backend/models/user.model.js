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
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true, select: false },
        name: { type: String, trim: true, require: true },
        role: { type: String, enum: ["customer", "author", "admin"], default: "customer", index: true },
        status: { type: String, enum: ["active", "blocked", "suspended"], default: "active", index: true },
        emailVerified: { type: Boolean, default: false, index: true },
        emailVerifiedAt: { type: Date, default: null },
        emailVerificationToken: { type: String, select: false },
        emailVerificationTokenExpiry: { type: Date, select: false },
        emailVerificationSentAt: { type: Date, select: false },
        tokenVersion: { type: Number, default: 0 },
        lastLoginAt: { type: Date, default: null },
        passwordChangedAt: { type: Date, default: null },
        otp: { type: String, default: null, select: false },
        otpExpiry: { type: Date, default: null, select: false },
        otpAttempts: { type: Number, default: 0, select: false },
        otpLastSentAt: { type: Date, select: false },
        resetToken: { type: String, select: false },
        resetTokenExpiry: { type: Date, select: false },
    },
    { timestamps: true }
);

userSchema.index({ createdAt: -1 });

const addressSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        fullName: { type: String, required: true, trim: true, maxlength: 100 },
        phone: { type: String, required: true, trim: true, maxlength: 20 },
        address: { type: String, required: true, trim: true, maxlength: 300 },
        city: { type: String, required: true, trim: true, maxlength: 100 },
        state: { type: String, required: true, trim: true, maxlength: 100 },
        pincode: { type: String, required: true, trim: true, maxlength: 20 },
        country: { type: String, default: "India", trim: true, maxlength: 100 },
        type: { type: String, enum: ["home", "work", "other"], default: "home" },
        landmark: { type: String, trim: true, maxlength: 200 },
        isDefault: { type: Boolean, default: false },
    },
    { timestamps: true }
);

addressSchema.index({ userId: 1, isDefault: -1, createdAt: -1 });

addressSchema.index(
    { userId: 1, isDefault: 1 },
    { unique: true, partialFilterExpression: { isDefault: true } }
);

const Permission = mongoose.model("Permission", permissionSchema);
const User = mongoose.model("User", userSchema);
const Address = mongoose.model("Address", addressSchema);

export { User, Permission, Address };