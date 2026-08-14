import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, unique: true },
        description: { type: String },
    },
    { timestamps: true }
);

const imageSubSchema = new mongoose.Schema(
    {
        url: { type: String, required: true },
        publicId: { type: String },
        position: { type: Number },
    },
    { _id: false }
);

const bookSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String },
        price: { type: Number, default: 0 },
        cost: { type: Number, default: 0 },
        isbn: { type: String },
        author: { type: String, required: true },
        publisher: { type: String },
        category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
        classLevel: { type: String },
        subject: { type: String },
        language: { type: String },
        stockQty: { type: Number, default: 0 },
        coverImage: { type: String },
        images: { type: [imageSubSchema], default: [] },
        isActive: { type: Boolean, default: true },
    },
    {
        timestamps: true,
    }
);

bookSchema.index({ isActive: 1, createdAt: -1 });
bookSchema.index({ category: 1 });
bookSchema.index({ classLevel: 1, subject: 1 });
bookSchema.index({ isbn: 1 }, { sparse: true });
bookSchema.index({ name: "text", author: "text", subject: "text" });

const Book = mongoose.model("Book", bookSchema);
const Category = mongoose.model("Category", categorySchema);

export { Book, Category };
