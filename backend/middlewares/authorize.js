
export const authorize =
    (...roles) =>
    (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        if (roles.length && !roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Insufficient permissions" });
        }
        next();
    };

export const selfOrAdmin = (paramName = "id") => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    if (req.user.role === "admin" || String(req.user.id) === String(req.params[paramName])) {
        return next();
    }
    return res.status(403).json({ message: "Access denied" });
};

const authorizeAdmin = authorize("admin");
export default authorizeAdmin;
