import mongoose from "mongoose";

const fileSchema = mongoose.Schema(
    {
        url: { String, required: true },
        publicId: { String, required: true },
    },
    {
        timestamp: true,
    }
);

export const File = mongoose.model("File", fileSchema);
