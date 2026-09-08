import mongoose from "mongoose";
import { Cart } from "../models/cart.model.js";
import { ApiError, handleError } from "../utils/apiError.js";

const formatCart = (cart) => ({
    ...cart,
    user: cart.userId,
    items: cart.items.filter((i) => i.productId).map((i) => ({
        productId: String(i.productId._id),
        quantity: i.quantity,
        product: i.productId,
    })),
});

export const getAllCart = async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Number(req.query.limit) || 20);
        const filter = { "items.0": { $exists: true } };

        const [carts, total] = await Promise.all([
            Cart.find(filter)
                .populate("userId", "first_name last_name username email")
                .populate("items.productId", "name price coverImage")
                .sort({ updatedAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Cart.countDocuments(filter),
        ]);

        res.status(200).json({ data: carts.map(formatCart), total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getCartByUserId = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid id");
        if (req.user.role !== "admin" && String(id) !== String(req.user.id)) throw new ApiError(403, "You can only view your own cart");

        const cart = await Cart.findOne({ userId: id })
            .populate("userId", "first_name last_name username email role")
            .populate("items.productId", "name price coverImage author stockQty subject classLevel")
            .lean();

        if (!cart) return res.status(200).json({ userId: id, items: [] });
        res.status(200).json(formatCart(cart));
    } catch (error) {
        handleError(error, req, res);
    }
};

export const createOrUpdateCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, quantity = 1 } = req.body;

        if (!mongoose.Types.ObjectId.isValid(productId)) throw new ApiError(400, "Invalid productId");
        if (typeof quantity !== "number" || isNaN(quantity)) throw new ApiError(400, "Quantity must be a number");

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            if (quantity <= 0) throw new ApiError(400, "Quantity must be greater than 0");
            cart = await Cart.create({ userId, items: [{ productId, quantity }] });
            return res.status(201).json({ message: "Cart created", cart });
        }

        const idx = cart.items.findIndex((item) => String(item.productId) === String(productId));
        if (idx !== -1) {
            cart.items[idx].quantity += quantity;
            if (cart.items[idx].quantity <= 0) cart.items.splice(idx, 1);
        } else {
            if (quantity <= 0) throw new ApiError(400, "Quantity must be greater than 0");
            cart.items.push({ productId, quantity });
        }

        if (cart.items.length === 0) {
            await Cart.deleteOne({ userId });
            return res.status(200).json({ message: "Cart cleared", cart: null });
        }

        await cart.save();
        res.status(200).json({ message: "Cart updated", cart });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const updateCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, quantity } = req.body;

        if (!mongoose.Types.ObjectId.isValid(productId)) throw new ApiError(400, "Invalid productId");
        if (typeof quantity !== "number" || isNaN(quantity)) throw new ApiError(400, "Quantity must be a number");

        const cart = await Cart.findOne({ userId });
        if (!cart) throw new ApiError(404, "Cart not found");

        const idx = cart.items.findIndex((item) => String(item.productId) === String(productId));
        if (idx === -1) throw new ApiError(404, "Item not found in cart");

        cart.items[idx].quantity += quantity;
        if (cart.items[idx].quantity <= 0) cart.items.splice(idx, 1);

        if (cart.items.length === 0) {
            await Cart.deleteOne({ userId });
            return res.status(200).json({ message: "Cart cleared", cart: null });
        }

        await cart.save();
        res.status(200).json({ message: "Cart updated", cart });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const deleteCart = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid Cart ID");

        const cart = await Cart.findById(id);
        if (!cart) throw new ApiError(404, "Cart not found");
        if (req.user.role !== "admin" && String(cart.userId) !== String(req.user.id)) throw new ApiError(403, "You can only delete your own cart");

        await Cart.findByIdAndDelete(id);
        res.json({ status: "success", message: "Cart deleted successfully" });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const clearCart = async (req, res) => {
    try {
        const { userId: paramUserId } = req.params;
        if (paramUserId) {
            if (req.user.role !== "admin") throw new ApiError(403, "Only admins can clear another user's cart");
            const cart = await Cart.findOne({ userId: paramUserId });
            if (!cart) throw new ApiError(404, "Cart not found");
            cart.items = [];
            await cart.save();
            return res.json({ success: true, message: "Cart cleared successfully" });
        }

        const userId = req.user.id;
        const cart = await Cart.findOne({ userId });
        if (!cart) throw new ApiError(404, "Cart not found");
        cart.items = [];
        await cart.save();
        res.json({ success: true, message: "Cart cleared successfully" });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getMyCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await Cart.findOne({ userId })
            .populate("userId", "first_name last_name username email role")
            .populate("items.productId", "name price coverImage author stockQty subject classLevel")
            .lean();

        if (!cart) return res.status(200).json({ userId, items: [], total: 0 });

        res.status(200).json({
            ...formatCart(cart),
            totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0),
            totalAmount: cart.items.reduce((sum, item) => sum + (item.productId?.price || 0) * item.quantity, 0),
        });
    } catch (error) {
        handleError(error, req, res);
    }
};