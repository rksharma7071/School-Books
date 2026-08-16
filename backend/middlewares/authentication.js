import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }

        const token = authHeader.slice(7).trim();

        if (!token) {
            return res.status(401).json({ success: false, message: "Authentication token is missing" });
        }

        const decoded = jwt.verify( token, process.env.JWT_SECRET );
        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
};

export default authMiddleware;