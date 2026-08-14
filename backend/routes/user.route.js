import express from "express";
import {
    handleGetAllUsers,
    handleCreateNewUser,
    handleGetUserUinsgId,
    handleUpdateUserUsingId,
    handleDeleteUserUsingId,
    handleUpdatePermission,
    handleGetPermissionUsingId,
    handleAllPermission,
} from "../controllers/user.controller.js";
import authMiddleware from "../middlewares/authentication.js";
import { authorize, selfOrAdmin } from "../middlewares/authorize.js";

const router = express.Router();

router.use(authMiddleware);

router
    .route("/")
    .get(authorize("admin"), handleGetAllUsers)
    .post(authorize("admin"), handleCreateNewUser);

router
    .route("/permission")
    .get(authorize("admin"), handleAllPermission)
    .post(authorize("admin"), handleUpdatePermission);

router
    .route("/permission/:id")
    .get(authorize("admin"), handleGetPermissionUsingId)
    .patch(authorize("admin"), handleUpdatePermission);

router
    .route("/:id")
    .get(selfOrAdmin("id"), handleGetUserUinsgId)
    .patch(selfOrAdmin("id"), handleUpdateUserUsingId)
    .delete(authorize("admin"), handleDeleteUserUsingId);

export default router;
