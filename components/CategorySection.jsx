import { getTopCategories } from '@/actions/products'; 
import CategoryGridAnimated from './CategoryGridAnimated';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default async function CategorySection() {
  // Fetch data on the server (Instant, no loading state)
  const allCategories = await getTopCategories();

  if (!allCategories || allCategories.length === 0) return null;

  const displayCategories = allCategories.slice(0, 12);

  return (
    // ✅ OPTIMIZED: Removed [content-visibility:auto] and [contain-intrinsic-size].
    // The browser now natively caches the painted pixels in memory, eliminating white flashes.
    <section className="py-20 md:py-32 bg-[#F9F6F0] relative font-body selection:bg-[#C5A059] selection:text-white">
      <div className="max-w-[1920px] mx-auto px-6 md:px-12 2xl:px-20">
        
        {/* --- HEADER --- */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
            <h2 className="font-heading font-normal text-4xl md:text-5xl 2xl:text-6xl text-[#121212] mb-6 uppercase tracking-tight leading-tight">
               Our Lifestyle Collections
            </h2>
            <div className="w-16 h-[2px] bg-[#C5A059] mx-auto mb-8"></div>
            <p className="font-body text-xs md:text-sm text-[#57534E] uppercase tracking-[0.25em] font-medium leading-relaxed opacity-80">
               Curated for the Gentleman of Distinction
            </p>
        </div>

        {/* --- ANIMATED GRID --- */}
        {/* We wrap this to ensure the layout is stable before the animation loads */}
        <div className="min-h-[500px]">
            <CategoryGridAnimated categories={displayCategories} />
        </div>

        {/* --- VIEW ALL BUTTON --- */}
        <div className="mt-20 md:mt-24 text-center">
            <Link 
              href="/category" 
              className="inline-flex items-center gap-4 px-12 py-5 border border-[#121212] text-[#121212] hover:text-white hover:bg-[#121212] text-xs md:text-sm font-bold uppercase tracking-[0.25em] transition-all duration-500 group hover:border-[#121212] hover:shadow-xl hover:shadow-[#121212]/10"
            >
               View All Categories
               <ArrowRight size={16} className="text-[#C5A059] group-hover:text-white group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
        </div>

      </div>
    </section>
  );
}