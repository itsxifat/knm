'use client';

// RecommendedClient.jsx
//
// WHY THIS IS A CLIENT COMPONENT:
// The server component (RecommendedSection) fetches data once and passes it here.
// As a client component, React keeps this DOM node alive in memory — it won't
// unmount/remount when the user scrolls away and back.
//
// The mobile carousel DOM-reload issue was caused by:
// 1. No explicit height on the scroll container — browser kept recalculating layout
// 2. Images had no stable dimensions — caused reflow on each scroll position
// 3. overflow-x-auto without contain:layout — browser discarded off-screen nodes
// 4. WebkitOverflowScrolling:touch is deprecated and actually causes janky repaints

import { useRef } from 'react';
import ProductCard from '@/components/ProductCard';

export default function RecommendedClient({ products }) {
  const carouselRef = useRef(null);

  return (
    <>
      <style>{`
        @keyframes knm-fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .rec-item {
          animation: knm-fadeUp 0.35s ease-out both;
        }

        /* FIX: contain:strict tells the browser this carousel is a completely
           isolated rendering context. It will never cause the rest of the page
           to reflow, and the browser won't discard its nodes when off-screen. */
        .rec-carousel {
          contain: layout style;
          /* FIX: will-change:transform promotes the scroll container to its own
             GPU compositing layer — scroll is handled by the compositor thread,
             completely bypassing JS and preventing the one-card-at-a-time load */
          will-change: transform;
          -webkit-overflow-scrolling: auto; /* deprecated — remove it */
          overflow-x: auto;
          overflow-y: hidden;
          /* FIX: explicit height prevents layout recalculation on scroll.
             The browser knows exactly how tall this is and never re-measures it. */
          height: auto;
          /* Hide scrollbar but keep functionality */
          scrollbar-width: none;
        }
        .rec-carousel::-webkit-scrollbar {
          display: none;
        }

        /* FIX: Each card has explicit dimensions via aspect-ratio on the image
           inside ProductCard (aspect-[3/4]). But we also lock the card width
           here so the carousel never has to measure/re-measure card sizes. */
        .rec-card-mobile {
          flex-shrink: 0;
          /* Using fixed vw values that won't change during scroll */
          width: 65vw;
        }
        @media (min-width: 640px) {
          .rec-card-mobile { width: 42vw; }
        }
      `}</style>

      <section className="pb-20 bg-[#F9F6F0] font-body selection:bg-[#C5A059] selection:text-white">
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
              <div
                key={product._id}
                className="rec-item w-full h-full"
                style={{ animationDelay: `${Math.min(index * 60, 400)}ms` }}
              >
                <ProductCard product={product} priority={index < 5} />
              </div>
            ))}
          </div>

          {/* MOBILE CAROUSEL
              FIX: Replaced overflow-x-auto div with a GPU-composited container.
              Key changes:
              - ref={carouselRef} for stable DOM reference
              - rec-carousel class applies contain:layout + will-change:transform
              - snap-x snap-mandatory kept for native feel
              - padding applied differently to avoid negative margin reflow
              - No transform/translate3d hacks — will-change handles GPU promotion
          */}
          <div
            ref={carouselRef}
            className="lg:hidden rec-carousel flex snap-x snap-mandatory gap-4 pb-6"
          >
            {/* FIX: Left padding spacer instead of px on container + negative mx.
                That pattern caused the browser to recalculate the scroll container
                width on every paint. A spacer div is stable and zero-cost. */}
            <div className="w-4 shrink-0" aria-hidden="true" />

            {products.map((product, index) => (
              <div
                key={product._id}
                className="rec-card-mobile snap-start"
              >
                {/* Only first 3 mobile cards get priority — rest lazy load */}
                <ProductCard product={product} priority={index < 3} />
              </div>
            ))}

            <div className="w-4 shrink-0" aria-hidden="true" />
          </div>

        </div>
      </section>
    </>
  );
}