'use client';

import { verifyOtpAction } from "@/app/authActions";
import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image"; 
import { Loader2, ShieldCheck, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { staggerChildren: 0.1, delayChildren: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] } 
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const shakeVariants = {
  idle: { x: 0 },
  error: { x: [-10, 10, -10, 10, 0], transition: { duration: 0.4 } }
};

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' }); 
  const [timer, setTimer] = useState(30);

  // Countdown Timer for Resend
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleVerify = async (e) => {
    e?.preventDefault(); 
    
    if(!otp || otp.length < 6) return;
    
    setLoading(true);
    setStatus({ type: '', message: '' });

    const res = await verifyOtpAction(email, otp);
    
    if (res.error) {
      setStatus({ type: 'error', message: res.error });
      setLoading(false);
    } else {
      setStatus({ type: 'success', message: 'Identity Verified. Redirecting...' });
      setTimeout(() => router.push('/login?verified=true'), 1500);
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="bg-[#F9F6F0] p-10 md:p-14 rounded-sm shadow-2xl shadow-[#C5A059]/5 border border-[#C5A059]/20 w-full max-w-md text-center relative z-10 overflow-hidden"
    >
      {/* Decorative Top Glow */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C5A059] to-transparent opacity-50"></div>

      {/* Header with Logo */}
      <motion.div variants={itemVariants} className="flex flex-col items-center mb-10">
         <div className="relative w-32 h-16 mb-6">
            <Image src="/logo.png" alt="KNM" fill className="object-contain" priority />
         </div>
         <div className="w-16 h-16 bg-[#C5A059]/10 text-[#C5A059] rounded-full flex items-center justify-center shadow-sm border border-[#C5A059]/20 mb-6">
            <ShieldCheck size={32} strokeWidth={1.2} />
         </div>
         <h1 className="text-3xl font-heading font-normal text-[#121212] mb-3 uppercase tracking-tight">
           Verification
         </h1>
         <p className="text-[#8C8279] text-xs font-medium tracking-wide leading-relaxed px-4">
           Please enter the 6-digit secure code sent to <br/> 
           <span className="font-bold text-[#121212] border-b border-[#C5A059]/30 pb-0.5">{email}</span>
         </p>
      </motion.div>

      {/* NOTIFICATION AREA */}
      <AnimatePresence mode="wait">
        {status.message && (
          <motion.div 
            key={status.type}
            variants={shakeVariants}
            initial="idle"
            animate={status.type === 'error' ? 'error' : 'idle'}
            className={`px-5 py-4 rounded-sm mb-8 flex items-center justify-center gap-3 text-xs font-bold border-l-4 ${
              status.type === 'success' 
              ? 'bg-[#121212] text-[#C5A059] border-[#C5A059]' 
              : 'bg-[#121212] text-red-400 border-red-500'
            }`}
          >
            {status.type === 'success' ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
            {status.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* INPUT FIELD */}
      <motion.div variants={itemVariants} className="relative mb-10 group">
        <input 
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} 
          onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
          className="w-full text-center text-4xl tracking-[0.5em] font-heading font-bold border-b-2 border-[#E5E5E5] focus:border-[#C5A059] outline-none py-4 bg-transparent transition-all placeholder:tracking-normal placeholder:font-body placeholder:text-xs placeholder:font-normal placeholder:text-[#E5E5E5] placeholder:uppercase text-[#121212]" 
          maxLength={6}
          placeholder="Enter Code"
          autoFocus
        />
      </motion.div>

      {/* VERIFY BUTTON */}
      <motion.button 
        variants={itemVariants}
        onClick={handleVerify} 
        disabled={loading || otp.length < 6} 
        className="w-full bg-[#C5A059] text-white h-14 font-bold uppercase text-xs tracking-[0.25em] hover:bg-[#121212] disabled:opacity-50 disabled:hover:bg-[#C5A059] disabled:cursor-not-allowed flex justify-center items-center gap-3 transition-all duration-500 shadow-lg hover:shadow-xl active:scale-[0.98]"
      >
        {loading ? <Loader2 className="animate-spin" size={18} /> : (
          <>Verify Identity <ArrowRight size={16} /></>
        )}
      </motion.button>

      {/* RESEND LOGIC */}
      <motion.div variants={itemVariants} className="mt-10 flex flex-col items-center gap-3">
        <p className="text-[9px] text-[#8C8279] uppercase tracking-widest font-bold">Didn't receive it?</p>
        
        {timer > 0 ? (
           <span className="text-[10px] text-[#C5A059] font-mono font-bold">Resend available in 00:{timer < 10 ? `0${timer}` : timer}</span>
        ) : (
           <button 
             onClick={() => { setTimer(30); setStatus({ type: 'success', message: 'Code resent successfully.' }); setTimeout(() => setStatus({type:'', message:''}), 3000) }}
             className="text-[10px] text-[#121212] font-bold uppercase tracking-widest border-b border-[#121212] hover:text-[#C5A059] hover:border-[#C5A059] transition-all pb-0.5"
           >
             Resend Code
           </button>
        )}
      </motion.div>

    </motion.div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white font-body relative overflow-hidden px-4 selection:bg-[#C5A059] selection:text-white">
       
       {/* Background Ambience */}
       <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#C5A059]/5 rounded-full blur-[150px]" />
       <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#121212]/5 rounded-full blur-[100px]" />

       <Suspense fallback={
         <div className="animate-pulse flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-[#F9F6F0] rounded-full border border-[#E5E5E5]"></div>
            <div className="h-4 w-40 bg-[#F9F6F0] rounded"></div>
         </div>
       }>
         <VerifyForm />
       </Suspense>
    </div>
  );
}