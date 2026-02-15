import { getRecommendedProducts } from '@/app/analytics-actions';
import ProductCard from '@/components/ProductCard'; 
import Link from 'next/link';

export default async function RecommendedSection() {
  // ✅ FIX: Fetch on server. Instant load. No "useEffect" delay.
  let products = [];
  try {
    if (typeof getRecommendedProducts === 'function') {
        products = await getRecommendedProducts();
    }
  } catch (e) {
    console.error("Failed to load recommendations:", e);
  }

  if (!products || products.length === 0) return null;

  return (
    <section className="py-20 md:py-32 bg-[#fff] font-body border-t border-[#F0F0F0]">
      <div className="max-w-[1920px] mx-auto px-4 md:px-8">
        
        {/* --- HEADER --- */}
        <div className="text-center mb-16 relative">
           {/* Decorative Line */}
           <div className="absolute top-1/2 left-0 w-full h-[1px] bg-[#F0F0F0] -z-10 hidden md:block"></div>
           
           <div className="inline-block bg-white px-8 relative">
              <span className="text-[#C5A059] font-bold uppercase tracking-[0.3em] text-[10px] block mb-3">
                  Just For You
              </span>
              <h2 className="font-heading font-normal text-4xl md:text-5xl text-[#121212] uppercase tracking-tight">
                  Recommended
              </h2>
           </div>
        </div>

        {/* --- DESKTOP GRID (Optimized) --- */}
        {/* 'content-visibility: auto' allows browser to render this lazily without lag */}
        <div className="hidden lg:grid grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-16 [content-visibility:auto] [contain-intrinsic-size:1px_1000px]">
          {products.map((product, index) => (
             <ProductCard 
                key={product._id} 
                product={product} 
                // ✅ Load first 5 images instantly (Priority)
                priority={index < 5} 
             />
          ))}
        </div>

        {/* --- MOBILE SCROLL (Hardware Accelerated) --- */}
        {/* 'will-change-transform' forces GPU usage for butter-smooth swipe */}
        <div className="lg:hidden -mx-4 px-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide [scroll-behavior:smooth] will-change-scroll">
           <div className="flex gap-4 pb-8 w-max">
             {products.map((product) => (
               <div key={product._id} className="snap-center min-w-[260px] w-[70vw] md:w-[45vw] flex-shrink-0">
                  <ProductCard product={product} />
               </div>
             ))}
             <div className="w-4 flex-shrink-0" />
           </div>
        </div>

      </div>
    </section>
  );
}