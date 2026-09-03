import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, unique: true },
        slug: { type: String, required: true, unique: true, trim: true, index: true },
        description: { type: String, trim: true },
    },
    { timestamps: true }
);

categorySchema.pre("save", function (next) {
    if (this.isModified("name") && !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-zA-Z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim();
    }
    next();
});

categorySchema.post("save", function (error, doc, next) {
    if (error.name === "MongoServerError" && error.code === 11000) {
        next(new Error("Category with this slug already exists"));
    } else {
        next(error);
    }
});

const imageSubSchema = new mongoose.Schema(
    {
        url: { type: String, required: true },
        publicId: { type: String },
        position: { type: Number, min: 1 },
    },
    { _id: false }
);

const bookSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: 200 },
        slug: { type: String, required: true, unique: true, trim: true, index: true },
        description: { type: String, trim: true, maxlength: 5000 },
        price: { type: Number, default: 0, min: 0 },
        cost: { type: Number, default: 0, min: 0 },
        isbn: { type: String, trim: true, index: true },
        author: { type: String, required: true, trim: true, maxlength: 200 },
        publisher: { type: String, trim: true, maxlength: 200 },
        category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
        classLevel: { type: String, trim: true },
        subject: { type: String, trim: true },
        language: { type: String, trim: true },
        stockQty: { type: Number, default: 0, min: 0 },
        coverImage: { type: String },
        images: { type: [imageSubSchema], default: [] },
        isActive: { type: Boolean, default: true, index: true },
    },
    { timestamps: true, versionKey: false }
);

bookSchema.pre("save", function (next) {
    if (this.isModified("name") && !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-zA-Z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim();
    }
    next();
});

bookSchema.index({ isActive: 1, createdAt: -1 });
bookSchema.index({ category: 1, isActive: 1, createdAt: -1 });
bookSchema.index({ author: 1, isActive: 1 });
bookSchema.index({ subject: 1, isActive: 1 });
bookSchema.index({ price: 1, isActive: 1 });
bookSchema.index({ name: "text", author: "text", isbn: "text", description: "text" });

const Book = mongoose.model("Book", bookSchema);
const Category = mongoose.model("Category", categorySchema);

export { Book, Category };
