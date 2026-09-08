import mongoose from "mongoose";


const imageSubSchema = new mongoose.Schema(
   {
       url: { type: String, required: true },
       publicId: { type: String },
       position: { type: Number, min: 1 },
   },
   { _id: false }
);


const optionSchema = {
   name: { type: String, required: true, trim: true, lowercase: true },
   values: [{ type: String, required: true, trim: true }],
};


const variantSchema = {
   _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
   sku: { type: String, trim: true },
   options: { type: Map, of: String },
   price: { type: Number, min: 0 },
   cost: { type: Number, default: 0, min: 0 },
   compareAtPrice: { type: Number, min: 0 },
   inventory_quantity: { type: Number, default: 0, min: 0 },
   isActive: { type: Boolean, default: true },
   images: { type: [imageSubSchema], default: [] },
};


const productSchema = new mongoose.Schema(
   {
       title: { type: String, required: true, trim: true, maxlength: 200 },
       handle: { type: String, unique: true, trim: true, index: true },
       description: { type: String, trim: true, maxlength: 5000 },
       isbn: { type: String, trim: true, index: true },
       categories: [{
           type: mongoose.Schema.Types.ObjectId,
           ref: "Category",
           index: true
       }],
       options: [optionSchema],
       variants: [variantSchema],
       inventory_quantity: { type: Number, default: 0, min: 0 },
       image: {
           url: { type: String },
           publicId: { type: String }
       },
       images: { type: [imageSubSchema], default: [] },
       isActive: { type: Boolean, default: true, index: true },
   },
   { timestamps: true, versionKey: false }
);


productSchema.index({ isActive: 1, createdAt: -1 });
productSchema.index({ isbn: 1, isActive: 1 });
productSchema.index({ categories: 1, isActive: 1 });
productSchema.index({ title: "text", isbn: "text", description: "text" });
productSchema.index({ "variants.price": 1, isActive: 1 });
productSchema.index({ "variants.inventory_quantity": 1, isActive: 1 });
productSchema.index({ "variants.sku": 1 }, { unique: true, sparse: true });


const Product = mongoose.model("Product", productSchema);


export { Product };