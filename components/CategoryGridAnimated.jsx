'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

// --- ANIMATION VARIANTS (Optimized for GPU) ---
const cardVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: (index) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      delay: index * 0.1, 
      ease: "easeOut"
    }
  })
};

// --- CARD COMPONENT ---
const CategoryCard = ({ category, index, priority = false }) => {
  return (
    <motion.div
      custom={index} // ✅ FIX: Added custom={index} so the delay stagger works properly
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10%" }} // Load slightly before it hits center
      className="w-full relative h-full"
    >
      <Link 
        href={`/category/${category.slug}`} 
        className="group relative block w-full h-full overflow-hidden bg-[#F9F6F0] aspect-[4/5] md:aspect-[3/4] rounded-sm"
      >
        {/* 1. IMAGE LAYER (Hardware Accelerated) */}
        <div className="relative w-full h-full bg-[#F5F2EA] overflow-hidden transform-gpu">
          {category.image ? (
            <Image 
              src={category.image} 
              alt={category.name} 
              fill 
              priority={priority} // ✅ FIX: Load top images instantly
              sizes="(max-width: 768px) 70vw, (max-width: 1200px) 33vw, 25vw"
              // ✅ FIX: Async decoding prevents UI freeze during scroll
              decoding="async"
              // ✅ FIX: Removed 'will-change-transform' to stop GPU memory leaks, replaced with 'transform-gpu'
              className="object-cover transition-transform duration-[1.2s] ease-out transform-gpu group-hover:scale-105 opacity-95 group-hover:opacity-100"
              quality={85} 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#F5F2EA]">
               <span className="font-heading text-2xl text-[#C5A059]/20 font-bold tracking-widest">KNM</span>
            </div>
          )}
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212]/90 via-[#121212]/20 to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-40" />
        </div>

        {/* 2. CONTENT LAYER */}
        <div className="absolute inset-0 p-5 md:p-8 flex flex-col justify-between z-10 pointer-events-none">
           {/* Desktop Icon */}
           <div className="flex justify-end w-full opacity-100 md:opacity-0 md:transform md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all duration-500">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-white/20 flex items-center justify-center bg-white/10 backdrop-blur-md group-hover:bg-[#C5A059] group-hover:border-[#C5A059] transition-colors duration-300">
                 <ArrowUpRight size={16} className="text-white group-hover:rotate-45 transition-transform duration-300" />
              </div>
           </div>

           {/* Title & Line */}
           <div className="transform transition-transform duration-500 ease-out md:translate-y-2 md:group-hover:translate-y-0">
              {/* ✅ FIX: Replaced expensive 'drop-shadow-lg' with hardware-accelerated 'text-shadow' */}
              <h3 className="font-heading font-normal text-xl md:text-2xl text-white uppercase tracking-wider leading-none mb-3 [text-shadow:_0_2px_4px_rgba(0,0,0,0.5)]">
                {category.name}
              </h3>
              {/* Gold Line Animation */}
              <div className="h-[2px] bg-[#C5A059] transition-all duration-500 ease-out w-8 md:w-0 md:group-hover:w-12" />
           </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default function CategoryGridAnimated({ categories }) {
  if (!categories || categories.length === 0) return null;

  return (
    <div className="w-full">
      
      {/* --- DESKTOP GRID (Standard) --- */}
      <div className="hidden md:grid grid-cols-4 gap-6">
        {categories.slice(0, 8).map((cat, index) => (
          <CategoryCard 
            key={cat._id} 
            category={cat} 
            index={index} 
            priority={index < 4} // ✅ Priority for top row
          />
        ))}
      </div>

      {/* --- MOBILE SCROLL SNAP (Zero Lag) --- */}
      {/* Replaced the JS auto-cycler with native CSS scroll snap for smooth performance */}
      <div className="md:hidden flex overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 pb-8 gap-4 [scroll-behavior:smooth]">
        {categories.map((cat, index) => (
          <div key={cat._id} className="snap-center shrink-0 w-[75vw]">
            <CategoryCard 
                category={cat} 
                index={index}
                priority={index < 2} // ✅ Priority for first 2 visible on mobile
            />
          </div>
        ))}
        {/* Spacer for end of scroll */}
        <div className="w-2 shrink-0"></div>
      </div>

    </div>
  );
}