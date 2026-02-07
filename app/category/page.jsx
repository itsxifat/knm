import { getTopCategories } from '@/app/actions';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import connectDB from '@/lib/db';
import SiteContent from '@/models/SiteContent';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function AllCategoriesPage() {
  await connectDB();

  // 1. Fetch Data
  const siteContent = await SiteContent.findOne({ identifier: 'main_layout' }).lean();
  const navData = {
    logoImage: "/logo.png",
    logoText: "KNM",
    links: siteContent?.navbarLinks ? JSON.parse(JSON.stringify(siteContent.navbarLinks)) : []
  };

  const categories = await getTopCategories();

  return (
    <div className="min-h-screen bg-white font-body text-[#121212] selection:bg-[#C5A059] selection:text-white">
      <Navbar navData={navData} />

      <main className="pt-10 pb-24 px-4 md:px-8 max-w-[1920px] mx-auto">

        {/* --- PREMIUM HEADER --- */}
        <div className="text-center max-w-4xl mx-auto mb-16 md:mb-24">
          <span className="text-[#C5A059] text-[10px] font-bold uppercase tracking-[0.3em] block mb-4">Discover</span>
          <h1 className="font-heading font-normal text-5xl md:text-7xl text-[#121212] mb-6 uppercase tracking-tight leading-none">
            The Collections
          </h1>
          <div className="w-16 h-[2px] bg-[#C5A059] mx-auto mb-6"></div>
          <p className="text-[#8C8279] text-xs uppercase tracking-[0.25em] font-medium max-w-lg mx-auto leading-relaxed">
            Curated heritage for the modern aesthetic.
          </p>
        </div>

        {/* --- CATEGORIES GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 md:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat._id}
              href={`/category/${cat.slug}`}
              className="group relative block w-full aspect-[3/4] overflow-hidden bg-[#F9F6F0]"
            >
              {/* IMAGE */}
              {cat.image ? (
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105 will-change-transform"
                  quality={90}
                  priority={false}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-[#F9F6F0] text-[#E5E5E5]">
                   <span className="font-heading text-4xl text-[#C5A059]/20">KNM</span>
                </div>
              )}

              {/* OVERLAY */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#121212]/90 via-transparent to-transparent opacity-60 group-hover:opacity-50 transition-opacity duration-700" />

              {/* TEXT CONTENT */}
              <div className="absolute inset-0 p-8 flex flex-col justify-end z-10 items-center text-center">
                
                <h2 className="font-heading font-normal text-3xl md:text-4xl text-white uppercase tracking-wide leading-none mb-3 translate-y-4 group-hover:translate-y-0 transition-transform duration-700 ease-out text-shadow-sm">
                  {cat.name}
                </h2>

                {/* Animated Gold Line */}
                <div className="h-[1px] bg-[#C5A059] w-0 group-hover:w-12 transition-all duration-700 ease-out mb-4 opacity-0 group-hover:opacity-100"></div>
                
                <div className="overflow-hidden h-0 group-hover:h-auto transition-all duration-700 delay-100 opacity-0 group-hover:opacity-100">
                    <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/90 border-b border-white/30 pb-1 hover:text-[#C5A059] hover:border-[#C5A059] transition-colors">
                        Explore Collection
                    </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {categories.length === 0 && (
          <div className="h-[40vh] flex flex-col items-center justify-center text-[#8C8279] bg-[#F9F6F0]/50 border border-[#C5A059]/10 mt-10">
            <p className="font-heading text-3xl mb-3 text-[#C5A059]">COMING SOON</p>
            <p className="text-[10px] uppercase tracking-widest font-bold">Our collections are being curated.</p>
          </div>
        )}

      </main>
    </div>
  );
}