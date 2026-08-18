export const validate = (schema, source = "body") => {
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

        const descriptor = Object.getOwnPropertyDescriptor(req, source);
        
        if (descriptor && descriptor.set) {
            req[source] = result.data;
        } else if (source === "query") {
            Object.keys(result.data).forEach(key => {
                req.query[key] = result.data[key];
            });
            req.validatedQuery = result.data;
        } else {
            req[source] = result.data;
        }
        
        next();
    };
};