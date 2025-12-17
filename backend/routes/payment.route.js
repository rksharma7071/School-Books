import express from "express";
import {
    createPayment,
    getAllPayment,
    getPaymentById,
} from "../controllers/payment.controller.js";

const router = express.Router();

router.route("/").get(getAllPayment).post(createPayment);

router.route("/:id").get(getPaymentById);

export default router;
