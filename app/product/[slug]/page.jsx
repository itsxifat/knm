import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import { getServerSession } from "next-auth"; 
import { authOptions } from '@/lib/auth'; 

// --- MODELS ---
import Product from '@/models/Product';
import SiteContent from '@/models/SiteContent';
import Order from '@/models/Order'; 
import User from '@/models/User'; 

// --- REFERENCED MODELS ---
import SizeGuide from '@/models/SizeGuide'; 
import Category from '@/models/Category'; 
import Tag from '@/models/Tag'; 

// --- COMPONENTS ---
import Navbar from '@/components/Navbar';
import ProductDetails from '@/components/ProductDetails'; 
import RecommendedSection from '@/components/RecommendedSection'; 

export const dynamic = 'force-dynamic';

const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  await mongoose.connect(process.env.MONGODB_URI);
};

export async function generateMetadata({ params }) {
  await connectDB();
  const { slug } = await params; 
  const product = await Product.findOne({ slug: decodeURIComponent(slug) }).select('name description images');
  if (!product) return { title: 'Product Not Found | KNM' };

  return {
    title: `${product.name} | KNM Heritage`,
    description: product.description?.substring(0, 160),
    openGraph: { images: product.images?.[0] ? [{ url: product.images[0] }] : [] },
  };
}

export default async function ProductPage({ params }) {
  await connectDB();
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  // 1. Fetch Product
  const product = await Product.findOne({ slug: decodedSlug })
    .populate('category')
    .populate('sizeGuide') 
    .populate('tags') 
    .lean();

  // 2. Fetch Navbar Data
  const siteContent = await SiteContent.findOne({ identifier: 'main_layout' }).lean();
  const navData = {
    logoImage: "/logo.png",
    logoText: "KNM",
    links: siteContent?.navbarLinks ? JSON.parse(JSON.stringify(siteContent.navbarLinks)) : []
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F9F6F0] text-[#121212] font-body selection:bg-[#C5A059] selection:text-white">
        <Navbar navData={navData} />
        <div className="h-[70vh] flex flex-col items-center justify-center text-center px-6">
          <h1 className="font-heading text-4xl mb-4 uppercase tracking-tight">Product Unavailable</h1>
          <p className="text-[#8C8279] text-xs tracking-[0.25em] uppercase mb-8 font-medium">The item you are looking for is no longer in our archives.</p>
          <a href="/category" className="border-b border-[#121212] text-xs uppercase tracking-[0.2em] pb-1 hover:text-[#C5A059] hover:border-[#C5A059] transition-colors font-bold">Return to Collections</a>
        </div>
      </div>
    );
  }

  // 3. Calculate Order Count
  let orderCount = 0;
  const session = await getServerSession(authOptions);
  
  if (session && session.user) {
    let userId = session.user.id;
    if (!userId && session.user.email) {
       const user = await User.findOne({ email: session.user.email });
       if (user) userId = user._id;
    }
    
    if (userId) {
       const orders = await Order.find({ 
           user: userId, 
           "items.product": product._id 
       }).select('_id'); 
       orderCount = orders.length;
    }
  }

  // 4. Serialize Data
  const serializedProduct = JSON.parse(JSON.stringify(product));

  return (
    <div className="bg-white min-h-screen font-body selection:bg-[#C5A059] selection:text-white">
      <Navbar navData={navData} />
      
      {/* Main Component */}
      <ProductDetails 
         product={serializedProduct} 
         orderCount={orderCount} 
      />

      {/* Recommendations */}
      <div className="border-t border-[#C5A059]/10">
        <RecommendedSection currentProductId={serializedProduct._id} categoryId={serializedProduct.category?._id} />
      </div>
    </div>
  );
}