'use client';

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { User, Package, Heart, LogOut, Settings, Camera, CheckCircle, AlertCircle, Info, X, ArrowRight, Lock, Mail, CreditCard } from "lucide-react";
import gsap from "gsap";
import EditProfileModal from "@/components/EditProfileModal"; 
import { AnimatePresence, motion } from "framer-motion";

// --- TOAST COMPONENT ---
const Toast = ({ message, type, onClose }) => {
  const styles = {
    success: 'bg-[#F9F6F0] border-[#C5A059]/30 text-[#121212]',
    error: 'bg-[#121212] border-red-900 text-red-400',
    info: 'bg-white border-[#E5E5E5] text-[#121212]',
  };
  const Icons = { success: CheckCircle, error: AlertCircle, info: Info };
  const Icon = Icons[type] || Info;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, x: '-50%' }} 
      animate={{ opacity: 1, y: 0, x: '-50%' }} 
      exit={{ opacity: 0, y: 20, x: '-50%' }}
      className={`fixed bottom-10 left-1/2 z-[200] flex items-center gap-3 px-6 py-4 rounded-sm shadow-2xl border ${styles[type] || styles.info} w-auto min-w-[320px]`}
    >
      <Icon size={18} className={type === 'error' ? 'text-red-400' : type === 'success' ? 'text-[#C5A059]' : 'text-[#121212]'} />
      <span className="text-xs font-bold uppercase tracking-widest">{message}</span>
      <button onClick={onClose} className="ml-auto opacity-40 hover:opacity-100 hover:text-[#C5A059] transition-colors"><X size={16}/></button>
    </motion.div>
  );
};

export default function AccountDashboard({ userHasPassword }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const containerRef = useRef(null);
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated" && containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.to(".anim-header", { y: 0, opacity: 1, duration: 1, ease: "power3.out" });
        gsap.to(".anim-card", { y: 0, opacity: 1, duration: 0.8, ease: "power2.out", stagger: 0.1, delay: 0.2 });
        gsap.to(".anim-footer", { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: 0.4 });
      }, containerRef);
      return () => ctx.revert();
    }
  }, [status]);

  if (status === "loading") return (
    <div className="min-h-[60vh] flex items-center justify-center bg-white">
        <div className="w-10 h-10 border border-[#C5A059] border-t-transparent rounded-full animate-spin"/>
    </div>
  );
  
  if (!session) return null;

  return (
    <div ref={containerRef} className="max-w-[1200px] mx-auto px-6 md:px-12 pb-24 font-body bg-white min-h-screen selection:bg-[#C5A059] selection:text-white">
      
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* --- HEADER --- */}
      <div className="anim-header opacity-0 translate-y-10 flex flex-col md:flex-row items-center md:items-end justify-between pt-16 md:pt-24 mb-20 md:mb-28 gap-10">
        
        {/* Text Info */}
        <div className="text-center md:text-left order-2 md:order-1">
          <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
              <div className="h-[1px] w-10 bg-[#C5A059]"></div>
              <span className="font-bold text-[10px] uppercase tracking-[0.3em] text-[#C5A059]">My Account</span>
          </div>
          <h1 className="font-heading text-4xl md:text-6xl text-[#121212] leading-tight mb-3">
            Welcome back,<br/> <span className="italic font-serif text-[#8C8279]">{session.user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-xs font-mono text-[#8C8279] uppercase tracking-widest mt-3 opacity-60">{session.user?.email}</p>
        </div>

        {/* Profile Image */}
        <div className="order-1 md:order-2 relative group cursor-pointer" onClick={() => setIsEditOpen(true)}>
            {/* Animated Ring */}
            <div className="absolute inset-0 rounded-full border border-[#C5A059]/30 scale-125 group-hover:scale-110 transition-transform duration-1000 ease-out"></div>
            
            <div className="relative overflow-hidden rounded-full w-28 h-28 md:w-36 md:h-36 border-4 border-white shadow-2xl group-hover:shadow-[#C5A059]/20 transition-all duration-500">
                {session.user?.image && !imageError ? (
                  <img 
                    src={session.user.image} 
                    alt="Profile" 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-[#121212] text-[#C5A059] flex items-center justify-center text-5xl font-heading">
                    {session.user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Edit Overlay */}
                <div className="absolute inset-0 bg-[#121212]/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 backdrop-blur-[2px]">
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white border-b border-[#C5A059] pb-1">Edit</span>
                </div>
            </div>
        </div>
      </div>

      {/* --- DASHBOARD GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        
        {/* 1. Profile Details */}
        <div className="anim-card opacity-0 translate-y-12 bg-[#F9F6F0] p-10 border border-[#C5A059]/10 hover:border-[#C5A059]/40 hover:bg-white hover:shadow-xl hover:shadow-[#C5A059]/5 transition-all duration-700 group relative">
           <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm mb-8 text-[#121212] group-hover:text-[#C5A059] border border-[#E5E5E5] transition-colors duration-500">
              <User size={22} strokeWidth={1.2} />
           </div>
           <h3 className="font-heading text-2xl text-[#121212] mb-2">Details</h3>
           <p className="text-xs text-[#57534E] mb-10 leading-relaxed font-medium">Manage your personal information and password.</p>
           <button onClick={() => setIsEditOpen(true)} className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#121212] group-hover:text-[#C5A059] transition-colors">
              Edit Profile <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform duration-300"/>
           </button>
        </div>

        {/* 2. Orders */}
        <div className="anim-card opacity-0 translate-y-12 bg-[#F9F6F0] p-10 border border-[#C5A059]/10 hover:border-[#C5A059]/40 hover:bg-white hover:shadow-xl hover:shadow-[#C5A059]/5 transition-all duration-700 group relative">
           <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm mb-8 text-[#121212] group-hover:text-[#C5A059] border border-[#E5E5E5] transition-colors duration-500">
              <Package size={22} strokeWidth={1.2} />
           </div>
           <h3 className="font-heading text-2xl text-[#121212] mb-2">Orders</h3>
           <p className="text-xs text-[#57534E] mb-10 leading-relaxed font-medium">Track shipments and view your purchase history.</p>
           <button className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#121212] group-hover:text-[#C5A059] transition-colors">
              View History <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform duration-300"/>
           </button>
        </div>

        {/* 3. Wishlist */}
        <div className="anim-card opacity-0 translate-y-12 bg-[#F9F6F0] p-10 border border-[#C5A059]/10 hover:border-[#C5A059]/40 hover:bg-white hover:shadow-xl hover:shadow-[#C5A059]/5 transition-all duration-700 group relative">
           <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm mb-8 text-[#121212] group-hover:text-[#C5A059] border border-[#E5E5E5] transition-colors duration-500">
              <Heart size={22} strokeWidth={1.2} />
           </div>
           <h3 className="font-heading text-2xl text-[#121212] mb-2">Wishlist</h3>
           <p className="text-xs text-[#57534E] mb-10 leading-relaxed font-medium">View and manage items you have saved for later.</p>
           <button className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#121212] group-hover:text-[#C5A059] transition-colors">
              View Wishlist <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform duration-300"/>
           </button>
        </div>

      </div>

      {/* --- FOOTER ACTIONS --- */}
      <div className="anim-footer opacity-0 translate-y-10 border-t border-[#C5A059]/20 pt-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex gap-8">
              <button className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C8279] hover:text-[#C5A059] transition-colors">Payment Methods</button>
              <button className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C8279] hover:text-[#C5A059] transition-colors">Contact Support</button>
          </div>

          <button 
              onClick={() => signOut({ callbackUrl: '/' })} 
              className="group flex items-center gap-4 px-8 py-3.5 border border-[#E5E5E5] hover:border-[#121212] hover:bg-[#121212] transition-all duration-500"
          >
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#57534E] group-hover:text-white transition-colors">Sign Out</span>
              <LogOut size={14} className="text-[#57534E] group-hover:text-[#C5A059] transition-colors" />
          </button>
      </div>

      {/* MODAL */}
      <EditProfileModal 
        user={session.user} 
        userHasPassword={userHasPassword} 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
      />
    </div>
  );
}