'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard'; 
import { ArrowRight, Play } from 'lucide-react';
import { motion, useInView } from 'framer-motion';

// --- ANIMATION CONFIGURATION ---
const fadeUp = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const revealImage = {
  hidden: { scale: 1.1, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { duration: 1.4, ease: "easeOut" } }
};

export default function SectionRenderer({ sections }) {
  if (!sections || sections.length === 0) return null;

  return (
    <div className="w-full flex flex-col bg-white gap-24 md:gap-32 pb-24">
      {sections.map((section, index) => {
         if (section.type === 'video') {
             return <VideoSection key={section._id} section={section} />;
         }
         return <ImageSection key={section._id} section={section} index={index} />;
      })}
    </div>
  );
}

// ============================================================================
// TEMPLATE A: IMAGE SPLIT LAYOUT (Banner Left | Grid Right)
// ============================================================================
function ImageSection({ section, index }) {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-10%" });
  const isPriority = index === 0;

  const topRowProducts = section.products.slice(0, 3);
  const bottomRowProducts = section.products.slice(3, 6);

  return (
    <div ref={containerRef} className="w-full">
      
      {/* 1. HEADER */}
      <motion.div 
        variants={fadeUp}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        className="container mx-auto px-4 mb-12 text-center"
      >
          <span className="text-[#C5A059] text-[10px] font-bold uppercase tracking-[0.3em] block mb-4">
            {section.subHeading || 'Collection'}
          </span>
          <h2 className="font-heading text-4xl md:text-6xl text-[#121212] uppercase tracking-tighter">
            {section.heading}
          </h2>
      </motion.div>

      {/* 2. SPLIT LAYOUT */}
      <div className="w-full flex flex-col lg:flex-row  lg:min-h-[85vh]">
        
        {/* LEFT: BANNER */}
        <div className="w-full lg:w-1/2 h-[50vh] lg:h-auto relative bg-[#F4F4F4] group overflow-hidden border-b lg:border-b-0 lg:border-r border-[#F0F0F0]">
           <Link href={section.link || '/category'} className="block w-full h-full relative cursor-pointer">
              <motion.div className="w-full h-full" variants={revealImage} initial="hidden" animate={isInView ? "visible" : "hidden"}>
                <Image 
                    src={section.mediaUrl} 
                    alt={section.heading}
                    fill
                    priority={isPriority}
                    className="object-cover transform scale-100 group-hover:scale-105 transition-transform duration-[2s] ease-out"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </motion.div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-700" />
           </Link>
        </div>

        {/* RIGHT: GRID */}
        <div className="w-full lg:w-1/2 flex flex-col bg-white">
           
           {/* TOP GRID */}
           <motion.div 
             variants={staggerContainer}
             initial="hidden"
             animate={isInView ? "visible" : "hidden"}
             className="flex-1 w-full px-4 lg:px-8 py-8 lg:py-12 flex items-end justify-center"
           >
              <div className="w-full grid grid-cols-3 gap-3 lg:gap-6 max-w-[800px]">
                  {topRowProducts.map((product) => (
                      <motion.div key={product._id} variants={fadeUp} className="w-full">
                          <ProductCard product={product} />
                      </motion.div>
                  ))}
                  {/* Fillers */}
                  {[...Array(Math.max(0, 3 - topRowProducts.length))].map((_, i) => (
                      <div key={`empty-t-${i}`} className="hidden lg:block w-full bg-gray-50/20 aspect-[3/4]" />
                  ))}
              </div>
           </motion.div>

           {/* MIDDLE BUTTON */}
           <div className="shrink-0 py-8 flex items-center justify-center border-y border-dashed border-[#F0F0F0] lg:border-none z-10 bg-white">
               <Link 
                  href={section.link || '/category'} 
                  className="group relative inline-flex items-center gap-3 px-10 py-4 overflow-hidden bg-white border border-[#121212] hover:bg-[#121212] transition-colors duration-500"
               >
                   <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#121212] group-hover:text-white transition-colors">
                      View Collection
                   </span>
                   <ArrowRight size={14} className="text-[#121212] group-hover:text-white -ml-1 transition-all group-hover:translate-x-1"/>
               </Link>
           </div>

           {/* BOTTOM GRID */}
           <motion.div 
             variants={staggerContainer}
             initial="hidden"
             animate={isInView ? "visible" : "hidden"}
             className="flex-1 w-full px-4 lg:px-8 py-8 lg:py-12 flex items-start justify-center"
           >
              <div className="w-full grid grid-cols-3 gap-3 lg:gap-6 max-w-[800px]">
                  {bottomRowProducts.map((product) => (
                      <motion.div key={product._id} variants={fadeUp} className="w-full">
                          <ProductCard product={product} />
                      </motion.div>
                  ))}
                  {[...Array(Math.max(0, 3 - bottomRowProducts.length))].map((_, i) => (
                      <div key={`empty-b-${i}`} className="hidden lg:block w-full bg-gray-50/20 aspect-[3/4]" />
                  ))}
              </div>
           </motion.div>

        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TEMPLATE B: VIDEO CINEMATIC LAYOUT
// ============================================================================
function VideoSection({ section }) {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-10%" });
  
  // Display 4 items
  const products = section.products.slice(0, 4); 

  return (
    <div ref={containerRef} className="w-full">
      
      {/* 1. FULL WIDTH VIDEO (Top) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.98 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="w-full max-w-[1920px] mx-auto mb-16"
      >
        <div className="relative w-full aspect-video bg-black group overflow-hidden">
            <Link href={section.link || '/category'} className="block w-full h-full">
               <video 
                  src={section.mediaUrl} 
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-700"
                  autoPlay muted loop playsInline
               />
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   {/* Play button removed as requested previously, or keep invisible/minimal */}
               </div>
            </Link>
        </div>
      </motion.div>

      {/* 2. HEADER (Middle) */}
      <motion.div 
          variants={fadeUp}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="container mx-auto px-4 mb-12 text-center"
       >
          <span className="text-[#C5A059] text-[10px] font-bold uppercase tracking-[0.3em] block mb-3">
            {section.subHeading || 'Featured Campaign'}
          </span>
          <h2 className="font-heading text-4xl md:text-6xl text-[#121212] uppercase tracking-tighter">
            {section.heading}
          </h2>
      </motion.div>

      {/* 3. PRODUCT ROW + BUTTON (Bottom) */}
      {/* ✅ FIX: Changed to flex-col. The button is now a flex item that sits naturally below the grid. */}
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        className="container mx-auto px-4 flex flex-col gap-16"
      >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {products.map((product) => (
                  <motion.div key={product._id} variants={fadeUp} className="w-full">
                      <ProductCard product={product} />
                  </motion.div>
              ))}
          </div>
          
          <motion.div variants={fadeUp} className="text-center pb-8">
             <Link 
                href={section.link || '/category'}
                className="inline-block px-12 py-4 border border-[#121212] text-[11px] font-bold uppercase tracking-[0.25em] text-[#121212] hover:bg-[#121212] hover:text-white transition-all duration-300"
             >
                View Campaign
             </Link>
          </motion.div>
      </motion.div>
    </div>
  );
}