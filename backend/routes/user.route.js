import express from "express";
import {
    getAllUsers,
    createNewUser,
    getUserById,
    updateUser,
    deleteUser,
    updatePermission,
    getPermissionById,
    getAllPermissions,
    getUserStats,
} from "../controllers/user.controller.js";
import authMiddleware from "../middlewares/authentication.js";
import { authorize, selfOrAdmin } from "../middlewares/authorize.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/stats", authorize("admin"), getUserStats);

router.route("/permission")
    .get(authorize("admin"), getAllPermissions)
    .post(authorize("admin"), updatePermission);

router.route("/permission/:id")
    .get(authorize("admin"), getPermissionById)
    .patch(authorize("admin"), updatePermission);

router.route("/")
    .get(authorize("admin"), getAllUsers)
    .post(authorize("admin"), createNewUser);

router.route("/:id")
    .get(selfOrAdmin("id"), getUserById)
    .patch(selfOrAdmin("id"), updateUser)
    .delete(authorize("admin"), deleteUser);

export default router;