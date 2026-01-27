'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

export default function AboutContent() {
  return (
    <div className="bg-[#F9F6F0] min-h-screen font-body text-[#121212] selection:bg-[#C5A059] selection:text-white pb-20">
      
      {/* =========================================
          PREMIUM BANNER (Single Image)
         ========================================= */}
      <section className="relative w-full h-[50vh] md:h-[65vh] overflow-hidden">
        <Image 
          // Using a high-end, abstract fashion/texture image
          src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2670&auto=format&fit=crop"
          alt="KNM Heritage"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Elegant Dark Overlay */}
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Page Title Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="font-heading text-5xl md:text-7xl text-white uppercase tracking-widest drop-shadow-lg"
          >
            About Us
          </motion.h1>
        </div>
      </section>

      {/* =========================================
          CONTENT SECTION (Exact Text)
         ========================================= */}
      <section className="max-w-4xl mx-auto px-6 md:px-12 -mt-12 relative z-10">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="bg-white p-8 md:p-16 shadow-xl border-t-4 border-[#C5A059]"
        >
          {/* Paragraph 1 */}
          <div className="mb-8 md:mb-10">
            <p className="text-[#57534E] text-sm md:text-base leading-[1.8] md:leading-[2] text-justify font-medium">
              <span className="text-4xl float-left mr-2 mt-[-6px] font-heading text-[#C5A059]">T</span>
              he story of K&M has just begun. K&M, the High-End Retailer, is one of the fastest-growing lifestyle brands. K&M’s pioneering and sublime artistic explorations are guided by an ambition to rise globally as the market leader in high-end retail. The novelty of our design innovations is essentially defined by our relentless pursuit of seeking the best for our customers. K&M has set a high standard for what can be achieved through dedication, diligence, and a firm resolution to bring the best to our customers. As a customer-centric, technology-driven, and visionary brand, K&M is committed to providing customers with high-end products and services that are second to none.
            </p>
          </div>

          {/* Divider */}
          <div className="w-16 h-[1px] bg-[#C5A059]/30 mx-auto mb-8 md:mb-10"></div>

          {/* Paragraph 2 */}
          <div>
            <p className="text-[#57534E] text-sm md:text-base leading-[1.8] md:leading-[2] text-justify font-medium">
              Our mission is to serve our customers with high-end products and services. Built on the operational and technological infrastructures of BYSL Global, a next-generation technology conglomerate, K&M has embarked on a journey towards a sustainable business model that would add value to the world and beyond. The name "K&M" carries a profound essence, inspired by the idea of reaching the highest realms of excellence. It symbolizes an elevated station, a place where the finest aspirations and ideals converge. Rooted in this philosophy, we are devoted to embodying the values of greatness, integrity, and unwavering commitment in everything we do. "K&M" reflects not just a name, but a promise to strive for the best and deliver unparalleled value to our customers and beyond.
            </p>
          </div>

          {/* Signature/Brand Mark */}
          <div className="mt-12 text-center">
             <span className="font-heading text-2xl text-[#121212] tracking-widest">K&M</span>
          </div>

        </motion.div>
      </section>

    </div>
  );
}