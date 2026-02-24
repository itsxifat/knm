"use client";

import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, ArrowLeft, ArrowUpRight } from "lucide-react"; 
import Link from 'next/link';
import Image from 'next/image';

// ==========================================
// CONFIGURATION
// ==========================================
const AUTOPLAY_DELAY = 7000;

// ==========================================
// SUB-COMPONENT: MODERN BUTTON
// ==========================================
const ModernButton = ({ children, link }) => {
  if (!children) return null;

  return (
    <Link href={link || '/product'} className="inline-block relative z-30 pointer-events-auto">
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
// MAIN HERO COMPONENT (Native CSS Slider)
// ==========================================
const Hero = ({ heroData }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const intervalRef = useRef(null);

  // --- AUTOPLAY ENGINE ---
  const startAutoplay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
        paginate(1);
    }, AUTOPLAY_DELAY);
  };

  useEffect(() => {
    if (!heroData?.length) return;
    startAutoplay();
    return () => clearInterval(intervalRef.current);
  }, [currentIndex, heroData]); // Re-run when index changes to reset timer

  if (!heroData || heroData.length === 0) return null;

  const totalSlides = heroData.length;

  const paginate = (newDirection) => {
    setCurrentIndex((prev) => {
      let next = prev + newDirection;
      if (next < 0) next = totalSlides - 1;
      if (next >= totalSlides) next = 0;
      return next;
    });
  };

  // --- TOUCH HANDLERS (Native Swipe) ---
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    clearInterval(intervalRef.current); // Pause on touch
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) paginate(1);
    if (isRightSwipe) paginate(-1);
    
    startAutoplay(); // Resume
  };

  return (
    <section className="w-full bg-white relative group/hero">
      <div 
        className="relative w-full aspect-[4/5] md:aspect-[21/8] overflow-hidden bg-neutral-900 isolate touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        
        {/* SLIDES CONTAINER */}
        {heroData.map((slide, index) => {
            const isActive = index === currentIndex;
            
            return (
                <div 
                    key={slide.id || index}
                    className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
                >
                    {/* IMAGE LAYER */}
                    <div className="relative w-full h-full">
                        {/* Desktop Image */}
                        <div className={`relative w-full h-full ${slide.imageMobile || slide.mobileImage ? 'hidden md:block' : 'block'}`}>
                            <Image 
                                src={slide.imageDesktop || slide.image} 
                                alt={slide.title || "Hero Image"} 
                                fill
                                priority={index === 0} // Only prioritize first slide
                                quality={85}
                                className={`object-cover transition-transform duration-[7000ms] ease-linear ${isActive ? 'scale-105' : 'scale-100'}`} 
                                sizes="100vw"
                            />
                        </div>
                        
                        {/* Mobile Image */}
                        {(slide.imageMobile || slide.mobileImage) && (
                            <div className="relative w-full h-full md:hidden">
                                <Image 
                                    src={slide.imageMobile || slide.mobileImage} 
                                    alt={slide.title || "Hero Mobile"} 
                                    fill
                                    priority={index === 0}
                                    quality={85}
                                    className={`object-cover transition-transform duration-[7000ms] ease-linear ${isActive ? 'scale-105' : 'scale-100'}`} 
                                    sizes="100vw"
                                />
                            </div>
                        )}

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
                        
                        {/* FULL LINK OVERLAY */}
                        <Link 
                            href={slide.buttonLayer?.link?.trim() ? slide.buttonLayer.link : '/product'}
                            className="absolute inset-0 z-10 w-full h-full"
                            aria-label="Go to product"
                        />
                    </div>

                    {/* CONTENT LAYER */}
                    <div className={`absolute inset-0 z-20 flex flex-col justify-end p-6 md:p-12 lg:p-16 pointer-events-none transition-all duration-700 delay-100 ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                        <div className="max-w-[1920px] w-full mx-auto px-4 md:px-8">
                            <div className="flex flex-col gap-2 md:gap-4 mb-6 md:mb-8">
                                
                                {slide.subtitle && (
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-[2px] bg-[#C5A059]" />
                                        <span className="font-heading text-white/90 text-[10px] md:text-xs font-bold uppercase tracking-[0.25em] drop-shadow-md">
                                            {slide.subtitle}
                                        </span>
                                    </div>
                                )}

                                {slide.title && (
                                    <h1 className="font-heading font-normal text-4xl md:text-6xl lg:text-8xl text-white uppercase tracking-tight leading-[0.9] drop-shadow-lg">
                                        {slide.title}
                                    </h1>
                                )}
                            </div>

                            {(slide.description || (slide.buttonLayer && slide.buttonLayer.text)) && (
                                <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 md:gap-6 border-t border-white/20 pt-4 md:pt-6">
                                    {slide.description ? (
                                        <p className="text-white/90 text-xs md:text-sm max-w-lg leading-relaxed font-body hidden md:block font-medium drop-shadow-md">
                                            {slide.description}
                                        </p>
                                    ) : <div />}

                                    {slide.buttonLayer?.text && (
                                        <div className="pointer-events-auto">
                                            <ModernButton link={slide.buttonLayer?.link}>
                                                {slide.buttonLayer.text}
                                            </ModernButton>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        })}

        {/* NAVIGATION ARROWS (Desktop) */}
        <div className="absolute bottom-10 right-10 z-30 hidden md:flex gap-2 pointer-events-auto opacity-0 group-hover/hero:opacity-100 transition-opacity duration-300">
            <button 
               onClick={() => { paginate(-1); startAutoplay(); }}
               className="w-12 h-12 rounded-sm border border-white/20 bg-black/40 flex items-center justify-center text-white hover:bg-[#C5A059] hover:border-[#C5A059] transition-all duration-300 group shadow-lg backdrop-blur-sm"
            >
               <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <button 
               onClick={() => { paginate(1); startAutoplay(); }}
               className="w-12 h-12 rounded-sm border border-white/20 bg-black/40 flex items-center justify-center text-white hover:bg-[#C5A059] hover:border-[#C5A059] transition-all duration-300 group shadow-lg backdrop-blur-sm"
            >
               <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
        </div>

        {/* PROGRESS BAR (Pure CSS Animation) */}
        <div className="absolute bottom-0 left-0 w-full h-[3px] z-30 bg-white/10">
             {/* Key changes to restart animation on index change */}
             <div 
               key={currentIndex}
               className="h-full bg-[#C5A059] origin-left animate-progress"
               style={{ animationDuration: `${AUTOPLAY_DELAY}ms` }}
             />
        </div>

      </div>
      
      {/* GLOBAL CSS ANIMATION FOR PROGRESS BAR */}
      <style jsx global>{`
        @keyframes progress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        .animate-progress {
          animation-name: progress;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
      `}</style>
    </section>
  );
};

export default Hero;