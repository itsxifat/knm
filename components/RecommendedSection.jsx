import { getRecommendedProducts } from '@/app/analytics-actions';
import ProductCard from '@/components/ProductCard'; 

export default async function RecommendedSection() {
  let products = [];
  
  try {
    if (typeof getRecommendedProducts === 'function') {
        products = await getRecommendedProducts();
    }
  } catch (e) {
    // Graceful degradation: log error but don't crash the page
    console.error("[RecommendedSection] Failed to load recommendations:", e);
    return null; 
  }

  if (!products || products.length === 0) return null;

  return (
    // ✅ FIX: Removed unnecessary font-body if it's inherited, kept clean background
    <section className="py-20 md:py-32 bg-white border-t border-[#F0F0F0] overflow-hidden">
      <div className="max-w-[1920px] mx-auto px-4 md:px-8">
        
        {/* --- HEADER --- */}
        <div className="text-center mb-12 md:mb-16 relative">
           <div className="absolute top-1/2 left-0 w-full h-[1px] bg-[#F0F0F0] -z-10 hidden md:block"></div>
           
           <div className="inline-block bg-white px-6 md:px-8 relative">
              <span className="text-[#C5A059] font-bold uppercase tracking-[0.3em] text-[9px] md:text-[10px] block mb-2 md:mb-3">
                  Just For You
              </span>
              <h2 className="font-heading font-normal text-3xl md:text-4xl lg:text-5xl text-[#121212] uppercase tracking-tight">
                  Recommended
              </h2>
           </div>
        </div>

        {/* --- DESKTOP GRID --- */}
        {/* ✅ FIX: Kept content-visibility for rendering performance, removed rigid strict heights that cause layout shifts */}
        <div className="hidden lg:grid grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-16 [content-visibility:auto]">
          {products.map((product) => (
             <div key={product._id} className="w-full h-full">
                 <ProductCard 
                    product={product} 
                    // ✅ FIX: Removed 'priority'. These are below the fold and MUST be lazy-loaded to save bandwidth.
                    priority={false} 
                 />
             </div>
          ))}
        </div>

        {/* --- MOBILE SCROLL --- */}
        {/* ✅ FIX: Replaced invalid 'will-change-scroll' with standard, optimized Tailwind scroll-snap classes */}
        <div className="lg:hidden -mx-4 px-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide overscroll-x-contain pb-8">
           <div className="flex gap-4 w-max">
             {products.map((product) => (
               <div key={product._id} className="snap-start min-w-[260px] w-[75vw] sm:w-[45vw] flex-shrink-0 transform-gpu">
                  <ProductCard product={product} priority={false} />
               </div>
             ))}
             {/* Spacer for the end of the scroll */}
             <div className="w-2 flex-shrink-0" />
           </div>
        </div>

      </div>
    </section>
  );
}