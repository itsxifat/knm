'use client';

import { useCart } from '@/lib/context/CartContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createOrder, saveAddress } from '@/app/actions';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, MapPin, Truck, CreditCard, CheckCircle, Loader2, Sparkles, AlertTriangle, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Barcode from 'react-barcode'; 

// --- CUSTOM TAKA ICON ---
const Taka = ({ size = 14, className = "" }) => (
  <svg 
    width={size} 
    height={size+2} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={`inline-block align-middle ${className}`}
    style={{ transform: 'translateY(-1px)' }}
  >
    <text 
      x="50%" 
      y="58%" 
      dominantBaseline="middle" 
      textAnchor="middle" 
      fontSize="22" 
      fontWeight="bold" 
      fill="currentColor" 
      style={{ fontFamily: "'Bodoni Moda', serif" }} 
    >
      ৳
    </text>
  </svg>
);

// --- FULL SCREEN SUCCESS ANIMATION ---
const SuccessOverlay = () => (
  <motion.div 
    initial={{ opacity: 0 }} 
    animate={{ opacity: 1 }} 
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[200] bg-[#081210] flex flex-col items-center justify-center text-center p-6"
  >
    <motion.div 
      initial={{ scale: 0 }} 
      animate={{ scale: 1 }} 
      transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
      className="w-24 h-24 bg-[#C5A059] rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(197,160,89,0.4)]"
    >
      <Check size={48} className="text-white stroke-[3]" />
    </motion.div>

    <motion.h2 
      initial={{ y: 20, opacity: 0 }} 
      animate={{ y: 0, opacity: 1 }} 
      transition={{ delay: 0.4 }}
      className="font-heading font-normal text-4xl md:text-6xl text-white uppercase tracking-tight mb-4"
    >
      Order Confirmed
    </motion.h2>

    <motion.p 
      initial={{ y: 20, opacity: 0 }} 
      animate={{ y: 0, opacity: 1 }} 
      transition={{ delay: 0.5 }}
      className="text-white/60 text-xs md:text-sm font-bold uppercase tracking-[0.25em]"
    >
      Redirecting to your orders...
    </motion.p>
  </motion.div>
);

// --- ERROR MODAL ---
const ErrorModal = ({ error, onClose, actionLabel = "Return to Cart" }) => {
  if (!error) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-white p-8 max-w-sm w-full text-center shadow-2xl relative border border-[#C5A059]/20"
      >
        <div className="w-12 h-12 bg-red-50 flex items-center justify-center mx-auto mb-6 border border-red-100 rounded-full">
            <AlertTriangle size={24} className="text-[#C5A059]" />
        </div>
        <h3 className="font-heading font-normal text-2xl text-[#121212] uppercase mb-3">Order Issue</h3>
        <p className="text-xs text-[#57534E] mb-8 leading-relaxed font-medium">{error}</p>
        <button onClick={onClose} className="w-full bg-[#121212] text-white py-3.5 text-[10px] font-bold uppercase tracking-[0.25em] hover:bg-[#C5A059] transition-colors">
            {actionLabel}
        </button>
      </motion.div>
    </div>
  );
};

// --- COMPACT INPUT ---
const MinimalInput = ({ name, placeholder, value, onChange, type = "text", required = true, className="" }) => (
  <div className={`relative group pt-2 ${className}`}>
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder=" "
      required={required}
      className="peer block w-full border-b border-[#E5E5E5] bg-transparent py-2 text-xs font-bold text-[#121212] focus:border-[#C5A059] focus:outline-none transition-colors placeholder-transparent rounded-none"
    />
    <label className="absolute left-0 top-0 text-[9px] font-bold uppercase tracking-widest text-[#8C8279] transition-all 
      peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-[10px] peer-placeholder-shown:font-medium peer-placeholder-shown:text-[#8C8279] 
      peer-focus:top-0 peer-focus:text-[8px] peer-focus:font-bold peer-focus:text-[#C5A059]">
      {placeholder} {required && '*'}
    </label>
  </div>
);

export default function CheckoutClient({ savedAddresses = [] }) {
  const { cart, appliedCoupon, clearCart } = useCart(); 
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); 
  const [errorMsg, setErrorMsg] = useState(null); 
  const [authError, setAuthError] = useState(false); 
  
  const [useSavedAddress, setUseSavedAddress] = useState(savedAddresses.length > 0);
  const [selectedAddressId, setSelectedAddressId] = useState(savedAddresses[0]?._id || null);
  const [shippingMethod, setShippingMethod] = useState('inside');
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: '', postalCode: '', label: 'Home'
  });

  const cartSubTotal = cart.reduce((total, item) => {
    const effectivePrice = (item.discountPrice && item.discountPrice < item.price) ? item.discountPrice : item.price;
    return total + (effectivePrice * item.quantity);
  }, 0);

  const shippingCost = shippingMethod === 'inside' ? 80 : 150;
  const discountAmount = appliedCoupon ? appliedCoupon.amount : 0;
  const finalTotal = Math.max(0, cartSubTotal + shippingCost - discountAmount);

  useEffect(() => {
    if (cart.length === 0 && !isSuccess) router.push('/cart');
  }, [cart, router, isSuccess]);

  useEffect(() => {
    if (isSuccess) {
        const timer = setTimeout(() => {
            router.refresh();
            router.push('/account/orders'); 
        }, 3500); 
        return () => clearTimeout(timer);
    }
  }, [isSuccess, router]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleErrorClose = () => {
      setErrorMsg(null);
      if (authError) {
          router.push('/login'); 
      }
      setAuthError(false);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setAuthError(false);

    let finalData = {};
    if (useSavedAddress && selectedAddressId) {
      const addr = savedAddresses.find(a => a._id === selectedAddressId);
      finalData = { ...addr };
    } else {
      finalData = { ...formData };
      if (isSavingAddress) {
        const saveFormData = new FormData();
        Object.keys(formData).forEach(key => saveFormData.append(key, formData[key]));
        await saveAddress(saveFormData);
      }
    }

    const orderData = {
      guestInfo: {
        firstName: finalData.firstName, lastName: finalData.lastName,
        email: finalData.email, phone: finalData.phone,
        address: finalData.address, city: finalData.city, postalCode: finalData.postalCode
      },
      items: cart.map(item => {
        const effectivePrice = (item.discountPrice && item.discountPrice < item.price) ? item.discountPrice : item.price;
        return {
            product: item._id,
            name: item.name,
            price: effectivePrice,
            quantity: item.quantity,
            size: item.selectedSize || item.size || "STD", 
            image: item.images?.[0] || item.image || '/placeholder.jpg'
        };
      }),
      shippingAddress: {
        address: finalData.address, city: finalData.city,
        postalCode: finalData.postalCode, method: shippingMethod
      },
      couponCode: appliedCoupon?.code || null,
      totalAmount: finalTotal,
      paymentMethod: 'COD'
    };

    const res = await createOrder(orderData);

    if (res.success) {
      clearCart();
      setIsSuccess(true); 
    } else {
      if (res.error && (res.error.includes("log in") || res.error.includes("Unauthorized"))) {
          setAuthError(true);
      }
      setErrorMsg(res.error || "Order failed. Please try again.");
      setLoading(false);
    }
  };

  if (cart.length === 0 && !isSuccess) return null;

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 font-body bg-white min-h-screen selection:bg-[#C5A059] selection:text-white">
      
      <AnimatePresence>
        {isSuccess && <SuccessOverlay />}
      </AnimatePresence>

      <AnimatePresence>
        {errorMsg && (
            <ErrorModal 
                error={errorMsg} 
                onClose={handleErrorClose} 
                actionLabel={authError ? "Log In" : "Close"} 
            />
        )}
      </AnimatePresence>

      {/* --- HEADER --- */}
      <div className="flex items-center justify-between mb-10 border-b border-[#C5A059]/20 pb-4">
        <div className="flex items-center gap-4">
            <Link href="/cart" className="w-9 h-9 flex items-center justify-center border border-[#E5E5E5] hover:bg-[#121212] hover:text-white transition-all group">
               <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform text-[#57534E] group-hover:text-white"/>
            </Link>
            <div>
                <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#C5A059] block">Final Step</span>
                <h1 className="font-heading font-normal text-3xl md:text-4xl text-[#121212] uppercase tracking-tight leading-none">Checkout</h1>
            </div>
        </div>
        <div className="hidden md:block text-right">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#8C8279]">Total Payable</p>
            <p className="font-heading font-bold text-xl flex items-center justify-end gap-1 text-[#121212]"><Taka size={18}/>{finalTotal.toLocaleString()}</p>
        </div>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        
        {/* --- LEFT COLUMN: DETAILS --- */}
        <div className="lg:col-span-7 space-y-10">
          
          {/* 1. SHIPPING INFO */}
          <div>
             <h2 className="font-heading font-bold text-lg uppercase tracking-wide mb-6 flex items-center gap-3 text-[#121212]">
               <span className="w-6 h-6 bg-[#121212] text-white text-[10px] flex items-center justify-center font-bold">1</span>
               Shipping Details
             </h2>

             {savedAddresses.length > 0 && (
               <div className="mb-6 flex gap-6 border-b border-[#E5E5E5] pb-3">
                 <button type="button" onClick={() => setUseSavedAddress(true)} 
                    className={`pb-1 text-[10px] font-bold uppercase tracking-[0.2em] border-b-2 transition-all ${useSavedAddress ? 'border-[#C5A059] text-[#C5A059]' : 'border-transparent text-[#8C8279] hover:text-[#121212]'}`}>
                   Saved Addresses
                 </button>
                 <button type="button" onClick={() => setUseSavedAddress(false)} 
                    className={`pb-1 text-[10px] font-bold uppercase tracking-[0.2em] border-b-2 transition-all ${!useSavedAddress ? 'border-[#C5A059] text-[#C5A059]' : 'border-transparent text-[#8C8279] hover:text-[#121212]'}`}>
                   New Address
                 </button>
               </div>
             )}

             <AnimatePresence mode='wait'>
               {useSavedAddress && savedAddresses.length > 0 ? (
                 <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedAddresses.map((addr) => (
                      <div key={addr._id} onClick={() => setSelectedAddressId(addr._id)} 
                        className={`cursor-pointer p-5 border transition-all relative ${selectedAddressId === addr._id ? 'border-[#C5A059] bg-[#F9F6F0]' : 'border-[#E5E5E5] hover:border-[#121212]'}`}>
                        
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-[9px] font-bold uppercase tracking-wider bg-white border border-[#E5E5E5] px-2 py-1 text-[#121212]">{addr.label}</span>
                            {selectedAddressId === addr._id && <CheckCircle size={16} className="text-[#C5A059]" />}
                        </div>
                        <p className="font-heading font-bold text-sm text-[#121212] mb-1">{addr.firstName} {addr.lastName}</p>
                        <p className="text-[11px] text-[#57534E] leading-relaxed mb-2 truncate font-medium">{addr.address}</p>
                        <p className="text-[10px] font-mono text-[#8C8279]">{addr.phone}</p>
                      </div>
                    ))}
                 </motion.div>
               ) : (
                 <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-5">
                    <div className="grid grid-cols-2 gap-6">
                       <MinimalInput name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleInputChange} />
                       <MinimalInput name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleInputChange} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <MinimalInput name="phone" type="tel" placeholder="Phone Number" value={formData.phone} onChange={handleInputChange} />
                       <MinimalInput name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleInputChange} required={false} />
                    </div>
                    <MinimalInput name="address" placeholder="Street Address" value={formData.address} onChange={handleInputChange} />
                    <div className="grid grid-cols-2 gap-6">
                       <MinimalInput name="city" placeholder="City" value={formData.city} onChange={handleInputChange} />
                       <MinimalInput name="postalCode" placeholder="Postal Code" value={formData.postalCode} onChange={handleInputChange} />
                    </div>
                    
                    <div className="flex items-center gap-3 pt-3">
                       <input type="checkbox" id="saveAddr" checked={isSavingAddress} onChange={(e) => setIsSavingAddress(e.target.checked)} className="w-4 h-4 accent-[#121212] cursor-pointer border-[#E5E5E5]" />
                       <label htmlFor="saveAddr" className="text-[10px] font-bold text-[#57534E] cursor-pointer select-none tracking-wide uppercase">Save address for later</label>
                    </div>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>

          {/* 2. DELIVERY METHOD */}
          <div className="pt-8 border-t border-[#C5A059]/20">
             <h2 className="font-heading font-bold text-lg uppercase tracking-wide mb-6 flex items-center gap-3 text-[#121212]">
               <span className="w-6 h-6 bg-[#121212] text-white text-[10px] flex items-center justify-center font-bold">2</span>
               Delivery Method
             </h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {['inside', 'outside'].map((method) => (
                 <div key={method} onClick={() => setShippingMethod(method)} 
                    className={`cursor-pointer p-4 border transition-all flex items-center justify-between ${shippingMethod === method ? 'border-[#121212] bg-[#121212] text-white shadow-lg' : 'border-[#E5E5E5] hover:border-[#8C8279]'}`}>
                   <div>
                     <span className="text-[10px] font-bold uppercase tracking-[0.2em] block mb-1">
                       {method === 'inside' ? 'Inside Dhaka' : 'Outside Dhaka'}
                     </span>
                     <span className={`text-[9px] font-medium uppercase ${shippingMethod === method ? 'text-white/60' : 'text-[#8C8279]'}`}>
                        2-3 Business Days
                     </span>
                   </div>
                   <span className="text-sm font-heading font-bold flex items-center">
                     <Taka size={14}/>{method === 'inside' ? '80' : '150'}
                   </span>
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: COMPACT SUMMARY --- */}
        <div className="lg:col-span-5">
           <div className="bg-[#F9F6F0] p-8 border border-[#C5A059]/20 lg:sticky lg:top-8 relative">
             <div className="absolute top-0 right-0 w-12 h-12 bg-[#C5A059]/10 -translate-y-1/2 translate-x-1/2 rotate-45"></div>

             <h2 className="font-heading font-normal text-xl mb-6 flex items-center gap-2 uppercase tracking-wide text-[#121212]">
               Order Review ({cart.length})
             </h2>
             
             {/* LIST */}
             <div className="space-y-5 mb-8 max-h-[50vh] overflow-y-auto pt-2 pr-2 custom-scrollbar border-b border-[#C5A059]/10 pb-6">
                {cart.map((item) => {
                   const itemPrice = (item.discountPrice && item.discountPrice < item.price) ? item.discountPrice : item.price;
                   return (
                     <div key={`${item._id}-${item.selectedSize}`} className="flex gap-4 items-start relative group">
                        
                        <div className="relative flex-shrink-0">
                            <div className="w-14 h-20 bg-white border border-[#E5E5E5] overflow-hidden relative">
                                <Image 
                                    src={item.images?.[0] || item.image || '/placeholder.jpg'} 
                                    alt={item.name} 
                                    fill
                                    sizes="56px"
                                    className="object-cover"
                                />
                            </div>
                            <span className="absolute -top-2 -right-2 bg-[#121212] text-white text-[9px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md z-10">
                                {item.quantity}
                            </span>
                        </div>

                        <div className="flex-1 min-w-0 pt-1">
                           <div className="flex justify-between items-start mb-1">
                                <h4 className="font-heading font-normal text-xs text-[#121212] truncate uppercase tracking-wide max-w-[70%]">{item.name}</h4>
                                <p className="text-xs font-bold text-[#121212] flex items-center font-heading">
                                    <Taka size={12}/>{(itemPrice * item.quantity).toLocaleString()}
                                </p>
                           </div>
                           <p className="text-[9px] text-[#57534E] uppercase tracking-widest mt-1">
                              {item.selectedSize || "STD"} {item.sku && <span className="font-mono text-[#C5A059]/60">| {item.sku}</span>}
                           </p>
                           
                           {item.barcode && (
                              <div className="mt-2 opacity-30 mix-blend-multiply origin-left scale-[0.65]">
                                  <Barcode value={item.barcode} width={1} height={15} fontSize={0} displayValue={false} margin={0} background="transparent" />
                              </div>
                           )}
                        </div>
                     </div>
                   );
                })}
             </div>

             {/* Totals */}
             <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[#57534E]">
                   <span>Subtotal</span>
                   <span className="text-[#121212] flex items-center gap-1 font-heading"><Taka size={10}/>{cartSubTotal.toLocaleString()}</span>
                </div>
                {appliedCoupon && (
                   <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[#C5A059]">
                      <span>Discount</span>
                      <span className="flex items-center gap-1 font-heading">-<Taka size={10}/>{appliedCoupon.amount.toLocaleString()}</span>
                   </div>
                )}
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[#57534E]">
                   <span>Shipping</span>
                   <span className="text-[#121212] flex items-center gap-1 font-heading"><Taka size={10}/>{shippingCost.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-end pt-4 mt-2 border-t border-[#121212] border-dashed">
                   <span className="font-heading font-bold text-lg text-[#121212] uppercase">Total</span>
                   <span className="font-heading font-bold text-3xl text-[#C5A059] leading-none flex items-center gap-1">
                      <Taka size={20}/>{finalTotal.toLocaleString()}
                   </span>
                </div>
             </div>

             {/* Payment Mode */}
             <div className="mt-8 bg-white border border-[#E5E5E5] p-4 flex items-center gap-4 shadow-sm">
                <CreditCard size={18} className="text-[#C5A059]"/>
                <div>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-[#121212]">Cash On Delivery</p>
                   <p className="text-[9px] text-[#8C8279] font-medium">Pay securely upon delivery.</p>
                </div>
             </div>

             {/* Submit */}
             <button type="submit" disabled={loading} className="w-full mt-8 bg-[#C5A059] text-white py-4 text-[11px] font-bold uppercase tracking-[0.25em] hover:bg-[#121212] transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group shadow-md hover:shadow-xl">
                {loading ? <Loader2 className="animate-spin" size={16}/> : <>Confirm Order <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/></>}
             </button>

           </div>
        </div>

      </form>
    </div>
  );
}