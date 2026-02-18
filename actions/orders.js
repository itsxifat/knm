'use server'

import connectDB from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Category from '@/models/Category'; 
import Coupon from '@/models/Coupon';
import Address from '@/models/Address';
import User from '@/models/User';
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth'; 
import { revalidatePath } from 'next/cache';
import crypto from 'crypto'; 

const serialize = (obj) => JSON.parse(JSON.stringify(obj));

// ==============================================================================
//  1. META DIRECT CAPI CONFIGURATION
// ==============================================================================

// ⚠️ REPLACE WITH YOUR REAL META CREDENTIALS
const META_PIXEL_ID = '762096979846911'; 
const META_ACCESS_TOKEN = 'EAAY3cI1tuiEBQlZAIQTdsOJWZAQqlM42GLt1BXRDOYrV9JkT56UC1f2v4sZCaAsZBYS4PO96H81jlTmHypD2ATAoeFis7ZAhYrvKF8VuCkhcqRsWfqfrKCu1gPGfP8i0cIClucOIwukGlqOn86eEQmKhmZCsssubjB0IIWv0cyH22ZB314LiLIsygQZCDuVr6Hx62QZDZD';
const META_TEST_EVENT_CODE = null; // Set to null for production

// Helper: SHA256 Hashing
function sha256(value) {
  if (!value) return undefined;
  return crypto.createHash('sha256').update(value).digest('hex');
}

// Helper: Send Purchase Event DIRECTLY to Meta Graph API
async function sendDirectMetaPurchase(order) {
  // Safety Check
  if (!META_PIXEL_ID || !META_ACCESS_TOKEN || META_PIXEL_ID.includes('YOUR_')) {
      console.error("[Meta CAPI] ERROR: Credentials not configured.");
      return;
  }

  try {
    // 1. Data Normalization
    const rawEmail = order.guestInfo?.email?.trim().toLowerCase() || '';
    const rawPhone = order.guestInfo?.phone?.replace(/\D/g, '') || ''; 
    
    const rawCity = order.guestInfo?.city?.trim().toLowerCase().replace(/\s/g, '') || '';
    const rawZip = order.guestInfo?.postalCode?.trim().toLowerCase().replace(/\s/g, '') || '';
    const rawFirstName = order.guestInfo?.firstName?.trim().toLowerCase() || '';
    const rawLastName = order.guestInfo?.lastName?.trim().toLowerCase() || '';

    // 2. Construct Payload (Standard Meta CAPI Format)
    const eventData = {
      "event_name": "Purchase",
      "event_time": Math.floor(Date.now() / 1000),
      "event_id": order.orderId, // ✅ CRITICAL for Deduplication
      "event_source_url": "https://knm.bd", // Replace with your actual site URL
      "action_source": "website",
      "user_data": {
        "em": rawEmail ? [sha256(rawEmail)] : [],
        "ph": rawPhone ? [sha256(rawPhone)] : [],
        "fn": rawFirstName ? [sha256(rawFirstName)] : [],
        "ln": rawLastName ? [sha256(rawLastName)] : [],
        "ct": rawCity ? [sha256(rawCity)] : [],
        "zp": rawZip ? [sha256(rawZip)] : [],
        "country": [sha256('bd')] 
      },
      "custom_data": {
        "currency": "BDT",
        "value": parseFloat(order.totalAmount) || 0,
        "content_type": "product",
        "order_id": order.orderId,
        "contents": order.items.map(item => ({
            "id": item.sku || item.product.toString(),
            "quantity": item.quantity,
            "item_price": item.price,
            "title": item.name
        }))
      }
    };

    const payload = {
        "data": [eventData]
    };

    console.log(`[Meta CAPI] Sending Direct Purchase Event for ${order.orderId}...`);

    // 3. Send Request to Graph API
    // ✅ FIX: Passed test_event_code in the URL query string instead of body
    let url = `https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events?access_token=${META_ACCESS_TOKEN}`;
    
    if (META_TEST_EVENT_CODE) {
        url += `&test_event_code=${META_TEST_EVENT_CODE}`;
    }
    
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const responseText = await res.text();

    if (!res.ok) {
        console.error(`[Meta CAPI] Failed: ${res.status} - ${responseText}`);
    } else {
        console.log(`[Meta CAPI] Success: ${responseText}`);
    }

  } catch (error) {
    console.error("[Meta CAPI] System Error:", error);
  }
}

// =========================================
//  ADDRESS ACTIONS
// =========================================
export async function getSavedAddresses() {
  await connectDB();
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) return [];
  
  let userId = session.user.id;
  if (!userId && session.user.email) {
    const user = await User.findOne({ email: session.user.email });
    if (user) userId = user._id;
  }
  
  if (!userId) return [];
  
  const addresses = await Address.find({ user: userId }).sort({ createdAt: -1 }).lean();
  return serialize(addresses);
}

export async function saveAddress(formData) {
  await connectDB();
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) return { error: "Unauthorized: Please log in." };
  
  let userId = session.user.id;
  if (!userId && session.user.email) {
    const user = await User.findOne({ email: session.user.email });
    if (user) userId = user._id;
  }

  try {
    const addressData = {
      user: userId,
      label: formData.get('label') || 'Home',
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      city: formData.get('city'),
      postalCode: formData.get('postalCode'),
    };
    await Address.create(addressData);
    revalidatePath('/checkout');
    return { success: true };
  } catch (error) { 
    return { error: "Failed to save address" }; 
  }
}

// =========================================
//  COUPON ACTIONS
// =========================================
export async function createCoupon(formData) {
  await connectDB();
  try {
    const isAutomatic = formData.get('isAutomatic') === 'true';
    let code = formData.get('code');
    if (isAutomatic && !code) code = `AUTO-${Date.now()}`;
    
    await Coupon.create({
      code,
      description: formData.get('description'),
      isAutomatic,
      discountType: formData.get('discountType'),
      discountValue: Number(formData.get('discountValue')),
      minSpend: Number(formData.get('minSpend') || 0),
      minQuantity: Number(formData.get('minQuantity') || 0),
      validUntil: new Date(formData.get('validUntil')),
      usageLimit: Number(formData.get('usageLimit') || 10000),
      applicableCategories: formData.getAll('categories'), 
      applicableProducts: formData.getAll('products'), 
    });
    
    revalidatePath('/admin/coupons');
    return { success: true };
  } catch (error) { return { error: 'Failed to create coupon' }; }
}

export async function getCoupons() {
  await connectDB();
  const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
  return serialize(coupons);
}

export async function deleteCoupon(id) {
  await connectDB();
  await Coupon.findByIdAndDelete(id);
  revalidatePath('/admin/coupons');
  return { success: true };
}

// =========================================
//  REVIEW ACTIONS
// =========================================

async function findProductRobust(productId, orderId) {
  let product = await Product.findById(productId);
  if (product) return product;

  if (orderId) {
    const order = await Order.findById(orderId);
    if (order) {
      const targetItem = order.items.find(i => i._id && i._id.toString() === productId);
      if (targetItem) {
         const realProductId = targetItem.product || targetItem.productId;
         if (realProductId) {
             product = await Product.findById(realProductId);
         }
      }
    }
  }
  return product;
}

export async function getOrderReview({ productId, orderId }) {
  await connectDB();
  try {
    if (!productId || !orderId) return { found: false };
    const product = await findProductRobust(productId, orderId);
    if (!product) return { found: false };

    const review = product.reviews?.find(r => r.orderId && r.orderId.toString() === orderId.toString());
    
    if (review) {
        return { 
            found: true, 
            rating: review.rating, 
            comment: review.comment, 
            editCount: review.editCount || 0 
        };
    }
    return { found: false };
  } catch (error) {
    return { found: false, error: error.message };
  }
}

export async function submitReview({ productId, rating, comment, orderId }) {
  try {
    await connectDB();
    if (!orderId || !productId || !rating) return { success: false, error: 'Missing Data' };

    const order = await Order.findById(orderId);
    if (!order) return { success: false, error: 'Order not found' };

    const product = await findProductRobust(productId, orderId);
    if (!product) return { success: false, error: 'Product not found.' };

    const reviewerName = order.guestInfo ? `${order.guestInfo.firstName} ${order.guestInfo.lastName}` : 'Verified Customer';

    const existingReviewIndex = product.reviews.findIndex(r => r.orderId && r.orderId.toString() === orderId.toString());

    if (existingReviewIndex >= 0) {
        const existingReview = product.reviews[existingReviewIndex];
        if ((existingReview.editCount || 0) >= 3) {
            return { success: false, error: "Maximum edit limit (3) reached." };
        }
        product.reviews[existingReviewIndex].rating = Number(rating);
        product.reviews[existingReviewIndex].comment = comment;
        product.reviews[existingReviewIndex].editCount = (existingReview.editCount || 0) + 1;
        product.reviews[existingReviewIndex].updatedAt = new Date();
    } else {
        const isDup = product.reviews.find(r => r.orderId?.toString() === orderId.toString());
        if(isDup) return { success: false, error: "Review already exists." };

        product.reviews.push({
            user: reviewerName,
            rating: Number(rating),
            comment,
            orderId: orderId.toString(),
            editCount: 0,
            createdAt: new Date()
        });
    }

    product.numReviews = product.reviews.length;
    product.rating = product.reviews.reduce((a, b) => a + b.rating, 0) / product.reviews.length;

    await product.save();
    
    revalidatePath(`/product/${product.slug}`);
    revalidatePath('/account/orders'); 
    
    return { success: true };
  } catch (error) {
    console.error('Review Action Error:', error);
    return { success: false, error: 'Submission Error' };
  }
}

// =========================================
//  ORDER & CART LOGIC
// =========================================

export async function getUserOrders() {
  await connectDB();
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) return [];
  
  let userId = session.user.id;
  if (!userId && session.user.email) {
    const user = await User.findOne({ email: session.user.email });
    if (user) userId = user._id;
  }
  
  const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).lean();
  if (!orders || orders.length === 0) return [];

  const productIds = orders.flatMap(o => o.items.map(i => (i.product && i.product._id) ? i.product._id : i.product)).filter(id => id);
  
  const products = await Product.find({ _id: { $in: productIds } }).select('reviews').lean();

  orders.forEach(order => {
    order.items.forEach(item => {
      const productIdStr = (item.product?._id || item.product)?.toString();
      const product = products.find(p => p._id.toString() === productIdStr);

      if (product && product.reviews) {
        const existingReview = product.reviews.find(r => r.orderId && r.orderId.toString() === order._id.toString());
        
        if (existingReview) {
          item.hasReviewed = true;
          item.userRating = existingReview.rating;
          item.userComment = existingReview.comment;
        } else {
          item.hasReviewed = false;
        }
      }
    });
  });

  return serialize(orders);
}

function computeRuleDiscount(rule, verifiedItems, cartTotal, totalQty) {
  const now = new Date();
  if (!rule.isActive) return 0;
  if (now > new Date(rule.validUntil)) return 0;
  if (rule.usedCount >= rule.usageLimit) return 0;
  if (cartTotal < rule.minSpend) return 0;
  if (totalQty < rule.minQuantity) return 0;

  let eligibleAmount = cartTotal;
  const hasCatRestriction = rule.applicableCategories?.length > 0;
  const hasProdRestriction = rule.applicableProducts?.length > 0;

  if (hasCatRestriction || hasProdRestriction) {
     const catIds = rule.applicableCategories.map(id => id.toString());
     const prodIds = rule.applicableProducts.map(id => id.toString());

     const eligibleItems = verifiedItems.filter(item => {
        const itemCatId = item.category?._id ? item.category._id.toString() : item.category?.toString();
        const itemProdId = item._id.toString();
        return (
            (hasCatRestriction && itemCatId && catIds.includes(itemCatId)) ||
            (hasProdRestriction && prodIds.includes(itemProdId))
        );
     });
     
     if (eligibleItems.length === 0) return 0;
     eligibleAmount = eligibleItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }

  let val = 0;
  if (rule.discountType === 'percentage') {
    val = (eligibleAmount * rule.discountValue) / 100;
    if (rule.maxDiscount && val > rule.maxDiscount) val = rule.maxDiscount;
  } else {
    val = rule.discountValue;
  }
  return Math.round(val);
}

export async function calculateCart(cartItems, manualCode = null) {
  await connectDB();
  const response = { cartTotal: 0, discountTotal: 0, grandTotal: 0, appliedCoupon: null, error: null };
  
  if (!cartItems || cartItems.length === 0) return serialize(response);

  const productIds = cartItems.map(i => i._id || i.product);
  const dbProductsRaw = await Product.find({ _id: { $in: productIds } }).populate('category').populate('tags').lean(); 
  const dbProducts = serialize(dbProductsRaw);
  const now = new Date();

  const verifiedItems = [];
  
  for (const clientItem of cartItems) {
      const dbProd = dbProducts.find(p => p._id.toString() === (clientItem._id || clientItem.product).toString());
      
      if (dbProd) {
          const basePrice = Number(dbProd.price);
          const discPrice = Number(dbProd.discountPrice);
          let effectivePrice = basePrice;
          
          if (!isNaN(discPrice) && discPrice > 0 && discPrice < basePrice) {
              const start = dbProd.saleStartDate ? new Date(dbProd.saleStartDate) : null;
              const end = dbProd.saleEndDate ? new Date(dbProd.saleEndDate) : null;
              const isStarted = !start || now >= start;
              const isNotEnded = !end || now <= end;
              
              if (isStarted && isNotEnded) {
                  effectivePrice = discPrice;
              }
          }

          let finalSize = clientItem.size || clientItem.selectedSize; 
          if (!finalSize && dbProd.variants && dbProd.variants.length === 1) {
              finalSize = dbProd.variants[0].size;
          } else if (!finalSize) {
              finalSize = "STD"; 
          }

          let displayTag = dbProd.tags?.[0]?.name || null;
          if (!displayTag) {
             if (effectivePrice < basePrice) displayTag = "SALE";
             else if (new Date(dbProd.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) displayTag = "NEW";
          }

          verifiedItems.push({
              ...dbProd,
              _id: dbProd._id, 
              price: effectivePrice, 
              basePrice: basePrice, 
              quantity: clientItem.quantity, 
              selectedSize: finalSize, 
              tag: displayTag,
              sku: dbProd.sku,
              barcode: dbProd.barcode 
          });
      }
  }

  response.cartTotal = verifiedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalQty = verifiedItems.reduce((acc, item) => acc + item.quantity, 0);

  const autoRules = await Coupon.find({ isAutomatic: true, isActive: true }).lean();
  let bestAutoDiscount = 0;
  let bestAutoRule = null;

  for (const rule of autoRules) {
    const amount = computeRuleDiscount(rule, verifiedItems, response.cartTotal, totalQty);
    if (amount > bestAutoDiscount) { bestAutoDiscount = amount; bestAutoRule = rule; }
  }

  if (manualCode) {
    const manualRule = await Coupon.findOne({ code: manualCode.toUpperCase(), isActive: true, isAutomatic: false }).lean();
    if (manualRule) {
      const manualAmount = computeRuleDiscount(manualRule, verifiedItems, response.cartTotal, totalQty);
      if (manualAmount > 0) {
        response.appliedCoupon = { code: manualRule.code, desc: manualRule.description, amount: manualAmount, isAuto: false };
        response.discountTotal = manualAmount;
      } else {
        response.error = `Requirements not met for ${manualCode}`;
        if (bestAutoRule) { 
            response.appliedCoupon = { code: bestAutoRule.code, desc: bestAutoRule.description, amount: bestAutoDiscount, isAuto: true }; 
            response.discountTotal = bestAutoDiscount; 
        }
      }
    } else {
      response.error = 'Invalid Coupon Code';
      if (bestAutoRule) { 
         response.appliedCoupon = { code: bestAutoRule.code, desc: bestAutoRule.description, amount: bestAutoDiscount, isAuto: true }; 
         response.discountTotal = bestAutoDiscount; 
      }
    }
  } else {
    if (bestAutoRule) {
      response.appliedCoupon = { code: bestAutoRule.code, desc: bestAutoRule.description, amount: bestAutoDiscount, isAuto: true };
      response.discountTotal = bestAutoDiscount;
    }
  }

  if (response.discountTotal > response.cartTotal) response.discountTotal = response.cartTotal;
  response.grandTotal = response.cartTotal - response.discountTotal;
  
  response.validatedCart = verifiedItems;
  return serialize(response);
}

// --- SAFER CREATE ORDER (Fixes Race Condition) ---
export async function createOrder(orderData) {
  console.log("--- CREATE ORDER STARTED ---");
  await connectDB();
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
      return { error: "Please log in to place an order." };
  }

  let userId = session.user.id;
  if (!userId && session.user.email) {
    const user = await User.findOne({ email: session.user.email });
    if (user) userId = user._id;
  }
  
  const calcResult = await calculateCart(orderData.items, orderData.couponCode);
  
  // ATOMIC STOCK CHECK
  for (const item of calcResult.validatedCart) {
      const product = await Product.findById(item._id);
      if (!product) return { error: `Product not found: ${item.name}` };

      if (item.selectedSize && item.selectedSize !== "STD" && item.selectedSize !== "Standard") {
          const variant = product.variants.find(v => v.size === item.selectedSize);
          if (!variant) return { error: `Size '${item.selectedSize}' invalid for "${product.name}".` };
          if (variant.stock < item.quantity) return { error: `SOLD OUT: Size ${item.selectedSize} of "${product.name}" unavailable.` };
      } else if (product.stock < item.quantity) {
          return { error: `SOLD OUT: "${product.name}" is out of stock.` };
      }
  }

  const count = await Order.countDocuments();
  
  const newOrder = new Order({
    ...orderData,
    user: userId, 
    orderId: `#OL-${1000 + count + 1}`,
    status: 'Pending',
    subTotal: calcResult.cartTotal, 
    discountAmount: calcResult.discountTotal || 0,
    couponCode: calcResult.appliedCoupon?.code || null,
    totalAmount: calcResult.grandTotal + (orderData.shippingAddress.method === 'outside' ? 150 : 80),
    items: calcResult.validatedCart.map(vi => ({
        product: vi._id,
        name: vi.name,
        price: vi.price, 
        basePrice: vi.basePrice,
        quantity: vi.quantity,
        size: vi.selectedSize, 
        image: vi.images?.[0] || vi.image,
        sku: vi.sku,         
        barcode: vi.barcode 
    }))
  });

  await newOrder.save();

  // ATOMIC DECREMENT
  for (const item of calcResult.validatedCart) {
    if (item.selectedSize && item.selectedSize !== "STD" && item.selectedSize !== "Standard") {
        await Product.updateOne(
            { _id: item._id, "variants.size": item.selectedSize },
            { $inc: { "variants.$.stock": -item.quantity, stock: -item.quantity } }
        );
    } else {
        await Product.findByIdAndUpdate(item._id, { $inc: { stock: -item.quantity } });
    }
  }

  if (calcResult.appliedCoupon) {
      await Coupon.findOneAndUpdate(
          { code: calcResult.appliedCoupon.code }, 
          { $inc: { usedCount: 1 }, $push: { usedBy: { user: userId, usedAt: new Date() } } }
      );
  }

  revalidatePath('/admin/orders');
  console.log("--- ORDER CREATED SUCCESSFULLY ---");
  return { success: true, orderId: newOrder.orderId };
}

// =========================================
// ORDER MANAGEMENT (Admin)
// =========================================

export async function getAdminOrders() {
  await connectDB();
  const orders = await Order.find().sort({ createdAt: -1 }).populate('user', 'name email').lean();
  return serialize(orders);
}

// ✅ UPDATED: UPDATE ORDER STATUS WITH DIRECT META CAPI TRIGGER
export async function updateOrderStatus(orderId, newStatus, cancellationReason = null) {
  await connectDB();
  try {
    const order = await Order.findById(orderId);
    if (!order) return { error: "Order not found" };

    const oldStatus = order.status;
    
    // 1. HANDLE CANCELLATION (Restock)
    if (newStatus === 'Cancelled' && oldStatus !== 'Cancelled') {
       for (const item of order.items) {
          if (item.product) {
             if (item.size && item.size !== "STD" && item.size !== "Standard") {
                await Product.updateOne(
                   { _id: item.product, "variants.size": item.size },
                   { $inc: { "variants.$.stock": item.quantity, stock: item.quantity } }
                );
             } else {
                await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
             }
          }
       }
    }
    
    // 2. ✅ DIRECT META CAPI PURCHASE TRIGGER (When status becomes 'Processing')
    // NOTE: This sends data DIRECTLY to Facebook Graph API, bypassing GTM Server entirely.
    if (newStatus === 'Processing' && oldStatus !== 'Processing') {
       // We don't await this to keep the UI fast, unless you need strict confirmation
       sendDirectMetaPurchase(order);
    }

    order.status = newStatus;
    if (cancellationReason) order.cancellationReason = cancellationReason;
    await order.save();
    revalidatePath('/admin/orders');
    return { success: true };
  } catch (error) { 
    console.error("Order Update Error:", error);
    return { error: "Failed to update status" }; 
  }
}

// =========================================
// CATEGORY DATA
// =========================================

export async function getCategoryPageData(slug, filters = {}) {
  await connectDB();

  const mainCategory = await Category.findOne({ slug }).lean();
  if (!mainCategory) return null;

  // Assuming 'parentCategory' based on provided code structure
  const subCategories = await Category.find({ parentCategory: mainCategory._id }).lean();
  
  const min = filters.minPrice ? Number(filters.minPrice) : 0;
  const max = filters.maxPrice ? Number(filters.maxPrice) : Infinity;
  const now = new Date();

  const buildProductQuery = (catId) => {
    const query = { category: catId };

    if (filters.search) {
      query.$or = [
         { name: { $regex: filters.search, $options: 'i' } }
      ];
    }

    if (filters.minPrice || filters.maxPrice) {
      query.$expr = {
        $and: [
           { $gte: [
              { $cond: {
                  if: { $and: [
                      { $gt: ["$discountPrice", 0] },
                      { $lt: ["$discountPrice", "$price"] },
                      { $or: [ { $eq: ["$saleStartDate", null] }, { $lte: ["$saleStartDate", now] } ] },
                      { $or: [ { $eq: ["$saleEndDate", null] }, { $gte: ["$saleEndDate", now] } ] }
                  ]},
                  then: "$discountPrice",
                  else: "$price"
              }}, 
              min 
           ]},
           { $lte: [
              { $cond: {
                  if: { $and: [
                      { $gt: ["$discountPrice", 0] },
                      { $lt: ["$discountPrice", "$price"] },
                      { $or: [ { $eq: ["$saleStartDate", null] }, { $lte: ["$saleStartDate", now] } ] },
                      { $or: [ { $eq: ["$saleEndDate", null] }, { $gte: ["$saleEndDate", now] } ] }
                  ]},
                  then: "$discountPrice",
                  else: "$price"
              }}, 
              max 
           ]}
        ]
      };
    }
    return query;
  };

  const mainProducts = await Product.find(buildProductQuery(mainCategory._id))
    .sort({ createdAt: -1 })
    .populate('category')
    .populate('tags')
    .lean();

  const sections = await Promise.all(subCategories.map(async (sub) => {
    const products = await Product.find(buildProductQuery(sub._id))
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('category')
      .populate('tags')
      .lean();

    return {
      _id: sub._id,
      name: sub.name,
      slug: sub.slug,
      products
    };
  }));

  return serialize({
    mainCategory,
    mainProducts,
    sections: sections.filter(s => s.products.length > 0)
  });
}

export async function getTopCategories() {
  await connectDB();
  const categories = await Category.find({ parentCategory: null }).limit(4).lean();
  return serialize(categories);
}