'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- ANIMATION VARIANTS ---
const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: (index) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6, // Slower for elegance
      delay: index * 0.05, 
      ease: "easeOut"
    }
  }),
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.4 } }
};

// --- CARD COMPONENT ---
const CategoryCard = ({ category }) => {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      exit="exit"
      className="w-full relative"
    >
      <Link 
        href={`/category/${category.slug}`} 
        className="group relative block w-full overflow-hidden bg-[#F9F6F0] aspect-[4/5]"
      >
        {/* 1. IMAGE LAYER */}
        <div className="relative w-full h-full bg-[#F5F2EA]">
          {category.image ? (
            <Image 
              src={category.image} 
              alt={category.name} 
              fill 
              className="object-cover transition-transform duration-[1.5s] ease-out will-change-transform group-hover:scale-105 opacity-95 group-hover:opacity-100"
              sizes="(max-width: 768px) 50vw, 20vw"
              loading="lazy"
              quality={85} // Higher quality for premium feel
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#F5F2EA]">
               <span className="font-heading text-2xl text-[#C5A059]/20 font-bold tracking-widest">KNM</span>
            </div>
          )}
          {/* Subtle Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212]/80 via-transparent to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-40" />
        </div>

        {/* 2. CONTENT LAYER */}
        <div className="absolute inset-0 p-5 md:p-8 flex flex-col justify-between z-10 pointer-events-none">
           {/* Desktop Icon */}
           <div className="flex justify-end w-full opacity-0 md:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-500">
              <div className="hidden md:flex w-10 h-10 rounded-full border border-white/20 items-center justify-center bg-white/10 backdrop-blur-md group-hover:bg-[#C5A059] group-hover:border-[#C5A059] transition-all duration-300">
                 <ArrowUpRight size={18} className="text-white group-hover:rotate-45 transition-transform duration-300" />
              </div>
           </div>

           {/* Title & Line */}
           <div className="transform md:translate-y-4 md:group-hover:translate-y-0 transition-transform duration-500 ease-out">
              <h3 className="font-heading font-normal text-xl md:text-2xl text-white uppercase tracking-wider leading-tight mb-3 drop-shadow-md">
                {category.name}
              </h3>
              {/* Gold Line */}
              <div className="h-[2px] bg-[#C5A059] transition-all duration-500 ease-out w-6 md:w-0 md:group-hover:w-12" />
           </div>
        </div>

        {/* 3. BORDER HIGHLIGHT */}
        <div className="absolute inset-0 border border-transparent md:group-hover:border-[#C5A059]/30 transition-colors duration-500 pointer-events-none" />
      </Link>
    </motion.div>
  );
};

export default function CategoryGridAnimated({ categories }) {
  const [startIndex, setStartIndex] = useState(0);
  const MOBILE_LIMIT = 4;
  
  const shouldCycle = categories && categories.length > MOBILE_LIMIT;

  // --- MOBILE AUTO-CYCLE LOGIC ---
  useEffect(() => {
    if (!shouldCycle) return;

    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;

    const interval = setInterval(() => {
      setStartIndex((prev) => {
        const nextIndex = prev + MOBILE_LIMIT;
        if (nextIndex >= categories.length) {
          return 0; 
        }
        return nextIndex;
      });
    }, 5000); // Slower cycle for elegance

    return () => clearInterval(interval);
  }, [shouldCycle, categories.length]);

  if (!categories || categories.length === 0) return null;

  const getMobileItems = () => {
    if (!shouldCycle) {
      return categories;
    }
    return categories.slice(startIndex, startIndex + MOBILE_LIMIT);
  };

  const mobileItems = getMobileItems();

  return (
    <div className="w-full">
      
      {/* --- DESKTOP GRID --- */}
      <div className="hidden md:grid grid-cols-4 gap-6">
        {categories.slice(0, 8).map((cat, index) => (
          <CategoryCard key={cat._id} category={cat} index={index} />
        ))}
      </div>

      {/* --- MOBILE GRID --- */}
      <div className={`grid md:hidden grid-cols-2 gap-3 items-start ${shouldCycle ? 'min-h-[420px]' : ''}`}> 
        <AnimatePresence mode="wait">
          <motion.div
             key={shouldCycle ? startIndex : 'static'}
             className="col-span-2 grid grid-cols-2 gap-3"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             transition={{ duration: 0.6 }}
          >
            {mobileItems.map((cat, index) => (
              <CategoryCard 
                key={cat._id}
                category={cat} 
                index={index} 
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mobile Progress Indicators */}
      {shouldCycle && (
        <div className="flex md:hidden justify-center gap-3 mt-8">
           {Array.from({ length: Math.ceil(categories.length / MOBILE_LIMIT) }).map((_, i) => (
              <div 
                key={i}
                className={`h-[2px] transition-all duration-700 ${
                  Math.floor(startIndex / MOBILE_LIMIT) === i ? 'w-8 bg-[#C5A059]' : 'w-4 bg-[#E5E5E5]'
                }`}
              />
           ))}
        </div>
      )}

    </div>
  );
}