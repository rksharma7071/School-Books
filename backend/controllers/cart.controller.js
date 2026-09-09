import mongoose from "mongoose";
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import { ApiError, handleError } from "../utils/apiError.js";

const findVariant = (product, variantId) => {
    if (!product?.variants || !variantId) return null;
    return product.variants.find((v) => String(v._id) === String(variantId)) || null;
};

const buildCartResponse = async (cart) => {
    const items = cart.items || [];
    const productIds = [...new Set(items.map((i) => String(i.productId)))];

    const products = productIds.length
        ? await Product.find({ _id: { $in: productIds } }).select("title image images variants isActive").lean()
        : [];
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    let subtotal = 0;
    let totalItems = 0;

    const enrichedItems = items.map((item) => {
        const product = productMap.get(String(item.productId));
        const base = {
            itemId: item._id,
            productId: item.productId,
            variantId: item.variantId || null,
            quantity: item.quantity,
        };

        if (!product) {
            return { ...base, product: null, available: false, lineTotal: 0 };
        }

        const variant = item.variantId ? findVariant(product, item.variantId) : null;
        const price = variant ? variant.price : 0;
        const lineTotal = price * item.quantity;

        const productActive = product.isActive !== false;
        const variantActive = !variant || variant.isActive !== false;
        const available = productActive && !!variant && variantActive;

        if (available) {
            subtotal += lineTotal;
            totalItems += item.quantity;
        }

        return {
            ...base,
            product: {
                id: product._id,
                name: product.title,
                image: product.image?.url || product.images?.[0]?.url || null,
                price,
                isActive: productActive,
                variant: variant
                    ? {
                          id: variant._id,
                          sku: variant.sku,
                          options: variant.options,
                          price: variant.price,
                          inventory_quantity: variant.inventory_quantity,
                          isActive: variant.isActive !== false,
                      }
                    : null,
            },
            available,
            lineTotal,
        };
    });

    return {
        id: cart._id,
        userId: cart.userId,
        items: enrichedItems,
        totalItems,
        subtotal,
    };
};

export const getAllCart = async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Number(req.query.limit) || 20);
        const filter = { "items.0": { $exists: true } };

        const [carts, total] = await Promise.all([
            Cart.find(filter)
                .populate("userId", "first_name last_name username email")
                .sort({ updatedAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Cart.countDocuments(filter),
        ]);

        const data = await Promise.all(
            carts.map(async (c) => ({ ...(await buildCartResponse(c)), user: c.userId }))
        );

        res.status(200).json({
            success: true,
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < total,
                hasPreviousPage: page > 1,
            },
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getCartByUserId = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid id");
        if (req.user.role !== "admin" && String(id) !== String(req.user.id)) {
            throw new ApiError(403, "You can only view your own cart");
        }

        const cart = await Cart.findOne({ userId: id }).lean();
        if (!cart) {
            return res.status(200).json({ success: true, data: { userId: id, items: [], totalItems: 0, subtotal: 0 } });
        }

        const enriched = await buildCartResponse(cart);
        res.status(200).json({ success: true, data: enriched });
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
        if (req.user.role !== "admin" && String(cart.userId) !== String(req.user.id)) {
            throw new ApiError(403, "You can only delete your own cart");
        }

        await Cart.findByIdAndDelete(id);
        res.json({ success: true, message: "Cart deleted successfully" });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getMyCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await Cart.findOne({ userId }).lean();

        if (!cart) {
            return res.status(200).json({ success: true, data: { userId, items: [], totalItems: 0, subtotal: 0 } });
        }

        const enriched = await buildCartResponse(cart);
        res.status(200).json({ success: true, data: enriched });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const addItemToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.body;
        let { variantId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(productId)) throw new ApiError(400, "Invalid productId");
        if (variantId !== undefined && variantId !== null && !mongoose.Types.ObjectId.isValid(variantId)) {
            throw new ApiError(400, "Invalid variantId");
        }

        const quantity = Number(req.body.quantity ?? 1);
        if (!Number.isInteger(quantity) || quantity < 1) throw new ApiError(400, "quantity must be a positive integer");

        const product = await Product.findById(productId).select("title isActive variants image images").lean();
        if (!product) throw new ApiError(404, "Product not found");
        if (product.isActive === false) throw new ApiError(400, "Product is not available");

        const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
        let variant = null;

        if (hasVariants) {
            if (!variantId) throw new ApiError(400, "variantId is required for this product");
            variant = findVariant(product, variantId);
            if (!variant) throw new ApiError(404, "Variant not found");
            if (variant.isActive === false) throw new ApiError(400, "Selected variant is not available");
        } else {
            variantId = null;
        }

        const availableInventory = variant ? variant.inventory_quantity : 0;
        if (availableInventory < quantity) throw new ApiError(409, "Insufficient inventory for the requested quantity");

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            try {
                cart = await Cart.create({ userId, items: [] });
            } catch (error) {
                if (error.code === 11000) {
                    cart = await Cart.findOne({ userId });
                } else {
                    throw error;
                }
            }
        }

        const idx = cart.items.findIndex(
            (item) => String(item.productId) === String(productId) && String(item.variantId || "") === String(variantId || "")
        );

        const newQuantity = idx !== -1 ? cart.items[idx].quantity + quantity : quantity;
        if (newQuantity > availableInventory) {
            throw new ApiError(409, `Only ${availableInventory} unit(s) available for this item`);
        }

        if (idx !== -1) {
            cart.items[idx].quantity = newQuantity;
        } else {
            cart.items.push({ productId, variantId, quantity: newQuantity });
        }

        await cart.save();

        const enriched = await buildCartResponse(cart);
        res.status(200).json({ success: true, message: "Item added to cart", data: enriched });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const setItemQuantity = async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(itemId)) throw new ApiError(400, "Invalid item id");

        const quantity = Number(req.body.quantity);
        if (!Number.isInteger(quantity) || quantity < 1) throw new ApiError(400, "quantity must be a positive integer");

        const cart = await Cart.findOne({ userId });
        if (!cart) throw new ApiError(404, "Cart not found");

        const item = cart.items.id(itemId);
        if (!item) throw new ApiError(404, "Cart item not found");

        const product = await Product.findById(item.productId).select("isActive variants").lean();
        if (!product || product.isActive === false) throw new ApiError(400, "Product is no longer available");

        let availableInventory = 0;
        if (item.variantId) {
            const variant = findVariant(product, item.variantId);
            if (!variant || variant.isActive === false) throw new ApiError(400, "Variant is no longer available");
            availableInventory = variant.inventory_quantity;
        }

        if (quantity > availableInventory) {
            throw new ApiError(409, `Only ${availableInventory} unit(s) available for this item`);
        }

        item.quantity = quantity;
        await cart.save();

        const enriched = await buildCartResponse(cart);
        res.status(200).json({ success: true, message: "Cart item updated", data: enriched });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const removeCartItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(itemId)) throw new ApiError(400, "Invalid item id");

        const cart = await Cart.findOne({ userId });
        if (!cart) throw new ApiError(404, "Cart not found");

        const item = cart.items.id(itemId);
        if (!item) throw new ApiError(404, "Cart item not found");

        item.deleteOne();
        await cart.save();

        const enriched = await buildCartResponse(cart);
        res.status(200).json({ success: true, message: "Item removed from cart", data: enriched });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const clearCart = async (req, res) => {
    try {
        const { userId: paramUserId } = req.params;

        let targetUserId = req.user.id;
        if (paramUserId) {
            if (req.user.role !== "admin") throw new ApiError(403, "Only admins can clear another user's cart");
            if (!mongoose.Types.ObjectId.isValid(paramUserId)) throw new ApiError(400, "Invalid userId");
            targetUserId = paramUserId;
        }

        const cart = await Cart.findOne({ userId: targetUserId });
        if (!cart) throw new ApiError(404, "Cart not found");

        cart.items = [];
        await cart.save();

        res.json({ success: true, message: "Cart cleared successfully" });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const validateCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await Cart.findOne({ userId }).lean();

        if (!cart || cart.items.length === 0) {
            return res.status(200).json({
                success: true,
                valid: true,
                issues: [],
                data: { items: [], totalItems: 0, subtotal: 0 },
            });
        }

        const productIds = [...new Set(cart.items.map((i) => String(i.productId)))];
        const products = await Product.find({ _id: { $in: productIds } }).select("title isActive variants").lean();
        const productMap = new Map(products.map((p) => [String(p._id), p]));

        const issues = [];

        for (const item of cart.items) {
            const product = productMap.get(String(item.productId));

            if (!product) {
                issues.push({ itemId: item._id, productId: item.productId, issue: "product_not_found" });
                continue;
            }
            if (product.isActive === false) {
                issues.push({ itemId: item._id, productId: item.productId, issue: "product_inactive" });
                continue;
            }

            const variant = item.variantId ? findVariant(product, item.variantId) : null;

            if (item.variantId && !variant) {
                issues.push({ itemId: item._id, productId: item.productId, variantId: item.variantId, issue: "variant_not_found" });
                continue;
            }
            if (variant && variant.isActive === false) {
                issues.push({ itemId: item._id, productId: item.productId, variantId: item.variantId, issue: "variant_inactive" });
                continue;
            }
            if (!Number.isInteger(item.quantity) || item.quantity < 1) {
                issues.push({ itemId: item._id, productId: item.productId, issue: "invalid_quantity" });
                continue;
            }

            const available = variant ? variant.inventory_quantity : 0;
            if (item.quantity > available) {
                issues.push({
                    itemId: item._id,
                    productId: item.productId,
                    variantId: item.variantId,
                    issue: "insufficient_inventory",
                    requested: item.quantity,
                    available,
                });
            }
        }

        const enriched = await buildCartResponse(cart);
        res.status(200).json({ success: true, valid: issues.length === 0, issues, data: enriched });
    } catch (error) {
        handleError(error, req, res);
    }
};