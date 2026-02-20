'use server'

import connectDB from '@/lib/db';
import Product from '@/models/Product';
import UserInterest from '@/models/UserInterest';
import mongoose from 'mongoose';
import { cookies } from 'next/headers';
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';

const serialize = (obj) => JSON.parse(JSON.stringify(obj));

// ============================================================================
// 1. LIVE USER TRACKING (HEARTBEAT SYSTEM)
// ============================================================================

// Lightweight schema to track active sessions (Auto-deletes after 5 minutes)
const activeSessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true },
    lastActiveAt: { type: Date, default: Date.now, expires: 300 } // 300s = 5 minutes
});

// Avoid re-compiling the model in dev mode
const ActiveSession = mongoose.models.ActiveSession || mongoose.model('ActiveSession', activeSessionSchema);

export async function getLiveActiveUsers() {
    await connectDB();
    try {
        // Look for users who have been active in the last 5 minutes
        const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        const count = await ActiveSession.countDocuments({
            lastActiveAt: { $gte: fiveMinsAgo }
        });
        
        return count;
    } catch (error) {
        console.error("Failed to get live users:", error);
        return 0;
    }
}

export async function recordActiveSession(clientSessionId) {
    if (!clientSessionId) return;
    await connectDB();
    try {
        // Upsert updates the lastActiveAt timestamp, keeping the session alive
        await ActiveSession.findOneAndUpdate(
            { sessionId: clientSessionId },
            { lastActiveAt: new Date() },
            { upsert: true, new: true }
        );
    } catch (error) {
        // Silent fail to prevent interrupting the user's browsing experience
    }
}


// ============================================================================
// 2. PRODUCT INTEREST TRACKING
// ============================================================================

export async function trackInterest({ productId, type = 'view' }) {
  await connectDB();
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  let guestId = cookieStore.get('guest_id')?.value;

  if (!session && !guestId) {
    // Note: In Server Actions, setting cookies is restricted in some contexts.
    // For now, we skip guest generation if missing to prevent errors.
    return;
  }

  try {
    const product = await Product.findById(productId);
    if (!product) return;

    const score = type === 'cart' ? 3 : 1;

    await UserInterest.create({
      user: session?.user?.id || null,
      guestId: session ? null : guestId,
      tags: product.tags || [],
      category: product.category,
      interactionType: type,
      score: score
    });
  } catch (error) {
    console.error("Tracking Error:", error);
  }
}


// ============================================================================
// 3. RECOMMENDATION ENGINE
// ============================================================================

export async function getRecommendedProducts() {
  await connectDB();
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const guestId = cookieStore.get('guest_id')?.value;

  let interests = [];
  
  if (session?.user?.id || guestId) {
    const query = session?.user?.id ? { user: session.user.id } : { guestId };
    try {
        interests = await UserInterest.find(query).sort({ createdAt: -1 }).limit(20).lean();
    } catch (e) {
        console.log("No interest history found");
    }
  }

  let products = [];

  if (interests.length > 0) {
    const tagCounts = {};
    const catCounts = {};

    interests.forEach(i => {
      if (i.category) catCounts[i.category] = (catCounts[i.category] || 0) + i.score;
      if (i.tags) i.tags.forEach(t => tagCounts[t] = (tagCounts[t] || 0) + i.score);
    });

    const topCats = Object.keys(catCounts).sort((a,b) => catCounts[b] - catCounts[a]).slice(0, 2);
    const topTags = Object.keys(tagCounts).sort((a,b) => tagCounts[b] - tagCounts[a]).slice(0, 3);

    products = await Product.find({
      $or: [
        { category: { $in: topCats } },
        { tags: { $in: topTags } }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('category')
    .populate('tags') // ✅ CRITICAL FIX: Added this so tags render correctly on frontend cards
    .lean();
  }

  // Fallback: If not enough recommended products, fill with latest arrivals
  if (products.length < 5) {
    const bestSellers = await Product.find({ _id: { $nin: products.map(p => p._id) } })
      .sort({ createdAt: -1 }) 
      .limit(10 - products.length)
      .populate('category')
      .populate('tags') // ✅ CRITICAL FIX
      .lean();
    products = [...products, ...bestSellers];
  }

  return serialize(products);
}