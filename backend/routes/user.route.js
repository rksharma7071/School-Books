import express from "express";
import {
    handleGetAllUsers,
    handleCreateNewUser,
    handleGetUserUinsgId,
    handleUpdateUserUsingId,
    handleDeleteUserUsingId,
} from "../controllers/user.controller.js";

const router = express.Router();

router.route("/").get(handleGetAllUsers).post(handleCreateNewUser);

router
    .route("/:id")
    .get(handleGetUserUinsgId)
    .patch(handleUpdateUserUsingId)
    .delete(handleDeleteUserUsingId);

export default router;
