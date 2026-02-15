'use server';

import connectDB from '@/lib/db';
import Section from '@/models/Section';
import { saveFileToPublic, deleteFileFromPublic } from '@/lib/storage';
import { revalidatePath } from 'next/cache';

// --- PUBLIC FETCH ---
export async function getHomepageSections() {
  await connectDB();
  
  const sections = await Section.find({ isActive: true })
    .sort({ order: 1 })
    .populate({
      path: 'products',
      select: 'name slug images price discountPrice category tags stock variants',
      options: { limit: 8 },
      populate: { path: 'category', select: 'name' } 
    })
    .lean();
    
  // Manual Deep Serialization
  return sections.map(doc => ({ 
    ...doc, 
    _id: doc._id.toString(), 
    products: doc.products ? doc.products.map(p => ({
        ...p,
        _id: p._id.toString(),
        category: p.category ? { ...p.category, _id: p.category._id.toString() } : null,
        tags: p.tags ? p.tags.map(t => t.toString()) : [],
        // Fix variants buffer error
        variants: p.variants ? p.variants.map(v => ({ ...v, _id: v._id ? v._id.toString() : null })) : [] 
    })) : [] 
  }));
}

export async function getAllSectionsAdmin() {
  await connectDB();
  const sections = await Section.find().sort({ order: 1 }).lean();
  return sections.map(doc => ({ ...doc, _id: doc._id.toString() }));
}

// --- CREATE ---
export async function createSection(formData) {
  await connectDB();
  
  try {
    const title = formData.get('title');
    const type = formData.get('type');
    const heading = formData.get('heading');
    const subHeading = formData.get('subHeading');
    const link = formData.get('link');
    const order = formData.get('order');
    const products = JSON.parse(formData.get('products') || '[]');

    const file = formData.get('mediaFile');
    let mediaUrl = '';
    
    // 1. Attempt File Save
    if (file && file.size > 0) {
      try {
        mediaUrl = await saveFileToPublic(file); 
      } catch (storageError) {
        // Catch the [STORAGE] error here
        console.error("Storage Error:", storageError);
        return { error: `Upload Failed: ${storageError.message || "Invalid file type"}` };
      }
    } else {
      mediaUrl = formData.get('mediaUrl') || '';
    }

    // 2. Validate
    if (!mediaUrl) {
      return { error: "Media file (Image or Video) is required." };
    }

    // 3. Create
    await Section.create({
      title, type, heading, subHeading, mediaUrl, link, order, products
    });

    revalidatePath('/');
    revalidatePath('/admin/sections');
    return { success: true };
  } catch (error) {
    console.error("Create Section Error:", error);
    if (error.name === 'ValidationError') {
        return { error: "Validation Failed: Missing required fields." };
    }
    return { error: "Failed to create section" };
  }
}

// --- UPDATE ---
export async function updateSection(id, formData) {
  await connectDB();
  
  try {
    const section = await Section.findById(id);
    if (!section) return { error: "Section not found" };

    section.title = formData.get('title');
    section.type = formData.get('type');
    section.heading = formData.get('heading');
    section.subHeading = formData.get('subHeading');
    section.link = formData.get('link');
    section.order = formData.get('order');
    section.products = JSON.parse(formData.get('products') || '[]');

    const file = formData.get('mediaFile');
    
    if (file && file.size > 0) {
      try {
        if (section.mediaUrl && section.mediaUrl.startsWith('/')) {
          await deleteFileFromPublic(section.mediaUrl);
        }
        section.mediaUrl = await saveFileToPublic(file);
      } catch (storageError) {
         return { error: `Upload Failed: ${storageError.message}` };
      }
    } else {
        const manualUrl = formData.get('mediaUrl');
        if (manualUrl && manualUrl !== section.mediaUrl) {
             section.mediaUrl = manualUrl;
        }
    }

    await section.save();
    revalidatePath('/');
    revalidatePath('/admin/sections');
    return { success: true };
  } catch (error) {
    console.error("Update Section Error:", error);
    return { error: "Failed to update section" };
  }
}

// --- DELETE ---
export async function deleteSection(id) {
  await connectDB();
  const section = await Section.findById(id);
  if (section && section.mediaUrl && section.mediaUrl.startsWith('/')) {
      await deleteFileFromPublic(section.mediaUrl);
  }
  await Section.findByIdAndDelete(id);
  revalidatePath('/');
  revalidatePath('/admin/sections');
  return { success: true };
}