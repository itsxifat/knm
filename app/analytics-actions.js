'use server'

import connectDB from '@/lib/db';
import Product from '@/models/Product';
import UserInterest from '@/models/UserInterest';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// ----------------------------------------------------------------------------
// SERIALIZER (mirrors the one in actions.js — keeps plain JS objects only)
// ----------------------------------------------------------------------------
function serializeDoc(doc) {
  if (!doc) return null;
  const p = { ...doc };
  if (p._id) p._id = p._id.toString();
  if (p.category) {
    if (typeof p.category === 'object' && p.category !== null) {
      p.category = { ...p.category, _id: p.category._id.toString() };
    } else {
      p.category = p.category.toString();
    }
  }
  if (Array.isArray(p.tags)) {
    p.tags = p.tags.map(t =>
      typeof t === 'object' ? { ...t, _id: t._id.toString() } : t.toString()
    );
  }
  if (Array.isArray(p.variants)) {
    p.variants = p.variants.map(v => ({ ...v, _id: v._id?.toString() }));
  }
  if (p.createdAt) p.createdAt = new Date(p.createdAt).toISOString();
  if (p.updatedAt) p.updatedAt = new Date(p.updatedAt).toISOString();
  if (p.saleStartDate) p.saleStartDate = new Date(p.saleStartDate).toISOString();
  if (p.saleEndDate) p.saleEndDate = new Date(p.saleEndDate).toISOString();
  return p;
}

// ----------------------------------------------------------------------------
// FIELD PROJECTION — only what ProductCard renders
// ----------------------------------------------------------------------------
const PRODUCT_PROJECTION = 'name slug price discountPrice images stock variants category tags saleStartDate saleEndDate createdAt';

// ----------------------------------------------------------------------------
// TRACK INTEREST
// FIX: Added upsert-style deduplication — one document per user+product+type
// per hour. Previously created a new document on every single view, causing
// the UserInterest collection to grow unboundedly.
// ----------------------------------------------------------------------------
export async function trackInterest({ productId, type = 'view' }) {
  await connectDB();
  try {
    const session = await getServerSession(authOptions);
    const cookieStore = await cookies();
    const guestId = cookieStore.get('guest_id')?.value;

    const product = await Product.findById(productId).select('tags category').lean();
    if (!product) return;

    const score = type === 'cart' ? 5 : 1;
    const userId = session?.user?.id || null;

    // FIX: Upsert within a 1-hour window — prevents one page view from creating
    // dozens of interest records if the user refreshes or navigates back
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const filter = {
      ...(userId ? { user: userId } : { guestId }),
      category: product.category,
      interactionType: type,
      createdAt: { $gte: oneHourAgo },
    };

    await UserInterest.findOneAndUpdate(
      filter,
      {
        $setOnInsert: {
          user: userId,
          guestId: userId ? null : guestId,
          tags: product.tags || [],
          category: product.category,
          interactionType: type,
          score,
        },
      },
      { upsert: true }
    );
  } catch (error) {
    // Silent fail is correct for analytics — never block UI
    console.error('Tracking Error:', error);
  }
}

// ----------------------------------------------------------------------------
// GET RECOMMENDED PRODUCTS
//
// FIX: Split into two exported functions:
//
// 1. getRecommendedProducts() — static-safe, no headers/cookies.
//    Returns popular products. Safe to call from any server component
//    including statically rendered pages. No build warning.
//
// 2. getPersonalisedRecommendations() — dynamic, reads cookies/session.
//    Call this ONLY from a dynamic route or a Suspense-wrapped component.
//    Never call from a statically rendered page root.
//
// In your RecommendedSection, use getPersonalisedRecommendations() wrapped
// in Suspense, or fall back to getRecommendedProducts() for static pages.
// ----------------------------------------------------------------------------

// ✅ STATIC-SAFE: No headers, no cookies — can be called from any page
export async function getRecommendedProducts() {
  await connectDB();

  const products = await Product.find({ stock: { $gt: 0 } })
    .select(PRODUCT_PROJECTION)
    .populate('category', 'name slug')
    .populate('tags', 'name color')
    .sort({ views: -1, createdAt: -1 }) // Most viewed first, then newest
    .limit(10)
    .lean();

  return products.map(serializeDoc);
}

// ✅ DYNAMIC (uses cookies + session): Only call from dynamic routes or Suspense
export async function getPersonalisedRecommendations() {
  await connectDB();

  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const guestId = cookieStore.get('guest_id')?.value;

  let personalised = [];

  // 1. Try to build personalised list from interest history
  if (session?.user?.id || guestId) {
    const query = session?.user?.id ? { user: session.user.id } : { guestId };

    let interests = [];
    try {
      interests = await UserInterest.find(query)
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
    } catch (e) {
      console.error('Error fetching interests:', e);
    }

    if (interests.length > 0) {
      const tagCounts = {};
      const catCounts = {};

      interests.forEach((i) => {
        if (i.category) catCounts[String(i.category)] = (catCounts[String(i.category)] || 0) + i.score;
        if (Array.isArray(i.tags)) {
          i.tags.forEach((t) => {
            tagCounts[String(t)] = (tagCounts[String(t)] || 0) + i.score;
          });
        }
      });

      const topCats = Object.keys(catCounts).sort((a, b) => catCounts[b] - catCounts[a]).slice(0, 2);
      const topTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]).slice(0, 3);

      personalised = await Product.find({
        $or: [
          { category: { $in: topCats } },
          { tags: { $in: topTags } },
        ],
        stock: { $gt: 0 },
      })
        .select(PRODUCT_PROJECTION)
        .populate('category', 'name slug')  // FIX: was populate('category') — full doc
        .populate('tags', 'name color')     // FIX: was populate('tags') — full doc
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
    }
  }

  // 2. FIX: Single query fallback — was two sequential queries before.
  // If personalised results are fewer than 5, top up with popular products
  // in the SAME query using $nin to exclude already-fetched products.
  if (personalised.length < 5) {
    const excludeIds = personalised.map((p) => p._id);
    const needed = 10 - personalised.length;

    const fallback = await Product.find({
      _id: { $nin: excludeIds },
      stock: { $gt: 0 },
    })
      .select(PRODUCT_PROJECTION)
      .populate('category', 'name slug')
      .populate('tags', 'name color')
      .sort({ views: -1, createdAt: -1 })
      .limit(needed)
      .lean();

    personalised = [...personalised, ...fallback];
  }

  return personalised.map(serializeDoc);
}