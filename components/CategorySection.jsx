import { getTopCategories } from '@/actions/products'; // Corrected import path
import CategoryGridAnimated from './CategoryGridAnimated';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default async function CategorySection() {
  const allCategories = await getTopCategories();

  if (!allCategories || allCategories.length === 0) return null;

  const displayCategories = allCategories.slice(0, 12);

  return (
    <section className="py-12 md:py-20 2xl:py-28 bg-white relative font-body selection:bg-[#C5A059] selection:text-white">
      <div className="max-w-[1920px] mx-auto px-6 md:px-12 2xl:px-20">
        
        {/* --- HEADER --- */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16 2xl:mb-20">
            <h2 className="font-heading font-normal text-4xl md:text-5xl 2xl:text-6xl text-[#121212] mb-6 uppercase tracking-tight leading-tight">
               Our Lifestyle Collections
            </h2>
            <div className="w-16 h-[2px] bg-[#C5A059] mx-auto mb-6"></div>
            <p className="font-body text-xs md:text-sm text-[#57534E] uppercase tracking-[0.25em] font-medium leading-relaxed">
               Curated for the Gentleman of Distinction
            </p>
        </div>

        {/* --- ANIMATED GRID --- */}
        <CategoryGridAnimated categories={displayCategories} />

        {/* --- VIEW ALL BUTTON --- */}
        <div className="mt-16 md:mt-20 text-center">
            <Link 
              href="/category" 
              className="inline-flex items-center gap-4 px-10 py-4 border border-[#121212] text-[#121212] hover:text-white hover:bg-[#121212] text-xs md:text-sm font-bold uppercase tracking-[0.2em] transition-all duration-500 group hover:border-[#121212]"
            >
               View All Categories
               <ArrowRight size={16} className="text-[#C5A059] group-hover:text-white group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
        </div>

      </div>
    </section>
  );
}