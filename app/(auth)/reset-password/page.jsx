'use client';

import { resetPassword } from "@/app/passwordActions";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Loader2, Lock, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newPass = e.target.password.value;
    const confirmPass = e.target.confirm.value;

    if(newPass !== confirmPass) {
        setStatus({ type: 'error', message: 'Passwords do not match.' });
        return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });
    
    const res = await resetPassword(token, newPass);
    
    setLoading(false);
    if (res.error) {
      setStatus({ type: 'error', message: res.error });
    } else {
      setStatus({ type: 'success', message: 'Password updated. Redirecting...' });
      setTimeout(() => router.push('/login'), 2000);
    }
  };

  const containerVariants = { hidden: { opacity: 0, scale: 0.98 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.08 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

  return (
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="visible" 
        className="bg-[#F9F6F0] p-10 md:p-14 rounded-sm shadow-2xl shadow-[#C5A059]/5 border border-[#C5A059]/20 w-full max-w-md relative z-10"
      >
        
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-10 flex flex-col items-center">
          <div className="relative w-32 h-16 mb-4">
             <Image src="/logo.png" alt="KNM" fill className="object-contain" priority />
          </div>
          <span className="font-bold text-[10px] uppercase tracking-[0.3em] text-[#C5A059] mb-2 block">Security Update</span>
          <h1 className="text-3xl md:text-4xl font-heading font-normal text-[#121212] uppercase tracking-tight">New Password</h1>
        </motion.div>
        
        {/* Status Messages */}
        <AnimatePresence>
          {status.message && (
            <motion.div 
              initial={{ opacity: 0, height: 0, mb: 0 }} 
              animate={{ opacity: 1, height: 'auto', mb: 24 }} 
              exit={{ opacity: 0, height: 0, mb: 0 }}
              className={`px-4 py-3 text-xs font-bold rounded-sm flex items-center gap-3 overflow-hidden border-l-4 ${
                status.type === 'success' 
                  ? 'bg-[#121212] text-[#C5A059] border-[#C5A059]' 
                  : 'bg-[#121212] text-red-400 border-red-500'
              }`}
            >
              {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {status.message}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div variants={itemVariants} className="relative group">
              <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-[#8C8279] group-focus-within:text-[#C5A059] transition-colors" size={18} />
              <input 
                name="password" 
                type="password" 
                placeholder="New Password" 
                required 
                className="w-full pl-8 pr-4 py-3 bg-transparent border-b border-[#E5E5E5] text-sm font-bold text-[#121212] outline-none focus:border-[#C5A059] transition-all placeholder:text-[#E5E5E5] placeholder:font-normal rounded-none" 
              />
            </motion.div>
            
            <motion.div variants={itemVariants} className="relative group">
              <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-[#8C8279] group-focus-within:text-[#C5A059] transition-colors" size={18} />
              <input 
                name="confirm" 
                type="password" 
                placeholder="Confirm Password" 
                required 
                className="w-full pl-8 pr-4 py-3 bg-transparent border-b border-[#E5E5E5] text-sm font-bold text-[#121212] outline-none focus:border-[#C5A059] transition-all placeholder:text-[#E5E5E5] placeholder:font-normal rounded-none" 
              />
            </motion.div>
            
            <motion.div variants={itemVariants} className="pt-4">
              <button disabled={loading} className="w-full bg-[#C5A059] text-white h-12 font-bold uppercase text-xs tracking-[0.25em] hover:bg-[#121212] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-3 transition-all shadow-lg hover:shadow-xl duration-300 group">
                {loading ? <Loader2 className="animate-spin" size={16} /> : <>Update & Login <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>}
              </button>
            </motion.div>
        </form>
      </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white font-body px-4 py-8 relative overflow-hidden selection:bg-[#C5A059] selection:text-white">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#C5A059]/5 rounded-full blur-[150px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#121212]/5 rounded-full blur-[100px]" />
      
      <Suspense fallback={<div className="flex justify-center"><Loader2 className="animate-spin text-[#C5A059]" size={40} /></div>}>
        <ResetForm />
      </Suspense>
    </div>
  );
}