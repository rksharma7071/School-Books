import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { User } from "../models/user.model.js";


const signToken = (user) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
    }

    return jwt.sign(
        {
            id: user._id,
            role: user.role,
            tokenVersion: user.tokenVersion || 0,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "7d",
        }
    );
};

const publicUser = (user) => ({
    id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified,
    lastLoginAt: user.lastLoginAt,
});

const hashToken = (value) => crypto.createHash("sha256").update(String(value)).digest("hex");

const getMailTransport = () =>
    nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

const sendVerificationEmail = async (user, token) => {
    try {
        const transporter = getMailTransport();

        const baseUrl = (process.env.FRONTEND_URL || "").split(",")[0];
        const verifyUrl = `${baseUrl}/verify-email?token=${token}&email=${encodeURIComponent(user.email)}`;

        await transporter.sendMail({
            from: `"Account Verification" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: "Verify your email address",

            text: `Please verify your email by visiting: ${verifyUrl}`,

            html: `
                <div style="font-family:Arial,sans-serif;padding:20px">
                    <h2>Verify your email</h2>
                    <p>Click the link below to verify your email address:</p>
                    <p><a href="${verifyUrl}">${verifyUrl}</a></p>
                    <p>This link expires in 24 hours.</p>
                </div>
            `,
        });
    } catch (error) {
        console.error("Failed to send verification email:", error.message);
    }
};


export const signUp = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        if (!email.includes("@") || !email.includes(".")) {
            return res.status(400).json({ success: false, message: "Invalid email format" });
        }

        if (String(password).length < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await User.findOne({
            $or: [
                { email: normalizedEmail }
            ],
        });

        if (existingUser) {
            return res.status(409).json({ success: false, message: "Email is already registered." });
        }

        const rawToken = crypto.randomBytes(32).toString("hex");

        const user = await User.create({
            email: normalizedEmail,
            password: await bcrypt.hash(password, 10),
            name,
            role: "customer",
            status: "active",
            emailVerified: false,
            emailVerificationToken: hashToken(rawToken),
            emailVerificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
            emailVerificationSentAt: new Date(),
        });

        await sendVerificationEmail(user, rawToken);

        return res.status(201).json({
            success: true,
            token: signToken(user),
            user: publicUser(user),
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Please provide email and password." });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() })
            .select("+password");

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid email id." });
        }
        if (!(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ success: false, message: "Incorrect password." });
        }

        if (["blocked", "suspended"].includes(user.status)) {
            return res.status(403).json({ success: false, message: "Your account is not active. Please contact support." });
        }

        if (!user.emailVerified) {
            const tokenValid =
                user.emailVerificationToken &&
                user.emailVerificationTokenExpiry &&
                Date.now() <= user.emailVerificationTokenExpiry.getTime();

            return res.status(403).json({
                success: false,
                message: "Please verify your email before logging in.",
                requiresEmailVerification: true,
                email: user.email,
                canResendVerification: true,
                verificationTokenExpired: !tokenValid,
            });
        }

        user.lastLoginAt = new Date();
        await user.save();

        return res.status(200).json({
            success: true,
            token: signToken(user),
            user: publicUser(user),
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).lean();

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({ success: true, user: publicUser(user) });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const logout = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.tokenVersion = (user.tokenVersion || 0) + 1;
        await user.save();

        return res.status(200).json({ success: true, message: "Logged out successfully. All sessions have been invalidated." });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ success: false, message: "Please provide old password and new password." });
        }

        if (String(newPassword).length < 8) {
            return res.status(400).json({ success: false, message: "New password must be at least 8 characters" });
        }

        const user = await User.findById(req.user.id).select("+password");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (!(await bcrypt.compare(oldPassword, user.password))) {
            return res.status(400).json({ success: false, message: "Old password is incorrect." });
        }

        if (await bcrypt.compare(newPassword, user.password)) {
            return res.status(400).json({ success: false, message: "New password must be different from the current password" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.passwordChangedAt = new Date();
        user.tokenVersion = (user.tokenVersion || 0) + 1;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password changed successfully. Please log in again with your new password.",
            token: signToken(user),
            user: publicUser(user),
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const requestOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        if (!email.includes("@") || !email.includes(".")) {
            return res.status(400).json({ success: false, message: "Invalid email format" });
        }

        const message = "If an account exists for this email, an OTP has been sent.";

        const user = await User.findOne({ email: email.toLowerCase().trim() })
            .select("+otpLastSentAt");

        if (!user) {
            return res.status(200).json({ success: true, message });
        }

        if (
            user.otpLastSentAt &&
            Date.now() - user.otpLastSentAt.getTime() < 60 * 1000
        ) {
            return res.status(429).json({ success: false, message: "Please wait before requesting another OTP" });
        }

        const otp = String(crypto.randomInt(100000, 1000000));

        user.otp = hashToken(otp);
        user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
        user.otpAttempts = 0;
        user.otpLastSentAt = new Date();
        user.resetToken = null;
        user.resetTokenExpiry = null;

        await user.save();

        try {
            await getMailTransport().sendMail({
                from: `"Password Reset" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: "Your OTP Code",
                text: `Your OTP is ${otp}. It expires in 5 minutes.`,
                html: `
                    <div style="font-family:Arial,sans-serif;padding:20px">
                        <h2>Password Reset Request</h2>
                        <p>Your OTP code is:</p>
                        <h1>${otp}</h1>
                        <p>This OTP expires in <b>5 minutes</b>.</p>
                    </div>
                `,
            });
        } catch (error) {
            console.error("Failed to send OTP:", error.message);
            return res.status(500).json({ success: false, message: "Failed to send OTP email. Please try again later." });
        }

        return res.status(200).json({ success: true, message });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: "Email and OTP are required" });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() })
            .select("+otp +otpExpiry +otpAttempts");

        if (!user || !user.otp || !user.otpExpiry) {
            return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
        }

        if (Date.now() > user.otpExpiry.getTime()) {
            user.otp = null;
            user.otpExpiry = null;
            user.otpAttempts = 0;

            await user.save();

            return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
        }

        if ((user.otpAttempts || 0) >= 5) {
            user.otp = null;
            user.otpExpiry = null;
            user.otpAttempts = 0;

            await user.save();

            return res.status(429).json({ success: false, message: "Too many incorrect attempts. Please request a new OTP." });
        }

        if (user.otp !== hashToken(otp)) {
            user.otpAttempts = (user.otpAttempts || 0) + 1;
            await user.save();

            return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");

        user.resetToken = hashToken(resetToken);
        user.resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);
        user.otp = null;
        user.otpExpiry = null;
        user.otpAttempts = 0;

        await user.save();

        return res.status(200).json({ success: true, message: "OTP verified, you can reset password now", resetToken });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { email, resetToken, password } = req.body;

        if (!email || !resetToken || !password) {
            return res.status(400).json({ success: false, message: "Email, reset token and new password are required" });
        }

        if (String(password).length < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() })
            .select("+resetToken +resetTokenExpiry +password");

        if (
            !user ||
            !user.resetToken ||
            !user.resetTokenExpiry ||
            Date.now() > user.resetTokenExpiry.getTime() ||
            user.resetToken !== hashToken(resetToken)
        ) {
            return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
        }

        user.password = await bcrypt.hash(password, 10);
        user.passwordChangedAt = new Date();
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        user.resetToken = null;
        user.resetTokenExpiry = null;
        user.otp = null;
        user.otpExpiry = null;
        user.otpAttempts = 0;

        await user.save();

        return res.status(200).json({ success: true, message: "Password reset successfully. Please log in again." });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const verifyEmail = async (req, res) => {
    try {
        const { email, token } = req.body;

        if (!email || !token) {
            return res.status(400).json({ success: false, message: "Email and verification token are required" });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() })
            .select("+emailVerificationToken +emailVerificationTokenExpiry");

        if (
            !user ||
            !user.emailVerificationToken ||
            !user.emailVerificationTokenExpiry ||
            Date.now() > user.emailVerificationTokenExpiry.getTime() ||
            user.emailVerificationToken !== hashToken(token)
        ) {
            return res.status(400).json({ success: false, message: "Invalid or expired verification token" });
        }

        user.emailVerified = true;
        user.emailVerifiedAt = new Date();
        user.emailVerificationToken = null;
        user.emailVerificationTokenExpiry = null;

        await user.save();

        return res.status(200).json({ success: true, message: "Email verified successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        if (!email.includes("@") || !email.includes(".")) {
            return res.status(400).json({ success: false, message: "Invalid email format" });
        }

        const message = "If an account exists for this email, a verification link has been sent.";

        const user = await User.findOne({ email: email.toLowerCase().trim() })
            .select("+emailVerificationSentAt");

        if (!user) {
            return res.status(200).json({ success: true, message });
        }

        if (user.emailVerified) {
            return res.status(200).json({ success: true, message: "Email is already verified." });
        }

        if (
            user.emailVerificationSentAt &&
            Date.now() - user.emailVerificationSentAt.getTime() < 60 * 1000
        ) {
            return res.status(429).json({ success: false, message: "Please wait before requesting another verification email" });
        }

        const token = crypto.randomBytes(32).toString("hex");

        user.emailVerificationToken = hashToken(token);
        user.emailVerificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        user.emailVerificationSentAt = new Date();

        await user.save();

        await sendVerificationEmail(user, token);

        return res.status(200).json({ success: true, message });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};