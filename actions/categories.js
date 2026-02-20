'use server';

import connectDB from '@/lib/db';
import Category from '@/models/Category';
import Product from '@/models/Product';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';

// ============================================================================
// 1. UTILITY & STORAGE HELPERS
// ============================================================================

const serialize = (obj) => JSON.parse(JSON.stringify(obj));

// Instantly deletes a file from the public directory
async function deleteFile(imagePath) {
  if (!imagePath) return;
  try {
    const filePath = path.join(process.cwd(), 'public', imagePath);
    await fs.unlink(filePath);
    console.log(`[Storage] Deleted: ${filePath}`);
  } catch (err) {
    if (err.code !== 'ENOENT') {
        console.error("[Storage] Failed to delete file:", err);
    }
  }
}

// Saves a file to the public/uploads directory
async function saveFileToPublic(file) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  // Clean filename to prevent spaces or weird characters breaking URLs
  const filename = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
  const finalName = `${uniqueSuffix}-${filename}`;
  const filePath = path.join(process.cwd(), 'public', 'uploads', finalName);
  
  // Ensure the uploads directory exists
  try {
    await fs.mkdir(path.join(process.cwd(), 'public', 'uploads'), { recursive: true });
  } catch (e) {} // Ignore if it already exists

  await fs.writeFile(filePath, buffer);
  return `/uploads/${finalName}`;
}

// Recursively finds all sub-categories (needed for the category page)
async function getAllDescendantCategories(categoryId) {
  let descendants = [];
  const children = await Category.find({ parent: categoryId }).lean();
  for (const child of children) {
      descendants.push(child);
      const childDescendants = await getAllDescendantCategories(child._id);
      descendants = descendants.concat(childDescendants);
  }
  return descendants;
}

// Auto-resets expired discounts (used in category page)
async function checkAndResetOffer(product) {
  const now = new Date();
  if (product.discountPrice && product.saleEndDate && new Date(product.saleEndDate) < now) {
      // If offer expired, remove it dynamically for the frontend
      product.discountPrice = null;
      product.saleStartDate = null;
      product.saleEndDate = null;
  }
  return product;
}


// ============================================================================
// 2. MUTATION ACTIONS (CREATE, UPDATE, DELETE)
// ============================================================================

export async function createCategory(formData) {
  await connectDB();
  const name = formData.get('name');
  const parentId = formData.get('parentId') || null;
  const imageFile = formData.get('image'); 
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  try {
    let imagePath = null;
    if (imageFile && imageFile.size > 0) {
        imagePath = await saveFileToPublic(imageFile);
    }
    
    await Category.create({ name, slug, parent: parentId, image: imagePath });
    
    revalidatePath('/admin/categories'); 
    revalidatePath('/admin/navbar'); 
    revalidatePath('/categories'); 
    return { success: true };
  } catch (error) { 
    console.error("Create Category Error:", error);
    return { error: 'Failed to create category' }; 
  }
}

export async function updateCategory(formData) {
  await connectDB();
  
  const id = formData.get('categoryId'); 
  const name = formData.get('name');
  const imageFile = formData.get('image');
  
  if (!id) return { error: 'Category ID is missing' };

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  try {
    const existingCat = await Category.findById(id);
    if (!existingCat) return { error: 'Category not found' };

    let imagePath = existingCat.image;

    // If a new image is uploaded, delete the old one and save the new one
    if (imageFile && imageFile.size > 0) {
      if (existingCat.image) {
         await deleteFile(existingCat.image);
      }
      imagePath = await saveFileToPublic(imageFile);
    }

    await Category.findByIdAndUpdate(id, { name, slug, image: imagePath });
    
    revalidatePath('/admin/categories');
    revalidatePath('/admin/navbar');
    revalidatePath('/categories');
    return { success: true };
  } catch (error) {
    console.error("Update Category Error:", error);
    return { error: 'Failed to update category' };
  }
}

export async function deleteCategory(id) {
  await connectDB();
  
  try {
    // Recursive function to delete a category, its children, and ALL associated images
    async function recursiveDelete(catId) {
       const cat = await Category.findById(catId);
       if (!cat) return;

       // 1. Delete physical file
       if (cat.image) await deleteFile(cat.image);

       // 2. Find and delete children
       const children = await Category.find({ parent: catId });
       for (const child of children) {
           await recursiveDelete(child._id);
       }

       // 3. Delete DB document
       await Category.findByIdAndDelete(catId);
    }

    await recursiveDelete(id);

    revalidatePath('/admin/categories');
    revalidatePath('/admin/navbar');
    revalidatePath('/categories');
    return { success: true };
  } catch (error) {
    console.error("Delete Category Error:", error);
    return { error: 'Failed to delete category' };
  }
}


// ============================================================================
// 3. QUERY ACTIONS (FETCHING DATA)
// ============================================================================

// Returns categories formatted as a hierarchical Tree (Parent -> Children)
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

// Returns a flat array of all categories
export async function getAllCategories() {
  await connectDB();
  const categories = await Category.find({}).sort({ name: 1 }).lean();
  return serialize(categories.map(c => ({ 
      ...c, 
      _id: c._id.toString(),
      parent: c.parent ? c.parent.toString() : null
  })));
}

// Returns only the Root categories (Top level, no parents)
export async function getTopCategories() {
  await connectDB();
  const categories = await Category.find({ parent: null }).lean();
  return serialize(categories.map(c => ({ ...c, _id: c._id.toString() })));
}

// Returns the full data package for a specific Category Page (frontend)
export async function getCategoryPageData(slug, searchParams = {}) {
  await connectDB();
  try {
    const mainCategory = await Category.findOne({ slug }).lean();
    if (!mainCategory) return null;
    
    // Fetch all sub-categories and their sub-subcategories recursively
    const allDescendantCategories = await getAllDescendantCategories(mainCategory._id);
    
    // Build search filters
    let productFilter = {};
    if (searchParams.search) productFilter.name = { $regex: searchParams.search, $options: 'i' };
    if (searchParams.minPrice || searchParams.maxPrice) {
      productFilter.price = {};
      if (searchParams.minPrice) productFilter.price.$gte = Number(searchParams.minPrice);
      if (searchParams.maxPrice) productFilter.price.$lte = Number(searchParams.maxPrice);
    }

    // Process every descendant category into a section
    const sections = await Promise.all(allDescendantCategories.map(async (sub) => {
      let products = await Product.find({ category: sub._id, ...productFilter })
          .populate('tags') 
          .limit(12)
          .sort({ createdAt: -1 })
          .lean();
      
      products = await Promise.all(products.map(checkAndResetOffer));

      return { 
          ...sub, 
          _id: sub._id.toString(), 
          parent: sub.parent ? sub.parent.toString() : null,
          products: serialize(products)
      };
    }));

    // Fetch products belonging directly to the main category
    let mainProducts = await Product.find({ category: mainCategory._id, ...productFilter })
        .populate('tags')
        .limit(12)
        .lean();
        
    mainProducts = await Promise.all(mainProducts.map(checkAndResetOffer));

    return serialize({ 
      mainCategory: { ...mainCategory, _id: mainCategory._id.toString(), parent: mainCategory.parent ? mainCategory.parent.toString() : null }, 
      sections, 
      mainProducts: mainProducts
    });
  } catch (error) { 
      console.error("Category Page Data Error:", error);
      return null; 
  }
}