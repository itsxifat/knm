"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ShoppingBag, Menu, Search, User, LogOut, ArrowRight, X, ChevronDown, Facebook, Instagram, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut } from "next-auth/react";
import { useCart } from '@/lib/context/CartContext'; 
import { usePathname, useRouter } from 'next/navigation';
import { searchProducts } from '@/actions/products';
import { recordActiveSession } from '@/actions/analytics'; // ✅ IMPORT THE TRACKING ACTION

// --- CUSTOM WHATSAPP ICON ---
const WhatsAppIcon = ({ size = 20, className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
    <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
  </svg>
);

// --- ANIMATION VARIANTS ---
const menuVariants = {
  hidden: { opacity: 0, x: '-100%' },
  visible: { opacity: 1, x: 0, transition: { type: "tween", ease: [0.33, 1, 0.68, 1], duration: 0.5 } }, // Slightly faster
  exit: { opacity: 0, x: '-100%', transition: { type: "tween", ease: "circIn", duration: 0.3 } }
};

const dropdownVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
};

const searchResultsVariants = {
  hidden: { opacity: 0, y: 5 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: 5, transition: { duration: 0.1 } }
};

// --- MOBILE MENU DRAWER ---
const MobileMenu = ({ isOpen, onClose, navData, session }) => {
  const [activeSub, setActiveSub] = useState(null);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      // Clean up search when closing
      setQuery("");
      setSearchResults([]);
    }
  }, [isOpen]);

  // Optimized Debounced Search
  useEffect(() => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchProducts(query);
        setSearchResults(results || []);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 400); // 400ms is standard for reducing rapid API calls

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/product?search=${encodeURIComponent(query)}`);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#121212]/40 backdrop-blur-sm z-150 lg:hidden"
          />
          <motion.div 
            variants={menuVariants}
            initial="hidden" animate="visible" exit="exit"
            className="fixed top-0 left-0 h-full w-[85%] max-w-85 bg-[#F9F6F0] z-160 shadow-2xl overflow-y-auto lg:hidden flex flex-col border-r border-[#C5A059]/20"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 pb-4 border-b border-[#C5A059]/10 shrink-0">
              <div className="relative h-10 w-24">
                <Image src="/logo.png" alt="KNM" fill className="object-contain object-left" sizes="96px" />
              </div>
              <button onClick={onClose} className="p-2 hover:bg-[#C5A059]/10 text-[#121212] transition rounded-full" aria-label="Close menu">
                <X size={24} strokeWidth={1} />
              </button>
            </div>

            {/* Mobile Search Bar & Results */}
            <div className="px-6 py-4 bg-white/50 relative z-20 shrink-0">
                <form onSubmit={handleSearchSubmit} className="relative">
                    <input 
                        type="text" 
                        placeholder="Search products..." 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full bg-white border border-[#C5A059] pl-4 pr-10 py-3 text-sm font-body text-[#121212] rounded-sm focus:outline-none focus:ring-1 focus:ring-[#C5A059] transition-all"
                    />
                    <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C5A059]">
                        {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={18} />}
                    </button>
                </form>

                {/* Mobile Search Results Dropdown */}
                <AnimatePresence>
                    {(searchResults.length > 0) && (
                       <motion.div 
                         variants={searchResultsVariants} initial="hidden" animate="visible" exit="exit"
                         className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#C5A059]/20 shadow-xl rounded-sm overflow-hidden z-130 max-h-[50vh] overflow-y-auto custom-scrollbar"
                       >
                         <div>
                            {searchResults.map((product) => (
                              <Link 
                                href={`/product/${product.slug}`} 
                                key={product._id} 
                                onClick={onClose}
                                className="flex items-center gap-3 p-3 hover:bg-[#F9F6F0] border-b border-gray-100 last:border-0 transition-colors group"
                              >
                                <div className="w-10 h-12 bg-gray-100 relative shrink-0 overflow-hidden rounded-[1px]">
                                  {product.images?.[0] && (
                                    <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="40px" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-heading text-[11px] font-bold text-[#121212] truncate group-hover:text-[#C5A059] transition-colors">{product.name}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                     {product.discountPrice ? (
                                       <>
                                         <span className="text-[10px] text-gray-400 line-through decoration-[#C5A059]/50">{product.price} BDT</span>
                                         <span className="text-[10px] text-[#C5A059] font-bold">{product.discountPrice} BDT</span>
                                       </>
                                     ) : (
                                        <span className="text-[10px] text-gray-600 font-medium">{product.price} BDT</span>
                                     )}
                                  </div>
                                </div>
                              </Link>
                            ))}
                            <Link 
                              href={`/product?search=${encodeURIComponent(query)}`}
                              onClick={onClose}
                              className="block p-3 text-center text-[10px] font-bold uppercase tracking-widest text-white bg-[#C5A059] hover:bg-[#b38f49] transition-colors"
                            >
                              View All Results
                            </Link>
                         </div>
                       </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Links */}
            <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4">
              {navData?.links?.map((link) => (
                <div key={link.label} className="border-b border-[#C5A059]/10 pb-3 last:border-0">
                  <div className="flex justify-between items-center py-1 group cursor-pointer" onClick={() => setActiveSub(activeSub === link.label ? null : link.label)}>
                      <Link href={link.href || '#'} onClick={() => { if(!link.children?.length) onClose(); }} className="font-heading text-lg font-bold text-[#121212] group-hover:text-[#C5A059] transition-colors duration-300">
                        {link.label}
                      </Link>
                      {link.children?.length > 0 && (
                        <ChevronDown size={16} strokeWidth={1} className={`text-[#8C8279] transition-transform duration-300 ${activeSub === link.label ? 'rotate-180 text-[#C5A059]' : ''}`} />
                      )}
                  </div>
                  <AnimatePresence>
                    {activeSub === link.label && link.children && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="pl-4 border-l border-[#C5A059]/30 mt-2 space-y-3 py-2">
                          {link.children.map(child => (
                            <div key={child.label} className="mb-4 last:mb-0">
                               <p className="font-heading text-xs font-bold text-[#C5A059] uppercase tracking-widest mb-2">{child.label}</p>
                               <div className="pl-0 space-y-2 flex flex-col">
                                 {child.children?.map(grandchild => (
                                   <Link key={grandchild.label} href={grandchild.href || '#'} onClick={onClose} className="font-body text-sm font-medium text-[#121212]/80 hover:text-[#121212] transition-colors">
                                     {grandchild.label}
                                   </Link>
                                 ))}
                               </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Mobile Socials */}
            <div className="p-6 pb-2 flex gap-6 justify-center border-t border-[#C5A059]/10 bg-white/40 shrink-0">
                <a href="https://www.facebook.com/knm.bangladesh" target="_blank" rel="noreferrer" className="text-[#57534E] hover:text-[#C5A059] transition-colors"><Facebook size={20} strokeWidth={1.5} /></a>
                <a href="https://www.instagram.com/knm.bangladesh" target="_blank" rel="noreferrer" className="text-[#57534E] hover:text-[#C5A059] transition-colors"><Instagram size={20} strokeWidth={1.5} /></a>
                <a href="https://api.whatsapp.com/send/?phone=8801711751172&text&type=phone_number&app_absent=0" target="_blank" rel="noreferrer" className="text-[#57534E] hover:text-[#C5A059] transition-colors"><WhatsAppIcon size={20} /></a>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#C5A059]/20 bg-[#F5F2EA] shrink-0">
              {session ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    {session.user?.image ? (
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#C5A059]">
                         <Image src={session.user.image} alt="User" fill className="object-cover" sizes="40px" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-[#C5A059] text-white flex items-center justify-center font-heading text-sm rounded-full">
                        {session.user?.name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-heading text-[#121212] text-sm truncate">{session.user.name}</p>
                      <p className="font-body text-xs text-[#8C8279] truncate">{session.user.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Link href="/account" onClick={onClose} className="flex items-center justify-center gap-2 bg-white border border-[#E5E5E5] py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#57534E] hover:border-[#C5A059] hover:text-[#C5A059] transition-all"><User size={12} /> Account</Link>
                    <Link href="/orders" onClick={onClose} className="flex items-center justify-center gap-2 bg-white border border-[#E5E5E5] py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#57534E] hover:border-[#C5A059] hover:text-[#C5A059] transition-all"><ShoppingBag size={12} /> Orders</Link>
                  </div>
                  <button onClick={() => { signOut(); onClose(); }} className="w-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-red-800/70 hover:bg-red-50 py-3 border border-red-100 transition-colors"><LogOut size={12} /> Sign Out</button>
                </div>
              ) : (
                <Link href="/login" onClick={onClose} className="block w-full py-4 bg-[#121212] text-white text-center text-[11px] font-heading uppercase tracking-[0.2em] hover:bg-[#C5A059] transition-colors duration-300">Sign In / Register</Link>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// --- MAIN NAVBAR ---
const Navbar = ({ navData }) => {
  const pathname = usePathname(); 
  const router = useRouter();
  const { data: session } = useSession();
  
  const cartContext = useCart();
  const cartCount = cartContext?.cartCount || 0;
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false); 
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const leaveTimeout = useRef(null);
  const profileRef = useRef(null); 
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  const isProductPage = pathname === '/product';

  useEffect(() => setMounted(true), []);

  // ✅ NEW: Live User Tracking Hook
  useEffect(() => {
    // We only want to track active users on the main site, not in the admin panel
    if (pathname && pathname.startsWith('/admin')) return;

    let sessionId = sessionStorage.getItem('knm_session_id');
    if (!sessionId) {
        sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('knm_session_id', sessionId);
    }

    const pingServer = async () => {
        try {
           await recordActiveSession(sessionId);
        } catch (e) {
           // Silently ignore tracking errors
        }
    };
    
    pingServer(); // Ping immediately on load/navigation
    
    // Ping every 4 minutes (DB expires at 5 minutes)
    const interval = setInterval(pingServer, 4 * 60 * 1000); 
    
    return () => clearInterval(interval);
  }, [pathname]); // Re-ping on navigation

  // Optimized Scroll Listener
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle click outside for dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setSearchOpen(false); 
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    } else if (!searchOpen) {
      // Clear results when closing
      setTimeout(() => setSearchResults([]), 200); 
    }
  }, [searchOpen]);

  // Optimized Desktop Search Debounce
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchProducts(searchQuery);
        setSearchResults(results || []);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleMouseEnter = useCallback((link) => {
    if (leaveTimeout.current) clearTimeout(leaveTimeout.current);
    setActiveCategory(link);
  }, []);

  const handleMouseLeave = useCallback(() => {
    leaveTimeout.current = setTimeout(() => {
      setActiveCategory(null);
    }, 200);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/product?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  // Hide Navbar on auth pages and admin pages (assuming Admin has its own sidebar/nav)
  if (pathname === '/login' || pathname === '/signup' || pathname.startsWith('/admin')) return null;

  return (
    <>
      <motion.nav 
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`z-100 bg-[#F9F6F0] text-[#121212] transition-all duration-300 border-b border-[#C5A059]/20 ${
          isProductPage ? 'relative' : 'sticky top-0'
        } ${isScrolled ? 'shadow-sm bg-[#F9F6F0]/95 backdrop-blur-md' : ''}`}
        onMouseLeave={handleMouseLeave}
      >
        <div className="w-full max-w-480 mx-auto px-6 md:px-12">
          
          {/* TOP ROW */}
          <div className="flex justify-between items-center h-13.75 md:h-17.25 relative z-101">
            
            {/* Left: Mobile Menu & Socials */}
            <div className="flex items-center gap-6 flex-1">
              <button 
                className="lg:hidden p-2 -ml-2 hover:bg-[#C5A059]/10 rounded-full transition text-[#121212]" 
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open Menu"
              >
                <Menu size={24} strokeWidth={1} />
              </button>

              <div className="hidden lg:flex items-center gap-4 text-[#57534E]">
                 <a href="https://www.facebook.com/knm.bangladesh" target='_blank' rel="noreferrer" className="hover:text-[#C5A059] transition-colors"><Facebook size={18} strokeWidth={1} /></a>
                 <a href="https://www.instagram.com/knm.bangladesh" target='_blank' rel="noreferrer" className="hover:text-[#C5A059] transition-colors"><Instagram size={18} strokeWidth={1} /></a>
                 <a href="https://wa.me/8801711751172" target='_blank' rel="noreferrer" className="hover:text-[#C5A059] transition-colors"><WhatsAppIcon size={18} /></a>
              </div>

              <div className="hidden lg:block w-px h-5 bg-[#C5A059]/30"></div>

              {/* Desktop Search */}
              <div className="hidden lg:flex items-center relative" ref={searchContainerRef}>
                  <motion.div 
                    initial={false}
                    animate={{ width: searchOpen ? 280 : 105 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={`flex items-center bg-white border ${searchOpen ? 'border-[#C5A059] shadow-sm' : 'border-transparent'} rounded-full px-4 py-1.5 transition-all cursor-pointer`}
                    onClick={() => !searchOpen && setSearchOpen(true)}
                  >
                    {isSearching ? <Loader2 size={16} className="text-[#C5A059] shrink-0 animate-spin" /> : <Search size={16} className="text-[#C5A059] shrink-0" strokeWidth={2.5} />}
                    
                    {!searchOpen ? (
                        <span className="ml-3 font-heading text-[11px] font-bold uppercase tracking-widest text-black select-none whitespace-nowrap">Search</span>
                    ) : (
                        <form onSubmit={handleSearchSubmit} className="flex-1 ml-3 flex items-center">
                           <input 
                             ref={searchInputRef}
                             type="text" 
                             value={searchQuery}
                             onChange={(e) => setSearchQuery(e.target.value)}
                             placeholder="Search..." 
                             className="w-full bg-transparent text-sm font-body text-black font-medium focus:outline-none placeholder:text-gray-400"
                           />
                           {searchQuery && (
                              <button type="button" onClick={(e) => { e.stopPropagation(); setSearchQuery(""); }} className="text-gray-400 hover:text-[#C5A059] p-1">
                                 <X size={14} />
                              </button>
                           )}
                        </form>
                    )}
                  </motion.div>

                  <AnimatePresence>
                    {(searchOpen && searchResults.length > 0) && (
                       <motion.div 
                         variants={searchResultsVariants} initial="hidden" animate="visible" exit="exit"
                         className="absolute top-full left-0 mt-3 w-[320px] bg-white border border-[#C5A059]/30 shadow-xl rounded-sm overflow-hidden z-120"
                       >
                         <div>
                            {searchResults.map((product) => (
                              <Link 
                                href={`/product/${product.slug}`} 
                                key={product._id} 
                                onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                                className="flex items-center gap-3 p-3 hover:bg-[#F9F6F0] border-b border-gray-100 last:border-0 transition-colors group"
                              >
                                <div className="w-10 h-12 bg-gray-100 relative shrink-0 overflow-hidden rounded-[1px]">
                                  {product.images?.[0] && <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="40px" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-heading text-[12px] font-bold text-[#121212] truncate group-hover:text-[#C5A059] transition-colors">{product.name}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                     {product.discountPrice ? (
                                       <>
                                         <span className="text-[11px] text-gray-400 line-through decoration-[#C5A059]/50">{product.price} BDT</span>
                                         <span className="text-[11px] text-[#C5A059] font-bold">{product.discountPrice} BDT</span>
                                       </>
                                     ) : (
                                        <span className="text-[11px] text-gray-600 font-medium">{product.price} BDT</span>
                                     )}
                                  </div>
                                </div>
                              </Link>
                            ))}
                            <Link 
                              href={`/product?search=${encodeURIComponent(searchQuery)}`}
                              onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                              className="block p-3 text-center text-[10px] font-bold uppercase tracking-widest text-white bg-[#C5A059] hover:bg-[#b38f49] transition-colors"
                            >
                              View All Results
                            </Link>
                         </div>
                       </motion.div>
                    )}
                  </AnimatePresence>
              </div>
            </div>

            {/* Center: LOGO */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center h-full pointer-events-none">
              <Link href="/" className="block group relative h-13 w-30 md:h-15 md:w-35 pointer-events-auto">
                <Image 
                  src="/logo.png" 
                  alt="KNM" 
                  fill
                  priority
                  sizes="(max-width: 768px) 120px, 140px"
                  className="object-contain transition-transform duration-500 group-hover:scale-105" 
                />
              </Link>
            </div>

            {/* Right: Icons */}
            <div className="flex items-center justify-end gap-5 md:gap-6 flex-1">
              <div className="hidden lg:block relative" ref={profileRef}>
                {session ? (
                    <div className="flex items-center gap-2 cursor-pointer py-1 px-1 rounded-full hover:bg-[#C5A059]/10 transition group" onClick={() => setProfileOpen(!profileOpen)}>
                      {session.user?.image ? (
                        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#C5A059]/30">
                           <Image src={session.user.image} alt="User" fill className="object-cover" sizes="32px" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-[#C5A059] text-white flex items-center justify-center font-heading text-[10px] rounded-full">
                            {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                ) : (
                    <Link href="/login" className="flex items-center text-[#121212] opacity-70 hover:opacity-100 hover:text-[#C5A059] transition duration-300 gap-2 p-2 rounded-full">
                      <User size={22} strokeWidth={0.75} />
                    </Link>
                )}
                
                <AnimatePresence>
                  {profileOpen && session && (
                    <motion.div variants={dropdownVariants} initial="hidden" animate="visible" exit="exit" className="absolute top-full right-0 mt-4 w-60 bg-[#F9F6F0] shadow-2xl border border-[#C5A059]/20 z-150 rounded-sm overflow-hidden">
                      <div className="p-5 border-b border-[#C5A059]/10 bg-[#F5F2EA]">
                        <p className="font-heading font-bold text-[#121212] text-sm uppercase tracking-wide">{session.user?.name}</p>
                        <p className="text-[10px] text-[#8C8279] mt-1 truncate">{session.user?.email}</p>
                      </div>
                      <div className="p-2 space-y-1">
                        <Link href="/account" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#57534E] hover:bg-[#C5A059]/10 hover:text-[#121212] transition-colors rounded-sm"><User size={14} strokeWidth={1} /> Account</Link>
                        <Link href="/orders" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#57534E] hover:bg-[#C5A059]/10 hover:text-[#121212] transition-colors rounded-sm"><ShoppingBag size={14} strokeWidth={1} /> Orders</Link>
                        <div className="h-px bg-[#C5A059]/10 my-2 mx-4"></div>
                        <button onClick={() => signOut()} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-red-800/60 hover:bg-red-50 hover:text-red-800 transition-colors text-left rounded-sm"><LogOut size={14} strokeWidth={1} /> Sign Out</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link href="/cart" className="relative transition group p-2 -mr-2 rounded-full hover:bg-[#C5A059]/10">
                <ShoppingBag size={22} strokeWidth={0.75} className="text-[#121212] group-hover:text-[#C5A059] transition-colors duration-300" />
                {mounted && cartCount > 0 && (
                    <span className="absolute top-0 right-0 min-w-4 h-4 bg-[#C5A059] text-white text-[9px] font-heading font-bold flex items-center justify-center rounded-full px-0.5 shadow-sm">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                )}
              </Link>
            </div>
          </div>

          {/* --- BOTTOM ROW (Links) --- */}
          <div className="hidden lg:flex justify-center pb-0 border-t border-[#C5A059]/10">
            <div className="flex gap-12">
              {navData?.links?.map((link, i) => {
                const isActive = activeCategory?._id === link._id;
                const hasChildren = link.children && link.children.length > 0;
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + (i * 0.05) }} 
                    key={link._id || link.label} 
                    className="relative group/link py-2.5 cursor-pointer" 
                    onMouseEnter={() => hasChildren && handleMouseEnter(link)}
                  >
                    <Link 
                      href={link.href || '#'} 
                      className={`font-heading text-[12px] font-bold uppercase tracking-[0.2em] transition-colors duration-300 ${isActive ? 'text-[#C5A059]' : 'text-[#121212] hover:text-[#C5A059]'}`}
                    >
                      {link.label}
                    </Link>
                    <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 bg-[#C5A059] transition-all duration-500 ease-out ${isActive ? 'w-full' : 'w-0 group-hover/link:w-2/3'}`} />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* --- MEGA MENU DROPDOWN --- */}
        <AnimatePresence>
          {activeCategory && (
            <motion.div 
              variants={dropdownVariants} initial="hidden" animate="visible" exit="exit"
              className="absolute top-full left-0 w-full bg-[#F9F6F0] border-t border-[#C5A059]/20 border-b shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] overflow-hidden z-50" 
              onMouseEnter={() => handleMouseEnter(activeCategory)} 
              onMouseLeave={handleMouseLeave}
            >
              <div className="max-w-480 mx-auto px-16 py-12">
                <div className="grid grid-cols-12 gap-16">
                  {/* Category Highlight */}
                  <div className="col-span-3 border-r border-[#C5A059]/20 pr-12 flex flex-col justify-center text-right">
                    <h2 className="font-heading text-4xl text-[#121212] mb-6 tracking-tight">{activeCategory.label}</h2>
                    <Link href={activeCategory.href || '#'} onClick={() => setActiveCategory(null)} className="inline-flex items-center justify-end gap-3 text-[11px] font-heading uppercase tracking-widest text-[#C5A059] hover:text-[#121212] transition-colors group">
                        Explore Collection <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
                    </Link>
                  </div>
                  
                  {/* Links Grid */}
                  <div className="col-span-9 grid grid-cols-4 gap-x-12 gap-y-10">
                    {activeCategory.children?.map((child) => (
                      <div key={child._id || child.label} className="group/child">
                        <Link href={child.href || '#'} onClick={() => setActiveCategory(null)} className="block font-heading text-sm font-bold text-[#121212] mb-4 hover:text-[#C5A059] transition-colors tracking-wide">
                          {child.label}
                        </Link>
                        <div className="flex flex-col gap-2.5">
                          {child.children?.map((grandchild) => (
                            <Link key={grandchild._id || grandchild.label} href={grandchild.href || '#'} onClick={() => setActiveCategory(null)} className="font-body text-sm text-[#57534E] hover:text-[#121212] hover:translate-x-1 transition-all duration-300 block">
                               {grandchild.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} navData={navData} session={session} />
    </>
  );
};

export default Navbar;