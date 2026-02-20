'use client';

import Link from 'next/link';
import Image from 'next/image'; 
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  LayoutDashboard, LayoutTemplate, Package, ShoppingBag, 
  Tag, Ruler, Cookie, Layers, Ticket, Images, 
  Users, Navigation, Settings, LogOut as SignOutIcon, Menu, X
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SidebarContent = ({ activePath, onClickItem }) => {
  // ✅ Refined icons to better match the context of each admin page
  const menuItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/sections', label: 'Homepage Sections', icon: LayoutTemplate },
    { href: '/admin/orders', label: 'Orders', icon: Package },
    { href: '/admin/products', label: 'Products', icon: ShoppingBag }, 
    { href: '/admin/tags', label: 'Product Tags', icon: Tag }, 
    { href: '/admin/sizes', label: 'Size', icon: Ruler },
    { href: '/admin/settings/cookies', label: 'Cookies', icon: Cookie },
    { href: '/admin/categories', label: 'Categories', icon: Layers },
    { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
    { href: '/admin/carousel', label: 'Carousel Studio', icon: Images },
    { href: '/admin/users', label: 'User Management', icon: Users },
    { href: '/admin/navbar', label: 'Navigation', icon: Navigation },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    // ✅ Rebranded to KNM Dark Theme (#041610 or #0a0a0a)
    <div className="flex flex-col h-full bg-[#0a0a0a] text-white border-r border-white/5 shadow-2xl relative overflow-hidden"
    data-lenis-prevent>
      
      {/* Background Ambience (KNM Gold Glow) */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-[#C5A059]/10 blur-[80px] pointer-events-none" />

      {/* Brand Header */}
      <div className="p-8 pb-10 flex justify-between items-center relative z-10">
        <div>
          <div className="relative w-24 h-10 mb-3 opacity-90">
             <Image 
               src="/logo.png" 
               alt="KNM" 
               fill 
               className="object-contain object-left" 
               // Assuming the original logo is dark, this inverts it to white
               style={{ filter: "brightness(0) invert(1)" }} 
               priority 
             />
          </div>
          <div className="flex items-center gap-2">
              <div className="h-[1px] w-6 bg-[#C5A059]"></div>
              <p className="text-[9px] uppercase tracking-[0.3em] text-[#C5A059] font-bold">Admin Suite</p>
          </div>
        </div>
        {onClickItem && (
          <button onClick={onClickItem} className="lg:hidden text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation Scroll Area */}
      <nav className="flex-1 px-4 space-y-1 mt-2 overflow-y-auto custom-scrollbar relative z-10 pb-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePath === item.href || (item.href !== '/admin/dashboard' && activePath.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClickItem}
              className={`relative flex items-center gap-4 px-5 py-3.5 rounded-sm transition-all duration-300 group overflow-hidden
                ${isActive 
                  ? 'bg-gradient-to-r from-[#C5A059]/10 to-transparent text-white border border-[#C5A059]/20 shadow-lg shadow-[#C5A059]/5' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
            >
              {/* Active Indicator Line */}
              {isActive && (
                 <motion.div 
                   layoutId="active-indicator"
                   className="absolute left-0 top-3 bottom-3 w-[2px] bg-[#C5A059]" 
                   initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                 />
              )}

              <Icon size={18} className={`relative z-10 transition-colors duration-300 ${isActive ? "text-[#C5A059]" : "group-hover:text-[#C5A059]/70"}`} strokeWidth={1.5} />
              <span className={`font-body text-xs font-bold tracking-widest uppercase flex-1 relative z-10 ${isActive ? "text-white" : ""}`}>{item.label}</span>
              
              {/* Subtle Gold Dot on Active */}
              {isActive && <div className="absolute right-4 w-1 h-1 rounded-full bg-[#C5A059] shadow-[0_0_8px_#C5A059]" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-6 border-t border-white/5 bg-[#050505] relative z-10">
        <button 
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="flex items-center justify-center gap-3 text-gray-500 hover:text-red-400 transition-all duration-300 w-full px-4 py-3.5 hover:bg-red-500/10 rounded-sm group border border-transparent hover:border-red-500/20"
        >
          <SignOutIcon size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Filter for mobile header logo (To make it KNM Gold #C5A059 if the original image is black)
  // Approximate CSS filter for #C5A059
  const goldFilter = "brightness(0) saturate(100%) invert(73%) sepia(21%) saturate(1055%) hue-rotate(3deg) brightness(88%) contrast(85%)";

  const sidebarVariants = {
    open: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
    closed: { x: "-100%", opacity: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 w-full bg-[#F9F6F0]/95 backdrop-blur-md z-[60] px-6 py-4 flex items-center justify-between border-b border-[#C5A059]/20 shadow-sm">
        <div className="relative w-24 h-8">
           <Image 
             src="/logo.png" 
             alt="KNM" 
             fill 
             className="object-contain object-left" 
             priority 
           />
        </div>
        <button onClick={() => setIsOpen(true)} className="text-[#121212] p-2 rounded-sm hover:bg-[#C5A059]/10 hover:text-[#C5A059] transition-colors">
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Drawer Overlay & Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-[#000000]/80 z-[70] lg:hidden backdrop-blur-sm"
            />
            <motion.aside
              variants={sidebarVariants}
              initial="closed" animate="open" exit="closed"
              className="fixed top-0 left-0 z-[80] h-screen w-[280px] lg:hidden shadow-2xl border-r border-white/10"
            >
              <SidebarContent activePath={pathname} onClickItem={() => setIsOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar (Fixed) */}
      <aside className="hidden lg:flex fixed top-0 left-0 z-50 h-screen w-[280px]">
        <SidebarContent activePath={pathname} />
      </aside>
    </>
  );
}