import mongoose from "mongoose";

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

const User = mongoose.model("User", userSchema);
export default User;
