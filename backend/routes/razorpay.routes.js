import express from "express";
import { createRazorpayOrder, verifyRazorpayPayment } from "../controllers/razorpay.controller.js";


const router = express.Router();

router.post("/create-order", createRazorpayOrder);
router.post("/verify-payment", verifyRazorpayPayment);

export default router;
