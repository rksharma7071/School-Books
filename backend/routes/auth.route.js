import express from "express";
import {
    handleAuthLogin,
    handleAuthSignUp,
    handleAuthChangePassword,
    handleAuthRequestOTP,
    handleAuthVerifyOTP,
    handleAuthResetPassword,
} from "../controllers/auth.controller.js";
import { authLimiter } from "../config/security.js";

const router = express.Router();

router.use(authLimiter);

router.post("/signup", handleAuthSignUp);
router.post("/login", handleAuthLogin);
router.post("/change-password", handleAuthChangePassword);
router.post("/request-otp", handleAuthRequestOTP);
router.post("/verify-otp", handleAuthVerifyOTP);
router.post("/reset-password", handleAuthResetPassword);

export default router;
