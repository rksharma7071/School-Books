import mongoose from "mongoose";
import slugify from "slugify";
import { Product } from "../models/product.model.js";
import { Review } from "../models/review.model.js";
import { File } from "../models/file.model.js";
import { ApiError, handleError } from "../utils/apiError.js";
import cloudinary from "../config/cloudinary.js";

const productQuery = (identifier) => (mongoose.Types.ObjectId.isValid(identifier) ? { _id: identifier } : { handle: identifier });

const getVariantKey = (options) => {
    if (!options) return "";
    const entries = options instanceof Map ? [...options.entries()] : Object.entries(options);
    return entries
        .map(([key, value]) => `${key.toLowerCase()}:${String(value).toLowerCase()}`)
        .sort()
        .join("|");
};

const validateProductOptions = (options) => {
    if (!Array.isArray(options) || options.length === 0) {
        throw new ApiError(400, "At least one option is required");
    }

    const seenNames = new Set();
    const normalizedOptions = [];

    for (const option of options) {
        if (!option.name || !String(option.name).trim()) {
            throw new ApiError(400, "Option name cannot be empty");
        }

        const name = String(option.name).toLowerCase().trim();
        if (seenNames.has(name)) {
            throw new ApiError(400, `Duplicate option name: ${option.name}`);
        }
        seenNames.add(name);

        if (!Array.isArray(option.values) || option.values.length === 0) {
            throw new ApiError(400, `Option "${name}" must have at least one value`);
        }

        const seenValues = new Set();
        const values = option.values.map((value) => {
            const normalized = String(value).trim();
            if (!normalized) {
                throw new ApiError(400, `Option "${name}" has an empty value`);
            }
            if (seenValues.has(normalized.toLowerCase())) {
                throw new ApiError(400, `Duplicate value "${value}" in option "${name}"`);
            }
            seenValues.add(normalized.toLowerCase());
            return normalized;
        });

        normalizedOptions.push({ name, values });
    }

    return normalizedOptions;
};

const validateVariantOptions = (variant, productOptions, variantIndex) => {
    const variantOptions = variant.options instanceof Map ? Object.fromEntries(variant.options) : variant.options || {};
    const variantOptionKeys = Object.keys(variantOptions).map((key) => key.toLowerCase());
    const productOptionNames = productOptions.map((opt) => opt.name.toLowerCase());

    for (const key of variantOptionKeys) {
        if (!productOptionNames.includes(key)) {
            throw new ApiError(400, `Variant ${variantIndex + 1} contains unknown option: ${key}`);
        }
    }

    for (const optionName of productOptionNames) {
        if (!variantOptionKeys.includes(optionName)) {
            throw new ApiError(400, `Variant ${variantIndex + 1} is missing required option: ${optionName}`);
        }
    }

    for (const option of productOptions) {
        const variantValue =
            variantOptions[option.name] ||
            Object.entries(variantOptions).find(([key]) => key.toLowerCase() === option.name.toLowerCase())?.[1];
        if (variantValue === undefined) {
            throw new ApiError(400, `Variant ${variantIndex + 1} is missing value for option "${option.name}"`);
        }
        if (!option.values.includes(String(variantValue))) {
            throw new ApiError(400, `Variant ${variantIndex + 1} has invalid value "${variantValue}" for option "${option.name}"`);
        }
    }
};

const validateVariants = (variants, options) => {
    if (!Array.isArray(variants) || variants.length === 0) {
        throw new ApiError(400, "At least one variant is required");
    }

    const seenCombinations = new Map();
    const seenSkus = new Set();
    const validatedVariants = [];

    for (let i = 0; i < variants.length; i++) {
        const variant = variants[i];

        if (variant.price === undefined || variant.price === null || isNaN(variant.price) || variant.price < 0) {
            throw new ApiError(400, `Variant ${i + 1} requires a valid, non-negative price`);
        }

        if (variant.cost !== undefined && variant.cost < 0) {
            throw new ApiError(400, `Variant ${i + 1} requires a non-negative cost`);
        }

        if (variant.compareAtPrice !== undefined) {
            if (variant.compareAtPrice < 0) {
                throw new ApiError(400, `Variant ${i + 1} requires a non-negative compareAtPrice`);
            }
            if (variant.compareAtPrice < variant.price) {
                throw new ApiError(400, `Variant ${i + 1} compareAtPrice must be greater than or equal to price`);
            }
        }

        if (variant.inventory_quantity === undefined || !Number.isInteger(variant.inventory_quantity) || variant.inventory_quantity < 0) {
            throw new ApiError(400, `Variant ${i + 1} requires a valid, non-negative integer inventory_quantity`);
        }

        validateVariantOptions(variant, options, i);

        const comboKey = getVariantKey(variant.options);
        if (seenCombinations.has(comboKey)) {
            const existing = seenCombinations.get(comboKey);
            const optionsStr = Object.entries(existing.options instanceof Map ? Object.fromEntries(existing.options) : existing.options)
                .map(([key, value]) => `${key}=${value}`)
                .sort()
                .join(", ");
            throw new ApiError(400, `Duplicate variant combination: ${optionsStr}`);
        }
        seenCombinations.set(comboKey, variant);

        if (variant.sku) {
            const normalizedSku = variant.sku.trim().toLowerCase();
            if (seenSkus.has(normalizedSku)) {
                throw new ApiError(400, `Duplicate SKU within product: ${variant.sku}`);
            }
            seenSkus.add(normalizedSku);
        }

        validatedVariants.push(variant);
    }

    return validatedVariants;
};

const validateGlobalSkus = async (variants, productId = null) => {
    const skus = variants.filter((v) => v.sku).map((v) => v.sku.trim());
    if (skus.length === 0) return;

    const query = { "variants.sku": { $in: skus.map((sku) => new RegExp(`^${sku}$`, "i")) } };
    if (productId) {
        query._id = { $ne: productId };
    }

    const products = await Product.find(query).select("variants.sku").lean();
    if (products.length === 0) return;

    const existingSkus = new Set();
    products.forEach((product) => {
        product.variants.forEach((variant) => {
            if (variant.sku) {
                existingSkus.add(variant.sku.toLowerCase());
            }
        });
    });

    const duplicateSkus = skus.filter((sku) => existingSkus.has(sku.toLowerCase()));
    if (duplicateSkus.length > 0) {
        throw new ApiError(400, `SKU already exists in another product: ${duplicateSkus.join(", ")}`);
    }
};

const generateSku = (productHandle, variantOptions, existingSkus) => {
    const base = `${productHandle.substring(0, 3).toUpperCase()}`;
    const optionPart = Object.entries(variantOptions instanceof Map ? Object.fromEntries(variantOptions) : variantOptions)
        .map(([key, value]) => `${key.substring(0, 1).toUpperCase()}${String(value).substring(0, 3).toUpperCase()}`)
        .sort()
        .join("-");

    let sku = `${base}-${optionPart}`;
    let counter = 1;

    while (existingSkus.has(sku.toLowerCase())) {
        sku = `${base}-${optionPart}-${counter}`;
        counter++;
    }

    return sku;
};

const calculateInventory = (variants) => {
    return variants
        .filter((v) => v.isActive !== false)
        .reduce((total, variant) => total + (Number(variant.inventory_quantity) || 0), 0);
};

const getPriceRange = (variants) => {
    const activeVariants = variants.filter((v) => v.isActive !== false);
    if (activeVariants.length === 0) {
        return { minPrice: 0, maxPrice: 0 };
    }

    const prices = activeVariants.map((v) => Number(v.price) || 0);
    return { minPrice: Math.min(...prices), maxPrice: Math.max(...prices) };
};

const getInventoryStatus = (quantity) => {
    if (quantity <= 0) return "out_of_stock";
    if (quantity <= 5) return "low_stock";
    return "in_stock";
};

const syncProductImages = async (product) => {
    const files = [
        product.image,
        ...(product.images || []),
        ...(product.variants || []).flatMap((variant) => variant.images || []),
    ].filter((file) => file?.url && file?.publicId);

    await Promise.all(
        files.map((file) => File.updateOne({ publicId: file.publicId }, { $set: file }, { upsert: true }))
    );
};

const removeImageFromCloudinary = async (publicId) => {
    if (!publicId) return;
    try {
        await cloudinary.uploader.destroy(publicId, { invalidate: true });
        await File.deleteOne({ publicId });
    } catch (error) {
        console.error(`Failed to delete image ${publicId}:`, error.message);
    }
};

const normalizeImagePositions = (images) => {
    return images
        .sort((a, b) => (a.position || 0) - (b.position || 0))
        .map((image, index) => ({ ...image, position: index + 1 }));
};

const processImageRemovals = async (product, removeImagePublicIds) => {
    if (!removeImagePublicIds || removeImagePublicIds.length === 0) return;

    const removedSet = new Set(removeImagePublicIds);

    if (product.images && product.images.length > 0) {
        product.images = product.images.filter((img) => !removedSet.has(img.publicId));
        product.images = normalizeImagePositions(product.images);
    }

    if (product.variants && product.variants.length > 0) {
        for (const variant of product.variants) {
            if (variant.images && variant.images.length > 0) {
                variant.images = variant.images.filter((img) => !removedSet.has(img.publicId));
                variant.images = normalizeImagePositions(variant.images);
            }
        }
    }

    if (product.image && removedSet.has(product.image.publicId)) {
        product.image = null;
        if (product.images && product.images.length > 0) {
            product.image = product.images[0];
            product.images.shift();
            product.images = normalizeImagePositions(product.images);
        }
    }

    await Promise.all(removeImagePublicIds.map(removeImageFromCloudinary));
};

const processImageOrdering = (product, imagesOrder) => {
    if (!imagesOrder || imagesOrder.length === 0) return;
    if (!product.images || product.images.length === 0) return;

    const imageMap = new Map(product.images.map((img) => [img.publicId, img]));
    const orderedImages = [];

    for (const publicId of imagesOrder) {
        const image = imageMap.get(publicId);
        if (image) {
            orderedImages.push(image);
            imageMap.delete(publicId);
        }
    }

    for (const image of imageMap.values()) {
        orderedImages.push(image);
    }

    product.images = normalizeImagePositions(orderedImages);
};

export const getAllProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            minPrice,
            maxPrice,
            isActive = true,
            sortBy = "createdAt",
            sortOrder = "desc",
            includeTotal,
        } = req.query;

        const pageNum = Number(page);
        const limitNum = Number(limit);

        const match = { isActive: isActive !== "false" };
        if (search) {
            match.$text = { $search: search };
        }

        const pipeline = [
            { $match: match },
            {
                $addFields: {
                    minPrice: { $min: "$variants.price" },
                    maxPrice: { $max: "$variants.price" },
                    totalInventory: {
                        $sum: {
                            $map: {
                                input: "$variants",
                                as: "variant",
                                in: {
                                    $cond: [{ $ne: ["$$variant.isActive", false] }, "$$variant.inventory_quantity", 0],
                                },
                            },
                        },
                    },
                },
            },
        ];

        if (minPrice !== undefined || maxPrice !== undefined) {
            const priceFilter = {};
            if (minPrice !== undefined) priceFilter.$gte = Number(minPrice);
            if (maxPrice !== undefined) priceFilter.$lte = Number(maxPrice);
            pipeline.push({ $match: { minPrice: priceFilter } });
        }

        const sortFields = { price: "minPrice", inventory: "totalInventory" };
        const field = sortFields[sortBy] || sortBy;
        const order = sortOrder === "asc" ? 1 : -1;
        pipeline.push({ $sort: { [field]: order } });

        let total = null;
        if (includeTotal === "true") {
            const result = await Product.aggregate([...pipeline, { $count: "total" }]);
            total = result[0]?.total || 0;
        }

        pipeline.push({ $skip: (pageNum - 1) * limitNum }, { $limit: limitNum });

        const products = await Product.aggregate(pipeline);

        const enrichedProducts = products.map((product) => ({
            ...product,
            inventoryStatus: getInventoryStatus(product.totalInventory || 0),
        }));

        return res.status(200).json({
            success: true,
            data: enrichedProducts,
            pagination: {
                page: pageNum,
                limit: limitNum,
                hasNextPage: products.length === limitNum,
                hasPreviousPage: pageNum > 1,
                ...(total !== null && { total, totalPages: Math.ceil(total / limitNum) }),
            },
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getProductBySlug = async (req, res) => {
    try {
        const { handle } = req.params;
        if (!handle) throw new ApiError(400, "Handle is required");

        const product = await Product.findOne({ handle, isActive: true }).lean();
        if (!product) throw new ApiError(404, "Product not found");

        const [reviews, stats] = await Promise.all([
            Review.find({ productId: product._id, approved: true })
                .populate("userId", "first_name last_name username")
                .sort({ createdAt: -1 })
                .limit(10)
                .lean(),
            Review.aggregate([
                { $match: { productId: product._id, approved: true } },
                { $group: { _id: null, averageRating: { $avg: "$rating" }, totalReviews: { $sum: 1 }, ratings: { $push: "$rating" } } },
            ]),
        ]);

        const statsData = stats[0];
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        statsData?.ratings.forEach((rating) => {
            distribution[rating]++;
        });

        const activeVariants = product.variants.filter((v) => v.isActive !== false);
        const priceRange = getPriceRange(product.variants);
        const totalInventory = calculateInventory(product.variants);

        return res.status(200).json({
            success: true,
            data: {
                ...product,
                variants: activeVariants,
                minPrice: priceRange.minPrice,
                maxPrice: priceRange.maxPrice,
                totalInventory,
                inventoryStatus: getInventoryStatus(totalInventory),
                reviews: {
                    summary: {
                        averageRating: statsData ? Number(statsData.averageRating.toFixed(1)) : 0,
                        totalReviews: statsData?.totalReviews || 0,
                        distribution,
                    },
                    recent: reviews.map((review) => ({
                        id: review._id,
                        rating: review.rating,
                        title: review.title,
                        body: review.body,
                        createdAt: review.createdAt,
                        user: review.userId
                            ? {
                                id: review.userId._id,
                                username: review.userId.username,
                                firstName: review.userId.first_name,
                                lastName: review.userId.last_name,
                                fullName:
                                    [review.userId.first_name, review.userId.last_name].filter(Boolean).join(" ") ||
                                    review.userId.username,
                            }
                            : null,
                    })),
                },
            },
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const createProduct = async (req, res) => {
    try {
        const data = { ...req.body };

        if (!data.title) throw new ApiError(400, "Title is required");

        data.options = validateProductOptions(data.options);

        const handle = slugify(String(data.handle || data.title), { lower: true, strict: true, trim: true });
        data.handle = handle;

        const existingSkus = new Set();
        if (data.variants) {
            data.variants.forEach((v) => {
                if (v.sku) existingSkus.add(v.sku.toLowerCase());
            });

            data.variants = data.variants.map((variant) => {
                if (!variant.sku) {
                    variant.sku = generateSku(handle, variant.options, existingSkus);
                    existingSkus.add(variant.sku.toLowerCase());
                }
                return variant;
            });
        }

        data.variants = validateVariants(data.variants, data.options);

        await validateGlobalSkus(data.variants);

        data.inventory_quantity = calculateInventory(data.variants);

        const exists = await Product.exists({ handle: data.handle });
        if (exists) throw new ApiError(400, "A product with this handle already exists");

        const product = await Product.create(data);
        await syncProductImages(product);

        return res.status(201).json({ success: true, message: "Product created successfully", data: product });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { identifier } = req.params;
        const query = productQuery(identifier);

        const existingProduct = await Product.findOne(query);
        if (!existingProduct) throw new ApiError(404, "Product not found");

        const updateData = { ...req.body };
        delete updateData._id;
        delete updateData.createdAt;
        delete updateData.updatedAt;

        if (updateData.options !== undefined) {
            updateData.options = validateProductOptions(updateData.options);
        }

        if (updateData.variants !== undefined) {
            const optionsForValidation =
                updateData.options ||
                existingProduct.options.map((opt) => ({ ...opt, name: opt.name.toLowerCase() }));

            const existingVariantsMap = new Map();
            existingProduct.variants.forEach((v) => {
                existingVariantsMap.set(v._id.toString(), v);
            });

            const existingSkus = new Set();
            updateData.variants.forEach((v) => {
                if (v.sku) existingSkus.add(v.sku.toLowerCase());
            });
            existingProduct.variants.forEach((v) => {
                if (v.sku) existingSkus.add(v.sku.toLowerCase());
            });

            updateData.variants = updateData.variants.map((variant) => {
                if (variant._id && existingVariantsMap.has(variant._id)) {
                    variant._id = existingVariantsMap.get(variant._id)._id;
                }

                if (!variant.sku) {
                    const handle = updateData.handle || existingProduct.handle;
                    variant.sku = generateSku(handle, variant.options, existingSkus);
                    existingSkus.add(variant.sku.toLowerCase());
                }
                return variant;
            });

            updateData.variants = validateVariants(updateData.variants, optionsForValidation);
            updateData.inventory_quantity = calculateInventory(updateData.variants);
        }

        if (updateData.handle !== undefined) {
            updateData.handle = slugify(String(updateData.handle), { lower: true, strict: true, trim: true });
            if (updateData.handle !== existingProduct.handle) {
                const exists = await Product.exists({ handle: updateData.handle, _id: { $ne: existingProduct._id } });
                if (exists) throw new ApiError(400, "A product with this handle already exists");
            }
        }

        const finalVariants = updateData.variants || existingProduct.variants;
        await validateGlobalSkus(finalVariants, existingProduct._id);

        const product = await Product.findOneAndUpdate(query, { $set: updateData }, { new: true, runValidators: true });

        if (updateData.removeImagePublicIds && updateData.removeImagePublicIds.length > 0) {
            await processImageRemovals(product, updateData.removeImagePublicIds);
        }

        if (updateData.imagesOrder) {
            processImageOrdering(product, updateData.imagesOrder);
        }

        await product.save();
        await syncProductImages(product);

        return res.status(200).json({ success: true, message: "Product updated successfully", data: product });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const { identifier } = req.params;
        const product = await Product.findOne(productQuery(identifier));
        if (!product) throw new ApiError(404, "Product not found");

        const allImagePublicIds = new Set();

        if (product.image?.publicId) {
            allImagePublicIds.add(product.image.publicId);
        }

        product.images?.forEach((img) => {
            if (img.publicId) allImagePublicIds.add(img.publicId);
        });

        product.variants?.forEach((variant) => {
            variant.images?.forEach((img) => {
                if (img.publicId) allImagePublicIds.add(img.publicId);
            });
        });

        const publicIds = [...allImagePublicIds];
        const referencedImages = await File.aggregate([
            { $match: { publicId: { $in: publicIds } } },
            { $group: { _id: "$publicId", count: { $sum: 1 } } },
        ]);

        const referencedCount = new Map(referencedImages.map((ref) => [ref._id, ref.count]));

        await Product.findOneAndDelete({ _id: product._id });

        for (const publicId of publicIds) {
            const count = referencedCount.get(publicId) || 0;
            if (count <= 1) {
                await removeImageFromCloudinary(publicId);
            }
        }

        return res.status(200).json({ success: true, message: "Product deleted successfully" });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const updateVariant = async (req, res) => {
    try {
        const { productIdentifier, variantId } = req.params;
        const product = await Product.findOne(productQuery(productIdentifier));
        if (!product) throw new ApiError(404, "Product not found");

        const variant = product.variants.id(variantId);
        if (!variant) throw new ApiError(404, "Variant not found");

        const updateData = req.body;
        delete updateData._id;

        Object.keys(updateData).forEach((key) => {
            if (key !== "options" && key !== "images") {
                variant[key] = updateData[key];
            }
        });

        if (updateData.options) {
            validateVariantOptions({ options: updateData.options }, product.options, 0);

            const comboKey = getVariantKey(updateData.options);
            for (const otherVariant of product.variants) {
                if (otherVariant._id.toString() !== variantId && getVariantKey(otherVariant.options) === comboKey) {
                    throw new ApiError(400, "Duplicate variant combination");
                }
            }
            variant.options = updateData.options;
        }

        if (updateData.images) {
            variant.images = normalizeImagePositions(updateData.images);
        }

        if (variant.price !== undefined && variant.price < 0) {
            throw new ApiError(400, "Price must be non-negative");
        }

        if (variant.cost !== undefined && variant.cost < 0) {
            throw new ApiError(400, "Cost must be non-negative");
        }

        if (variant.compareAtPrice !== undefined && (variant.compareAtPrice < 0 || variant.compareAtPrice < variant.price)) {
            throw new ApiError(400, "compareAtPrice must be >= price");
        }

        if (variant.sku) {
            const normalizedSku = variant.sku.toLowerCase();

            for (const otherVariant of product.variants) {
                if (
                    otherVariant._id.toString() !== variantId &&
                    otherVariant.sku &&
                    otherVariant.sku.toLowerCase() === normalizedSku
                ) {
                    throw new ApiError(400, "Duplicate SKU within product");
                }
            }
            await validateGlobalSkus([{ sku: variant.sku }], product._id);
        }

        product.inventory_quantity = calculateInventory(product.variants);

        await product.save();
        await syncProductImages(product);

        return res.status(200).json({ success: true, message: "Variant updated successfully", data: variant });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const deleteVariant = async (req, res) => {
    try {
        const { productIdentifier, variantId } = req.params;
        const product = await Product.findOne(productQuery(productIdentifier));
        if (!product) throw new ApiError(404, "Product not found");

        const variant = product.variants.id(variantId);
        if (!variant) throw new ApiError(404, "Variant not found");

        if (product.variants.length <= 1) {
            throw new ApiError(400, "Cannot delete the last variant");
        }

        if (variant.images && variant.images.length > 0) {
            const variantImagePublicIds = variant.images.map((img) => img.publicId).filter(Boolean);
            const referencedElsewhere = new Set();

            if (product.image?.publicId) referencedElsewhere.add(product.image.publicId);
            product.images?.forEach((img) => {
                if (img.publicId) referencedElsewhere.add(img.publicId);
            });

            for (const otherVariant of product.variants) {
                if (otherVariant._id.toString() !== variantId) {
                    otherVariant.images?.forEach((img) => {
                        if (img.publicId) referencedElsewhere.add(img.publicId);
                    });
                }
            }

            for (const publicId of variantImagePublicIds) {
                if (!referencedElsewhere.has(publicId)) {
                    await removeImageFromCloudinary(publicId);
                }
            }
        }

        variant.deleteOne();
        product.inventory_quantity = calculateInventory(product.variants);
        await product.save();

        return res.status(200).json({ success: true, message: "Variant deleted successfully" });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const updateVariantInventory = async (req, res) => {
    try {
        const { productIdentifier, variantId } = req.params;
        const { adjustment } = req.body;

        if (adjustment === undefined || !Number.isInteger(adjustment)) {
            throw new ApiError(400, "Adjustment must be an integer");
        }

        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                const product = await Product.findOne(productQuery(productIdentifier)).session(session);
                if (!product) throw new ApiError(404, "Product not found");

                const variant = product.variants.id(variantId);
                if (!variant) throw new ApiError(404, "Variant not found");

                const newQuantity = variant.inventory_quantity + adjustment;
                if (newQuantity < 0) {
                    throw new ApiError(400, "Inventory cannot become negative");
                }

                variant.inventory_quantity = newQuantity;
                product.inventory_quantity = calculateInventory(product.variants);
                await product.save({ session });
            });
        } finally {
            await session.endSession();
        }

        const updatedProduct = await Product.findOne(productQuery(productIdentifier));
        const updatedVariant = updatedProduct.variants.id(variantId);

        return res.status(200).json({
            success: true,
            message: "Variant inventory updated successfully",
            data: {
                variant: updatedVariant,
                totalInventory: updatedProduct.inventory_quantity,
                inventoryStatus: getInventoryStatus(updatedProduct.inventory_quantity),
            },
        });
    } catch (error) {
        handleError(error, req, res);
    }
};