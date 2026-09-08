export class ApiError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

export const handleError = (error, req, res) => {
    console.error(`[${req.method}] ${req.originalUrl}`, error);

    if (error.message === "CORS origin not allowed") {
        return res.status(403).json({ success: false, message: "CORS origin is not allowed" });
    }

    if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map((item) => ({
            field: item.path,
            message: item.message,
        }));
        return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    if (error.name === "CastError") {
        return res.status(400).json({ success: false, message: "Invalid resource ID" });
    }

    if (error.code === 11000) {
        return res.status(409).json({ success: false, message: "Duplicate resource", fields: error.keyValue });
    }

    const statusCode = error.status || error.statusCode || 500;
    const message =
        process.env.NODE_ENV === "production" && statusCode === 500 ? "Internal server error" : error.message;

    return res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV !== "production" && { stack: error.stack }),
    });
};