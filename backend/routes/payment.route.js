import express from "express";
import {
    createPayment,
    deletePayment,
    getAllPayment,
    getPaymentById,
    getPaymentByOrderId,
} from "../controllers/payment.controller.js";
import authMiddleware from "../middlewares/authentication.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/order/:orderId", authorize("admin"), getPaymentByOrderId);

router.route("/")
    .get(authMiddleware, authorize("admin"), getAllPayment)
    .post(authMiddleware, authorize("admin"), createPayment);

router.route("/:id")
    .get(authMiddleware, authorize("admin"), getPaymentById)
    .delete(authMiddleware, authorize("admin"), deletePayment);

export default router;