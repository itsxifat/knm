import { getRecommendedProducts } from '@/app/analytics-actions';
import ProductCard from '@/components/ProductCard'; 

export default async function RecommendedSection() {
  let products = [];
  
  try {
    if (typeof getRecommendedProducts === 'function') {
        products = await getRecommendedProducts();
    }
  } catch (e) {
    console.error("[RecommendedSection] Failed to load recommendations:", e);
    return null; 
  }

  if (!products || products.length === 0) return null;

  return (
    <section className="py-20 md:py-32 bg-[#F9F6F0] border-t border-[#C5A059]/10 overflow-hidden font-body selection:bg-[#C5A059] selection:text-white">
      <div className="max-w-480 mx-auto px-4 md:px-8">
        
        {/* --- HEADER --- */}
        <div className="text-center mb-12 md:mb-16 relative">
           <div className="absolute top-1/2 left-0 w-full h-px bg-[#C5A059]/20 -z-10 hidden md:block"></div>
           
           <div className="inline-block bg-[#F9F6F0] px-6 md:px-8 relative">
              <span className="text-[#C5A059] font-bold uppercase tracking-[0.3em] text-[9px] md:text-[10px] block mb-2 md:mb-3">
                 Just For You
              </span>
              <h2 className="font-heading font-normal text-3xl md:text-4xl lg:text-5xl text-[#121212] uppercase tracking-tight">
                 Recommended
              </h2>
           </div>
        </div>

        {/* --- DESKTOP GRID --- */}
        <div className="hidden lg:grid grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-16">
          {products.map((product) => (
             <div key={product._id} className="w-full h-full">
                 <ProductCard 
                    product={product} 
                    priority={false} 
                 />
             </div>
          ))}
        </div>

        {/* --- MOBILE SCROLL --- */}
        {/* ✅ FIX: Added data-lenis-prevent="true" to stop Lenis from lagging the horizontal scroll */}
        <div 
          data-lenis-prevent="true"
          className="lg:hidden flex overflow-x-auto snap-x snap-mandatory gap-4 pb-8 custom-scrollbar px-4 -mx-4"
        >
          {products.map((product) => (
            <div key={product._id} className="snap-start min-w-[65vw] w-[75vw] sm:w-[45vw] shrink-0">
               <ProductCard product={product} priority={false} />
            </div>
          ))}
          <div className="w-4 shrink-0" aria-hidden="true" />
        </div>

      </div>
    </section>
  );
}