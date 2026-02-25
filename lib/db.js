import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: true,

      // FIX 1: Limit pool size — default is 100 which is excessive for a
      // Next.js serverless environment. Each serverless function instance
      // maintains its own pool. 10 is plenty; too many connections will
      // actually slow down MongoDB Atlas on shared/free tiers.
      maxPoolSize: 10,

      // FIX 2: Fail fast on connection attempt — default is 30s.
      // If MongoDB is unreachable, you want to know in 5s not 30s.
      serverSelectionTimeoutMS: 5000,

      // FIX 3: Detect stale connections faster.
      // Default socket timeout is 30s — this cuts it to 10s so hung
      // queries don't silently block your server functions.
      socketTimeoutMS: 10000,

      // FIX 4: Keep connections alive — prevents Atlas from dropping idle
      // connections which would force a reconnect on next request.
      heartbeatFrequencyMS: 10000,
    }).then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    // FIX 5: Reset promise on failure so the next request retries
    // instead of hanging forever on a rejected promise.
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;