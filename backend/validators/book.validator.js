import { z } from "zod";

const booleanFromQuery = z.preprocess((value) => {
    if (value === undefined) return undefined;

    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;

    return value;
}, z.boolean().optional());

export const createBookSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Name is required")
        .max(200),

    description: z
        .string()
        .trim()
        .max(5000)
        .optional(),

    price: z.coerce
        .number()
        .min(0)
        .default(0),

    cost: z.coerce
        .number()
        .min(0)
        .default(0),

    isbn: z
        .string()
        .trim()
        .max(50)
        .optional(),

    author: z
        .string()
        .trim()
        .min(1, "Author is required")
        .max(200),

    publisher: z
        .string()
        .trim()
        .max(200)
        .optional(),

    category: z
        .string()
        .optional(),

    classLevel: z
        .string()
        .trim()
        .max(100)
        .optional(),

    subject: z
        .string()
        .trim()
        .max(100)
        .optional(),

    language: z
        .string()
        .trim()
        .max(100)
        .optional(),

    stockQty: z
        .coerce
        .number()
        .int()
        .min(0)
        .default(0),

    coverImage: z
        .string()
        .url()
        .optional(),

    isActive: booleanFromQuery.default(true),
});

export const updateBookSchema =
    createBookSchema.partial().extend({
        removeImagePublicIds: z
            .array(z.string())
            .optional(),

        imagesOrder: z
            .string()
            .optional(),
    });

export const listBookQuerySchema = z.object({
    page: z.coerce
        .number()
        .int()
        .min(1)
        .default(1),

    limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(50)
        .default(20),

    search: z
        .string()
        .trim()
        .max(100)
        .optional(),

    category: z
        .string()
        .optional(),

    author: z
        .string()
        .trim()
        .max(100)
        .optional(),

    subject: z
        .string()
        .trim()
        .max(100)
        .optional(),

    language: z
        .string()
        .trim()
        .max(100)
        .optional(),

    classLevel: z
        .string()
        .trim()
        .max(100)
        .optional(),

    minPrice: z
        .coerce
        .number()
        .min(0)
        .optional(),

    maxPrice: z
        .coerce
        .number()
        .min(0)
        .optional(),

    isActive: booleanFromQuery,

    sortBy: z.enum(["createdAt", "updatedAt", "price", "name", "stockQty"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
});