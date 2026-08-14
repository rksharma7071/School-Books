import mongoose from "mongoose";

let cached = global._mongoose;
if (!cached) cached = global._mongoose = { conn: null, promise: null };

export async function connectDB() {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        mongoose.set("strictQuery", true);
        cached.promise = mongoose.connect(process.env.MONGODB_URL, {
            maxPoolSize: 10,
            minPoolSize: 0,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 20000,
        });
    }
    cached.conn = await cached.promise;
    return cached.conn;
}