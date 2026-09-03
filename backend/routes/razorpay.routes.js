import express from "express";
import { createRazorpayOrder, verifyRazorpayPayment } from "../controllers/razorpay.controller.js";
import authMiddleware from "../middlewares/authentication.js";
import { razorpayLimiter } from "../config/security.js";

const router = express.Router();

router.post("/create-order", razorpayLimiter, authMiddleware, createRazorpayOrder);
router.post("/verify-payment", razorpayLimiter, authMiddleware, verifyRazorpayPayment);

export default router;