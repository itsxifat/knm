'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Instagram, Facebook, ArrowUpRight, Users, Phone } from 'lucide-react';

// --- CUSTOM WHATSAPP ICON ---
const WhatsAppIcon = ({ size = 20, className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
    <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
  </svg>
);

// --- SOCIAL BUTTON ---
const SocialButton = ({ icon: Icon, href }) => (
  <motion.a 
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    whileHover={{ scale: 1.05, backgroundColor: '#C5A059', borderColor: '#C5A059', color: '#ffffff' }}
    className="w-10 h-10 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] hover:text-white cursor-pointer transition-colors duration-500 rounded-sm bg-white/5"
  >
    <Icon size={18} strokeWidth={1.5} />
  </motion.a>
);

// --- FOOTER LINKS COLUMN ---
const FooterColumn = ({ title, links }) => (
  <div className="flex flex-col space-y-5">
    <h4 className="text-[11px] font-heading font-bold uppercase tracking-[0.2em] text-[#C5A059] flex items-center gap-3">
        <span className="w-8 h-[1px] bg-[#C5A059]/50"></span>
        {title}
    </h4>
    <ul className="space-y-3 pl-11">
      {links.map((link, i) => (
        <li key={i}>
          <Link href={link.href} className="text-xs font-medium uppercase tracking-wide text-white/60 hover:text-white hover:translate-x-1 transition-all flex items-center gap-2 group">
            <span className="w-1 h-1 rounded-full bg-[#C5A059] opacity-0 group-hover:opacity-100 transition-opacity"></span>
            {link.label} 
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

// --- MAIN FOOTER ---
export default function Footer() {
  const currentYear = new Date().getFullYear();

  // Reorganized your list into logical columns for better layout
  const columns = {
    col1: {
      title: "Quick Links",
      links: [
        { label: 'About Us', href: '/about' },
        { label: 'Contact Us', href: '/contact' },
        { label: 'Customer Service', href: '/support' },
      ]
    },
    col2: {
      title: "Policies",
      links: [
        { label: 'Shipping Policy', href: '/policies/shipping' },
        { label: 'Payment Policy', href: '/policies/payment' },
        { label: 'Exchange & Refund', href: '/policies/refund' },
      ]
    },
    col3: {
      title: "Legal",
      links: [
        { label: 'Privacy Policy', href: '/policies/privacy' },
        { label: 'Terms & Conditions', href: '/policies/terms' },
        { label: 'Intellectual Property', href: '/policies/ip' },
      ]
    }
  };

  return (
    // Background: Rich Dark Navy (#081210) | Accent: Gold (#C5A059)
    <footer className="bg-[#081210] text-white pt-16 pb-0 font-body relative overflow-hidden border-t border-[#C5A059]/20 z-10 selection:bg-[#C5A059] selection:text-white">
      
      {/* Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none -z-10 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      
      <div className="max-w-[1920px] mx-auto px-6 md:px-12 relative z-20">
        
        {/* --- COMPACT COMMUNITY SECTION --- */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-8 pb-12 border-b border-[#C5A059]/10 mb-12">
          
          {/* Text Side */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl md:text-4xl 2xl:text-5xl font-heading font-normal text-white uppercase tracking-tight leading-none mb-3">
              Join The <span className="text-[#C5A059] font-serif italic">Inner Circle.</span>
            </h2>
            <p className="text-white/40 text-xs font-medium uppercase tracking-[0.2em]">
              Exclusive drops. Member-only events. The legacy continues.
            </p>
          </div>
          
          {/* Button Side */}
          <div>
            <a 
              href="https://facebook.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative px-10 py-4 bg-[#C5A059] text-white text-xs font-bold uppercase tracking-[0.25em] overflow-hidden hover:bg-white hover:text-[#081210] transition-colors duration-500 inline-flex items-center gap-3"
            >
              <span>Join Community</span>
              <Users size={16} />
            </a>
          </div>
        </div>

        {/* --- LINKS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-y-12 lg:gap-12 mb-16">
          
          {/* LOGO & SOCIALS (Left Side) */}
          <div className="lg:col-span-4 flex flex-col justify-between h-full space-y-8 lg:space-y-0">
              <div className="space-y-6">
                {/* Logo Image */}
                <div className="relative w-40 h-16">
                    <Image 
                        src="/logo.png" 
                        alt="KNM" 
                        fill 
                        className="object-contain object-left opacity-90" 
                    />
                </div>
                <p className="text-white/40 text-xs leading-relaxed max-w-xs font-light">
                    Crafting timeless elegance for the modern gentleman since 2024. A legacy of quality, tradition, and style.
                </p>
                
                {/* Social Icons */}
                <div className="flex gap-3">
                    <SocialButton icon={Facebook} href="https://facebook.com" />
                    <SocialButton icon={Instagram} href="https://instagram.com" />
                    <SocialButton icon={WhatsAppIcon} href="https://whatsapp.com" />
                </div>
              </div>
          </div>

          {/* Spacer (Desktop) */}
          <div className="hidden lg:block lg:col-span-2"></div>

          {/* Navigation Columns */}
          <div className="lg:col-span-2"><FooterColumn title={columns.col1.title} links={columns.col1.links} /></div>
          <div className="lg:col-span-2"><FooterColumn title={columns.col2.title} links={columns.col2.links} /></div>
          <div className="lg:col-span-2"><FooterColumn title={columns.col3.title} links={columns.col3.links} /></div>
        </div>

        {/* --- BOTTOM BAR --- */}
        <div className="relative border-t border-[#C5A059]/10 pt-8 overflow-hidden">
           <div className="flex flex-col md:flex-row justify-between items-center gap-6 pb-24 2xl:pb-32 relative z-20">
             
             {/* Copyright */}
             <div className="flex items-center gap-6 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
                 <p>&copy; {currentYear} KNM Lifestyle.</p>
                 <span className="text-[#C5A059]/40">|</span>
                 <p>Site by <span className="text-[#C5A059] hover:text-white transition-colors cursor-pointer">Enfinito</span></p>
             </div>

             {/* Tagline */}
             <div className="text-[10px] font-bold text-[#C5A059]/40 uppercase tracking-widest hidden md:block">
                 Engineered for the Modern Aesthetic.
             </div>
           </div>
           
           {/* GIANT TEXT (Behind everything) */}
           <h1 className="font-heading text-[22vw] leading-[0.7] text-center text-[#C5A059] opacity-[0.02] font-black absolute bottom-[-5%] left-1/2 -translate-x-1/2 w-full select-none pointer-events-none -z-10">
             KNM
           </h1>
        </div>
      </div>
    </footer>
  );
}