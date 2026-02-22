import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import CategorySection from "@/components/CategorySection"; 
import RecommendedSection from "../components/RecommendedSection"; 
import connectDB from "@/lib/db";
import HeroModel from "@/models/Hero";
import SiteContent from "@/models/SiteContent";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

// --- PREMIUM SKELETON LOADER ---
// This shows a sleek gold spinner while heavy sections load in the background
const SectionLoader = () => (
  <div className="w-full py-32 flex flex-col items-center justify-center bg-[#F9F6F0]">
    <Loader2 className="w-8 h-8 animate-spin text-[#C5A059]" />
    <p className="mt-4 text-[9px] font-bold uppercase tracking-[0.3em] text-[#8C8279]">Loading Collection...</p>
  </div>
);

export default async function Home() {
  await connectDB();
  
  // ✅ OPTIMIZATION: Parallel Fetching
  // Fires database queries simultaneously instead of waiting for one to finish before starting the next.
  const [siteContent, slides] = await Promise.all([
    SiteContent.findOne({ identifier: 'main_layout' }).lean(),
    HeroModel.find({}).sort({ createdAt: -1 }).lean()
  ]);

  const navData = {
    logoImage: "/logo.png",
    logoText: "KNM", // ✅ Rebranded to KNM
    links: siteContent?.navbarLinks ? JSON.parse(JSON.stringify(siteContent.navbarLinks)) : [] 
  };

  const heroData = slides.map(slide => ({
    id: slide._id.toString(),
    link: slide.link || '/',
    imageDesktop: slide.image || '/placeholder.jpg',
    imageMobile: slide.mobileImage || null
  }));

  return (
    // ✅ Rebranded to KNM Off-White Background & Custom Selection
    <main className="min-h-screen bg-[#F9F6F0] font-body selection:bg-[#C5A059] selection:text-white">
      
      {/* Navbar & Hero render instantly because their data is already ready */}
      <Navbar navData={navData} />
      
      {heroData.length > 0 ? (
        <Hero heroData={heroData} />
      ) : (
        <div className="h-[500px] flex flex-col items-center justify-center bg-[#F9F6F0] border-b border-[#C5A059]/10">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8C8279]">Carousel Empty</p>
        </div>
      )}

      {/* ✅ OPTIMIZATION: React Suspense Streaming 
         The server will flush the HTML for the Hero immediately, meaning the user sees the site instantly.
         These heavier sections will calculate their products and pop into place independently.
      */}
      <Suspense fallback={<SectionLoader />}>
        <CategorySection />
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <RecommendedSection />
      </Suspense>

    </main>
  );
}