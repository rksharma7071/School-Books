import mongoose from "mongoose";
import { Cart } from "../models/cart.model.js";
import { User } from "../models/user.model.js";

async function getAllCart(req, res) {
    try {
        await Cart.deleteMany({
            $or: [{ items: { $exists: false } }, { items: { $size: 0 } }],
        });

        const carts = await Cart.find({});

        return res.status(200).json(carts || []);
    } catch (error) {
        console.error("Get All Cart Error:", error);
        return res.status(500).json({
            message: "Failed to fetch carts",
        });
    }
}

async function getCartByUserId(req, res) {
    try {
        const { id } = req.params;

        const cart = await Cart.findOne({ userId: id });

        if (!cart) {
            return res
                .status(404)
                .json({ message: "Cart not found for this user" });
        }
        return res.status(200).json(cart);
    } catch (error) {
        console.error("Get Cart By UserId Error:", error);

        return res.status(500).json({ message: "Failed to fetch cart" });
    }
}

async function createOrUpdateCart(req, res) {
    try {
        const { userId, bookId, quantity = 1 } = req.body;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid userId" });
        }

        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            return res.status(400).json({ message: "Invalid bookId" });
        }

        if (typeof quantity !== "number") {
            return res
                .status(400)
                .json({ message: "Quantity must be a number" });
        }

        let cart = await Cart.findOne({ userId });

        // 🆕 Create cart
        if (!cart) {
            if (quantity <= 0) {
                return res.status(400).json({
                    message: "Quantity must be greater than 0",
                });
            }

            cart = await Cart.create({
                userId,
                items: [{ bookId, quantity }],
            });

            return res.status(201).json({
                message: "Cart created successfully",
                cart,
            });
        }

        const itemIndex = cart.items.findIndex(
            (item) => String(item.bookId) === String(bookId)
        );

        // ➕ Item exists → update quantity
        if (itemIndex !== -1) {
            cart.items[itemIndex].quantity += quantity;

            // ❌ Remove item if quantity <= 0
            if (cart.items[itemIndex].quantity <= 0) {
                cart.items.splice(itemIndex, 1);
            }
        }
        // ➕ Item does not exist → add new
        else {
            if (quantity <= 0) {
                return res.status(400).json({
                    message: "Quantity must be greater than 0",
                });
            }

            cart.items.push({ bookId, quantity });
        }

        // 🧹 Remove cart if empty
        if (cart.items.length === 0) {
            await Cart.deleteOne({ userId });
            return res.status(200).json({
                message: "Cart cleared",
                cart: null,
            });
        }

        await cart.save();

        return res.status(200).json({
            message: "Cart updated successfully",
            cart,
        });
    } catch (error) {
        console.error("Cart Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function updateCart(req, res) {
    try {
        const { userId, bookId, quantity } = req.body;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid userId" });
        }

        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            return res.status(400).json({ message: "Invalid bookId" });
        }

        if (typeof quantity !== "number") {
            return res
                .status(400)
                .json({ message: "Quantity must be a number" });
        }

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        const itemIndex = cart.items.findIndex(
            (item) => String(item.bookId) === String(bookId)
        );

        if (itemIndex === -1) {
            return res.status(404).json({ message: "Item not found in cart" });
        }

        // 🔁 Update quantity
        cart.items[itemIndex].quantity += quantity;

        // ❌ Remove item if quantity <= 0
        if (cart.items[itemIndex].quantity <= 0) {
            cart.items.splice(itemIndex, 1);
        }

        // 🧹 Delete cart if empty
        if (cart.items.length === 0) {
            await Cart.deleteOne({ userId });
            return res.status(200).json({
                message: "Cart cleared",
                cart: null,
            });
        }

        await cart.save();

        return res.status(200).json({
            message: "Cart updated successfully",
            cart,
        });
    } catch (error) {
        console.error("Update Cart Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function deleteCart(req, res) {
    try {
        const id = req.params.id;
        if (!id) {
            return res.status(400).json({ message: "Invalid Cart ID" });
        }
        await Cart.findByIdAndDelete(id);
        return res.json({
            status: "success",
            message: "Cart deleted successfully",
        });
    } catch (error) {
        console.error("Cart delete error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export const clearCart = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        cart.items = [];
        await cart.save();

        return res.json({
            success: true,
            message: "Cart cleared successfully",
        });
    } catch (error) {
        console.error("Clear cart error:", error);
        res.status(500).json({ message: "Failed to clear cart" });
    }
};

export {
    getAllCart,
    getCartByUserId,
    createOrUpdateCart,
    updateCart,
    deleteCart,
};
