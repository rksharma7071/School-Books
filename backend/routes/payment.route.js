import express from "express";
import {
    createPayment,
    deletePayment,
    getAllPayment,
    getPaymentById,
} from "../controllers/payment.controller.js";

const router = express.Router();

router.route("/").get(getAllPayment).post(createPayment);

router.route("/:id").get(getPaymentById).delete(deletePayment);

export default router;
