import express from "express";
import {
    signUp,
    login,
    logout,
    getCurrentUser,
    changePassword,
    requestOTP,
    verifyOTP,
    resetPassword,
    verifyEmail,
    resendVerification,
} from "../controllers/auth.controller.js";
import authMiddleware from "../middlewares/authentication.js";
import { authLimiter } from "../config/security.js";

const router = express.Router();

router.use(authLimiter);

router.post("/signup", signUp);
router.post("/login", login);
router.post("/request-otp", requestOTP);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);

router.get("/me", authMiddleware, getCurrentUser);
router.post("/logout", authMiddleware, logout);
router.post("/change-password", authMiddleware, changePassword);

export default router;