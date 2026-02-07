import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Category from '@/models/Category';
import Product from '@/models/Product';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (!slug) return NextResponse.json({ error: "Please add ?slug=YOUR-SLUG to the URL" });

  try {
    // 1. Get the Parent
    const parent = await Category.findOne({ slug }).lean();
    if (!parent) return NextResponse.json({ error: "Parent Category Not Found" });

    const parentIdStr = parent._id.toString();

    // 2. Get ALL Categories to check strict equality
    const allCats = await Category.find().lean();

    // 3. Manual Filter (Simulating what our code does)
    const directChildren = allCats.filter(c => {
      // Check both String and ObjectId matching
      const pId = c.parent ? c.parent.toString() : 'null';
      return pId === parentIdStr;
    });

    // 4. Debug Output
    return NextResponse.json({
      TARGET_PARENT: {
        name: parent.name,
        id: parentIdStr,
        typeOfId: typeof parent._id
      },
      DATABASE_DUMP: {
        totalCategories: allCats.length,
        directChildrenFound: directChildren.length,
        // Print detailed info about potential children
        potentialChildrenMatch: directChildren.map(c => ({
          name: c.name,
          id: c._id.toString(),
          parentIdInDb: c.parent ? c.parent.toString() : 'null'
        }))
      },
      // 5. Check if we found children but no products
      PRODUCT_CHECK: await Promise.all(directChildren.map(async (child) => {
        const count = await Product.countDocuments({ category: child._id });
        return {
          childName: child.name,
          productsCount: count,
          childId: child._id.toString()
        };
      }))
    });

  } catch (error) {
    return NextResponse.json({ error: error.message });
  }
}