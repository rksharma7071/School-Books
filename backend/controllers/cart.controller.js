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

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid userId" });
        }

        if (!Array.isArray(items)) {
            return res.status(400).json({ message: "Items must be an array" });
        }

        let cart = await Cart.findOne({ userId });

        if (cart && items.length === 0) {
            await Cart.deleteOne({ userId });
            return res.status(200).json({
                message: "Cart removed because items are empty",
            });
        }

        if (!cart) {
            if (items.length === 0) {
                return res.status(400).json({
                    message: "Cannot create an empty cart",
                });
            }

            cart = await Cart.create({ userId, items });
            return res.status(201).json({
                message: "Cart created successfully",
                cart,
            });
        }

        for (const newItem of items) {
            const existingItem = cart.items.find(
                (i) => String(i.bookId) === String(newItem.bookId)
            );

            if (existingItem) {
                existingItem.quantity += newItem.quantity || 1;
            } else {
                cart.items.push({
                    bookId: newItem.bookId,
                    quantity: newItem.quantity || 1,
                });
            }
        }

        await cart.save();

        return res
            .status(200)
            .json({ message: "Cart updated successfully", cart });
    } catch (error) {
        console.error("Cart Error:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}

export { getAllCart, getCartByUserId, createOrUpdateCart };
