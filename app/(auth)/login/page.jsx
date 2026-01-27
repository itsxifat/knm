'use client';

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image"; 
import { Loader2, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCredentialsLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const email = e.target.email.value;
    const password = e.target.password.value;

    const res = await signIn("credentials", { 
      email, password, redirect: false 
    });

    if (res?.error) {
      setError("Invalid email or password.");
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.1 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white font-body px-4 py-8 relative overflow-hidden selection:bg-[#C5A059] selection:text-white">
      
      {/* Background Decor */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#C5A059]/5 rounded-full blur-[150px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#121212]/5 rounded-full blur-[100px]" />
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-[#F9F6F0] p-10 md:p-14 border border-[#C5A059]/20 w-full max-w-md relative z-10 shadow-2xl shadow-[#C5A059]/5"
      >
        {/* Header with Logo */}
        <motion.div variants={itemVariants} className="text-center mb-12 flex flex-col items-center">
          <div className="relative w-56 h-25 mb-6">
             <Image 
               src="/logo.png" 
               alt="KNM" 
               fill 
               className="object-contain" 
               priority
             />
          </div>
          <span className="font-bold text-[10px] uppercase tracking-[0.3em] text-[#C5A059] mb-3 block">
            Welcome Back
          </span>
          <h1 className="text-3xl md:text-4xl font-heading font-normal text-[#121212] uppercase tracking-tight">
            Member Access
          </h1>
        </motion.div>
        
        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0, mb: 0 }}
              animate={{ opacity: 1, height: 'auto', mb: 24 }}
              exit={{ opacity: 0, height: 0, mb: 0 }}
              className="bg-[#121212] text-white px-5 py-4 text-xs font-bold rounded-sm flex items-center gap-3 overflow-hidden border-l-4 border-red-500"
            >
              <AlertCircle size={16} className="shrink-0 text-red-400" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleCredentialsLogin} className="space-y-6">
          
          <motion.div variants={itemVariants} className="relative group">
            <Mail className="absolute left-0 top-1/2 -translate-y-1/2 text-[#8C8279] group-focus-within:text-[#C5A059] transition-colors" size={18} />
            <input name="email" type="email" placeholder="Email Address" required className="w-full pl-8 pr-4 py-3 bg-transparent border-b border-[#E5E5E5] text-sm font-bold text-[#121212] outline-none focus:border-[#C5A059] transition-all placeholder:text-[#E5E5E5] placeholder:font-normal rounded-none" />
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-4">
            <div className="relative group">
              <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-[#8C8279] group-focus-within:text-[#C5A059] transition-colors" size={18} />
              <input name="password" type="password" placeholder="Password" required className="w-full pl-8 pr-4 py-3 bg-transparent border-b border-[#E5E5E5] text-sm font-bold text-[#121212] outline-none focus:border-[#C5A059] transition-all placeholder:text-[#E5E5E5] placeholder:font-normal rounded-none" />
            </div>
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-[10px] uppercase tracking-widest text-[#8C8279] hover:text-[#C5A059] transition-colors font-bold">
                Forgot Password?
              </Link>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="pt-4">
            <button disabled={loading} className="w-full bg-[#C5A059] text-white h-14 font-bold uppercase text-xs tracking-[0.25em] hover:bg-[#121212] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-3 transition-all shadow-lg hover:shadow-xl duration-300 group">
              {loading ? <Loader2 className="animate-spin" size={16} /> : <>Sign In <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>}
            </button>
          </motion.div>
        </form>

        <motion.div variants={itemVariants} className="relative my-10 text-center">
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-[#E5E5E5]"></div>
          <span className="bg-[#F9F6F0] px-4 relative z-10 text-[9px] text-[#8C8279] uppercase tracking-widest font-bold">Or continue with</span>
        </motion.div>

        <motion.div variants={itemVariants}>
          <button onClick={() => signIn('google', { callbackUrl: '/' })} className="group w-full bg-white border border-[#E5E5E5] h-14 font-bold text-xs text-[#57534E] uppercase tracking-widest hover:border-[#C5A059] hover:text-[#C5A059] transition-all flex items-center justify-center gap-4 shadow-sm hover:shadow-md duration-300">
            <div className="p-1.5 bg-white rounded-full transition-colors">
               <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
               </svg>
            </div>
            <span>Google</span>
          </button>
        </motion.div>

        <motion.div variants={itemVariants} className="text-center mt-10 border-t border-[#C5A059]/10 pt-6">
          <p className="text-xs text-[#8C8279] font-medium">
            New to KNM? <Link href="/signup" className="text-[#121212] font-bold uppercase tracking-widest border-b border-[#121212] hover:border-[#C5A059] hover:text-[#C5A059] transition-all pb-0.5 ml-1">Sign Up</Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}