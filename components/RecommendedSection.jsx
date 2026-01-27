'use client';

import { useEffect, useState } from 'react';
import { getRecommendedProducts } from '@/app/analytics-actions';
import ProductCard from '@/components/ProductCard'; 

export default function RecommendedSection() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInfo() {
      try {
        if (typeof getRecommendedProducts === 'function') {
           const data = await getRecommendedProducts();
           setProducts(data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchInfo();
  }, []);

  if (loading || products.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-white font-body border-t border-neutral-100">
      <div className="max-w-[1920px] mx-auto px-4 md:px-6">
        
        {/* --- HEADER --- */}
        <div className="text-center mb-12 md:mb-20">
          <span className="text-[#C5A059] font-bold uppercase tracking-[0.25em] text-[10px] md:text-xs">
              Curated For You
          </span>
          <h2 className="font-heading font-normal text-4xl md:text-5xl text-[#121212] mt-4 uppercase tracking-tight leading-tight">
              Recommended
          </h2>
          <div className="w-12 h-[2px] bg-[#C5A059] mx-auto mt-6" />
        </div>

        {/* --- DESKTOP GRID --- */}
        <div className="hidden lg:grid grid-cols-5 gap-x-6 gap-y-12">
          {products.map((product) => (
             <ProductCard key={product._id} product={product} />
          ))}
        </div>

        {/* --- MOBILE/TABLET SCROLL --- */}
        <div className="lg:hidden -mx-4 px-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
           <div className="flex gap-4 pb-8">
             {products.map((product) => (
               <div key={product._id} className="snap-center min-w-[200px] w-[65vw] md:w-[45vw] flex-shrink-0">
                  <ProductCard product={product} />
               </div>
             ))}
             {/* Spacer */}
             <div className="w-2 flex-shrink-0" />
           </div>
        </div>

      </div>
    </section>
  );
}