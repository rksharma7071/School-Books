import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { User } from "../models/user.model.js";
import { asyncHandler, ApiError } from "../middlewares/asyncHandler.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(user) {
    if (!process.env.JWT_SECRET) {
        throw new ApiError(500, "JWT_SECRET is not defined");
    }
    return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    });
}

function publicUser(u) {
    return {
        id: u._id,
        username: u.username,
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name,
        role: u.role,
    };
}

function generateOTP() {
    return String(crypto.randomInt(100000, 1000000));
}

function hashOTP(otp) {
    return crypto.createHash("sha256").update(otp).digest("hex");
}

export const signUp = asyncHandler(async (req, res) => {
    const { username, email, password, first_name, last_name } = req.body;

    if (!username || !email || !password) throw new ApiError(400, "Username, email and password are required");
    if (!EMAIL_RE.test(email)) throw new ApiError(400, "Invalid email format");
    if (String(password).length < 8) throw new ApiError(400, "Password must be at least 8 characters");

    const existingUser = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { username }],
    }).lean();

    if (existingUser) throw new ApiError(409, "Email or username already in use");

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
        username,
        email: email.toLowerCase(),
        password: hashedPassword,
        first_name,
        last_name,
        role: "customer",
    });

    res.status(201).json({ token: signToken(newUser), user: publicUser(newUser) });
});

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) throw new ApiError(400, "Please provide email and password.");

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new ApiError(400, "Invalid credentials");
    }

    res.json({ token: signToken(user), user: publicUser(user) });
});

export const changePassword = asyncHandler(async (req, res) => {
    const { email, oldPassword, newPassword } = req.body;
    if (!email || !oldPassword || !newPassword) throw new ApiError(400, "Please provide email, old password, and new password.");
    if (String(newPassword).length < 8) throw new ApiError(400, "New password must be at least 8 characters");

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
        throw new ApiError(400, "Old password is incorrect.");
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password changed successfully." });
});

export const requestOTP = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) throw new ApiError(400, "Email is required");
    if (!EMAIL_RE.test(email)) throw new ApiError(400, "Invalid email format");

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) throw new ApiError(404, "No account found. Please check your email or sign up.");

    const otp = generateOTP();
    user.otp = hashOTP(otp);
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
        from: `"Password Reset" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Your OTP Code",
        text: `Your OTP is ${otp}. It expires in 5 minutes.`,
        html: `<div style="font-family:Arial,sans-serif;padding:20px;">
            <h2>Password Reset Request</h2>
            <p>Your OTP code is:</p>
            <h1 style="background:#f4f4f4;display:inline-block;padding:10px 20px;border-radius:5px;">${otp}</h1>
            <p>This OTP expires in <b>5 minutes</b>.</p>
        </div>`,
    });

    res.status(200).json({ success: true, message: "OTP has been sent to your email address." });
});

export const verifyOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) throw new ApiError(400, "Email and OTP are required");

    const user = await User.findOne({ email: email.toLowerCase() }).select("+otp +otpExpiry");
    if (!user || !user.otp || user.otp !== hashOTP(otp) || !user.otpExpiry || Date.now() > user.otpExpiry.getTime()) {
        throw new ApiError(400, "Invalid or expired OTP");
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetToken = hashOTP(resetToken);
    user.resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.json({ message: "OTP verified, you can reset password now", resetToken });
});

export const resetPassword = asyncHandler(async (req, res) => {
    const { email, resetToken, password } = req.body;
    if (!email || !resetToken || !password) throw new ApiError(400, "Email, reset token and new password are required");
    if (String(password).length < 8) throw new ApiError(400, "Password must be at least 8 characters");

    const user = await User.findOne({ email: email.toLowerCase() }).select("+resetToken +resetTokenExpiry");
    if (!user || !user.resetToken || user.resetToken !== hashOTP(resetToken) || !user.resetTokenExpiry || Date.now() > user.resetTokenExpiry.getTime()) {
        throw new ApiError(400, "Invalid or expired reset token");
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
});