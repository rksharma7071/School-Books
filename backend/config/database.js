import mongoose from "mongoose";

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URL) {
            throw new Error("MONGODB_URL is not configured");
        }

        await mongoose.connect(process.env.MONGODB_URL, {
            maxPoolSize: 20,
            minPoolSize: 5,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
            family: 4,
        });

        console.log(`MongoDB connected: ${mongoose.connection.name}`);
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        throw error;
    }
};

const disconnectDB = async () => {
    try {
        await mongoose.disconnect();
        console.log("MongoDB disconnected");
    } catch (error) {
        console.error("MongoDB disconnect error:", error.message);
    }
};

export { connectDB, disconnectDB };
