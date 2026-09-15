import mongoose from "mongoose";
import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";
import { File } from "../models/file.model.js";
import { generateHandle } from "../utils/generateHandle.js";
import cloudinary from "../config/cloudinary.js";

const getCategoryQuery = (identifier) =>
    mongoose.Types.ObjectId.isValid(identifier)
        ? { _id: identifier }
        : { handle: identifier };

const SORT_WHITELIST = ["name", "sortOrder", "createdAt", "updatedAt", "productCount"];

const categoryNameExists = async (name, excludeId = null) => {
    const query = { name: { $regex: new RegExp(`^${name}$`, "i") } };
    if (excludeId) query._id = { $ne: excludeId };
    return !!(await Category.findOne(query).lean());
};

const generateUniqueHandle = async (baseHandle, excludeId = null) => {
    let handle = baseHandle;
    let counter = 1;

    while (await Category.exists({ handle, ...(excludeId && { _id: { $ne: excludeId } }) })) {
        handle = `${baseHandle}-${counter}`;
        counter++;
    }

    return handle;
};


const OPERATOR_MAP = {
    equals: "$eq",
    not_equals: "$ne",
    greater_than: "$gt",
    greater_than_or_equal: "$gte",
    less_than: "$lt",
    less_than_or_equal: "$lte",
    in: "$in",
    not_in: "$nin",
};

const FIELD_MAP = {
    title: "title",
    description: "description",
    price: "variants.price",
    compareAtPrice: "variants.compareAtPrice",
    inventory: "inventory_quantity",
    status: "isActive",
    isbn: "isbn",
};

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildConditionClause = (condition) => {
    const { field, operator, value } = condition;

    if (field === "status") {
        if (operator === "equals") return { isActive: value === "active" };
        if (operator === "not_equals") return { isActive: value !== "active" };
        return null;
    }

    const productField = FIELD_MAP[field] || field;

    switch (operator) {
        case "contains":
            return { [productField]: { $regex: escapeRegex(value), $options: "i" } };
        case "not_contains":
            return { [productField]: { $not: new RegExp(escapeRegex(value), "i") } };
        case "starts_with":
            return { [productField]: { $regex: `^${escapeRegex(value)}`, $options: "i" } };
        case "ends_with":
            return { [productField]: { $regex: `${escapeRegex(value)}$`, $options: "i" } };
    }

    const mongoOp = OPERATOR_MAP[operator];
    if (!mongoOp) return null;
    return { [productField]: { [mongoOp]: value } };
};

const buildQueryFromConditions = (category) => {
    if (category.type !== "automatic" || !category.conditions?.length) {
        return {};
    }

    const clauses = category.conditions.map(buildConditionClause).filter(Boolean);
    if (!clauses.length) return {};

    return category.conditionMatch === "any" ? { $or: clauses } : { $and: clauses };
};


const getProductCount = async (category, includeInactive = false) => {
    const query =
        category.type === "manual"
            ? { categories: category._id }
            : buildQueryFromConditions(category);

    if (!includeInactive) {
        query.isActive = true;
    }

    return Product.countDocuments(query);
};

const cleanupCategoryImage = async (publicId, excludeId = null) => {
    if (!publicId) return;
    try {
        const query = { imagePublicId: publicId };
        if (excludeId) query._id = { $ne: excludeId };

        const count = await Category.countDocuments(query);
        if (count === 0) {
            await cloudinary.uploader.destroy(publicId, { invalidate: true });
            await File.deleteOne({ publicId });
        }
    } catch (error) {
        console.error(`Failed to cleanup image ${publicId}:`, error.message);
    }
};

const parseMaybeJSON = (value, fallback) => {
    if (typeof value !== "string") return value ?? fallback;
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
};

const coerceBool = (v) => v === true || v === "true" || v === "1";

export const getAllCategoriesWithCount = async (req, res) => {
    try {
        const {
            search,
            sortBy = "sortOrder",
            sortOrder = "asc",
            page = 1,
            limit = 20,
            includeInactive = false,
        } = req.query;

        const pageNum = Math.max(1, Number(page) || 1);
        const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));

        if (!SORT_WHITELIST.includes(sortBy)) {
            return res.status(400).json({
                success: false,
                message: `Invalid sortBy field. Allowed: ${SORT_WHITELIST.join(", ")}`,
            });
        }

        const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1, name: 1 };
        const filter = {};

        if (!includeInactive) filter.isActive = true;

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { handle: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }

        const [categories, total] = await Promise.all([
            Category.find(filter).sort(sort).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
            Category.countDocuments(filter),
        ]);

        const data = await Promise.all(
            categories.map(async (c) => ({
                id: c._id,
                name: c.name,
                handle: c.handle,
                description: c.description,
                image: c.image,
                type: c.type,
                isActive: c.isActive,
                sortOrder: c.sortOrder,
                conditionMatch: c.conditionMatch,
                productCount: await getProductCount(c, includeInactive),
            }))
        );

        return res.status(200).json({
            success: true,
            data,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
                hasNextPage: pageNum * limitNum < total,
                hasPreviousPage: pageNum > 1,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getAllCategories = getAllCategoriesWithCount;

export const getCategoryDetail = async (req, res) => {
    try {
        const { identifier } = req.params;

        if (["admin", "all", "popular", "stats"].includes(identifier)) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        const category = await Category.findOne(getCategoryQuery(identifier)).lean();
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        const isAdmin = req.user?.role === "admin";
        if (!category.isActive && !isAdmin) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        const productCount = await getProductCount(category, isAdmin);

        return res.status(200).json({
            success: true,
            data: {
                id: category._id,
                name: category.name,
                handle: category.handle,
                description: category.description,
                image: category.image,
                imagePublicId: isAdmin ? category.imagePublicId : undefined,
                type: category.type,
                conditionMatch: category.conditionMatch,
                isActive: category.isActive,
                sortOrder: category.sortOrder,
                productCount,
                products: category.products || [],
                conditions: isAdmin ? category.conditions : undefined,
                createdAt: category.createdAt,
                updatedAt: category.updatedAt,
            },
        });
    } catch (error) {
        console.error("getCategoryDetail error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getCategoryWithProducts = async (req, res) => {
    try {
        const { identifier } = req.params;
        const { page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc" } = req.query;

        if (["admin", "all", "popular"].includes(identifier)) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        const category = await Category.findOne(getCategoryQuery(identifier)).lean();
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        const isAdmin = req.user?.role === "admin";
        if (!category.isActive && !isAdmin) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        const pageNum = Math.max(1, Number(page) || 1);
        const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));

        const allowedSortFields = ["createdAt", "updatedAt", "title", "price", "inventory"];
        if (!allowedSortFields.includes(sortBy)) {
            return res.status(400).json({
                success: false,
                message: `Invalid sortBy field. Allowed: ${allowedSortFields.join(", ")}`,
            });
        }

        const query =
            category.type === "manual"
                ? { categories: category._id }
                : buildQueryFromConditions(category);

        if (!isAdmin) query.isActive = true;

        const sortFieldMap = { price: "variants.price", inventory: "inventory_quantity" };
        const actualSortField = sortFieldMap[sortBy] || sortBy;
        const sort = { [actualSortField]: sortOrder === "asc" ? 1 : -1 };

        const [products, total] = await Promise.all([
            Product.find(query)
                .select("title handle variants image images isActive inventory_quantity")
                .sort(sort)
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .lean(),
            Product.countDocuments(query),
        ]);

        const enrichedProducts = products.map((p) => {
            const variants = (p.variants || []).filter((v) => v.isActive !== false);
            const prices = variants.map((v) => v.price).filter((n) => typeof n === "number");
            return {
                ...p,
                minPrice: prices.length ? Math.min(...prices) : 0,
                maxPrice: prices.length ? Math.max(...prices) : 0,
                totalInventory: variants.reduce((t, v) => t + (v.inventory_quantity || 0), 0),
            };
        });

        return res.status(200).json({
            success: true,
            data: {
                category: {
                    id: category._id,
                    name: category.name,
                    handle: category.handle,
                    description: category.description,
                    image: category.image,
                    type: category.type,
                },
                products: enrichedProducts,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum),
                    hasNextPage: pageNum * limitNum < total,
                    hasPreviousPage: pageNum > 1,
                },
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getCategoryStatistics = async (req, res) => {
    try {
        const categories = await Category.find().lean();

        const stats = await Promise.all(
            categories.map(async (c) => {
                const query =
                    c.type === "manual"
                        ? { categories: c._id, isActive: true }
                        : { ...buildQueryFromConditions(c), isActive: true };

                const products = await Product.find(query)
                    .select("variants inventory_quantity")
                    .lean();

                const productCount = products.length;
                const totalInventory = products.reduce(
                    (t, p) => t + (p.inventory_quantity || 0),
                    0
                );

                const allPrices = products.flatMap((p) =>
                    (p.variants || []).map((v) => v.price).filter((n) => typeof n === "number")
                );

                const minPrice = allPrices.length ? Math.min(...allPrices) : 0;
                const maxPrice = allPrices.length ? Math.max(...allPrices) : 0;
                const averagePrice = allPrices.length
                    ? allPrices.reduce((a, b) => a + b, 0) / allPrices.length
                    : 0;

                return {
                    _id: c._id,
                    name: c.name,
                    handle: c.handle,
                    description: c.description,
                    type: c.type,
                    isActive: c.isActive,
                    productCount,
                    totalInventory,
                    minPrice,
                    maxPrice,
                    averagePrice,
                    createdAt: c.createdAt,
                    updatedAt: c.updatedAt,
                };
            })
        );

        stats.sort((a, b) => b.productCount - a.productCount);

        return res.status(200).json({ success: true, data: stats });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getPopularCategories = async (req, res) => {
    try {
        const { limit = 5 } = req.query;
        const limitNum = Math.min(20, Math.max(1, Number(limit) || 5));

        const categories = await Category.find({ isActive: true }).lean();

        const data = await Promise.all(
            categories.map(async (c) => ({
                id: c._id,
                name: c.name,
                handle: c.handle,
                description: c.description,
                image: c.image,
                type: c.type,
                productCount: await getProductCount(c),
            }))
        );

        data.sort((a, b) => b.productCount - a.productCount);

        return res.status(200).json({ success: true, data: data.slice(0, limitNum) });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const createCategory = async (req, res) => {
    try {
        const body = req.body || {};

        const {
            name,
            description,
            type = "manual",
            conditionMatch = "all",
            isActive = true,
            sortOrder = 0,
        } = body;

        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: "Category name is required" });
        }

        const categoryName = name.trim();

        if (await categoryNameExists(categoryName)) {
            return res.status(409).json({ success: false, message: "Category with this name already exists" });
        }

        const baseHandle = generateHandle(body.handle || categoryName);
        if (!baseHandle) {
            return res.status(400).json({ success: false, message: "Could not derive a valid handle from the category name" });
        }
        const handle = await generateUniqueHandle(baseHandle);

        const parsedConditions = parseMaybeJSON(body.conditions, []) || [];
        const parsedProducts = parseMaybeJSON(body.products, []) || [];

        const finalProducts = type === "manual" ? parsedProducts : [];

        let imageUrl = "";
        let imagePublicId = null;

        if (req.file) {
            imageUrl = req.file.path || req.file.secure_url || "";
            imagePublicId = req.file.filename || req.file.public_id || null;

            await File.updateOne(
                { publicId: imagePublicId },
                { $set: { publicId: imagePublicId, url: imageUrl } },
                { upsert: true }
            );
        } else if (body.image) {
            imageUrl = body.image;
            imagePublicId = body.imagePublicId || null;
        }

        const category = await Category.create({
            name: categoryName,
            handle,
            description: description?.trim() || "",
            image: imageUrl,
            imagePublicId,
            type,
            conditionMatch,
            conditions: parsedConditions,
            products: finalProducts,
            isActive: coerceBool(isActive),
            sortOrder: Number(sortOrder) || 0,
        });

        return res.status(201).json({ success: true, message: "Category created successfully", data: category });
    } catch (error) {
        console.error(error);

        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: "Category with this name or handle already exists" });
        }
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

export const updateCategory = async (req, res) => {
    try {
        const { identifier } = req.params;
        const category = await Category.findOne(getCategoryQuery(identifier));

        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        const body = req.body || {};
        const updateData = {};

        if (body.name !== undefined) {
            const newName = String(body.name).trim();
            if (!newName) {
                return res.status(400).json({
                    success: false,
                    message: "Category name cannot be empty",
                });
            }
            if (await categoryNameExists(newName, category._id)) {
                return res.status(409).json({
                    success: false,
                    message: "Category with this name already exists",
                });
            }
            updateData.name = newName;
        }

        if (body.description !== undefined) {
            updateData.description = String(body.description).trim();
        }

        if (body.handle !== undefined) {
            const newHandle = generateHandle(String(body.handle));
            if (!newHandle) {
                return res.status(400).json({ success: false, message: "Invalid handle" });
            }
            updateData.handle = await generateUniqueHandle(newHandle, category._id);
        }

        if (body.type !== undefined) {
            if (!["manual", "automatic"].includes(body.type)) {
                return res.status(400).json({
                    success: false,
                    message: "type must be 'manual' or 'automatic'",
                });
            }
            updateData.type = body.type;
        }

        if (body.conditionMatch !== undefined) {
            if (!["all", "any"].includes(body.conditionMatch)) {
                return res.status(400).json({
                    success: false,
                    message: "conditionMatch must be 'all' or 'any'",
                });
            }
            updateData.conditionMatch = body.conditionMatch;
        }
        if (body.conditions !== undefined) {
            const parsed = parseMaybeJSON(body.conditions, []) || [];
            updateData.conditions = parsed;
        }

        if (body.products !== undefined) {
            const parsed = parseMaybeJSON(body.products, []) || [];
            updateData.products = parsed;
        }

        const effectiveType = updateData.type || category.type;
        if (effectiveType === "automatic") {
            updateData.products = [];
        }

        if (body.isActive !== undefined) {
            updateData.isActive = coerceBool(body.isActive);
        }

        if (body.sortOrder !== undefined) {
            const n = Number(body.sortOrder);
            if (!Number.isInteger(n)) {
                return res.status(400).json({
                    success: false,
                    message: "sortOrder must be an integer",
                });
            }
            updateData.sortOrder = n;
        }

        if (req.file) {
            const newUrl = req.file.path || req.file.secure_url || "";
            const newPublicId = req.file.filename || req.file.public_id || null;

            updateData.image = newUrl;
            updateData.imagePublicId = newPublicId;

            await File.updateOne(
                { publicId: newPublicId },
                { $set: { publicId: newPublicId, url: newUrl } },
                { upsert: true }
            );

            if (category.imagePublicId && category.imagePublicId !== newPublicId) {
                await cleanupCategoryImage(category.imagePublicId, category._id);
            }
        } else if (body.image !== undefined) {
            updateData.image = body.image || "";
            updateData.imagePublicId = body.imagePublicId || null;

            if (
                category.imagePublicId &&
                category.imagePublicId !== body.imagePublicId
            ) {
                await cleanupCategoryImage(category.imagePublicId, category._id);
            }
        }

        const updated = await Category.findByIdAndUpdate(
            category._id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            success: true,
            message: "Category updated successfully",
            data: updated,
        });
    } catch (error) {
        console.error(error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Category with this name or handle already exists",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const { identifier } = req.params;
        const category = await Category.findOne(getCategoryQuery(identifier));

        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        if (category.type === "manual") {
            const productCount = await Product.countDocuments({
                categories: category._id,
            });

            if (productCount > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot delete category with ${productCount} products. Please reassign or delete the products first.`,
                });
            }
        }

        if (category.imagePublicId) {
            await cleanupCategoryImage(category.imagePublicId, category._id);
        }

        await Category.findByIdAndDelete(category._id);

        return res.status(200).json({
            success: true,
            message: "Category deleted successfully",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const addProductToCategory = async (req, res) => {
    try {
        const { categoryId, productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({ success: false, message: "Invalid category ID" });
        }
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: "Invalid product ID" });
        }

        const [category, product] = await Promise.all([
            Category.findById(categoryId),
            Product.findById(productId),
        ]);

        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        if (category.type !== "manual") {
            return res.status(400).json({
                success: false,
                message: "Cannot manually assign products to automatic categories",
            });
        }

        if (!category.products.some((id) => id.equals(product._id))) {
            category.products.push(product._id);
            await category.save();
        }

        if (!product.categories?.some((id) => id.equals(category._id))) {
            product.categories = product.categories || [];
            product.categories.push(category._id);
            await product.save();
        }

        return res.status(200).json({
            success: true,
            message: "Product added to category successfully",
            data: { categoryId: category._id, productId: product._id },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const removeProductFromCategory = async (req, res) => {
    try {
        const { categoryId, productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({ success: false, message: "Invalid category ID" });
        }
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: "Invalid product ID" });
        }

        const [category, product] = await Promise.all([
            Category.findById(categoryId),
            Product.findById(productId),
        ]);

        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        category.products = category.products.filter((id) => !id.equals(product._id));
        await category.save();

        product.categories = (product.categories || []).filter(
            (id) => !id.equals(category._id)
        );
        await product.save();

        return res.status(200).json({
            success: true,
            message: "Product removed from category successfully",
            data: { categoryId: category._id, productId: product._id },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const previewAutomaticMatches = async (req, res) => {
    try {
        const body = req.body || {};
        const conditionMatch = body.conditionMatch || "all";
        const conditions = parseMaybeJSON(body.conditions, []) || [];
        const limit = body.limit || 20;

        if (!Array.isArray(conditions) || conditions.length === 0) {
            return res.status(200).json({
                success: true,
                data: { products: [], total: 0 },
            });
        }

        const fakeCategory = { type: "automatic", conditionMatch, conditions };
        const query = buildQueryFromConditions(fakeCategory);

        if (req.user?.role !== "admin") {
            query.isActive = true;
        }

        const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));

        const [products, total] = await Promise.all([
            Product.find(query)
                .select("title handle image images variants isActive inventory_quantity")
                .limit(limitNum)
                .lean(),
            Product.countDocuments(query),
        ]);

        const enriched = products.map((p) => {
            const variants = (p.variants || []).filter((v) => v.isActive !== false);
            const prices = variants.map((v) => v.price).filter((n) => typeof n === "number");
            return {
                id: p._id,
                title: p.title,
                handle: p.handle,
                image: p.image?.url || p.images?.[0]?.url || "",
                minPrice: prices.length ? Math.min(...prices) : 0,
                maxPrice: prices.length ? Math.max(...prices) : 0,
                inventory: variants.reduce((t, v) => t + (v.inventory_quantity || 0), 0),
            };
        });

        return res.status(200).json({
            success: true,
            data: { products: enriched, total },
        });
    } catch (error) {
        console.error("previewAutomaticMatches error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};