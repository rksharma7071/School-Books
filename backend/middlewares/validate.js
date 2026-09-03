const validate = (schema, source = "body") => {
    return (req, res, next) => {
        const data = req[source];
        const result = schema.safeParse(data);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.flatten(),
            });
        }

        if (source === "query") {
            req.validatedQuery = result.data;
        } else {
            req[source] = result.data;
        }

        next();
    };
};

export { validate };