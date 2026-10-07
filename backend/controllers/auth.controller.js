import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Resend } from "resend";
import { User } from "../models/user.model.js";

const resend = new Resend(process.env.RESEND_API_KEY);
const SENDER_EMAIL = process.env.SENDER_EMAIL || "onboarding@resend.dev"; // Replace with your verified domain email, e.g. info@schoolbook.lol

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

const sendVerificationEmail = async (user, token) => {
    try {
        const baseUrl = (process.env.FRONTEND_URL || "").split(",")[0];
        const verifyUrl = `${baseUrl}/verify-email?token=${token}&email=${encodeURIComponent(user.email)}`;

        const BRAND = "Acme";
        const LOGO_URL = process.env.LOGO_URL; // absolute HTTPS URL, e.g. https://acme.com/brand/logo.png
        const ACCENT = "#4f46e5";

        await resend.emails.send({
            from: `"${BRAND} Accounts" <${SENDER_EMAIL}>`,
            to: user.email,
            subject: "Verify your email address",
            text: [
                `Verify your email address`,
                ``,
                `Thanks for signing up for ${BRAND}. Confirm this address to activate your account:`,
                verifyUrl,
                ``,
                `This link expires in 24 hours. If you didn't create a ${BRAND} account, you can ignore this email.`,
            ].join("\n"),
            html: `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Verify your email address</title>
  <!--[if mso]>
  <style>
    table, td, p, a, h1 { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
  <style>
    a { text-decoration: none; }

    @media (max-width: 600px) {
      .container { width: 100% !important; }
      .px  { padding-left: 24px !important; padding-right: 24px !important; }
      .h1  { font-size: 22px !important; line-height: 30px !important; }
      .btn { width: 100% !important; }
    }

    @media (prefers-color-scheme: dark) {
      .bg    { background-color: #0b0f19 !important; }
      .card  { background-color: #151a23 !important; }
      .text  { color: #e5e7eb !important; }
      .muted { color: #9ca3af !important; }
      .note  { background-color: #1b2230 !important; border-color: #2a3140 !important; }
    }
  </style>
</head>

<body class="bg" style="margin:0; padding:0; width:100%; background-color:#f3f4f6;">

  <!-- Preheader: shows in the inbox preview, hidden in the body -->
  <div style="display:none; font-size:1px; color:#f3f4f6; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">
    Confirm your email address to activate your ${BRAND} account. This link expires in 24 hours.
    &#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg" style="background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">

          <!-- Card -->
          <tr>
            <td class="card px" style="background-color:#ffffff; border-radius:14px; padding:40px 40px 36px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

                <!-- Logo -->
                <tr>
                  <td align="center" style="padding-bottom:32px;">
                    <img src="${LOGO_URL}"
                         width="160" height="40"
                         alt="${BRAND}"
                         style="display:block; width:160px; height:40px; border:0; outline:none; text-decoration:none;">
                  </td>
                </tr>

                <!-- Heading -->
                <tr>
                  <td align="center">
                    <h1 class="h1 text" style="margin:0 0 12px 0; font-family:Arial,Helvetica,sans-serif; font-size:24px; line-height:32px; font-weight:700; color:#111827;">
                      Verify your email address
                    </h1>
                  </td>
                </tr>

                <!-- Intro copy -->
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <p class="muted" style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:24px; color:#6b7280;">
                      Thanks for signing up for ${BRAND}. Confirm this address to activate
                      your account &mdash; it only takes a second.
                    </p>
                  </td>
                </tr>

                <!-- Button -->
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
                      href="${verifyUrl}"
                      style="height:52px; v-text-anchor:middle; width:260px;"
                      arcsize="23%" strokecolor="${ACCENT}" fillcolor="${ACCENT}">
                      <w:anchorlock/>
                      <center style="color:#ffffff; font-family:Arial,sans-serif; font-size:16px; font-weight:700;">
                        Verify email address
                      </center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-- -->
                    <a class="btn" href="${verifyUrl}"
                       style="display:inline-block; width:260px; background-color:${ACCENT}; color:#ffffff; font-family:Arial,Helvetica,sans-serif; font-size:16px; font-weight:700; line-height:52px; text-align:center; border-radius:12px;">
                      Verify email address
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>

                <!-- Fallback link -->
                <tr>
                  <td align="center" style="padding-bottom:8px;">
                    <p class="muted" style="margin:0 0 6px 0; font-family:Arial,Helvetica,sans-serif; font-size:13px; line-height:20px; color:#9ca3af;">
                      Button not working? Paste this link into your browser:
                    </p>
                    <p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:13px; line-height:20px; word-break:break-all;">
                      <a href="${verifyUrl}" style="color:${ACCENT}; text-decoration:underline;">${verifyUrl}</a>
                    </p>
                  </td>
                </tr>

                <!-- Expiry / security note -->
                <tr>
                  <td style="padding-top:28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td class="note" style="background-color:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:14px 16px;">
                          <p class="muted" style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:13px; line-height:20px; color:#6b7280;">
                            This link expires in <strong>24 hours</strong>. If you didn&rsquo;t create a
                            ${BRAND} account, you can safely ignore this email.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 8px 0 8px;">
              <p class="muted" style="margin:0 0 6px 0; font-family:Arial,Helvetica,sans-serif; font-size:12px; line-height:18px; color:#9ca3af;">
                ${BRAND} &middot; 123 Example Street, City, Country
              </p>
              <p class="muted" style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:12px; line-height:18px; color:#9ca3af;">
                This is a one-time transactional message about your account.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `,
        });
    } catch (error) {
        console.error("Failed to send verification email:", error.message || error);
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

        // console.log({ user, rawToken });

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
            await resend.emails.send({
                from: `"Password Reset" <${SENDER_EMAIL}>`,
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
            console.error("Failed to send OTP:", error.message || error);
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