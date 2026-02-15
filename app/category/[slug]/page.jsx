'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCategoryPageData } from '@/actions/products';
import { getNavbarConfig } from '@/actions/content';
import Navbar from '@/components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, Loader2, ChevronDown, ArrowRight, X, Minus } from 'lucide-react';
import ProductCard from '@/components/ProductCard'; 
import Link from 'next/link';

export default function CategoryPage({ params }) {
  // Data States
  const [data, setData] = useState(null);
  const [navData, setNavData] = useState(null);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter Inputs (Search Removed)
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  // --- FETCH DATA ---
  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setIsFiltering(true);

    try {
        const resolvedParams = await params;
        const slug = resolvedParams.slug;

        const [categoryResult, navbarResult] = await Promise.all([
            getCategoryPageData(slug, { 
                minPrice: priceRange.min, 
                maxPrice: priceRange.max 
            }),
            isInitial ? getNavbarConfig() : Promise.resolve(null)
        ]);

        setData(categoryResult);
        if (navbarResult) setNavData(navbarResult);
        
    } catch (error) {
        console.error("Fetch error:", error);
    } finally {
        setLoading(false);
        setIsFiltering(false);
    }
  }, [params, priceRange.min, priceRange.max]);

  // Initial Load
  useEffect(() => {
    fetchData(true);
  }, []);

  // Handle Filter Submit
  const handleFilterSubmit = (e) => { 
    e.preventDefault(); 
    fetchData(false);
  };

  // --- LOADING STATE (Premium) ---
  if (loading) return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf9f6] gap-6 font-body">
          <div className="relative">
            <div className="w-20 h-20 border-[1px] border-[#C5A059]/20 rounded-full animate-ping absolute inset-0"></div>
            <div className="w-20 h-20 border-[1px] border-t-[#C5A059] border-r-[#C5A059] border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          </div>
          <p className="font-heading text-[10px] uppercase tracking-[0.4em] text-[#121212] animate-pulse">Curating Collection</p>
      </div>
  );
  
  // --- ERROR STATE ---
  if (!data || !data.mainCategory) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-[#121212] font-body">
        <h1 className="font-heading text-4xl mb-4">Collection Not Found</h1>
        <Link href="/" className="text-xs font-bold uppercase tracking-widest border-b border-[#C5A059] pb-1 hover:text-[#C5A059] transition-colors">Return Home</Link>
    </div>
  );

  const totalItems = (data.mainProducts?.length || 0) + (data.sections?.reduce((acc, curr) => acc + (curr.products?.length || 0), 0) || 0);

  return (
    <div className="min-h-screen bg-white font-body text-[#121212] selection:bg-[#C5A059] selection:text-white">
      <Navbar navData={navData} />

      {/* --- HERO HEADER --- */}
      <div className="pt-10 pb-5 px-6 text-center bg-white relative z-10">
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, ease: "easeOut" }}
        >
            <span className="text-[#C5A059] text-[10px] font-bold uppercase tracking-[0.3em] block mb-4">The Collection</span>
            <h1 className="font-heading font-normal text-5xl md:text-7xl uppercase tracking-tight mb-4 text-[#121212]">
                {data.mainCategory.name}
            </h1>
            <div className="flex items-center justify-center gap-4 opacity-60">
                <div className="w-8 h-[1px] bg-[#121212]/20"></div>
                <p className="text-[#121212] text-[10px] font-bold uppercase tracking-[0.25em]">
                    {totalItems} Items
                </p>
                <div className="w-8 h-[1px] bg-[#121212]/20"></div>
            </div>
        </motion.div>
      </div>

      {/* --- STICKY FILTER BAR (Redesigned) --- */}
      <div className="z-40 bg-white/90 backdrop-blur-md border-b border-[#F0F0F0] transition-all duration-300">
        <div className="max-w-480 mx-auto">
             
             {/* Toggle Bar */}
             <div className="flex justify-center items-center py-4 relative">
                <button 
                  onClick={() => setShowFilters(!showFilters)} 
                  className={`group flex items-center gap-3 px-8 py-2 border transition-all duration-500 text-[10px] font-bold uppercase tracking-[0.2em] ${showFilters ? 'bg-[#121212] text-[#C5A059] border-[#121212]' : 'bg-transparent text-[#121212] border-[#E5E5E5] hover:border-[#C5A059]'}`}
                >
                   <SlidersHorizontal size={14} className={showFilters ? "text-[#C5A059]" : "text-[#8C8279] group-hover:text-[#C5A059] transition-colors"} /> 
                   Filter Selection
                   <ChevronDown size={12} className={`transition-transform duration-500 ${showFilters ? 'rotate-180 text-[#C5A059]' : 'text-[#8C8279] group-hover:text-[#C5A059]'}`}/>
                </button>

                {/* Loading Indicator (Absolute) */}
                {isFiltering && (
                    <div className="absolute right-8 flex items-center gap-2 text-[#C5A059] text-[10px] uppercase font-bold tracking-widest animate-in fade-in">
                        <Loader2 size={12} className="animate-spin"/> Updating
                    </div>
                )}
             </div>

             {/* Expanded Filter Panel */}
             <AnimatePresence>
                {showFilters && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: 'auto', opacity: 1 }} 
                    exit={{ height: 0, opacity: 0 }} 
                    className="overflow-hidden bg-[#faf9f6] border-t border-[#F0F0F0]"
                  >
                     <form onSubmit={handleFilterSubmit} className="max-w-4xl mx-auto py-8 px-6 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
                        
                        <div className="flex flex-col items-center gap-4 w-full md:w-auto">
                            <span className="text-[10px] font-bold uppercase text-[#8C8279] tracking-[0.2em]">Price Range (BDT)</span>
                            <div className="flex items-center gap-4">
                                {/* Min Input - No Arrows */}
                                <div className="relative group">
                                    <input 
                                        type="number" 
                                        placeholder="0" 
                                        className="w-32 bg-white border-b border-[#E5E5E5] py-3 text-center text-sm font-medium focus:border-[#C5A059] outline-none text-[#121212] placeholder:text-[#E5E5E5] transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                        value={priceRange.min} 
                                        onChange={(e) => setPriceRange({...priceRange, min: e.target.value})} 
                                    />
                                    <span className="absolute -bottom-5 left-0 w-full text-center text-[9px] text-[#C5A059] opacity-0 group-focus-within:opacity-100 transition-opacity uppercase font-bold tracking-widest">Min</span>
                                </div>

                                <Minus size={12} className="text-[#E5E5E5]" />

                                {/* Max Input - No Arrows */}
                                <div className="relative group">
                                    <input 
                                        type="number" 
                                        placeholder="Any" 
                                        className="w-32 bg-white border-b border-[#E5E5E5] py-3 text-center text-sm font-medium focus:border-[#C5A059] outline-none text-[#121212] placeholder:text-[#E5E5E5] transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                        value={priceRange.max} 
                                        onChange={(e) => setPriceRange({...priceRange, max: e.target.value})} 
                                    />
                                    <span className="absolute -bottom-5 left-0 w-full text-center text-[9px] text-[#C5A059] opacity-0 group-focus-within:opacity-100 transition-opacity uppercase font-bold tracking-widest">Max</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                             <button 
                                type="button" 
                                onClick={() => { setPriceRange({min:'', max:''}); fetchData(false); }}
                                className="px-6 py-3 border border-[#E5E5E5] text-[#8C8279] text-[10px] font-bold uppercase tracking-[0.2em] hover:text-[#121212] hover:border-[#121212] transition-colors"
                             >
                                Reset
                             </button>
                             <button 
                                type="submit" 
                                className="bg-[#121212] text-[#C5A059] px-8 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#C5A059] hover:text-white transition-all shadow-lg shadow-[#C5A059]/10"
                             >
                                View Results
                             </button>
                        </div>

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
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] transition-all" 
                />
            )}
          </AnimatePresence>

          {/* 1. Main Category Products */}
          {data.mainProducts?.length > 0 && (
             <ProductGrid title="Featured Items" products={data.mainProducts} />
          )}

          {/* 2. Sub-Category Sections */}
          {data.sections?.map((section) => (
             section && section.products?.length > 0 && (
               <ProductGrid 
                 key={section._id} 
                 title={section.name} 
                 products={section.products} 
                 slug={section.slug} 
               />
             )
          ))}

          {/* Empty State */}
          {(!data.sections?.some(s => s.products?.length > 0)) && (!data.mainProducts?.length) && (
             <div className="flex flex-col items-center justify-center py-32 m-4 rounded-sm border border-dashed border-[#E5E5E5]">
                <p className="font-heading text-3xl text-[#121212] uppercase mb-2">No items found</p>
                <p className="text-[#8C8279] text-sm mb-8 font-light">Try adjusting your price range</p>
                <button 
                    onClick={() => { setPriceRange({min:'', max:''}); fetchData(false); }} 
                    className="flex items-center gap-2 border-b border-[#C5A059] pb-1 text-[#C5A059] text-[10px] font-bold uppercase tracking-[0.2em] hover:text-[#121212] hover:border-[#121212] transition-all"
                >
                    <X size={12}/> Clear Filters
                </button>
             </div>
          )}
      </div>
    </div>
  );
}

// --- REUSABLE PRODUCT GRID COMPONENT ---
function ProductGrid({ title, products, slug }) {
  return (
    <div className="mb-24 last:mb-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-[#E5E5E5] pb-4">
         <div className="flex items-baseline gap-4">
            <h2 className="text-3xl font-heading font-normal uppercase tracking-wide text-[#121212] leading-none">{title}</h2>
            <span className="text-[#8C8279] text-[10px] font-bold uppercase tracking-widest bg-[#F9F6F0] px-3 py-1 rounded-full">
                {products.length} {products.length === 1 ? 'Item' : 'Items'}
            </span>
         </div>
         
         {slug && (
           <Link href={`/category/${slug}`} className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#C5A059] hover:text-[#121212] transition-colors">
              View Collection <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
           </Link>
         )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-12">
        {products.map((product) => (<ProductCard key={product._id} product={product} />))}
      </div>
    </div>
  );
}