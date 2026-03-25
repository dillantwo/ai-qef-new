import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable in .env.local");
}

// Cache the connection to avoid reconnecting on every request in dev (HMR)
const cached = (globalThis as Record<string, unknown>).__mongoose as
  | { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
  | undefined;

const mongoCache = cached ?? { conn: null, promise: null };
(globalThis as Record<string, unknown>).__mongoose = mongoCache;

export async function connectDB() {
  if (mongoCache.conn) return mongoCache.conn;

  if (!mongoCache.promise) {
    mongoCache.promise = mongoose.connect(MONGODB_URI);
  }

  mongoCache.conn = await mongoCache.promise;
  return mongoCache.conn;
}
