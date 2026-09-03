import express from "express";
import {
    signUp,
    login,
    changePassword,
    requestOTP,
    verifyOTP,
    resetPassword,
} from "../controllers/auth.controller.js";
import { authLimiter } from "../config/security.js";

const router = express.Router();

router.use(authLimiter);

router.post("/signup", signUp);
router.post("/login", login);
router.post("/change-password", changePassword);
router.post("/request-otp", requestOTP);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

export default router;