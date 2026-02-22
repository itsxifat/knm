"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, ArrowUpRight } from "lucide-react"; 
import Link from 'next/link';
import Image from 'next/image'; // ✅ FIX: Imported Next Image for auto-optimization

// ==========================================
// CONFIGURATION
// ==========================================
const AUTOPLAY_DELAY = 7000;
const SWIPE_CONFIDENCE_THRESHOLD = 10000;

// ==========================================
// HELPER: CALCULATE SWIPE POWER
// ==========================================
const swipePower = (offset, velocity) => {
  return Math.abs(offset) * velocity;
};

// ==========================================
// SUB-COMPONENT: MODERN BUTTON
// ==========================================
const ModernButton = ({ children, link }) => {
  if (!children) return null;

  return (
    <Link href={link || '/product'} className="inline-block relative z-30">
      {/* ✅ FIX: Removed 'backdrop-blur-md', replaced with solid opacity bg-black/40 to save GPU */}
      <button className="group relative px-8 py-4 md:px-10 md:py-4 overflow-hidden transition-all duration-300 hover:w-auto bg-black/40 border border-white/20 hover:bg-[#C5A059] hover:border-[#C5A059]">
        <span className="relative z-10 flex items-center gap-3 font-sans text-xs font-bold uppercase tracking-[0.2em] text-white transition-colors duration-500">
          {children}
          <ArrowUpRight size={16} className="transition-transform duration-500 group-hover:rotate-45" />
        </span>
      </button>
    </Link>
  );
};

// ==========================================
// MAIN HERO COMPONENT
// ==========================================
const Hero = ({ heroData }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // --- AUTOPLAY ENGINE ---
  useEffect(() => {
    if (!heroData?.length) return;
    const timer = setInterval(() => paginate(1), AUTOPLAY_DELAY);
    return () => clearInterval(timer);
  }, [currentIndex, heroData]);

  if (!heroData || heroData.length === 0) return null;

  const slide = heroData[currentIndex];
  const totalSlides = heroData.length;

  const paginate = (newDirection) => {
    setDirection(newDirection);
    setCurrentIndex((prev) => {
      let next = prev + newDirection;
      if (next < 0) next = totalSlides - 1;
      if (next >= totalSlides) next = 0;
      return next;
    });
  };

  // --- ANIMATION VARIANTS ---
  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 30 : -30, // ✅ FIX: Changed to small slide instead of full width
      opacity: 0,
      // ✅ FIX: Removed 'scale: 1.1' (Massive GPU saver!)
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.5 },
        // ✅ FIX: Removed the 6-second continuous scale animation
      }
    },
    exit: (dir) => ({
      zIndex: 0,
      x: dir < 0 ? 30 : -30,
      opacity: 0,
      transition: { duration: 0.4, ease: "easeInOut" }
    })
  };

  const textVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: (delay = 0) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, delay: 0.1 + delay, ease: "easeOut" }
    })
  };

  const targetLink = slide.buttonLayer?.link?.trim() ? slide.buttonLayer.link : '/product';

  return (
    <section className="w-full bg-white relative">
      <div className="relative w-full aspect-[4/5] md:aspect-[21/8] overflow-hidden bg-neutral-900 isolate touch-pan-y">
        
        {/* LAYER 0 & 1: DRAGGABLE CAROUSEL & LINK */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = swipePower(offset.x, velocity.x);
                if (swipe < -SWIPE_CONFIDENCE_THRESHOLD) {
                  paginate(1);
                } else if (swipe > SWIPE_CONFIDENCE_THRESHOLD) {
                  paginate(-1);
                }
              }}
              className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing transform-gpu"
            >
               <div className="relative w-full h-full bg-neutral-900">
                 
                 {/* ✅ FIX: Replaced raw <img> with Next.js <Image> for automatic compression & memory saving */}
                 <div className={`relative w-full h-full ${slide.imageMobile || slide.mobileImage ? 'hidden md:block' : 'block'}`}>
                    <Image 
                      src={slide.imageDesktop || slide.image} 
                      alt={slide.title || "Hero Image"} 
                      fill
                      priority={currentIndex === 0} // Only prioritize the first slide
                      quality={80} // Dropped quality slightly to save memory
                      className="object-cover select-none pointer-events-none"
                      draggable="false"
                      sizes="100vw"
                    />
                 </div>
                 
                 {(slide.imageMobile || slide.mobileImage) && (
                   <div className="relative w-full h-full md:hidden">
                      <Image 
                        src={slide.imageMobile || slide.mobileImage} 
                        alt={slide.title || "Hero Mobile"} 
                        fill
                        priority={currentIndex === 0}
                        quality={80}
                        className="object-cover select-none pointer-events-none" 
                        draggable="false"
                        sizes="100vw"
                      />
                   </div>
                 )}

                 {/* Gradient Overlay for better text readability without using expensive shadows */}
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none z-0" />

                 <Link 
                   href={targetLink} 
                   className="absolute inset-0 z-10 w-full h-full"
                   draggable="false"
                   aria-label="Go to product"
                 />
               </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* LAYER 2: CONTENT (Z-20) */}
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 md:p-12 lg:p-16 pointer-events-none">
          <AnimatePresence mode="wait">
             <div key={currentIndex} className="max-w-[1920px] w-full mx-auto px-4 md:px-8">
                  
                  <div className="flex flex-col gap-2 md:gap-4 mb-6 md:mb-8">
                    {slide.subtitle && (
                      <motion.div 
                          variants={textVariants} custom={0} initial="hidden" animate="visible" exit="hidden"
                          className="flex items-center gap-3"
                      >
                          <span className="w-8 h-[2px] bg-[#C5A059]" />
                          {/* ✅ FIX: Replaced drop-shadow with hardware-accelerated text-shadow */}
                          <span className="font-heading text-white/90 text-[10px] md:text-xs font-bold uppercase tracking-[0.25em] [text-shadow:_0_2px_4px_rgba(0,0,0,0.8)]">
                             {slide.subtitle}
                          </span>
                      </motion.div>
                    )}

                    {slide.title && (
                      <motion.h1 
                          variants={textVariants} custom={0.1} initial="hidden" animate="visible" exit="hidden"
                          // ✅ FIX: Replaced drop-shadow with hardware-accelerated text-shadow
                          className="font-heading font-normal text-4xl md:text-6xl lg:text-8xl text-white uppercase tracking-tight leading-[0.9] [text-shadow:_0_4px_10px_rgba(0,0,0,0.8)]"
                      >
                          {slide.title}
                      </motion.h1>
                    )}
                  </div>

                  {(slide.description || (slide.buttonLayer && slide.buttonLayer.text)) && (
                    <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 md:gap-6 border-t border-white/20 pt-4 md:pt-6">
                        {slide.description ? (
                          <motion.p 
                            variants={textVariants} custom={0.2} initial="hidden" animate="visible" exit="hidden"
                            className="text-white/90 text-xs md:text-sm max-w-lg leading-relaxed font-body hidden md:block font-medium [text-shadow:_0_2px_4px_rgba(0,0,0,0.8)]"
                          >
                             {slide.description}
                          </motion.p>
                        ) : <div />}

                        {slide.buttonLayer?.text && (
                          <motion.div 
                            variants={textVariants} custom={0.3} initial="hidden" animate="visible" exit="hidden"
                            className="pointer-events-auto"
                          >
                             <ModernButton link={targetLink}>
                                {slide.buttonLayer.text}
                             </ModernButton>
                          </motion.div>
                        )}
                    </div>
                  )}

             </div>
          </AnimatePresence>
        </div>

        {/* LAYER 3: NAVIGATION (Desktop Only) */}
        <div className="absolute bottom-10 right-10 z-30 hidden md:flex gap-2 pointer-events-auto">
            {/* ✅ FIX: Removed 'backdrop-blur-md' to save GPU */}
            <button 
               onClick={() => paginate(-1)}
               className="w-12 h-12 rounded-sm border border-white/20 bg-black/40 flex items-center justify-center text-white hover:bg-[#C5A059] hover:border-[#C5A059] transition-all duration-300 group shadow-lg"
            >
               <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <button 
               onClick={() => paginate(1)}
               className="w-12 h-12 rounded-sm border border-white/20 bg-black/40 flex items-center justify-center text-white hover:bg-[#C5A059] hover:border-[#C5A059] transition-all duration-300 group shadow-lg"
            >
               <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
        </div>

        {/* GOLD ACCENT: Progress Bar */}
        <div className="absolute bottom-0 left-0 w-full h-[3px] z-30 bg-white/10">
              <motion.div 
                key={currentIndex}
                // ✅ FIX: Animating scaleX instead of width prevents layout thrashing
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: AUTOPLAY_DELAY / 1000, ease: "linear" }}
                className="h-full bg-[#C5A059] origin-left"
              />
        </div>

      </div>
    </section>
  );
};

export default Hero;