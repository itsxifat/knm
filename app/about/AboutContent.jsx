'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

export default function AboutContent() {
  return (
    // ✅ Swapped background to your custom deep green (#0c3027)
    <div className="bg-[#0c3027] min-h-screen font-body text-[#F9F6F0] selection:bg-[#C5A059] selection:text-[#0c3027] pb-24">
      
      {/* =========================================
         PREMIUM BANNER (Dark & Moody)
         ========================================= */}
      <section className="relative w-full h-[55vh] md:h-[70vh] overflow-hidden">
        <Image 
          // High-end abstract/fashion texture
          src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2670&auto=format&fit=crop"
          alt="KNM Lifestyle"
          fill
          className="object-cover object-center opacity-70"
          priority
          quality={90}
        />
        {/* ✅ Custom Green Gradient Overlay for seamless blending into the page */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c3027]/30 via-[#0c3027]/70 to-[#0c3027]" />
        
        {/* Page Title Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <motion.span 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            className="text-[#C5A059] text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] mb-4"
          >
            The Heritage
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }}
            className="font-heading text-5xl md:text-7xl text-white uppercase tracking-widest [text-shadow:_0_4px_20px_rgba(0,0,0,0.8)]"
          >
            About Us
          </motion.h1>
        </div>
      </section>

      {/* =========================================
         CONTENT SECTION (Luxurious Dark Card)
         ========================================= */}
      <section className="max-w-4xl mx-auto px-4 md:px-12 -mt-20 md:-mt-32 relative z-10">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10%" }}
          variants={fadeInUp}
          // ✅ Slightly darker shade of the custom green for the card to give it depth
          className="relative bg-[#08221b] p-8 md:p-16 lg:p-20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-[#C5A059]/20 overflow-hidden"
        >
          {/* Subtle inner gold glow (Hardware accelerated, no blur) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#C5A059]/15 to-transparent opacity-40 pointer-events-none" />

          {/* Top Decorative Line */}
          <div className="w-full flex justify-center mb-10 relative z-10">
            <div className="w-1 h-1 rounded-full bg-[#C5A059]" />
            <div className="w-24 h-[1px] bg-gradient-to-r from-[#C5A059] to-transparent mt-[1.5px] opacity-50" />
          </div>

          {/* Paragraph 1 */}
          <div className="mb-10 md:mb-12 relative z-10">
            <p className="text-white/85 text-sm md:text-base leading-[2.2] md:leading-[2.4] text-justify font-light tracking-wide">
              <span className="text-5xl md:text-6xl float-left mr-4 mt-[-8px] font-heading text-[#C5A059]">T</span>
              he story of K&M has just begun. K&M, the High-End Retailer, is one of the fastest-growing lifestyle brands. K&M’s pioneering and sublime artistic explorations are guided by an ambition to rise globally as the market leader in high-end retail. The novelty of our design innovations is essentially defined by our relentless pursuit of seeking the best for our customers. K&M has set a high standard for what can be achieved through dedication, diligence, and a firm resolution to bring the best to our customers. As a customer-centric, technology-driven, and visionary brand, K&M is committed to providing customers with high-end products and services that are second to none.
            </p>
          </div>

          {/* Golden Divider */}
          <div className="flex items-center justify-center gap-4 my-12 opacity-80 relative z-10">
             <div className="w-16 h-[1px] bg-gradient-to-r from-transparent to-[#C5A059]/60" />
             <div className="w-2 h-2 rotate-45 border border-[#C5A059]" />
             <div className="w-16 h-[1px] bg-gradient-to-l from-transparent to-[#C5A059]/60" />
          </div>

          {/* Paragraph 2 */}
          <div className="relative z-10">
            <p className="text-white/85 text-sm md:text-base leading-[2.2] md:leading-[2.4] text-justify font-light tracking-wide">
              Our mission is to serve our customers with high-end products and services. Built on the operational and technological infrastructures of BYSL Global, a next-generation technology conglomerate, K&M has embarked on a journey towards a sustainable business model that would add value to the world and beyond. The name &quot;K&M&quot; carries a profound essence, inspired by the idea of reaching the highest realms of excellence. It symbolizes an elevated station, a place where the finest aspirations and ideals converge. Rooted in this philosophy, we are devoted to embodying the values of greatness, integrity, and unwavering commitment in everything we do. &quot;K&M&quot; reflects not just a name, but a promise to strive for the best and deliver unparalleled value to our customers and beyond.
            </p>
          </div>

          {/* Signature/Brand Mark */}
          <div className="mt-16 text-center relative z-10 flex flex-col items-center">
             <span className="font-heading text-3xl md:text-4xl text-[#C5A059] tracking-[0.2em] uppercase">K&M</span>
             <span className="text-[9px] uppercase tracking-[0.4em] text-white/40 mt-3">Established 2024</span>
          </div>

        </motion.div>
      </section>

    </div>
  );
}