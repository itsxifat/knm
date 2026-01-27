'use client';

import { useState } from 'react';
import { X, Camera, Save, Loader2, User, Phone, Mail, Lock, Shield, CheckCircle, AlertCircle, ChevronRight, KeyRound, Info } from 'lucide-react';
import { updateUserProfile, changePassword, initiateEmailChange, verifyEmailChangeOTP } from '@/app/actions';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from "next-auth/react";
import Cropper from 'react-easy-crop';

// --- UTILITY: Create Cropped Image Blob ---
async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.95);
  });
}

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); 
    image.src = url;
  });

// --- REUSABLE TOAST ---
const ModalToast = ({ message, type }) => (
  <motion.div 
    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
    className={`absolute top-6 left-6 right-16 p-3 rounded-sm flex items-center gap-3 text-xs font-bold uppercase tracking-wide shadow-sm z-50 ${
      type === 'success' ? 'bg-[#F9F6F0] text-[#121212] border border-[#C5A059]/30' : 'bg-[#121212] text-red-400 border border-red-900'
    }`}
  >
    {type === 'success' ? <CheckCircle size={16} className="text-[#C5A059]"/> : <AlertCircle size={16}/>}
    {message}
  </motion.div>
);

export default function EditProfileModal({ user, isOpen, onClose, userHasPassword }) {
  const { update } = useSession();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // --- IMAGE CROP STATES ---
  const [cropSrc, setCropSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [preview, setPreview] = useState(null);
  const [blobForUpload, setBlobForUpload] = useState(null);

  // --- SECURITY STATES ---
  const [emailStep, setEmailStep] = useState(1); // 1: Form, 2: OTP
  const [pendingEmail, setPendingEmail] = useState('');

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- 1. GENERAL PROFILE HANDLERS ---
  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => setCropSrc(reader.result);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const performCrop = async () => {
    try {
      const croppedBlob = await getCroppedImg(cropSrc, croppedAreaPixels); 
      setPreview(URL.createObjectURL(croppedBlob));
      setBlobForUpload(croppedBlob);
      setCropSrc(null);
    } catch (e) { showToast('Error cropping image', 'error'); }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    if (blobForUpload) formData.append('image', blobForUpload, 'pfp.jpg');
    formData.append('email', user.email); 

    const res = await updateUserProfile(formData);
    if (res.success) {
      showToast('Profile Updated', 'success');
      await update();
      setTimeout(() => onClose(), 1000);
    } else {
      showToast(res.error || 'Failed', 'error');
    }
    setLoading(false);
  };

  // --- 2. PASSWORD HANDLER (Hybrid Support) ---
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const res = await changePassword(formData);
    if (res.success) {
      showToast('Password Updated Successfully', 'success');
      e.target.reset();
    } else {
      showToast(res.error, 'error');
    }
    setLoading(false);
  };

  // --- 3. EMAIL HANDLERS ---
  const handleEmailInitiate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const emailInput = formData.get('newEmail');
    
    const res = await initiateEmailChange(formData);
    
    if (res.success) {
      setPendingEmail(emailInput);
      setEmailStep(2);
      showToast('Verification Code Sent', 'success');
    } else {
      showToast(res.error, 'error');
    }
    setLoading(false);
  };

  const handleEmailVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    formData.append('newEmail', pendingEmail);
    const res = await verifyEmailChangeOTP(formData);
    if (res.success) {
      showToast('Email Changed! Please login again.', 'success');
      setTimeout(() => window.location.href = '/login', 2000);
    } else {
      showToast(res.error, 'error');
    }
    setLoading(false);
  };

  const currentImageSrc = preview || user.image || `https://ui-avatars.com/api/?name=${user.name}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-[#121212]/60 backdrop-blur-sm z-[100]" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-0 flex items-center justify-center z-[110] p-4 pointer-events-none">
            
            {/* --- CROPPER UI --- */}
            {cropSrc ? (
              <div className="bg-white w-full max-w-md rounded-sm shadow-2xl pointer-events-auto overflow-hidden h-[500px] flex flex-col border border-[#C5A059]/20">
                 <div className="relative flex-1 bg-black">
                    <Cropper image={cropSrc} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onCropComplete={(a, b) => setCroppedAreaPixels(b)} onZoomChange={setZoom} cropShape="round" showGrid={false} />
                 </div>
                 <div className="p-4 bg-white flex justify-end gap-4 border-t border-[#E5E5E5]">
                    <button onClick={() => setCropSrc(null)} className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[#8C8279] hover:text-[#121212] transition-colors">Cancel</button>
                    <button onClick={performCrop} className="px-8 py-3 bg-[#C5A059] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#121212] transition-colors shadow-lg">Apply</button>
                 </div>
              </div>
            ) : (
              
              /* --- MAIN MODAL --- */
              <div className="bg-white w-full max-w-4xl h-[85vh] max-h-[650px] rounded-sm shadow-2xl pointer-events-auto flex flex-col md:flex-row overflow-hidden relative border border-[#C5A059]/10">
                
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 hover:bg-[#F9F6F0] rounded-full transition text-[#8C8279] hover:text-[#C5A059]"><X size={20}/></button>
                {/* Toast */}
                <AnimatePresence>{toast && <ModalToast message={toast.msg} type={toast.type} />}</AnimatePresence>

                {/* LEFT SIDEBAR */}
                <div className="w-full md:w-72 bg-[#F9F6F0] border-r border-[#C5A059]/10 flex flex-col shrink-0">
                   <div className="p-8 pb-6 text-center border-b border-[#C5A059]/10 bg-white">
                      <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-4 border-[#F9F6F0] shadow-inner group relative">
                         <img src={currentImageSrc} alt="" className="w-full h-full object-cover"/>
                      </div>
                      <h3 className="font-heading font-normal text-xl text-[#121212] truncate px-2 uppercase tracking-wide">{user.name}</h3>
                      <p className="text-[10px] uppercase tracking-widest text-[#8C8279] mt-1 font-bold">Manage Account</p>
                   </div>
                   <nav className="flex-1 p-6 space-y-3">
                      <button onClick={() => setActiveTab('general')} className={`w-full flex items-center gap-4 px-5 py-4 text-xs font-bold uppercase tracking-widest transition-all duration-300 ${activeTab === 'general' ? 'bg-[#121212] text-white shadow-lg translate-x-1 border-l-4 border-[#C5A059]' : 'text-[#8C8279] hover:bg-white hover:text-[#C5A059]'}`}>
                         <User size={16} /> General
                      </button>
                      <button onClick={() => setActiveTab('security')} className={`w-full flex items-center gap-4 px-5 py-4 text-xs font-bold uppercase tracking-widest transition-all duration-300 ${activeTab === 'security' ? 'bg-[#121212] text-white shadow-lg translate-x-1 border-l-4 border-[#C5A059]' : 'text-[#8C8279] hover:bg-white hover:text-[#C5A059]'}`}>
                         <Shield size={16} /> Security
                      </button>
                   </nav>
                </div>

                {/* RIGHT CONTENT */}
                <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-white relative custom-scrollbar font-body">
                   
                   {/* --- TAB: GENERAL --- */}
                   {activeTab === 'general' && (
                     <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-md mx-auto pt-2">
                        <div className="mb-10 border-b border-[#C5A059]/20 pb-4">
                           <h2 className="font-heading font-normal text-3xl text-[#121212] mb-2 uppercase tracking-wide">Edit Profile</h2>
                           <p className="text-xs text-[#8C8279] uppercase tracking-widest font-medium">Update your personal details below.</p>
                        </div>

                        <form onSubmit={handleProfileUpdate} className="space-y-8">
                           <div className="flex items-center gap-6 p-5 border border-dashed border-[#C5A059]/30 bg-[#F9F6F0]/50">
                              <div className="w-16 h-16 rounded-full overflow-hidden border border-[#E5E5E5] shrink-0">
                                 <img src={currentImageSrc} className="w-full h-full object-cover" alt="Avatar"/>
                              </div>
                              <div>
                                 <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-[#E5E5E5] text-[10px] font-bold uppercase tracking-widest hover:border-[#C5A059] hover:text-[#C5A059] transition-colors shadow-sm">
                                    <Camera size={14}/> Change Photo
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                 </label>
                                 <p className="text-[9px] text-[#8C8279] mt-2 font-medium uppercase tracking-wide">JPG, PNG or GIF. Max 1MB.</p>
                              </div>
                           </div>

                           <div className="space-y-6">
                              <div>
                                 <label className="text-[9px] font-bold text-[#8C8279] uppercase tracking-widest block mb-2">Full Name</label>
                                 <div className="relative">
                                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8C8279]"/>
                                    <input name="name" defaultValue={user.name} className="w-full bg-transparent border-b border-[#E5E5E5] pl-10 pr-4 py-2 text-sm font-bold text-[#121212] focus:border-[#C5A059] outline-none transition-colors placeholder:text-[#E5E5E5] rounded-none" />
                                 </div>
                              </div>
                              <div>
                                 <label className="text-[9px] font-bold text-[#8C8279] uppercase tracking-widest block mb-2">Phone Number</label>
                                 <div className="relative">
                                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8C8279]"/>
                                    <input name="phone" defaultValue={user.phone} placeholder="+123..." className="w-full bg-transparent border-b border-[#E5E5E5] pl-10 pr-4 py-2 text-sm font-bold text-[#121212] focus:border-[#C5A059] outline-none transition-colors placeholder:text-[#E5E5E5] rounded-none" />
                                 </div>
                              </div>
                           </div>

                           <div className="pt-8 border-t border-[#E5E5E5]">
                              <button disabled={loading} className="w-full py-4 bg-[#C5A059] text-white text-xs font-bold uppercase tracking-[0.25em] hover:bg-[#121212] transition-colors disabled:opacity-70 flex items-center justify-center gap-2 shadow-md active:scale-[0.98] duration-200">
                                 {loading ? <Loader2 size={16} className="animate-spin"/> : <><Save size={16}/> Save Changes</>}
                              </button>
                           </div>
                        </form>
                     </motion.div>
                   )}

                   {/* --- TAB: SECURITY --- */}
                   {activeTab === 'security' && (
                     <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-md mx-auto pt-2 space-y-12">
                        <div className="mb-6 border-b border-[#C5A059]/20 pb-4">
                           <h2 className="font-heading font-normal text-3xl text-[#121212] mb-2 uppercase tracking-wide">Security</h2>
                           <p className="text-xs text-[#8C8279] uppercase tracking-widest font-medium">Manage password and contact info.</p>
                        </div>

                        {/* 1. CHANGE PASSWORD */}
                        <div className="space-y-6">
                           <h3 className="text-xs font-bold uppercase tracking-widest text-[#C5A059] border-b border-[#E5E5E5] pb-2 flex items-center gap-2">
                              <Lock size={14}/> {userHasPassword ? 'Change Password' : 'Set Password'}
                           </h3>
                           
                           <form onSubmit={handlePasswordUpdate} className="space-y-5">
                              {userHasPassword && (
                                <div className="relative">
                                    <KeyRound size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-[#8C8279]"/>
                                    <input type="password" name="currentPassword" placeholder="Current Password" required className="w-full bg-transparent border-b border-[#E5E5E5] pl-8 pr-4 py-2 text-sm font-bold text-[#121212] focus:border-[#C5A059] outline-none transition-colors rounded-none placeholder:text-[#E5E5E5]" />
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-6">
                                 <input type="password" name="newPassword" placeholder="New Password" required className="w-full bg-transparent border-b border-[#E5E5E5] py-2 text-sm font-bold text-[#121212] focus:border-[#C5A059] outline-none transition-colors rounded-none placeholder:text-[#E5E5E5]" />
                                 <input type="password" name="confirmPassword" placeholder="Confirm" required className="w-full bg-transparent border-b border-[#E5E5E5] py-2 text-sm font-bold text-[#121212] focus:border-[#C5A059] outline-none transition-colors rounded-none placeholder:text-[#E5E5E5]" />
                              </div>
                              <button disabled={loading} className="w-full py-3.5 bg-white border border-[#121212] text-[#121212] hover:bg-[#121212] hover:text-white transition-colors text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 mt-4">
                                 {loading ? <Loader2 size={14} className="animate-spin"/> : (userHasPassword ? 'Update Password' : 'Set Password')}
                              </button>
                           </form>
                        </div>

                        {/* 2. CHANGE EMAIL */}
                        <div className="space-y-6 pt-2">
                           <h3 className="text-xs font-bold uppercase tracking-widest text-[#C5A059] border-b border-[#E5E5E5] pb-2 flex items-center gap-2">
                              <Mail size={14}/> Email Address
                           </h3>
                           
                           {emailStep === 1 ? (
                              <form onSubmit={handleEmailInitiate} className="space-y-5">
                                 <div className="p-4 bg-[#F9F6F0] border border-[#C5A059]/20 flex items-center justify-between">
                                    <div>
                                       <label className="text-[9px] uppercase tracking-widest text-[#8C8279] block mb-1 font-bold">Current Email</label>
                                       <div className="text-sm font-bold text-[#121212]">{user.email}</div>
                                    </div>
                                    <CheckCircle size={18} className="text-[#C5A059]" />
                                 </div>
                                 
                                 <div className="relative">
                                    <Mail size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-[#8C8279]"/>
                                    <input type="email" name="newEmail" placeholder="New Email Address" required className="w-full bg-transparent border-b border-[#E5E5E5] pl-8 pr-4 py-2 text-sm font-bold text-[#121212] focus:border-[#C5A059] outline-none transition-colors rounded-none placeholder:text-[#E5E5E5]" />
                                 </div>
                                 
                                 {userHasPassword && (
                                    <div className="relative">
                                       <KeyRound size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-[#8C8279]"/>
                                       <input type="password" name="password" placeholder="Confirm with Password" required className="w-full bg-transparent border-b border-[#E5E5E5] pl-8 pr-4 py-2 text-sm font-bold text-[#121212] focus:border-[#C5A059] outline-none transition-colors rounded-none placeholder:text-[#E5E5E5]" />
                                    </div>
                                 )}

                                 <button disabled={loading} className="w-full py-3.5 bg-[#121212] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#C5A059] transition-colors flex items-center justify-center gap-2 shadow-md">
                                    {loading ? <Loader2 size={14} className="animate-spin"/> : <>Send Verification Code <ChevronRight size={14}/></>}
                                 </button>
                              </form>
                           ) : (
                              <form onSubmit={handleEmailVerify} className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                 <div className="bg-[#C5A059]/10 p-4 text-xs text-[#C5A059] border border-[#C5A059]/20 flex items-start gap-3 font-medium leading-relaxed">
                                    <Info size={16} className="shrink-0 mt-0.5"/>
                                    <span>We sent a 6-digit code to <b>{pendingEmail}</b>. Please enter it below to confirm.</span>
                                 </div>
                                 <input type="text" name="otp" placeholder="0 0 0 0 0 0" maxLength={6} required className="w-full bg-white border-2 border-[#E5E5E5] px-4 py-4 text-center text-xl font-heading font-bold tracking-[0.5em] focus:border-[#C5A059] focus:text-[#C5A059] outline-none transition-all placeholder:text-[#E5E5E5]" />
                                 <div className="flex gap-4">
                                    <button type="button" onClick={() => setEmailStep(1)} className="flex-1 py-3.5 bg-white border border-[#E5E5E5] text-xs font-bold uppercase tracking-widest text-[#8C8279] hover:text-[#121212] hover:border-[#121212] transition-colors">Back</button>
                                    <button disabled={loading} className="flex-[2] py-3.5 bg-[#C5A059] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#121212] transition-colors shadow-lg">
                                       {loading ? 'Verifying...' : 'Verify & Update'}
                                    </button>
                                 </div>
                              </form>
                           )}
                        </div>

                     </motion.div>
                   )}

                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}