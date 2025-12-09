import mongoose from "mongoose";

export const connectDB = () => {
    mongoose
        .connect(process.env.MONGODB_URL)
        .then(() => console.log("MongoDB is running!"))
        .catch((e) => console.log("MongoDB Error: ", e));
};
