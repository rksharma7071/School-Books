import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { User } from "../models/user.model.js";

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function handleAuthSignUp(req, res) {
    const { username, email, password, first_name, last_name, role } = req.body;

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
            role: role || "customer",
        });

        await newUser.save();

        // Generate JWT token
        const token = jwt.sign(
            { id: newUser._id, role: newUser.role },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d",
            }
        );
        res.json({
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                first_name: newUser.first_name,
                last_name: newUser.last_name,
                role: newUser.role,
            },
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
}

async function handleAuthLogin(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res
            .status(400)
            .json({ message: "Please provide email and password." });
    }

    try {
        // 1. Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found." });
        }

        // 2. Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Password is incorrect." });
        }

        // 3. Generate JWT token
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is not defined in .env file");
            return res.status(500).json({ message: "Server config error." });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        // 4. Respond with token and user info
        return res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
}

async function handleAuthChangePassword(req, res) {
    const { email, oldPassword, newPassword } = req.body;

    if (!email || !oldPassword || !newPassword) {
        return res.status(400).json({
            message: "Please provide email, old password, and new password.",
        });
    }

    try {
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found." });
        }

        // Compare old password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res
                .status(400)
                .json({ message: "Old password is incorrect." });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        // Update user's password
        user.password = hashedNewPassword;
        await user.save();

        res.json({ message: "Password changed successfully." });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
}

async function handleAuthRequestOTP(req, res) {
    const { email } = req.body;
    console.log("email: ", email);
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    console.log("user: ", user);

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000;
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
        to: email,
        subject: "Your OTP Code",
        text: `Your OTP is ${otp}. It expires in 5 minutes.`,
        html: `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2 style="color:#333;">Password Reset Request</h2>
      <p>Hello,</p>
      <p>Your OTP code is:</p>
      <h1 style="background:#f4f4f4; display:inline-block; padding:10px 20px; border-radius:5px; color:#333;">
        ${otp}
      </h1>
      <p style="margin-top:20px;">⚠️ This OTP will expire in <b>5 minutes</b>.</p>
      <p>If you didn’t request a password reset, you can safely ignore this email.</p>
      <br/>
      <p style="color:#888;">— Your App Team</p>
    </div>
  `,
    });

    res.json({ message: "OTP sent successfully" });
}

async function handleAuthVerifyOTP(req, res) {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.otp !== otp || Date.now() > user.otpExpiry) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    res.json({ message: "OTP verified, you can reset password now" });
}

async function handleAuthResetPassword(req, res) {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.json({ message: "Password reset successfully" });
}

export {
    handleAuthSignUp,
    handleAuthLogin,
    handleAuthChangePassword,
    handleAuthRequestOTP,
    handleAuthVerifyOTP,
    handleAuthResetPassword,
};
