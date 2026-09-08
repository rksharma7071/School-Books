import { z } from "zod";

const imageSchema = z.object({
    url: z.string().url(),
    publicId: z.string().optional(),
    position: z.number().int().min(1).optional(),
});

const optionSchema = z.object({
    name: z.string().min(1),
    values: z.array(z.string().min(1)).min(1),
});

const variantSchema = z.object({
    _id: z.string().optional(),
    sku: z.string().optional(),
    options: z.record(z.string(), z.string()),
    price: z.number().nonnegative(),
    cost: z.number().nonnegative().optional(),
    compareAtPrice: z.number().nonnegative().optional(),
    inventory_quantity: z.number().int().nonnegative(),
    isActive: z.boolean().optional(),
    images: z.array(imageSchema).optional(),
});

const createProductSchema = z.object({
    title: z.string().min(1),
    handle: z.string().optional(),
    description: z.string().optional(),
    isbn: z.string().optional(),
    options: z.array(optionSchema).min(1),
    variants: z.array(variantSchema).min(1),
    image: z
        .object({
            url: z.string().url(),
            publicId: z.string().optional(),
        })
        .optional(),
    images: z.array(imageSchema).optional(),
    isActive: z.boolean().optional(),
});

const updateProductSchema = z.object({
    title: z.string().min(1).optional(),
    handle: z.string().optional(),
    description: z.string().optional(),
    isbn: z.string().optional(),
    options: z.array(optionSchema).optional(),
    variants: z.array(variantSchema).optional(),
    image: z
        .object({
            url: z.string().url(),
            publicId: z.string().optional(),
        })
        .optional(),
    images: z.array(imageSchema).optional(),
    isActive: z.boolean().optional(),
    removeImagePublicIds: z.array(z.string()).optional(),
    imagesOrder: z.array(z.string()).optional(),
});

const listProductQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    search: z.string().trim().max(100).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    isActive: z.preprocess((value) => {
        if (value === undefined) return undefined;
        if (value === "true" || value === true) return true;
        if (value === "false" || value === false) return false;
        return value;
    }, z.boolean().optional()),
    sortBy: z.enum(["createdAt", "updatedAt", "price", "title"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
    includeTotal: z.preprocess((value) => {
        if (value === undefined) return undefined;
        return value === "true" || value === true;
    }, z.boolean().optional()),
});

export { createProductSchema, updateProductSchema, listProductQuerySchema };