"use server";

import connectDB from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category";
import Tag from "@/models/Tag";
import SiteContent from "@/models/SiteContent";
import { saveFileToPublic, deleteFileFromPublic } from "@/lib/storage";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

// --- HELPER FUNCTIONS ---
function generateSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

function generateCode(prefix = "OL") {
  const randomPart = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${randomPart}`;
}

async function checkAndResetOffer(product) {
  if (!product.saleEndDate) return product;
  const now = new Date();
  if (now > new Date(product.saleEndDate)) {
    await Product.findByIdAndUpdate(product._id, {
      $unset: { discountPrice: "", saleStartDate: "", saleEndDate: "" },
    });
    product.discountPrice = null;
    product.saleStartDate = null;
    product.saleEndDate = null;
  }
  return product;
}

// --- 🛠️ RECURSION HELPER ---
function getFamilyTreeIds(rootId, allCategories) {
  const rootStr = rootId.toString();
  let ids = [rootStr];
  const children = allCategories.filter((c) => c.parent && c.parent.toString() === rootStr);
  children.forEach((child) => {
    ids = [...ids, ...getFamilyTreeIds(child._id, allCategories)];
  });
  return ids;
}

// --- 🛠️ UI TREE HELPER ---
function buildCategoryTree(rootId, allCategories) {
  const rootStr = rootId.toString();
  return allCategories
    .filter((c) => c.parent && c.parent.toString() === rootStr)
    .map((c) => ({
      ...c,
      _id: c._id.toString(),
      children: buildCategoryTree(c._id, allCategories)
    }));
}

// ==========================================
// ✅ CATEGORY ACTIONS (Admin & Storefront)
// ==========================================

export async function createCategory(formData) {
  await connectDB();
  try {
    let imagePath = null;
    const f = formData.get("image");
    if (f && f.size > 0) imagePath = await saveFileToPublic(f);
    
    await Category.create({
      name: formData.get("name"),
      slug: formData.get("name").toLowerCase().replace(/ /g, "-"),
      parent: formData.get("parentId") || null,
      image: imagePath,
    });
    
    revalidatePath("/admin/categories");
    revalidatePath("/category");
    return { success: true };
  } catch (error) {
    return { error: "Failed to create category" };
  }
}

export async function deleteCategory(id) {
  await connectDB();
  await Category.findByIdAndDelete(id);
  revalidatePath("/admin/categories");
  return { success: true };
}

export async function getTopCategories() {
  await connectDB();
  const c = await Category.find({ parent: null }).lean();
  return JSON.parse(JSON.stringify(c));
}

export async function getCategories() {
  await connectDB();
  const raw = await Category.find().lean();
  const build = (cats, pid) =>
    cats
      .filter((c) => String(c.parent) === String(pid))
      .map((c) => ({
        ...c,
        _id: c._id.toString(),
        children: build(cats, c._id),
      }));
  return build(JSON.parse(JSON.stringify(raw)), null);
}

// --- ✅ GET CATEGORY PAGE DATA (The Fixed One) ---
export async function getCategoryPageData(slug, searchParams = {}) {
  await connectDB();
  try {
    const [mainCategory, siteContent] = await Promise.all([
      Category.findOne({ slug }).lean(),
      SiteContent.findOne({ identifier: 'main_layout' }).lean()
    ]);

    if (!mainCategory) return null;

    const navData = {
      logoImage: "/logo.png",
      logoText: "KNM",
      links: siteContent?.navbarLinks ? JSON.parse(JSON.stringify(siteContent.navbarLinks)) : []
    };

    const allCategoriesRaw = await Category.find().select("_id parent name slug image").lean();
    const mainCategoryIdStr = mainCategory._id.toString();

    const allFamilyIds = getFamilyTreeIds(mainCategoryIdStr, allCategoriesRaw);
    const familyObjectIds = allFamilyIds.map(id => new mongoose.Types.ObjectId(id));
    const directChildren = allCategoriesRaw.filter(c => c.parent && c.parent.toString() === mainCategoryIdStr);

    // Build Filter
    let productFilter = {};
    const now = new Date();
    if (searchParams.search) productFilter.name = { $regex: searchParams.search, $options: "i" };
    
    if (searchParams.minPrice || searchParams.maxPrice) {
      const min = searchParams.minPrice ? Number(searchParams.minPrice) : 0;
      const max = searchParams.maxPrice ? Number(searchParams.maxPrice) : Infinity;
      productFilter.$expr = {
        $and: [
          { $gte: [ { $cond: { if: { $and: [ { $gt: ["$discountPrice", 0] }, { $lt: ["$discountPrice", "$price"] }, { $or: [{ $eq: ["$saleStartDate", null] }, { $lte: ["$saleStartDate", now] }] }, { $or: [{ $eq: ["$saleEndDate", null] }, { $gte: ["$saleEndDate", now] }] } ] }, then: "$discountPrice", else: "$price" } }, min ] },
          { $lte: [ { $cond: { if: { $and: [ { $gt: ["$discountPrice", 0] }, { $lt: ["$discountPrice", "$price"] }, { $or: [{ $eq: ["$saleStartDate", null] }, { $lte: ["$saleStartDate", now] }] }, { $or: [{ $eq: ["$saleEndDate", null] }, { $gte: ["$saleEndDate", now] }] } ] }, then: "$discountPrice", else: "$price" } }, max ] }
        ]
      };
    }

    const sections = await Promise.all(directChildren.map(async (child) => {
      const childTreeIds = getFamilyTreeIds(child._id, allCategoriesRaw);
      const query = { ...productFilter, category: { $in: childTreeIds.map(id => new mongoose.Types.ObjectId(id)) } };
      
      let products = await Product.find(query).limit(12).sort({ createdAt: -1 }).lean();
      const totalCount = await Product.countDocuments(query);
      products = await Promise.all(products.map(checkAndResetOffer));

      return { 
        ...child, 
        _id: child._id.toString(), 
        children: buildCategoryTree(child._id, allCategoriesRaw),
        products: JSON.parse(JSON.stringify(products)), 
        count: totalCount 
      };
    }));

    const mainQuery = { ...productFilter, category: { $in: familyObjectIds } };
    let mainProducts = await Product.find(mainQuery).limit(20).sort({ createdAt: -1 }).lean();
    mainProducts = await Promise.all(mainProducts.map(checkAndResetOffer));

    return {
      mainCategory: JSON.parse(JSON.stringify(mainCategory)),
      sections: sections.filter(s => s.products.length > 0),
      mainProducts: JSON.parse(JSON.stringify(mainProducts)),
      navData
    };
  } catch (error) {
    console.error("Critical Error in getCategoryPageData:", error);
    return null;
  }
}

// ==========================================
// ✅ PRODUCT ACTIONS
// ==========================================

export async function searchProducts(query) {
  await connectDB();
  if (!query || query.trim().length < 2) return [];
  const regex = new RegExp(query, "i");
  try {
    const nameMatches = await Product.find({ name: { $regex: regex } }).limit(5).populate("category", "name").lean();
    const excludeIds = nameMatches.map((p) => p._id);
    const descMatches = await Product.find({ description: { $regex: regex }, _id: { $nin: excludeIds } }).limit(3).populate("category", "name").lean();
    return JSON.parse(JSON.stringify(await Promise.all([...nameMatches, ...descMatches].map(checkAndResetOffer))));
  } catch (error) { return []; }
}

export async function createProduct(formData) {
  await connectDB();
  try {
    const variants = JSON.parse(formData.get("variants") || "[]");
    const totalStock = variants.length > 0
        ? variants.reduce((s, v) => s + (parseInt(v.stock) || 0), 0)
        : parseInt(formData.get("stock") || 0);
    const imgs = [];
    for (const f of formData.getAll("images"))
      if (f.size > 0) imgs.push(await saveFileToPublic(f));

    await Product.create({
      name: formData.get("name"),
      slug: generateSlug(formData.get("name")) + "-" + Date.now(),
      sku: formData.get("sku") === "AUTO" || !formData.get("sku") ? generateCode("SKU") : formData.get("sku"),
      barcode: formData.get("barcode") === "AUTO" || !formData.get("barcode") ? generateCode("BAR") : formData.get("barcode"),
      description: formData.get("description"),
      price: parseFloat(formData.get("price")),
      discountPrice: formData.get("discountPrice") ? parseFloat(formData.get("discountPrice")) : null,
      saleStartDate: formData.get("saleStartDate") ? new Date(formData.get("saleStartDate")) : null,
      saleEndDate: formData.get("saleEndDate") ? new Date(formData.get("saleEndDate")) : null,
      category: formData.get("category"),
      stock: totalStock,
      variants,
      sizeGuide: formData.get("sizeGuide") || undefined,
      tags: formData.getAll("tags"),
      images: imgs,
    });
    revalidatePath("/admin/products");
    revalidatePath("/product");
    return { success: true };
  } catch (e) {
    return { error: "Failed" };
  }
}

export async function updateProduct(formData) {
  await connectDB();
  try {
    const p = await Product.findById(formData.get("id"));
    if (!p) return { error: "Not Found" };
    p.name = formData.get("name");
    p.description = formData.get("description");
    p.price = parseFloat(formData.get("price"));
    p.category = formData.get("category");
    const v = formData.get("variants") ? JSON.parse(formData.get("variants")) : null;
    if (v) {
      p.variants = v;
      p.stock = v.reduce((a, b) => a + (parseInt(b.stock) || 0), 0);
    } else {
      p.stock = parseInt(formData.get("stock") || p.stock);
    }
    p.sizeGuide = formData.get("sizeGuide") || undefined;
    p.discountPrice = formData.get("discountPrice") ? parseFloat(formData.get("discountPrice")) : null;
    p.saleStartDate = formData.get("saleStartDate") ? new Date(formData.get("saleStartDate")) : null;
    p.saleEndDate = formData.get("saleEndDate") ? new Date(formData.get("saleEndDate")) : null;
    p.tags = formData.getAll("tags");
    const kept = formData.getAll("keptImages");
    const toDel = p.images.filter((i) => !kept.includes(i));
    for (const d of toDel) await deleteFileFromPublic(d);
    const n = [];
    for (const f of formData.getAll("newImages"))
      if (f.size > 0) n.push(await saveFileToPublic(f));
    p.images = [...kept, ...n];
    await p.save();
    revalidatePath("/admin/products");
    revalidatePath(`/product/${p.slug}`);
    return { success: true };
  } catch (e) {
    return { error: "Failed" };
  }
}

export async function deleteProduct(id) {
  await connectDB();
  const p = await Product.findById(id);
  if (p?.images) for (const i of p.images) await deleteFileFromPublic(i);
  await Product.findByIdAndDelete(id);
  revalidatePath("/admin/products");
  return { success: true };
}

export async function getProductBySlug(slug) {
  await connectDB();
  let p = await Product.findOneAndUpdate(
    { slug },
    { $inc: { views: 1 } },
    { new: true },
  )
    .populate("category tags sizeGuide")
    .lean();
  return p ? JSON.parse(JSON.stringify(await checkAndResetOffer(p))) : null;
}

export async function getAllProducts() {
  await connectDB();
  let p = await Product.find()
    .sort({ createdAt: -1 })
    .populate("category tags")
    .lean();
  return JSON.parse(
    JSON.stringify(await Promise.all(p.map(checkAndResetOffer))),
  );
}

export async function getRelatedProducts(catId, currId) {
  await connectDB();
  let p = await Product.find({ category: catId, _id: { $ne: currId } })
    .limit(4)
    .lean();
  return JSON.parse(
    JSON.stringify(await Promise.all(p.map(checkAndResetOffer))),
  );
}

export async function getProductById(id) {
  await connectDB();
  try {
    let p = await Product.findById(id).populate("category tags").lean();
    return p ? JSON.parse(JSON.stringify(await checkAndResetOffer(p))) : null;
  } catch (e) {
    return null;
  }
}

export async function getProductHierarchy() {
  await connectDB();
  const cats = await Category.find().lean();
  const h = await Promise.all(
    cats.map(async (c) => {
      const p = await Product.find({ category: c._id })
        .select("name price _id")
        .lean();
      return {
        ...c,
        _id: c._id.toString(),
        products: JSON.parse(JSON.stringify(p)),
      };
    }),
  );
  return JSON.parse(JSON.stringify(h));
}

export async function getAdminProducts() {
  await connectDB();
  const p = await Product.find()
    .sort({ createdAt: -1 })
    .populate("category tags")
    .lean();
  return JSON.parse(JSON.stringify(p));
}

// --- ✅ Added Back: Missing Tag Actions ---

export async function updateProductTags(id, tags) {
  await connectDB();
  await Product.findByIdAndUpdate(id, { tags });
  revalidatePath("/admin/products");
  return { success: true };
}

export async function getProductsByTag(tagId) {
  await connectDB();
  const products = await Product.find({ tags: tagId })
    .select("name price images sku")
    .lean();
  return JSON.parse(JSON.stringify(products));
}

// ==========================================
// ✅ TAG ACTIONS
// ==========================================

export async function getTags() {
  await connectDB();
  const tags = await Tag.find().sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(tags));
}

export async function createTag(formData) {
  await connectDB();
  try {
    await Tag.create({
      name: formData.get("name"),
      slug: generateSlug(formData.get("name")),
      color: formData.get("color"),
    });
    revalidatePath("/admin/tags");
    return { success: true };
  } catch (error) {
    return { error: "Exists" };
  }
}

export async function deleteTag(id) {
  await connectDB();
  try {
    await Tag.findByIdAndDelete(id);
    await Product.updateMany({ tags: id }, { $pull: { tags: id } });
    revalidatePath("/admin/tags");
    return { success: true };
  } catch (error) {
    return { error: "Failed" };
  }
}