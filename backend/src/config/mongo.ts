import mongoose from "mongoose";

/**
 * MongoDB Connection
 * ──────────────────
 * Connects to MongoDB using Mongoose. Uses the MONGO_URI env var
 * with a fallback to localhost. Called once at server startup.
 */

export async function connectMongo(): Promise<void> {
    try {
        const uri = process.env.MONGO_URI || "mongodb://localhost:27017/url-shortener";
        await mongoose.connect(uri);
        console.log("[MongoDB] Connected successfully");

        // Clean up old index if it exists, fixing the E11000 duplicate key error
        try {
            await mongoose.connection.collection("urls").dropIndex("shortUrl_1");
            console.log("[MongoDB] Successfully dropped outdated 'shortUrl_1' index");
        } catch (indexError: any) {
            // Error code 27 means "IndexNotFound". We only care if it's a different error.
            if (indexError.code !== 27) {
                console.warn("[MongoDB] Notice querying old index:", indexError.message);
            }
        }
    } catch (error) {
        console.error("[MongoDB] Connection failed:", error);
        process.exit(1);
    }
}

/**
 * Gracefully disconnect MongoDB — call during shutdown.
 */
export async function disconnectMongo(): Promise<void> {
    await mongoose.disconnect();
    console.log("[MongoDB] Disconnected gracefully");
}
