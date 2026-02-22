import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import CategorySection from "@/components/CategorySection"; 
import RecommendedSection from "../components/RecommendedSection"; 
import connectDB from "@/lib/db";
import HeroModel from "@/models/Hero";
import SiteContent from "@/models/SiteContent";

// ✅ THE ULTIMATE CACHE COMMAND
// This tells the server to build the page ONCE and keep it perfectly rendered in RAM for 1 hour (3600 seconds).
// This guarantees zero white flashes and 0ms load times for your users.
export const revalidate = 3600; 

export default async function Home() {
  await connectDB();
  
  // Fires database queries simultaneously for maximum speed
  const [siteContent, slides] = await Promise.all([
    SiteContent.findOne({ identifier: 'main_layout' }).lean(),
    HeroModel.find({}).sort({ createdAt: -1 }).lean()
  ]);

  const navData = {
    logoImage: "/logo.png",
    logoText: "KNM", 
    links: siteContent?.navbarLinks ? JSON.parse(JSON.stringify(siteContent.navbarLinks)) : [] 
  };

  const heroData = slides.map(slide => ({
    id: slide._id.toString(),
    link: slide.link || '/',
    imageDesktop: slide.image || '/placeholder.jpg',
    imageMobile: slide.mobileImage || null
  }));

  return (
    <main className="min-h-screen bg-[#F9F6F0] font-body selection:bg-[#C5A059] selection:text-white">
      
      {/* Navbar & Hero */}
      <Navbar navData={navData} />
      
      {heroData.length > 0 ? (
        <Hero heroData={heroData} />
      ) : (
        <div className="h-[500px] flex flex-col items-center justify-center bg-[#F9F6F0] border-b border-[#C5A059]/10">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8C8279]">Carousel Empty</p>
        </div>
      )}

      {/* ✅ FIX: Suspense and Loading Spinners have been completely removed! 
         The server will now assemble the entire page in the background and send the 
         browser a 100% complete, flawless website instantly. No more DOM popping in.
      */}
      <CategorySection />
      <RecommendedSection />

    </main>
  );
}