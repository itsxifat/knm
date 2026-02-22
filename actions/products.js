'use server'

import connectDB from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import Tag from '@/models/Tag';
import { saveFileToPublic, deleteFileFromPublic } from '@/lib/storage';
import { revalidatePath } from 'next/cache';

// --- HELPER: DEEP SERIALIZATION (Fixes "Plain Object" Error) ---
function serializeProduct(product) {
  if (!product) return null;
  const p = JSON.parse(JSON.stringify(product)); 
  
  if (p._id) p._id = p._id.toString();
  
  if (p.category) {
    if (typeof p.category === 'object') {
      p.category._id = p.category._id.toString();
      if (p.category.parent) p.category.parent = p.category.parent.toString();
    } else {
      p.category = p.category.toString();
    }
  }
  
  if (p.tags && Array.isArray(p.tags)) {
    p.tags = p.tags.map(t => (typeof t === 'object' ? { ...t, _id: t._id.toString() } : t.toString()));
  }

  if (p.variants && Array.isArray(p.variants)) {
    p.variants = p.variants.map(v => ({
      ...v,
      _id: v._id ? v._id.toString() : undefined
    }));
  }

  if (p.sizeGuide && typeof p.sizeGuide === 'object') {
    p.sizeGuide._id = p.sizeGuide._id.toString();
  }

  if (p.reviews && Array.isArray(p.reviews)) {
    p.reviews = p.reviews.map(r => ({
      ...r,
      _id: r._id ? r._id.toString() : undefined,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null
    }));
  }

  return p;
}

// --- HELPER FUNCTIONS ---
function generateSlug(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function generateCode(prefix = "ANQ") {
  const randomPart = Math.floor(100000 + Math.random() * 900000); 
  return `${prefix}-${randomPart}`;
}

// --- ✅ FIX: OPTIMIZED RECURSIVE CATEGORY FETCHER (Prevents N+1 DB Queries) ---
async function getAllDescendantCategories(parentId, allCategories = null) {
  if (!allCategories) {
    allCategories = await Category.find().lean();
  }
  
  let descendants = [];
  const children = allCategories.filter(c => String(c.parent) === String(parentId));
  
  for (const child of children) {
    descendants.push(child);
    const nestedChildren = await getAllDescendantCategories(child._id, allCategories);
    descendants = descendants.concat(nestedChildren);
  }
  
  return descendants;
}

// --- OFFER EXPIRY CHECKER ---
async function checkAndResetOffer(product) {
  if (!product.saleEndDate) return product;

  const now = new Date();
  const endDate = new Date(product.saleEndDate);

  if (now > endDate) {
    await Product.findByIdAndUpdate(product._id, {
      $unset: { discountPrice: "", saleStartDate: "", saleEndDate: "" }
    });
    product.discountPrice = null;
    product.saleStartDate = null;
    product.saleEndDate = null;
  }
  return product;
}

// --- TAGS ---
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
    const slug = generateSlug(name);
    await Tag.create({ name, slug, color });
    revalidatePath('/admin/tags');
    return { success: true };
  } catch (error) { return { error: 'Tag already exists' }; }
}

export async function deleteTag(id) {
  await connectDB();
  try {
    await Tag.findByIdAndDelete(id);
    await Product.updateMany({ tags: id }, { $pull: { tags: id } });
    revalidatePath('/admin/tags');
    return { success: true };
  } catch (error) { return { error: 'Failed to delete' }; }
}

export async function getProductsByTag(tagId) {
  await connectDB();
  const products = await Product.find({ tags: tagId }).select('name price images sku').lean();
  return products.map(serializeProduct);
}

// --- CATEGORIES ---
export async function createCategory(formData) {
  await connectDB();
  const name = formData.get('name');
  const parentId = formData.get('parentId') || null;
  const imageFile = formData.get('image'); 
  const slug = name.toLowerCase().replace(/ /g, '-');

  try {
    let imagePath = null;
    if (imageFile && imageFile.size > 0) imagePath = await saveFileToPublic(imageFile);
    await Category.create({ name, slug, parent: parentId, image: imagePath });
    revalidatePath('/admin/categories'); revalidatePath('/admin/navbar'); revalidatePath('/categories'); 
    return { success: true };
  } catch (error) { return { error: 'Failed to create category' }; }
}

export async function getCategoryPageData(slug, searchParams = {}) {
  await connectDB();
  try {
    const mainCategory = await Category.findOne({ slug }).lean();
    if (!mainCategory) return null;
    
    // ✅ FIX: Fetch all categories once to pass into the recursive function
    const allCategories = await Category.find().lean();
    const allDescendantCategories = await getAllDescendantCategories(mainCategory._id, allCategories);
    
    let productFilter = {};
    if (searchParams.search) productFilter.name = { $regex: searchParams.search, $options: 'i' };
    if (searchParams.minPrice || searchParams.maxPrice) {
      productFilter.price = {};
      if (searchParams.minPrice) productFilter.price.$gte = Number(searchParams.minPrice);
      if (searchParams.maxPrice) productFilter.price.$lte = Number(searchParams.maxPrice);
    }

    const sections = await Promise.all(allDescendantCategories.map(async (sub) => {
      let products = await Product.find({ category: sub._id, ...productFilter })
      .limit(12).sort({ createdAt: -1 }).lean();
      
      products = await Promise.all(products.map(checkAndResetOffer));

      return { 
          ...sub, 
          _id: sub._id.toString(), 
          parent: sub.parent ? sub.parent.toString() : null,
          products: products.map(serializeProduct)
      };
    }));

    let mainProducts = await Product.find({ category: mainCategory._id, ...productFilter }).limit(12).lean();
    mainProducts = await Promise.all(mainProducts.map(checkAndResetOffer));

    return { 
      mainCategory: { ...mainCategory, _id: mainCategory._id.toString(), parent: mainCategory.parent ? mainCategory.parent.toString() : null }, 
      sections, 
      mainProducts: mainProducts.map(serializeProduct)
    };
  } catch (error) { 
      console.error("Category Page Data Error:", error);
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
      parent: c.parent ? c.parent.toString() : null 
  }));
  
  const buildTree = (cats, parentId = null) => {
    return cats.filter(c => String(c.parent) === String(parentId)).map(c => ({
        ...c, children: buildTree(cats, c._id)
    }));
  };
  return buildTree(categories, null);
}

export async function getAllCategories() {
  await connectDB();
  const categories = await Category.find({}).sort({ name: 1 }).lean();
  return categories.map(c => ({ 
      ...c, 
      _id: c._id.toString(),
      parent: c.parent ? c.parent.toString() : null
  }));
}

// --- PRODUCTS ---
export async function getProductById(id) {
  await connectDB();
  try {
    let product = await Product.findById(id).populate('category').populate('tags').lean();
    if (!product) return null;
    
    product = await checkAndResetOffer(product);
    return serializeProduct(product);
  } catch (error) { return null; }
}

export async function getProductHierarchy() {
  await connectDB();
  const categories = await Category.find().lean();
  const hierarchy = await Promise.all(categories.map(async (cat) => {
    const products = await Product.find({ category: cat._id }).select('name price _id').lean();
    return { ...cat, _id: cat._id.toString(), products: products.map(serializeProduct) };
  }));
  return JSON.parse(JSON.stringify(hierarchy)); 
}

export async function getAdminProducts() {
  await connectDB();
  const productsRaw = await Product.find().sort({ createdAt: -1 }).populate('category', 'name').populate('tags', 'name color').lean();
  return productsRaw.map(serializeProduct);
}

export async function updateProductTags(productId, tags) {
  await connectDB();
  try {
    await Product.findByIdAndUpdate(productId, { tags: tags });
    revalidatePath('/admin/products');
    return { success: true };
  } catch (error) { return { error: "Failed to update tags" }; }
}

// --- CORE PRODUCT LOGIC ---

export async function createProduct(formData) {
  await connectDB();
  try {
    const name = formData.get('name');
    const description = formData.get('description');
    const price = parseFloat(formData.get('price'));
    const category = formData.get('category');
    
    const variantsJson = formData.get('variants');
    const variants = variantsJson ? JSON.parse(variantsJson) : [];
    
    const totalStock = variants.length > 0 
      ? variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0)
      : parseInt(formData.get('stock') || 0);

    const sizeGuide = formData.get('sizeGuide') || null;

    const discountPrice = formData.get('discountPrice') ? parseFloat(formData.get('discountPrice')) : null;
    const saleStartDate = formData.get('saleStartDate') ? new Date(formData.get('saleStartDate')) : null;
    const saleEndDate = formData.get('saleEndDate') ? new Date(formData.get('saleEndDate')) : null;

    let sku = formData.get('sku');
    if (sku === 'AUTO' || !sku) sku = generateCode('SKU');
    
    let barcode = formData.get('barcode');
    if (barcode === 'AUTO' || !barcode) barcode = generateCode('BAR');

    const tags = formData.getAll('tags');
    const images = formData.getAll('images'); 
    const imagePaths = [];

    for (const file of images) {
      if (file.size > 0) {
        const path = await saveFileToPublic(file);
        if (path) imagePaths.push(path);
      }
    }

    const slug = generateSlug(name) + '-' + Date.now(); 

    await Product.create({
      name, slug, sku, barcode, description, price, 
      discountPrice, saleStartDate, saleEndDate,
      category, 
      stock: totalStock,
      variants,          
      sizeGuide,         
      tags, 
      images: imagePaths 
    });

    revalidatePath('/admin/products'); revalidatePath('/product'); 
    return { success: true };
  } catch (error) {
    if (error.code === 11000) return { error: "SKU or Barcode already exists." };
    console.error("Create Product Error:", error); 
    return { error: "Failed to create product" };
  }
}

export async function updateProduct(formData) {
  await connectDB();
  try {
    const id = formData.get('id');
    const product = await Product.findById(id);
    if (!product) return { error: "Product not found" };

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
    if (sizeGuide && sizeGuide.length > 0) {
        product.sizeGuide = sizeGuide;
    } else {
        product.sizeGuide = undefined;
    }
    
    const sku = formData.get('sku');
    if (sku === 'AUTO') {
        product.sku = generateCode('SKU');
    } else if (sku && sku.trim() !== '') {
        product.sku = sku;
    }

    const barcode = formData.get('barcode');
    if (barcode === 'AUTO') {
        product.barcode = generateCode('BAR');
    } else if (barcode && barcode.trim() !== '') {
        product.barcode = barcode;
    }

    product.discountPrice = formData.get('discountPrice') ? parseFloat(formData.get('discountPrice')) : null;
    product.saleStartDate = formData.get('saleStartDate') ? new Date(formData.get('saleStartDate')) : null;
    product.saleEndDate = formData.get('saleEndDate') ? new Date(formData.get('saleEndDate')) : null;

    product.tags = formData.getAll('tags');

    const keptImages = formData.getAll('keptImages'); 
    const imagesToDelete = product.images.filter(img => !keptImages.includes(img));
    for (const imgPath of imagesToDelete) await deleteFileFromPublic(imgPath);

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
    
    return { success: true };
  } catch (error) {
    if (error.code === 11000) return { error: "SKU or Barcode already exists." };
    console.error("Update Product Error:", error);
    return { error: "Failed to update product" };
  }
}

export async function deleteProduct(id) {
  await connectDB();
  try {
    const product = await Product.findById(id);
    if(product.images) for(const img of product.images) await deleteFileFromPublic(img);
    await Product.findByIdAndDelete(id);
    revalidatePath('/admin/products');
    return { success: true };
  } catch (error) { return { error: "Failed to delete" }; }
}

export async function getProductBySlug(slug) {
  await connectDB();
  try {
    let productRaw = await Product.findOneAndUpdate({ slug }, { $inc: { views: 1 } }, { new: true })
      .populate('category')
      .populate('tags')
      .populate('sizeGuide') 
      .lean();
      
    if (!productRaw) return null;

    productRaw = await checkAndResetOffer(productRaw);
    return serializeProduct(productRaw);
  } catch (error) { return null; }
}

export async function getRelatedProducts(categoryId, currentProductId) {
  await connectDB();
  try {
    let productsRaw = await Product.find({ category: categoryId, _id: { $ne: currentProductId } }).limit(4).lean();
    productsRaw = await Promise.all(productsRaw.map(checkAndResetOffer));
    return productsRaw.map(serializeProduct);
  } catch (error) { return []; }
}

export async function searchProducts(query) {
  await connectDB();
  
  if (!query || query.length < 2) return [];

  try {
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    })
    .select('name slug images price discountPrice')
    .limit(5)
    .lean();
    
    return products.map(serializeProduct);
  } catch (error) {
    console.error("Search Error:", error);
    return [];
  }
}

export async function getAllProducts() {
  await connectDB();
  
  const products = await Product.find({})
    .populate('category', 'name') 
    .populate('tags') 
    .sort({ createdAt: -1 })
    .lean();

  return {
    products: products.map(serializeProduct) 
  };
}

const serialize = (obj) => JSON.parse(JSON.stringify(obj));

export async function getProductsBySearch(searchQuery) {
  await connectDB();
  
  if (!searchQuery || typeof searchQuery !== 'string') {
      return [];
  }

  const regex = new RegExp(searchQuery, 'i');

  const query = {
      $or: [
          { name: regex },
          { description: regex },
          { sku: regex }
      ]
  };

  try {
      const products = await Product.find(query)
          .populate('category')
          .populate('tags')
          .sort({ createdAt: -1 })
          .lean();

      return serialize(products);
  } catch (error) {
      console.error("Error searching products:", error);
      return [];
  }
}