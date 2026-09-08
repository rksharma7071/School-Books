import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }

        const token = authHeader.slice(7).trim();
        if (!token) {
            return res.status(401).json({ success: false, message: "Authentication token is missing" });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
            return res.status(401).json({ success: false, message: "Invalid or expired token" });
        }

        if (!decoded?.id) {
            return res.status(401).json({ success: false, message: "Invalid token payload" });
        }

        const user = await User.findById(decoded.id).select("role status tokenVersion").lean();

        if (!user) {
            return res.status(401).json({ success: false, message: "Account no longer exists" });
        }

        const currentTokenVersion = user.tokenVersion || 0;
        const jwtTokenVersion = decoded.tokenVersion || 0;

        if (currentTokenVersion !== jwtTokenVersion) {
            return res.status(401).json({ success: false, message: "Session has expired. Please log in again." });
        }

        if (user.status === "blocked" || user.status === "suspended") {
            return res.status(401).json({ success: false, message: "Your account is not active. Please contact support." });
        }

        req.user = {
            id: user._id,
            role: user.role,
            status: user.status,
            tokenVersion: currentTokenVersion,
        };

        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
};

export default authMiddleware;