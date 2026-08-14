import mongoose from "mongoose";
import { Cart } from "../models/cart.model.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

const getAllCart = asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const filter = { "items.0": { $exists: true } };

    const [carts, total] = await Promise.all([
        Cart.find(filter)
            .populate("userId", "first_name last_name username email")
            .populate("items.bookId", "name price coverImage")
            .sort({ updatedAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Cart.countDocuments(filter),
    ]);

    return res.status(200).json({
        data: carts.map((cart) => ({
            ...cart,
            user: cart.userId,
            items: cart.items
                .filter((i) => i.bookId)
                .map((i) => ({
                    bookId: String(i.bookId._id),
                    quantity: i.quantity,
                    book: i.bookId,
                })),
        })),
        total,
        page,
        pages: Math.ceil(total / limit),
    });
});

const getCartByUserId = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid id" });
    }

    const cart = await Cart.findOne({ $or: [{ userId: id }, { _id: id }] })
        .populate("userId", "first_name last_name username email role")
        .populate(
            "items.bookId",
            "name price coverImage author stockQty subject classLevel"
        )
        .lean();

    if (!cart) return res.status(200).json({ userId: id, items: [] });

    return res.status(200).json({
        ...cart,
        user: cart.userId,
        items: cart.items
            .filter((i) => i.bookId)
            .map((i) => ({
                bookId: String(i.bookId._id),
                quantity: i.quantity,
                book: i.bookId,
            })),
    });
});

const createOrUpdateCart = asyncHandler(async (req, res) => {
    const { userId, bookId, quantity = 1 } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid userId" });
    }
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
        return res.status(400).json({ message: "Invalid bookId" });
    }
    if (typeof quantity !== "number") {
        return res.status(400).json({ message: "Quantity must be a number" });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
        if (quantity <= 0) {
            return res
                .status(400)
                .json({ message: "Quantity must be greater than 0" });
        }
        cart = await Cart.create({ userId, items: [{ bookId, quantity }] });
        return res.status(201).json({ message: "Cart created", cart });
    }

    const idx = cart.items.findIndex(
        (item) => String(item.bookId) === String(bookId)
    );

    if (idx !== -1) {
        cart.items[idx].quantity += quantity;
        if (cart.items[idx].quantity <= 0) cart.items.splice(idx, 1);
    } else {
        if (quantity <= 0) {
            return res
                .status(400)
                .json({ message: "Quantity must be greater than 0" });
        }
        cart.items.push({ bookId, quantity });
    }

    if (cart.items.length === 0) {
        await Cart.deleteOne({ userId });
        return res.status(200).json({ message: "Cart cleared", cart: null });
    }

    await cart.save();
    return res.status(200).json({ message: "Cart updated", cart });
});

const updateCart = asyncHandler(async (req, res) => {
    const { userId, bookId, quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid userId" });
    }
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
        return res.status(400).json({ message: "Invalid bookId" });
    }
    if (typeof quantity !== "number") {
        return res.status(400).json({ message: "Quantity must be a number" });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const idx = cart.items.findIndex(
        (item) => String(item.bookId) === String(bookId)
    );
    if (idx === -1) {
        return res.status(404).json({ message: "Item not found in cart" });
    }

    cart.items[idx].quantity += quantity;
    if (cart.items[idx].quantity <= 0) cart.items.splice(idx, 1);

    if (cart.items.length === 0) {
        await Cart.deleteOne({ userId });
        return res.status(200).json({ message: "Cart cleared", cart: null });
    }

    await cart.save();
    return res.status(200).json({ message: "Cart updated", cart });
});

const deleteCart = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid Cart ID" });
    }
    await Cart.findByIdAndDelete(id);
    return res.json({ status: "success", message: "Cart deleted successfully" });
});

const clearCart = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
    }
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = [];
    await cart.save();
    return res.json({ success: true, message: "Cart cleared successfully" });
});

export {
    getAllCart,
    getCartByUserId,
    createOrUpdateCart,
    updateCart,
    deleteCart,
    clearCart,
};
