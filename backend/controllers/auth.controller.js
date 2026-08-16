import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(user) {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
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

    try {
        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }],
        });
        if (existingUser) {
            return res
                .status(400)
                .json({ message: "Email or username already in use" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            first_name,
            last_name,
            role: "customer",
        });

    if (!username || !email || !password) {
        return res
            .status(400)
            .json({ message: "username, email and password are required" });
    }
    if (!EMAIL_RE.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
    }
    if (String(password).length < 8) {
        return res
            .status(400)
            .json({ message: "Password must be at least 8 characters" });
    }

    const existingUser = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { username }],
    }).lean();
    if (existingUser) {
        return res
            .status(409)
            .json({ message: "Email or username already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
        username,
        email,
        password: hashedPassword,
        first_name,
        last_name,
        role: "customer",
    });

    return res
        .status(201)
        .json({ token: signToken(newUser), user: publicUser(newUser) });
});

const handleAuthLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res
            .status(400)
            .json({ message: "Please provide email and password." });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
        "+password"
    );

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ message: "Invalid credentials" });
    }

    return res.json({ token: signToken(user), user: publicUser(user) });
});

const handleAuthChangePassword = asyncHandler(async (req, res) => {
    const { email, oldPassword, newPassword } = req.body;
    if (!email || !oldPassword || !newPassword) {
        return res.status(400).json({
            message: "Please provide email, old password, and new password.",
        });
    }
    if (String(newPassword).length < 8) {
        return res
            .status(400)
            .json({ message: "New password must be at least 8 characters" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
        "+password"
    );
    if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
        return res.status(400).json({ message: "Old password is incorrect." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password changed successfully." });
});

const handleAuthRequestOTP = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
        const otp = generateOTP();
        user.otp = hashOTP(otp);
        user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
        await user.save();

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
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
    }

    res.json({ message: "If the account exists, an OTP has been sent." });
});

const handleAuthVerifyOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
        "+otp +otpExpiry"
    );

    if (
        !user ||
        !user.otp ||
        user.otp !== hashOTP(otp) ||
        !user.otpExpiry ||
        Date.now() > user.otpExpiry.getTime()
    ) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    res.json({ message: "OTP verified, you can reset password now" });
});

const handleAuthResetPassword = asyncHandler(async (req, res) => {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) {
        return res
            .status(400)
            .json({ message: "Email, OTP and new password are required" });
    }
    if (String(password).length < 8) {
        return res
            .status(400)
            .json({ message: "Password must be at least 8 characters" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
        "+otp +otpExpiry"
    );
    if (
        !user ||
        !user.otp ||
        user.otp !== hashOTP(otp) ||
        !user.otpExpiry ||
        Date.now() > user.otpExpiry.getTime()
    ) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.json({ message: "Password reset successfully" });
});

export {
    handleAuthSignUp,
    handleAuthLogin,
    handleAuthChangePassword,
    handleAuthRequestOTP,
    handleAuthVerifyOTP,
    handleAuthResetPassword,
};
