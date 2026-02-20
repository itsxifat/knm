'use client';

import React, { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, X, Check, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCart } from '@/lib/context/CartContext';

// --- OPTIMIZATION: Extract Formatter ---
const priceFormatter = new Intl.NumberFormat('en-BD', {
  style: 'decimal',
  minimumFractionDigits: 0,
});

// --- CUSTOM TAKA ICON ---
const Taka = ({ size = 14, className = "", weight = "bold" }) => (
  <svg 
    width={size} height={size+2} viewBox="0 0 24 24" fill="none" 
    xmlns="http://www.w3.org/2000/svg" className={`inline-block ${className}`}
    style={{ verticalAlign: 'middle', transform: 'translateY(-1px)' }} 
  >
    <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fontSize="22" fontWeight={weight === 'bold' ? 'bold' : 'normal'} fill="currentColor" style={{ fontFamily: "'Bodoni Moda', serif" }}>৳</text>
  </svg>
);

// --- AGGRESSIVE SAFE TAG EXTRACTOR ---
const getValidTagName = (t) => {
  if (!t) return null;
  // If it's a populated object (checks name, label, or title)
  if (typeof t === 'object') {
      const name = t.name || t.label || t.title;
      if (name) return { name, color: t.color || '#C5A059' };
  }
  // If it's a raw text string AND NOT a 24-character MongoDB ID
  if (typeof t === 'string' && !/^[a-f\d]{24}$/i.test(t)) {
      return { name: t, color: '#C5A059' };
  }
  return null;
};

export default function ProductCard({ product, priority = false }) {
  const [showSizes, setShowSizes] = useState(false);
  const [status, setStatus] = useState('idle'); 
  const { addToCart } = useCart(); 

  // --- MEMOIZED LOGIC ---
  const { isSaleActive, currentPrice, originalPrice, tagData } = useMemo(() => {
      if (!product) return {};
      
      const now = new Date();
      const saleActive = product.discountPrice && 
        product.discountPrice < product.price &&
        (!product.saleStartDate || new Date(product.saleStartDate) <= now) &&
        (!product.saleEndDate || new Date(product.saleEndDate) >= now);

      let calculatedTag = null;

      // 1. Check array: product.tags
      if (product.tags && product.tags.length > 0) {
          calculatedTag = getValidTagName(product.tags[0]);
      }
      
      // 2. Check singular: product.tag (Fallback)
      if (!calculatedTag && product.tag) {
          calculatedTag = getValidTagName(product.tag);
      }

      // 3. Fallback to SALE
      if (!calculatedTag && saleActive) {
          calculatedTag = { name: "SALE", color: '#C5A059' };
      }
      
      // 4. Fallback to NEW (Last 30 Days)
      if (!calculatedTag && product.createdAt && new Date(product.createdAt) > new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)) {
          calculatedTag = { name: "NEW", color: '#C5A059' };
      }

      return {
          isSaleActive: saleActive,
          currentPrice: saleActive ? product.discountPrice : product.price,
          originalPrice: saleActive ? product.price : null,
          tagData: calculatedTag
      };
  }, [product]);

  if (!product) return null;
  const format = (num) => priceFormatter.format(num || 0);

  // --- ADD TO CART HANDLER ---
  const handleAddToCart = useCallback((selectedVariant = null) => {
    try {
        const stockToCheck = selectedVariant ? selectedVariant.stock : product.stock;
        if (stockToCheck <= 0) {
            setStatus('error');
            setTimeout(() => setStatus('idle'), 2000);
            return;
        }
        const sizeToAdd = selectedVariant ? selectedVariant.size : null;
        addToCart(product, 1, sizeToAdd);
        setStatus('success');
        setTimeout(() => {
            setStatus('idle');
            setShowSizes(false);
        }, 1500);
    } catch (error) {
        console.error("Add to cart failed:", error);
        setStatus('error');
    }
  }, [product, addToCart]);

  const handleCartClick = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (product.variants && product.variants.length > 0) setShowSizes(!showSizes);
    else handleAddToCart(null); 
  };

  const handleSizeSelect = (e, variant) => {
    e.preventDefault(); e.stopPropagation();
    handleAddToCart(variant);
  };

  return (
    <div className="product-card group block w-full h-full relative">
        <Link href={`/product/${product.slug}`} className="block w-full h-full" prefetch={false}>
        
        {/* IMAGE CONTAINER */}
        <div className="relative w-full aspect-3/4 overflow-hidden bg-[#F9F6F0] mb-4 transform-gpu border border-transparent group-hover:border-[#C5A059]/20 transition-colors duration-500">
            <Image 
                src={product.images?.[0] || '/placeholder.jpg'} alt={product.name} fill priority={priority}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-[1.5s] ease-out transform-gpu group-hover:scale-105"
                decoding="async" quality={90}
            />
            <div className={`absolute inset-0 bg-black/0 transition-colors duration-500 pointer-events-none ${showSizes ? 'bg-black/20' : 'group-hover:bg-black/5'}`}></div>

            {/* TAG */}
            {tagData && (
                <div className="absolute top-0 left-0 p-3 z-10 pointer-events-none">
                    <span 
                        className="backdrop-blur-md px-3 py-1.5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest shadow-sm"
                        style={{
                           backgroundColor: tagData.name === 'SALE' ? '#C5A059' : 'rgba(255,255,255,0.95)',
                           color: tagData.name === 'SALE' ? 'white' : (tagData.color || '#C5A059')
                        }}
                    >
                        {tagData.name}
                    </span>
                </div>
            )}

            {/* --- SIZE SELECTOR OVERLAY --- */}
            <AnimatePresence>
                {showSizes && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="absolute inset-x-0 bottom-0 p-4 bg-white/95 backdrop-blur-xl border-t border-[#C5A059]/20 z-30 flex flex-col items-center gap-3 cursor-default"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} 
                    >
                          <div className="flex justify-between items-center w-full mb-1">
                             <span className="text-[10px] font-bold uppercase text-[#57534E] tracking-widest">Select Size</span>
                             <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowSizes(false); }} className="text-[#8C8279] hover:text-[#C5A059]">
                                 <X size={14} />
                             </button>
                          </div>
                          
                          {status === 'success' ? (
                             <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full py-2 bg-green-50 text-green-700 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 rounded-sm border border-green-200">
                                <Check size={14} /> Added
                             </motion.div>
                          ) : status === 'error' ? (
                             <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full py-2 bg-red-50 text-red-700 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 rounded-sm border border-red-200">
                                <AlertCircle size={14} /> No Stock
                             </motion.div>
                          ) : (
                             <div className="flex flex-wrap gap-2 justify-center w-full">
                                 {product.variants?.map((variant) => (
                                     <button
                                         key={`${variant.size}-${variant._id || 'v'}`} 
                                         onClick={(e) => handleSizeSelect(e, variant)} disabled={variant.stock <= 0}
                                         className={`h-8 min-w-9 px-2 text-[10px] font-bold border transition-all duration-300 ${variant.stock > 0 ? 'border-gray-200 hover:border-[#C5A059] hover:bg-[#C5A059] hover:text-white text-[#121212]' : 'border-gray-100 text-gray-300 cursor-not-allowed line-through bg-gray-50'}`}
                                     >
                                          {variant.size}
                                     </button>
                                 ))}
                             </div>
                          )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- QUICK ADD BUTTON --- */}
            {!showSizes && (
                <div className="absolute bottom-4 right-4 z-20 md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all duration-500 ease-out">
                    <button 
                        onClick={handleCartClick} disabled={product.stock <= 0 && (!product.variants || product.variants.length === 0)}
                        className={`bg-white text-[#121212] w-10 h-10 flex items-center justify-center hover:bg-[#C5A059] hover:text-white transition-colors shadow-xl border border-gray-100 ${status === 'success' ? 'bg-green-600! text-white! border-green-600!' : ''}`}
                        aria-label="Add to Cart"
                    >
                         {status === 'success' ? <Check size={16} /> : <ShoppingBag size={16} strokeWidth={1.5} />}
                    </button>
                </div>
            )}
        </div>

        {/* INFO */}
        <div className="px-1 flex flex-col gap-1.5">
            <h3 className="font-heading font-normal text-sm text-[#121212] truncate group-hover:text-[#C5A059] transition-colors tracking-wide">
                {product.name}
            </h3>

            <div className="flex items-end justify-between min-h-9">
                <p className="text-[10px] font-medium text-[#8C8279] uppercase tracking-widest truncate max-w-[55%] mb-1">
                    {product.category?.name || "Collection"}
                </p>
                
                <div className="flex flex-col items-end leading-none">
                    {isSaleActive && (
                        <div className="flex items-center gap-px text-[10px] text-[#8C8279] line-through decoration-[#8C8279] mb-1">
                            <Taka size={9} weight="normal" className="text-[#8C8279]" />
                            <span>{format(originalPrice)}</span>
                        </div>
                    )}
                    <div className={`flex items-center gap-0.5 font-heading font-bold ${isSaleActive ? 'text-[#C5A059] text-sm' : 'text-[#121212] text-sm'}`}>
                        <Taka size={14} weight="bold" />
                        <span>{format(currentPrice)}</span>
                    </div>
                </div>
            </div>
        </div>
        </Link>
    </div>
  );
}