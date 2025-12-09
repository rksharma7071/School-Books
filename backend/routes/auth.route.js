import express from "express";

const router = express.Router();
import {
    handleAuthLogin,
    handleAuthSignUp,
    handleAuthChangePassword,
    handleAuthRequestOTP,
    handleAuthVerifyOTP,
    handleAuthResetPassword,
} from "../controllers/auth.controller.js";

router.route("/signup").post(handleAuthSignUp);
router.route("/login").post(handleAuthLogin);
router.route("/change-password").post(handleAuthChangePassword);
router.route("/request-otp").post(handleAuthRequestOTP);
router.route("/verify-otp").post(handleAuthVerifyOTP);
router.route("/reset-password").post(handleAuthResetPassword);

export default router;
