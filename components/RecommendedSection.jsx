// RecommendedSection.jsx
//
// Two versions depending on your needs:
//
// Version A (default below) — uses getRecommendedProducts() which is STATIC-SAFE.
// Works on any page including statically rendered ones. Shows most-viewed products.
// No build warning. Use this if recommendations don't need to be per-user.
//
// Version B — uses getPersonalisedRecommendations() which reads cookies/session.
// Only use this if your page is already dynamic (force-dynamic or has other
// dynamic data), OR wrap it in Suspense as shown at the bottom of this file.

import { getRecommendedProducts } from '@/app/analytics-actions';
import ProductCard from '@/components/ProductCard';

export default async function RecommendedSection() {
  let products = [];

  try {
    products = await getRecommendedProducts();
  } catch (e) {
    console.error('[RecommendedSection] Failed to load recommendations:', e);
    return null;
  }

  if (!products?.length) return null;

  return (
    <section className="py-20 md:py-32 bg-[#F9F6F0] border-t border-[#C5A059]/10 font-body selection:bg-[#C5A059] selection:text-white">
      <div className="max-w-[1920px] mx-auto px-4 md:px-8">

        {/* HEADER */}
        <div className="text-center mb-12 md:mb-16 relative">
          <div className="absolute top-1/2 left-0 w-full h-px bg-[#C5A059]/20 -z-10 hidden md:block" />
          <div className="inline-block bg-[#F9F6F0] px-6 md:px-8 relative z-10">
            <span className="text-[#C5A059] font-bold uppercase tracking-[0.3em] text-[9px] md:text-[10px] block mb-2 md:mb-3">
              Just For You
            </span>
            <h2 className="font-heading font-normal text-3xl md:text-4xl lg:text-5xl text-[#121212] uppercase tracking-tight">
              Recommended
            </h2>
          </div>
        </div>

        {/* DESKTOP GRID */}
        <div className="hidden lg:grid grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-16">
          {products.map((product, index) => (
            <div key={product._id} className="w-full h-full">
              {/* FIX: was priority={true} for ALL cards — only first row needs priority */}
              <ProductCard product={product} priority={index < 5} />
            </div>
          ))}
        </div>

        {/* MOBILE HORIZONTAL SCROLL */}
        <div
          className="lg:hidden flex overflow-x-auto snap-x snap-mandatory gap-4 pb-8 px-4 -mx-4 transform-gpu"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {products.map((product, index) => (
            <div key={product._id} className="snap-start min-w-[65vw] w-[75vw] sm:w-[45vw] shrink-0">
              <ProductCard product={product} priority={index < 2} />
            </div>
          ))}
          <div className="w-4 shrink-0" aria-hidden="true" />
        </div>

      </div>
    </section>
  );
}


// ----------------------------------------------------------------------------
// IF YOU WANT PERSONALISED RECOMMENDATIONS:
// Replace the import above with getPersonalisedRecommendations,
// then in your page.jsx wrap the section in Suspense:
//
// import { Suspense } from 'react';
// import RecommendedSection from '@/components/RecommendedSection';
//
// export default async function HomePage() {
//   return (
//     <main>
//       {/* ...other static content... */}
//       <Suspense fallback={<RecommendedSkeleton />}>
//         <RecommendedSection />   ← this can now use cookies/session safely
//       </Suspense>
//     </main>
//   );
// }
//
// The Suspense boundary isolates the dynamic part — the rest of the page
// stays static/cached, only this section streams in dynamically.
// ----------------------------------------------------------------------------