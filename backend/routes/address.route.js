// routes/address.route.js
import express from "express";
import {
    getAddresses,
    createAddress,
    getAddressById,
    getAddressByUserId,
    updateAddress,
    deleteAddress
} from "../controllers/address.controller.js";
import authMiddleware from "../middlewares/authentication.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", authorize("admin"), getAddresses);
router.post("/", createAddress);

router.get("/user/:id", getAddressByUserId);

router.route("/:id")
    .get(getAddressById)
    .patch(updateAddress)
    .delete(deleteAddress);

export default router;