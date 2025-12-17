import { Cart } from "../models/cart.model.js";
import { User } from "../models/user.model.js";

async function getAllCart(req, res) {
    const cart = await Cart.find({});
    return res.json(cart || []);
}

async function getCartByUserId(req, res) {
    const cart = await Cart.findOne({ userId: req.params.id });
    return res.json(cart);
}

async function createOrUpdateCart(req, res) {
    try {
        const { userId, items = [] } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }

        const existingCart = await Cart.findOne({ userId });

        if (existingCart && items.length === 0) {
            await Cart.deleteOne({ userId });
            return res
                .status(200)
                .json({ message: "Cart removed because items are empty" });
        }

        if (existingCart) {
            existingCart.items = items;
            await existingCart.save();
            return res
                .status(200)
                .json({
                    message: "Cart updated successfully",
                    cart: existingCart,
                });
        }

        if (items.length > 0) {
            const cart = await Cart.create({ userId, items });
            return res
                .status(201)
                .json({ message: "Cart created successfully", cart });
        }

        return res.status(400).json({ message: "Cannot create an empty cart" });
    } catch (error) {
        console.error("Cart Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export { getAllCart, getCartByUserId, createOrUpdateCart };