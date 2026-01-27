'use client';

import { requestPasswordReset } from "@/app/passwordActions";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Mail, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleSubmit = async (formData) => {
    setLoading(true);
    setStatus({ type: '', message: '' });
    
    const res = await requestPasswordReset(formData);
    
    setLoading(false);
    if (res.error) {
      setStatus({ type: 'error', message: res.error });
    } else {
      setStatus({ type: 'success', message: res.message });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.08 } 
    }
  };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white font-body px-4 py-8 relative overflow-hidden selection:bg-[#C5A059] selection:text-white">
      
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#C5A059]/5 rounded-full blur-[150px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#121212]/5 rounded-full blur-[100px]" />
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-[#F9F6F0] p-10 md:p-14 rounded-sm shadow-2xl shadow-[#C5A059]/5 border border-[#C5A059]/20 w-full max-w-md relative z-10"
      >
        {/* Header with Logo */}
        <motion.div variants={itemVariants} className="text-center mb-10 flex flex-col items-center">
          <div className="relative w-32 h-16 mb-4">
             <Image src="/logo.png" alt="KNM" fill className="object-contain" priority />
          </div>
          <span className="font-bold text-[10px] uppercase tracking-[0.3em] text-[#C5A059] mb-2 block">
            Account Recovery
          </span>
          <h1 className="text-3xl md:text-4xl font-heading font-normal text-[#121212] uppercase tracking-tight">
            Reset Password
          </h1>
          <p className="text-xs text-[#8C8279] mt-3 font-medium leading-relaxed max-w-xs">
            Enter your email address and we'll send you a secure link to reset your access.
          </p>
        </motion.div>
        
        {/* Status Message */}
        <AnimatePresence>
          {status.message && (
            <motion.div 
              initial={{ opacity: 0, height: 0, mb: 0 }}
              animate={{ opacity: 1, height: 'auto', mb: 24 }}
              exit={{ opacity: 0, height: 0, mb: 0 }}
              className={`px-4 py-3 text-xs font-bold rounded-sm flex items-center gap-2 overflow-hidden border-l-4 ${
                status.type === 'success' 
                  ? 'bg-[#121212] text-[#C5A059] border-[#C5A059]' 
                  : 'bg-[#121212] text-red-400 border-red-500'
              }`}
            >
              {status.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              {status.message}
            </motion.div>
          )}
        </AnimatePresence>

        {status.type !== 'success' ? (
          <form action={handleSubmit} className="space-y-6">
            <motion.div variants={itemVariants} className="relative group">
              <Mail className="absolute left-0 top-1/2 -translate-y-1/2 text-[#8C8279] group-focus-within:text-[#C5A059] transition-colors" size={18} />
              <input 
                name="email" 
                type="email" 
                placeholder="Email Address" 
                required 
                className="w-full pl-8 pr-4 py-3 bg-transparent border-b border-[#E5E5E5] text-sm font-bold text-[#121212] outline-none focus:border-[#C5A059] transition-all placeholder:text-[#E5E5E5] placeholder:font-normal rounded-none" 
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <button disabled={loading} className="w-full bg-[#C5A059] text-white h-12 font-bold uppercase text-xs tracking-[0.25em] hover:bg-[#121212] disabled:opacity-70 flex justify-center items-center gap-3 transition-all shadow-lg hover:shadow-xl duration-300 active:scale-[0.98]">
                {loading ? <Loader2 className="animate-spin" size={16} /> : <>Send Secure Link <ArrowRight size={16} /></>}
              </button>
            </motion.div>
          </form>
        ) : (
           <motion.div variants={itemVariants}>
              <Link href="/login" className="w-full bg-white border border-[#E5E5E5] text-[#57534E] h-12 font-bold uppercase text-xs tracking-[0.25em] hover:border-[#121212] hover:text-[#121212] flex justify-center items-center gap-2 transition-all shadow-sm active:scale-[0.98]">
                 Return to Login
              </Link>
           </motion.div>
        )}

        <motion.div variants={itemVariants} className="text-center mt-8 border-t border-[#C5A059]/10 pt-6">
          <Link href="/login" className="text-[10px] uppercase tracking-widest text-[#8C8279] hover:text-[#C5A059] transition-colors font-bold border-b border-transparent hover:border-[#C5A059] pb-0.5">
            Back to Sign In
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}