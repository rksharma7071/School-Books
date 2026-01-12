import express from "express";
import {
    createAddress,
    deleteAddress,
    getAddressById,
    getAddressByUserId,
    getAddresses,
    updateAddress,
} from "../controllers/address.controller.js";

const router = express.Router();

router.route("/")
    .get(getAddresses)
    .post(createAddress);

router.get("/user/:id", getAddressByUserId);

router
    .route("/:id")
    .get(getAddressById)
    .patch(updateAddress)
    .delete(deleteAddress);

export default router;