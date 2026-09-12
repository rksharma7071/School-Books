import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { User } from "../models/user.model.js";
import { ApiError, handleError } from "../utils/apiError.js";


function signToken(user) {
    if (!process.env.JWT_SECRET) {
        throw new ApiError(500, "JWT_SECRET is not defined");
    }
    return jwt.sign(
        { id: user._id, role: user.role, tokenVersion: user.tokenVersion || 0 },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );
}

function publicUser(user) {
    return {
        id: user._id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt,
    };
}

function hashToken(value) {
    return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function getMailTransport() {
    return nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
}

async function sendVerificationEmail(user, rawToken) {
    try {
        const transporter = getMailTransport();
        const baseUrl = (process.env.FRONTEND_URL || "").split(",")[0] || "";
        const verifyUrl = `${baseUrl}/verify-email?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

        await transporter.sendMail({
            from: `"Account Verification" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: "Verify your email address",
            text: `Please verify your email by visiting: ${verifyUrl}`,
            html: `<div style="font-family:Arial,sans-serif;padding:20px;">
                <h2>Verify your email</h2>
                <p>Click the link below to verify your email address:</p>
                <p><a href="${verifyUrl}">${verifyUrl}</a></p>
                <p>This link expires in 24 hours.</p>
            </div>`,
        });
    } catch (error) {
        console.error("Failed to send verification email:", error.message);
    }
}

export const signUp = async (req, res) => {
    try {
        const { username, email, password, first_name, last_name } = req.body;

        if (!username || !email || !password) throw new ApiError(400, "Username, email and password are required");
        if (username.length < 3 || username.length > 30) throw new ApiError(400, "Username must be 3-30 characters");
        if (!email.includes("@") || !email.includes(".")) throw new ApiError(400, "Invalid email format");
        if (String(password).length < 8) throw new ApiError(400, "Password must be at least 8 characters");

        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await User.findOne({
            $or: [{ email: normalizedEmail }, { username }],
        }).lean();

        if (existingUser) throw new ApiError(409, "Email or username already in use");

        const hashedPassword = await bcrypt.hash(password, 10);
        const rawVerificationToken = crypto.randomBytes(32).toString("hex");

        const newUser = await User.create({
            username,
            email: normalizedEmail,
            password: hashedPassword,
            first_name,
            last_name,
            role: "customer",
            status: "active",
            emailVerified: false,
            emailVerificationToken: hashToken(rawVerificationToken),
            emailVerificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
            emailVerificationSentAt: new Date(),
        });

        await sendVerificationEmail(newUser, rawVerificationToken);

        res.status(201).json({ token: signToken(newUser), user: publicUser(newUser) });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) throw new ApiError(400, "Please provide email and password.");

        const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new ApiError(400, "Invalid credentials");
        }

        if (user.status === "blocked" || user.status === "suspended") {
            throw new ApiError(403, "Your account is not active. Please contact support.");
        }

        if (!user.emailVerified) {
            const hasValidToken = 
                user.emailVerificationToken && 
                user.emailVerificationTokenExpiry && 
                Date.now() <= user.emailVerificationTokenExpiry.getTime();

            throw new ApiError(403, "Please verify your email before logging in.", {
                requiresEmailVerification: true,
                email: user.email,
                canResendVerification: !hasValidToken || true,
                verificationTokenExpired: !hasValidToken
            });
        }

        user.lastLoginAt = new Date();
        await user.save();

        res.json({ token: signToken(user), user: publicUser(user) });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).lean();
        if (!user) throw new ApiError(404, "User not found");

        res.status(200).json({ success: true, user: publicUser(user) });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const logout = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) throw new ApiError(404, "User not found");

        user.tokenVersion = (user.tokenVersion || 0) + 1;
        await user.save();

        res.status(200).json({ success: true, message: "Logged out successfully. All sessions have been invalidated." });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) throw new ApiError(400, "Please provide old password and new password.");
        if (String(newPassword).length < 8) throw new ApiError(400, "New password must be at least 8 characters");

        const user = await User.findById(req.user.id).select("+password");
        if (!user) throw new ApiError(404, "User not found");

        if (!(await bcrypt.compare(oldPassword, user.password))) {
            throw new ApiError(400, "Old password is incorrect.");
        }

        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) throw new ApiError(400, "New password must be different from the current password");

        user.password = await bcrypt.hash(newPassword, 10);
        user.passwordChangedAt = new Date();
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        await user.save();

        res.json({
            message: "Password changed successfully. Please log in again with your new password.",
            token: signToken(user),
            user: publicUser(user),
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const requestOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) throw new ApiError(400, "Email is required");
        if (!email.includes("@") || !email.includes(".")) throw new ApiError(400, "Invalid email format");

        const genericMessage = "If an account exists for this email, an OTP has been sent.";
        const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+otpLastSentAt");

        if (!user) {
            return res.status(200).json({ success: true, message: genericMessage });
        }

        if (user.otpLastSentAt && Date.now() - user.otpLastSentAt.getTime() < 60 * 1000) {
            throw new ApiError(429, "Please wait before requesting another OTP");
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
            const transporter = getMailTransport();
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
        } catch (mailError) {
            console.error("Failed to send OTP email:", mailError.message);
            throw new ApiError(500, "Failed to send OTP email. Please try again later.");
        }

        res.status(200).json({ success: true, message: genericMessage });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) throw new ApiError(400, "Email and OTP are required");

        const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+otp +otpExpiry +otpAttempts");
        if (!user || !user.otp || !user.otpExpiry) {
            throw new ApiError(400, "Invalid or expired OTP");
        }

        if (Date.now() > user.otpExpiry.getTime()) {
            user.otp = null;
            user.otpExpiry = null;
            user.otpAttempts = 0;
            await user.save();
            throw new ApiError(400, "Invalid or expired OTP");
        }

        if ((user.otpAttempts || 0) >= 5) {
            user.otp = null;
            user.otpExpiry = null;
            user.otpAttempts = 0;
            await user.save();
            throw new ApiError(429, "Too many incorrect attempts. Please request a new OTP.");
        }

        if (user.otp !== hashToken(otp)) {
            user.otpAttempts = (user.otpAttempts || 0) + 1;
            await user.save();
            throw new ApiError(400, "Invalid or expired OTP");
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        user.resetToken = hashToken(resetToken);
        user.resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);
        user.otp = null;
        user.otpExpiry = null;
        user.otpAttempts = 0;
        await user.save();

        res.json({ message: "OTP verified, you can reset password now", resetToken });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { email, resetToken, password } = req.body;
        if (!email || !resetToken || !password) throw new ApiError(400, "Email, reset token and new password are required");
        if (String(password).length < 8) throw new ApiError(400, "Password must be at least 8 characters");

        const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+resetToken +resetTokenExpiry +password");
        if (
            !user ||
            !user.resetToken ||
            !user.resetTokenExpiry ||
            Date.now() > user.resetTokenExpiry.getTime() ||
            user.resetToken !== hashToken(resetToken)
        ) {
            throw new ApiError(400, "Invalid or expired reset token");
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

        res.status(200).json({ message: "Password reset successfully. Please log in again." });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const verifyEmail = async (req, res) => {
    try {
        const { email, token } = req.body;
        if (!email || !token) throw new ApiError(400, "Email and verification token are required");

        const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
            "+emailVerificationToken +emailVerificationTokenExpiry"
        );

        if (
            !user ||
            !user.emailVerificationToken ||
            !user.emailVerificationTokenExpiry ||
            Date.now() > user.emailVerificationTokenExpiry.getTime() ||
            user.emailVerificationToken !== hashToken(token)
        ) {
            throw new ApiError(400, "Invalid or expired verification token");
        }

        user.emailVerified = true;
        user.emailVerifiedAt = new Date();
        user.emailVerificationToken = null;
        user.emailVerificationTokenExpiry = null;
        await user.save();

        res.status(200).json({ success: true, message: "Email verified successfully" });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) throw new ApiError(400, "Email is required");
        if (!email.includes("@") || !email.includes(".")) throw new ApiError(400, "Invalid email format");

        const genericMessage = "If an account exists for this email, a verification link has been sent.";
        const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+emailVerificationSentAt");

        if (!user) {
            return res.status(200).json({ success: true, message: genericMessage });
        }

        if (user.emailVerified) {
            return res.status(200).json({ success: true, message: "Email is already verified." });
        }

        if (
            user.emailVerificationSentAt &&
            Date.now() - user.emailVerificationSentAt.getTime() < 60 * 1000
        ) {
            throw new ApiError(429, "Please wait before requesting another verification email");
        }

        const rawToken = crypto.randomBytes(32).toString("hex");
        user.emailVerificationToken = hashToken(rawToken);
        user.emailVerificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        user.emailVerificationSentAt = new Date();
        await user.save();

        await sendVerificationEmail(user, rawToken);

        res.status(200).json({ success: true, message: genericMessage });
    } catch (error) {
        handleError(error, req, res);
    }
};