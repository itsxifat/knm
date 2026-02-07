'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCategoryPageData } from '@/app/actions';
import Navbar from '@/components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, Search, Loader2, ChevronDown, ArrowRight } from 'lucide-react';
import ProductCard from '@/components/ProductCard'; 
import Link from 'next/link';

function useDebounceValue(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function CategoryPage({ params }) {
  const [data, setData] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true); 
  const [isFiltering, setIsFiltering] = useState(false);      
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const debouncedSearch = useDebounceValue(searchQuery, 400);
  
  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) setInitialLoading(true);
    else setIsFiltering(true);

    try {
        const resolvedParams = await params;
        const result = await getCategoryPageData(resolvedParams.slug, { 
          search: debouncedSearch, 
          minPrice: priceRange.min, 
          maxPrice: priceRange.max 
        });
        setData(result);
    } catch (error) {
        console.error("Fetch error:", error);
    } finally {
        setInitialLoading(false);
        setIsFiltering(false);
    }
  }, [params, debouncedSearch, priceRange.min, priceRange.max]);

  useEffect(() => { fetchData(data === null); }, [fetchData]);

  const handleFilterSubmit = (e) => { e.preventDefault(); fetchData(false); };

  if (initialLoading && !data) return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-6 font-body">
          <div className="w-16 h-16 border border-[#C5A059] border-t-transparent rounded-full animate-spin"></div>
          <p className="font-heading text-xs uppercase tracking-[0.3em] text-[#121212]">Curating Collection...</p>
      </div>
  );
  
  if (!data && !initialLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-[#121212] font-body">
        <h1 className="font-heading text-4xl mb-4">Collection Not Found</h1>
        <button onClick={() => window.location.reload()} className="text-xs font-bold uppercase tracking-widest border-b border-[#C5A059] pb-1 hover:text-[#C5A059] transition-colors">Reload Page</button>
    </div>
  );

  const totalItems = (data.mainProducts?.length || 0) + (data.sections?.reduce((acc, curr) => acc + (curr.count || 0), 0) || 0);

  return (
    <div className="min-h-screen bg-white font-body text-[#121212] selection:bg-[#C5A059] selection:text-white">
      {/* ✅ FIXED: Passing navData to Navbar */}
      <Navbar navData={data.navData} />

      {/* --- HERO --- */}
      <div className="pt-32 pb-12 px-6 text-center bg-white relative z-10">
        <span className="text-[#C5A059] text-[10px] font-bold uppercase tracking-[0.3em] block mb-4">The Collection</span>
        <h1 className="font-heading font-normal text-5xl md:text-7xl uppercase tracking-tight mb-6 text-[#121212]">
            {data.mainCategory?.name}
        </h1>
        <div className="flex items-center justify-center gap-6 opacity-80">
             <div className="w-12 h-[1px] bg-[#C5A059]/30"></div>
             <p className="text-[#8C8279] text-[10px] font-bold uppercase tracking-[0.25em]">{totalItems > 0 ? `${totalItems} Items Available` : 'Exclusive Selection'}</p>
             <div className="w-12 h-[1px] bg-[#C5A059]/30"></div>
        </div>
      </div>

      {/* --- FILTER BAR --- */}
      <div className="sticky top-20 z-40 bg-white/95 backdrop-blur-md border-y border-[#F0F0F0] shadow-sm">
        <div className="max-w-[1920px] mx-auto px-4 md:px-8 py-3">
             <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-[#8C8279] group-focus-within:text-[#C5A059] transition-colors" size={14} />
                    <input 
                      type="text" 
                      placeholder="Search Collection..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-6 pr-4 py-2 bg-transparent border-b border-[#E5E5E5] text-xs font-bold uppercase tracking-wide focus:border-[#C5A059] focus:outline-none placeholder:text-[#E5E5E5] transition-colors text-[#121212]"
                    />
                    {isFiltering && <div className="absolute right-0 top-1/2 -translate-y-1/2"><Loader2 size={14} className="animate-spin text-[#C5A059]" /></div>}
                </div>
                <button type="button" onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-3 px-6 py-2 border transition-all text-[10px] font-bold uppercase tracking-[0.2em] ${showFilters ? 'bg-[#121212] text-[#C5A059] border-[#121212]' : 'bg-transparent text-[#121212] border-[#E5E5E5] hover:border-[#C5A059] hover:text-[#C5A059]'}`}>
                  <SlidersHorizontal size={14} /> Filters <ChevronDown size={12} className={`transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`}/>
                </button>
             </div>
             <AnimatePresence>
                {showFilters && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                     <form onSubmit={handleFilterSubmit} className="pt-6 pb-2 flex items-center justify-center md:justify-end gap-4">
                        <span className="text-[10px] font-bold uppercase text-[#8C8279] tracking-widest">Price Range</span>
                        <div className="flex items-center gap-2">
                            <input placeholder="MIN" type="number" className="w-20 p-2 bg-[#F9F6F0] border border-transparent text-center text-xs font-bold focus:border-[#C5A059] outline-none text-[#121212]" value={priceRange.min} onChange={(e) => setPriceRange({...priceRange, min: e.target.value})} />
                            <span className="text-[#E5E5E5]">—</span>
                            <input placeholder="MAX" type="number" className="w-20 p-2 bg-[#F9F6F0] border border-transparent text-center text-xs font-bold focus:border-[#C5A059] outline-none text-[#121212]" value={priceRange.max} onChange={(e) => setPriceRange({...priceRange, max: e.target.value})} />
                        </div>
                        <button type="submit" className="bg-[#C5A059] text-white px-6 py-2 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#121212] transition-colors shadow-sm">Apply</button>
                     </form>
                  </motion.div>
                )}
             </AnimatePresence>
        </div>
      </div>

      {/* --- CONTENT --- */}
      <div className="relative min-h-[60vh] max-w-[1920px] mx-auto px-4 md:px-8 pb-32 pt-12">
          <AnimatePresence>
            {isFiltering && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 bg-white/80 backdrop-blur-[1px] flex items-start pt-32 justify-center">
                    <div className="flex items-center gap-3 bg-[#121212] text-[#C5A059] px-8 py-4 rounded-sm shadow-2xl">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Refining Selection...</span>
                    </div>
                </motion.div>
            )}
          </AnimatePresence>

          {data.mainProducts?.length > 0 && (
             <ProductGrid title="Featured Items" products={data.mainProducts} isMain={true} />
          )}

          {data.sections?.map((section) => (
             section && (section.products?.length > 0) && (
               <ProductGrid 
                 key={section._id || Math.random()} 
                 title={section.name} 
                 count={section.count} 
                 products={section.products} 
                 slug={section.slug} 
               />
             )
          ))}

          {(!data.sections || data.sections.every(s => !s.products || s.products.length === 0)) && (!data.mainProducts || data.mainProducts.length === 0) && (
             <div className="text-center py-32 border border-[#C5A059]/10 bg-[#F9F6F0]/30 m-4 rounded-sm">
                <p className="font-heading text-3xl text-[#121212] uppercase mb-4">No items found.</p>
                <button onClick={() => { setSearchQuery(''); setPriceRange({min:'', max:''}); }} className="px-8 py-3 bg-[#121212] text-[#C5A059] text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#C5A059] hover:text-white transition-colors">Clear All Filters</button>
             </div>
          )}
      </div>
    </div>
  );
}

function ProductGrid({ title, count, products, slug, isMain = false }) {
  return (
    <div className="mb-24 last:mb-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-[#E5E5E5] pb-4">
         <div className="flex items-baseline gap-4">
            <h2 className="text-2xl md:text-3xl font-heading font-normal uppercase tracking-wide text-[#121212] leading-none">{title}</h2>
            {count > 0 && <span className="text-[#8C8279] text-[10px] font-bold uppercase tracking-widest bg-[#F9F6F0] px-2 py-1 rounded-sm">({count})</span>}
         </div>
         {slug && (
           <Link href={`/category/${slug}`} className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#C5A059] hover:text-[#121212] transition-colors">
              View Entire Collection <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
           </Link>
         )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-12">
        {products.map((product) => (<ProductCard key={product._id} product={product} />))}
      </div>
    </div>
  );
}