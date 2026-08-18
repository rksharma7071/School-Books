const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to perform this action",
            });
        }

        next();
    };
};

const selfOrAdmin = (paramName = "id") => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const requestedUserId = req.params[paramName];

        if (req.user.role === "admin") {
            return next();
        }

        if (String(req.user.id) !== String(requestedUserId)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this resource",
            });
        }

        next();
    };
};

const verifyAddressOwnership = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid address ID"
            });
        }

        const address = await Address.findById(id);
        if (!address) {
            return res.status(404).json({
                success: false,
                message: "Address not found"
            });
        }

        // Store address in request for later use
        req.address = address;

        // Check ownership
        if (
            req.user.role !== "admin" &&
            String(address.userId) !== String(req.user.id)
        ) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You can only access your own addresses.",
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error verifying address ownership"
        });
    }
};

const verifyCartOwnership = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid cart ID"
            });
        }

        const cart = await Cart.findById(id);
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        // Store cart in request for later use
        req.cart = cart;

        // Check ownership
        if (
            req.user.role !== "admin" &&
            String(cart.userId) !== String(req.user.id)
        ) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You can only access your own cart.",
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error verifying cart ownership"
        });
    }
};

const verifyReviewOwnership = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid review ID"
            });
        }

        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }

        // Store review in request for later use
        req.review = review;

        // Check ownership
        if (
            req.user.role !== "admin" &&
            String(review.userId) !== String(req.user.id)
        ) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You can only access your own reviews.",
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error verifying review ownership"
        });
    }
};

export {
    authorize,
    selfOrAdmin,
    verifyAddressOwnership,
    verifyCartOwnership,
    verifyReviewOwnership
};