import connectDB from '@/lib/db';
import SiteContent from '@/models/SiteContent';
import { getAllProducts } from '@/app/actions';
import Navbar from '@/components/Navbar';
import ProductListing from '@/components/ProductListing';

export const dynamic = 'force-dynamic';

export default async function ProductsPage({ searchParams }) {
  await connectDB();

  // ✅ Await searchParams (Required for modern Next.js 15+)
  const params = await searchParams;
  const initialSearch = params?.search || '';

  // 1. Fetch Navbar Data
  const siteContent = await SiteContent.findOne({ identifier: 'main_layout' }).lean();
  
  // --- CRITICAL MEMORY FIX ---
  const rawLinks = siteContent?.navbarLinks ? siteContent.navbarLinks : [];
  const sanitizedLinks = JSON.parse(JSON.stringify(rawLinks));

  const navData = {
    logoImage: "/logo.png",
    logoText: "KNM", 
    links: sanitizedLinks
  };

  // 2. Fetch All Products
  const products = await getAllProducts();

  return (
    <div className="bg-white min-h-screen text-black selection:bg-[#C5A059] selection:text-white">
      <Navbar navData={navData} />
      
      {/* ✅ Pass initialSearch to pre-filter the products */}
      <ProductListing initialProducts={products} initialSearch={initialSearch} />
    </div>
  );
}