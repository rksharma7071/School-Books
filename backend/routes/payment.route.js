import express from "express";
import {
    createPayment,
    deletePayment,
    getAllPayment,
    getPaymentById,
} from "../controllers/payment.controller.js";
import authMiddleware from "../middlewares/authentication.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

router.use(authMiddleware);

router
    .route("/")
    .get(authorize("admin"), getAllPayment)
    .post(authorize("admin"), createPayment);

router
    .route("/:id")
    .get(authorize("admin"), getPaymentById)
    .delete(authorize("admin"), deletePayment);

export default router;
