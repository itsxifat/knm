'use server'

import connectDB from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import Tag from '@/models/Tag';
import { saveFileToPublic, deleteFileFromPublic } from '@/lib/storage';
import { revalidatePath, revalidateTag } from 'next/cache';
import { unstable_cache } from 'next/cache';

// ----------------------------------------------------------------------------
// SERIALIZATION
// Single-pass serializer — no double JSON.parse/stringify anywhere.
// ----------------------------------------------------------------------------
function serializeDoc(doc) {
  if (!doc) return null;
  const p = { ...doc };

  if (p._id) p._id = p._id.toString();
  if (p.category) {
    if (typeof p.category === 'object' && p.category !== null) {
      p.category = { ...p.category, _id: p.category._id.toString() };
      if (p.category.parent) p.category.parent = p.category.parent.toString();
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
    p.variants = p.variants.map(v => ({ ...v, _id: v._id ? v._id.toString() : undefined }));
  }
  if (p.sizeGuide && typeof p.sizeGuide === 'object') {
    p.sizeGuide = { ...p.sizeGuide, _id: p.sizeGuide._id.toString() };
  }
  if (Array.isArray(p.reviews)) {
    p.reviews = p.reviews.map(r => ({
      ...r,
      _id: r._id ? r._id.toString() : undefined,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
    }));
  }
  if (p.createdAt) p.createdAt = new Date(p.createdAt).toISOString();
  if (p.updatedAt) p.updatedAt = new Date(p.updatedAt).toISOString();
  if (p.saleStartDate) p.saleStartDate = new Date(p.saleStartDate).toISOString();
  if (p.saleEndDate) p.saleEndDate = new Date(p.saleEndDate).toISOString();

  return p;
}

function serializeList(docs) {
  return docs.map(serializeDoc);
}

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------
function generateSlug(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function generateCode(prefix = 'ANQ') {
  return `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
}

// FIX: Iterative BFS instead of recursive async — no DB call per level,
// works entirely on the already-fetched allCategories array in memory.
function getAllDescendantIds(parentId, allCategories) {
  const result = [];
  const queue = [String(parentId)];
  while (queue.length > 0) {
    const current = queue.shift();
    const children = allCategories.filter(c => String(c.parent) === current);
    for (const child of children) {
      result.push(child._id);
      queue.push(String(child._id));
    }
  }
  return result;
}

// ----------------------------------------------------------------------------
// OFFER EXPIRY
// FIX: Moved from inline per-product read to a BULK update.
// Call this from a cron job (e.g. /api/cron/expire-offers) — NOT during reads.
// ----------------------------------------------------------------------------
export async function expireStaleOffers() {
  await connectDB();
  const result = await Product.updateMany(
    { saleEndDate: { $lt: new Date() }, discountPrice: { $exists: true } },
    { $unset: { discountPrice: '', saleStartDate: '', saleEndDate: '' } }
  );
  return { updated: result.modifiedCount };
}

// ----------------------------------------------------------------------------
// TAGS
// ----------------------------------------------------------------------------
export async function getTags() {
  await connectDB();
  const tags = await Tag.find().sort({ createdAt: -1 }).lean();
  return tags.map(t => ({ ...t, _id: t._id.toString() }));
}

export async function createTag(formData) {
  await connectDB();
  try {
    const name = formData.get('name');
    const color = formData.get('color');
    await Tag.create({ name, slug: generateSlug(name), color });
    revalidatePath('/admin/tags');
    return { success: true };
  } catch {
    return { error: 'Tag already exists' };
  }
}

export async function deleteTag(id) {
  await connectDB();
  try {
    // FIX: Run both deletes in parallel instead of sequentially
    await Promise.all([
      Tag.findByIdAndDelete(id),
      Product.updateMany({ tags: id }, { $pull: { tags: id } }),
    ]);
    revalidatePath('/admin/tags');
    return { success: true };
  } catch {
    return { error: 'Failed to delete' };
  }
}

export async function getProductsByTag(tagId) {
  await connectDB();
  const products = await Product.find({ tags: tagId })
    .select('name price images sku')
    .lean();
  return serializeList(products);
}

// ----------------------------------------------------------------------------
// CATEGORIES
// ----------------------------------------------------------------------------
export async function createCategory(formData) {
  await connectDB();
  const name = formData.get('name');
  const parentId = formData.get('parentId') || null;
  const imageFile = formData.get('image');
  try {
    let imagePath = null;
    if (imageFile && imageFile.size > 0) imagePath = await saveFileToPublic(imageFile);
    await Category.create({
      name,
      slug: name.toLowerCase().replace(/ /g, '-'),
      parent: parentId,
      image: imagePath,
    });
    revalidatePath('/admin/categories');
    revalidatePath('/admin/navbar');
    revalidatePath('/categories');
    return { success: true };
  } catch {
    return { error: 'Failed to create category' };
  }
}

export async function getCategoryPageData(slug, searchParams = {}) {
  await connectDB();
  try {
    // FIX: Fetch main category + all categories in parallel (was sequential)
    const [mainCategory, allCategories] = await Promise.all([
      Category.findOne({ slug }).lean(),
      Category.find().lean(),
    ]);
    if (!mainCategory) return null;

    const descendantIds = getAllDescendantIds(mainCategory._id, allCategories);
    const allCategoryIds = [mainCategory._id, ...descendantIds];

    const productFilter = { category: { $in: allCategoryIds } };
    if (searchParams.search) productFilter.name = { $regex: searchParams.search, $options: 'i' };
    if (searchParams.minPrice || searchParams.maxPrice) {
      productFilter.price = {};
      if (searchParams.minPrice) productFilter.price.$gte = Number(searchParams.minPrice);
      if (searchParams.maxPrice) productFilter.price.$lte = Number(searchParams.maxPrice);
    }

    // FIX: ONE query for all products across all subcategories instead of N queries
    const allProducts = await Product.find(productFilter)
      .select('name slug price discountPrice images stock variants category tags saleStartDate saleEndDate createdAt')
      .populate('tags', 'name color')
      .sort({ createdAt: -1 })
      .lean();

    // Group by category in JS — zero extra DB round trips
    const productsByCategory = {};
    for (const product of allProducts) {
      const catId = String(product.category);
      if (!productsByCategory[catId]) productsByCategory[catId] = [];
      if (productsByCategory[catId].length < 12) productsByCategory[catId].push(product);
    }

    const sections = allCategories
      .filter(c => descendantIds.some(id => String(id) === String(c._id)))
      .map(sub => ({
        ...sub,
        _id: sub._id.toString(),
        parent: sub.parent ? sub.parent.toString() : null,
        products: serializeList(productsByCategory[String(sub._id)] || []),
      }));

    return {
      mainCategory: {
        ...mainCategory,
        _id: mainCategory._id.toString(),
        parent: mainCategory.parent ? mainCategory.parent.toString() : null,
      },
      sections,
      mainProducts: serializeList(productsByCategory[String(mainCategory._id)] || []),
    };
  } catch (error) {
    console.error('Category Page Data Error:', error);
    return null;
  }
}

export async function getTopCategories() {
  await connectDB();
  const categories = await Category.find({ parent: null }).lean();
  return categories.map(c => ({ ...c, _id: c._id.toString() }));
}

export async function deleteCategory(id) {
  await connectDB();
  await Category.findByIdAndDelete(id);
  revalidatePath('/admin/categories');
  return { success: true };
}

export async function getCategories() {
  await connectDB();
  const categoriesRaw = await Category.find().lean();
  const categories = categoriesRaw.map(c => ({
    ...c,
    _id: c._id.toString(),
    parent: c.parent ? c.parent.toString() : null,
  }));
  const buildTree = (cats, parentId = null) =>
    cats
      .filter(c => String(c.parent) === String(parentId))
      .map(c => ({ ...c, children: buildTree(cats, c._id) }));
  return buildTree(categories, null);
}

export async function getAllCategories() {
  await connectDB();
  const categories = await Category.find({}).sort({ name: 1 }).lean();
  return categories.map(c => ({
    ...c,
    _id: c._id.toString(),
    parent: c.parent ? c.parent.toString() : null,
  }));
}

// ----------------------------------------------------------------------------
// PRODUCTS — READ
// ----------------------------------------------------------------------------

// FIX: Cached, projected, plain-array response.
// - unstable_cache: DB result cached for 60s, busted by revalidateTag('products')
// - Field projection: only what ProductCard renders
// - .populate('tags', 'name color'): was populating full tag documents before
// - Returns plain array (not { products: [...] } wrapper)
// - Single serializeList pass — no double JSON.parse/stringify
export const getAllProducts = unstable_cache(
  async () => {
    await connectDB();
    const products = await Product.find({})
      .select('name slug price discountPrice category tags images stock variants saleStartDate saleEndDate createdAt')
      .populate('category', 'name slug')
      .populate('tags', 'name color')
      .sort({ createdAt: -1 })
      .lean();
    return serializeList(products);
  },
  ['all-products'],
  { revalidate: 60, tags: ['products'] }
);

export async function getAdminProducts() {
  await connectDB();
  const products = await Product.find()
    .sort({ createdAt: -1 })
    .populate('category', 'name')
    .populate('tags', 'name color')
    .lean();
  return serializeList(products);
}

export async function getProductById(id) {
  await connectDB();
  try {
    const product = await Product.findById(id)
      .populate('category')
      .populate('tags')
      .lean();
    if (!product) return null;
    return serializeDoc(product);
  } catch {
    return null;
  }
}

export async function getProductHierarchy() {
  await connectDB();
  // FIX: Fetch categories + products in parallel, group in JS — was N+1 queries
  const [categories, allProducts] = await Promise.all([
    Category.find().lean(),
    Product.find().select('name price _id category').lean(),
  ]);
  const productsByCategory = {};
  for (const p of allProducts) {
    const catId = String(p.category);
    if (!productsByCategory[catId]) productsByCategory[catId] = [];
    productsByCategory[catId].push(serializeDoc(p));
  }
  return categories.map(cat => ({
    ...cat,
    _id: cat._id.toString(),
    products: productsByCategory[String(cat._id)] || [],
  }));
}

export async function updateProductTags(productId, tags) {
  await connectDB();
  try {
    await Product.findByIdAndUpdate(productId, { tags });
    revalidatePath('/admin/products');
    revalidateTag('products');
    return { success: true };
  } catch {
    return { error: 'Failed to update tags' };
  }
}

// FIX: No longer writes on read. Views tracked via separate non-blocking call.
// This allows Next.js to cache product pages properly.
export async function getProductBySlug(slug) {
  await connectDB();
  try {
    const product = await Product.findOne({ slug })
      .populate('category')
      .populate('tags')
      .populate('sizeGuide')
      .lean();
    if (!product) return null;
    return serializeDoc(product);
  } catch {
    return null;
  }
}

// Call this from a POST /api/products/view route on the client (fire-and-forget)
// so it never blocks page rendering or caching
export async function trackProductView(slug) {
  await connectDB();
  Product.findOneAndUpdate({ slug }, { $inc: { views: 1 } }).exec();
}

export async function getRelatedProducts(categoryId, currentProductId) {
  await connectDB();
  try {
    const products = await Product.find({
      category: categoryId,
      _id: { $ne: currentProductId },
    })
      .select('name slug price discountPrice images stock variants tags category saleStartDate saleEndDate createdAt')
      .populate('tags', 'name color')
      .limit(4)
      .lean();
    return serializeList(products);
  } catch {
    return [];
  }
}

// FIX: Removed duplicate getProductsBySearch. Use this one — it has projection + limit.
export async function searchProducts(query) {
  await connectDB();
  if (!query || query.length < 2) return [];
  try {
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { sku: { $regex: query, $options: 'i' } },
      ],
    })
      .select('name slug images price discountPrice')
      .limit(8)
      .lean();
    return serializeList(products);
  } catch (error) {
    console.error('Search Error:', error);
    return [];
  }
}

// ----------------------------------------------------------------------------
// PRODUCTS — WRITE
// ----------------------------------------------------------------------------

export async function createProduct(formData) {
  await connectDB();
  try {
    const name = formData.get('name');
    const variantsJson = formData.get('variants');
    const variants = variantsJson ? JSON.parse(variantsJson) : [];
    const totalStock = variants.length > 0
      ? variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0)
      : parseInt(formData.get('stock') || 0);

    let sku = formData.get('sku');
    if (sku === 'AUTO' || !sku) sku = generateCode('SKU');
    let barcode = formData.get('barcode');
    if (barcode === 'AUTO' || !barcode) barcode = generateCode('BAR');

    const images = formData.getAll('images');
    const imagePaths = [];
    for (const file of images) {
      if (file.size > 0) {
        const path = await saveFileToPublic(file);
        if (path) imagePaths.push(path);
      }
    }

    await Product.create({
      name,
      slug: `${generateSlug(name)}-${Date.now()}`,
      sku,
      barcode,
      description: formData.get('description'),
      price: parseFloat(formData.get('price')),
      discountPrice: formData.get('discountPrice') ? parseFloat(formData.get('discountPrice')) : null,
      saleStartDate: formData.get('saleStartDate') ? new Date(formData.get('saleStartDate')) : null,
      saleEndDate: formData.get('saleEndDate') ? new Date(formData.get('saleEndDate')) : null,
      category: formData.get('category'),
      stock: totalStock,
      variants,
      sizeGuide: formData.get('sizeGuide') || null,
      tags: formData.getAll('tags'),
      images: imagePaths,
    });

    revalidatePath('/admin/products');
    revalidatePath('/product');
    revalidateTag('products'); // Bust getAllProducts cache immediately
    return { success: true };
  } catch (error) {
    if (error.code === 11000) return { error: 'SKU or Barcode already exists.' };
    console.error('Create Product Error:', error);
    return { error: 'Failed to create product' };
  }
}

export async function updateProduct(formData) {
  await connectDB();
  try {
    const id = formData.get('id');
    const product = await Product.findById(id);
    if (!product) return { error: 'Product not found' };

    product.name = formData.get('name');
    product.description = formData.get('description');
    product.price = parseFloat(formData.get('price'));
    product.category = formData.get('category');

    const variantsJson = formData.get('variants');
    if (variantsJson) {
      const parsedVariants = JSON.parse(variantsJson);
      product.variants = parsedVariants;
      product.stock = parsedVariants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
    } else {
      product.stock = parseInt(formData.get('stock') || product.stock);
    }

    const sizeGuide = formData.get('sizeGuide');
    product.sizeGuide = sizeGuide?.length > 0 ? sizeGuide : undefined;

    const sku = formData.get('sku');
    if (sku === 'AUTO') product.sku = generateCode('SKU');
    else if (sku?.trim()) product.sku = sku;

    const barcode = formData.get('barcode');
    if (barcode === 'AUTO') product.barcode = generateCode('BAR');
    else if (barcode?.trim()) product.barcode = barcode;

    product.discountPrice = formData.get('discountPrice') ? parseFloat(formData.get('discountPrice')) : null;
    product.saleStartDate = formData.get('saleStartDate') ? new Date(formData.get('saleStartDate')) : null;
    product.saleEndDate = formData.get('saleEndDate') ? new Date(formData.get('saleEndDate')) : null;
    product.tags = formData.getAll('tags');

    const keptImages = formData.getAll('keptImages');
    const imagesToDelete = product.images.filter(img => !keptImages.includes(img));
    // FIX: Delete images in parallel instead of sequentially
    await Promise.all(imagesToDelete.map(img => deleteFileFromPublic(img)));

    const newFiles = formData.getAll('newImages');
    const newPaths = [];
    for (const file of newFiles) {
      if (file.size > 0) {
        const path = await saveFileToPublic(file);
        if (path) newPaths.push(path);
      }
    }
    product.images = [...keptImages, ...newPaths];

    await product.save();
    revalidatePath('/admin/products');
    revalidatePath(`/product/${product.slug}`);
    revalidateTag('products'); // Bust getAllProducts cache on every update
    return { success: true };
  } catch (error) {
    if (error.code === 11000) return { error: 'SKU or Barcode already exists.' };
    console.error('Update Product Error:', error);
    return { error: 'Failed to update product' };
  }
}

export async function deleteProduct(id) {
  await connectDB();
  try {
    const product = await Product.findById(id);
    if (product?.images?.length) {
      // FIX: Delete images in parallel instead of sequentially
      await Promise.all(product.images.map(img => deleteFileFromPublic(img)));
    }
    await Product.findByIdAndDelete(id);
    revalidatePath('/admin/products');
    revalidateTag('products'); // Bust getAllProducts cache on delete
    return { success: true };
  } catch {
    return { error: 'Failed to delete' };
  }
}