'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/lib/context/CartContext';
import Link from 'next/link';
import Image from 'next/image'; 
import { Minus, Plus, X, ArrowRight, ShoppingBag, Ticket, Zap, AlertTriangle, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Barcode from 'react-barcode';

// --- CUSTOM TAKA ICON ---
const Taka = ({ size = 16, className = "" }) => (
  <svg 
    width={size} 
    height={size+2} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={`inline-block align-middle ${className}`}
    style={{ transform: 'translateY(-2px)' }}
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

// --- SUB-COMPONENT: CART ITEM ---
const CartItem = ({ item, updateQuantity, removeFromCart }) => {
  // 1. Safe Image Logic
  const rawImage = Array.isArray(item.images) ? item.images[0] : item.image;
  const imageUrl = rawImage || '/placeholder.jpg';

  // 2. Variant & Stock Logic
  const variantData = item.variants?.find(v => v.size === item.selectedSize);
  const stockLimit = variantData ? variantData.stock : (item.stock || 10);
  const isLowStock = stockLimit < 5 && stockLimit > 0;

  // 3. Price Logic
  const effectivePrice = (item.discountPrice && item.discountPrice < item.price) ? item.discountPrice : item.price;
  const isOnSale = effectivePrice < item.price;

  // 4. Tag Logic
  const displayTag = item.tag || item.tags?.[0]?.name;

  return (
    <motion.div 
      layout 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, height: 0, marginBottom: 0 }} 
      className="group relative flex flex-col sm:flex-row gap-5 md:gap-8 py-8 border-b border-[#C5A059]/10 last:border-0 bg-white hover:bg-[#F9F6F0]/50 transition-colors px-2 md:px-4"
    >
      {/* --- IMAGE SECTION --- */}
      <div className="flex gap-4 sm:block">
        <div className="w-24 sm:w-28 md:w-32 aspect-[3/4] bg-[#F5F2EA] relative overflow-hidden shrink-0 border border-transparent group-hover:border-[#C5A059]/20 transition-all duration-500">
          <Image 
            src={imageUrl} 
            alt={item.name} 
            fill
            sizes="(max-width: 768px) 100px, 150px"
            quality={90}
            className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
          />
        </div>
        
        {/* MOBILE: Delete Button */}
        <button 
          onClick={() => removeFromCart(item._id, item.selectedSize)} 
          className="sm:hidden text-[#8C8279] hover:text-[#C5A059] transition-colors p-1"
        >
          <X size={18} />
        </button>
      </div>

      {/* --- DETAILS SECTION --- */}
      <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
        <div>
          {/* Title Row */}
          <div className="flex justify-between items-start mb-2">
            <Link href={`/product/${item.slug || '#'}`} className="font-heading font-normal text-lg md:text-xl text-[#121212] uppercase tracking-wide leading-tight hover:text-[#C5A059] transition-colors line-clamp-2 pr-6">
              {item.name}
            </Link>
            {/* DESKTOP: Delete Button */}
            <button 
              onClick={() => removeFromCart(item._id, item.selectedSize)} 
              className="hidden sm:block text-[#8C8279] hover:text-[#C5A059] transition-colors p-1 -mr-2"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>
          
          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-[#57534E] mb-4">
              <span>{item.category?.name || 'Item'}</span>
              
              {item.selectedSize && (
                <>
                  <span className="w-1 h-1 bg-[#C5A059] rounded-full"></span>
                  <span className="text-[#121212] bg-[#F5F2EA] px-2 py-1 border border-[#C5A059]/10">
                    Size: {item.selectedSize}
                  </span>
                </>
              )}

               {displayTag && (
                <>
                  <span className="w-1 h-1 bg-[#C5A059] rounded-full"></span>
                  <span className="text-[#C5A059] bg-[#F5F2EA] px-2 py-1 border border-[#C5A059]/10">
                    {displayTag}
                  </span>
                </>
              )}
          </div>

          {/* Barcode & Stock */}
          <div className="flex flex-col gap-2 mb-4">
             {item.barcode && (
               <div className="opacity-30 origin-left scale-75 sm:scale-90 grayscale">
                 <Barcode 
                   value={item.barcode} 
                   width={1.2} height={25} fontSize={10} 
                   displayValue={false} background="transparent" lineColor="#000" margin={0}
                 />
               </div>
             )}

             {isLowStock && (
                <span className="text-[10px] text-[#B91C1C] font-medium uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle size={12} className="text-[#B91C1C]"/> Low Stock: Only {stockLimit} left
                </span>
             )}
          </div>

          {/* Controls & Price */}
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#C5A059]/10 sm:border-none">
              
              {/* Quantity */}
              <div className="flex items-center border border-[#E5E5E5] h-9 bg-white">
                <button 
                  onClick={() => updateQuantity(item._id, item.selectedSize, item.quantity - 1)} 
                  className="w-9 h-full flex items-center justify-center text-[#57534E] hover:bg-[#121212] hover:text-white transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center text-xs font-bold text-[#121212]">{item.quantity}</span>
                <button 
                  onClick={() => updateQuantity(item._id, item.selectedSize, item.quantity + 1)} 
                  disabled={item.quantity >= stockLimit}
                  className="w-9 h-full flex items-center justify-center text-[#57534E] hover:bg-[#121212] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Price Display */}
              <div className="text-right flex flex-col items-end">
                {isOnSale ? (
                   <>
                      <span className="text-sm font-bold text-[#C5A059] flex items-center gap-0.5">
                        <Taka size={14} />{(effectivePrice * item.quantity).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-[#8C8279] line-through flex items-center gap-0.5 mt-0.5">
                        <Taka size={10} />{(item.price * item.quantity).toLocaleString()}
                      </span>
                   </>
                ) : (
                   <span className="text-sm font-bold flex items-center gap-0.5 text-[#121212]">
                     <Taka size={14} />{(effectivePrice * item.quantity).toLocaleString()}
                   </span>
                )}
              </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- MAIN PAGE ---
export default function CartClient() {
  const { 
    cart, removeFromCart, updateQuantity, 
    appliedCoupon, applyCouponCode, removeCoupon, manualCode, couponError 
  } = useCart();

  const [mounted, setMounted] = useState(false);
  const [inputVal, setInputVal] = useState('');

  useEffect(() => { if(manualCode) setInputVal(manualCode); }, [manualCode]);
  useEffect(() => { setMounted(true); }, []);

  const handleApply = () => { if (inputVal.trim()) applyCouponCode(inputVal); };
  const handleRemove = () => { removeCoupon(); setInputVal(''); };

  // Calculate Totals Locally
  const localSubTotal = cart.reduce((acc, item) => {
      const price = (item.discountPrice && item.discountPrice < item.price) ? item.discountPrice : item.price;
      return acc + (price * item.quantity);
  }, 0);

  const localGrandTotal = localSubTotal - (appliedCoupon ? appliedCoupon.amount : 0);

  if (!mounted) return null;

  // --- EMPTY STATE ---
  if (cart.length === 0) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center font-body bg-white relative px-6 text-center">
      <div className="mb-8 p-8 rounded-full bg-[#F9F6F0] border border-[#C5A059]/20">
        <ShoppingBag size={32} className="text-[#C5A059]" strokeWidth={1} />
      </div>
      <h1 className="font-heading font-normal text-4xl uppercase tracking-tight mb-4 text-[#121212]">Your Bag is Empty</h1>
      <p className="text-xs text-[#8C8279] mb-10 uppercase tracking-[0.2em] font-medium">Start curating your wardrobe with our latest pieces.</p>
      <Link href="/category" className="px-10 py-4 bg-[#121212] text-white text-[11px] font-bold uppercase tracking-[0.25em] hover:bg-[#C5A059] transition-colors duration-500">
        View Collections
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-body relative pb-24 selection:bg-[#C5A059] selection:text-white">
      
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16 md:py-24 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 border-b border-[#C5A059]/30 pb-8">
           <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C5A059] block mb-3">Cart Review</span>
              <h1 className="font-heading font-normal text-5xl md:text-7xl text-[#121212] uppercase tracking-tight leading-none">Shopping Bag</h1>
           </div>
           <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8C8279] mt-6 md:mt-0">
             {cart.length} {cart.length === 1 ? 'Item' : 'Items'}
           </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
          
          {/* LEFT: Items List */}
          <div className="lg:col-span-7">
              <div className="flex flex-col gap-0 border-t border-[#C5A059]/10">
                <AnimatePresence mode='popLayout'>
                  {cart.map((item) => (
                    <CartItem 
                      key={`${item._id}-${item.selectedSize}`} 
                      item={item} 
                      updateQuantity={updateQuantity} 
                      removeFromCart={removeFromCart} 
                    />
                  ))}
                </AnimatePresence>
              </div>
          </div>

          {/* RIGHT: Summary & Checkout */}
          <div className="lg:col-span-5 lg:sticky lg:top-32">
            <div className="bg-[#F9F6F0] p-8 md:p-10 border border-[#C5A059]/20 shadow-sm relative overflow-hidden">
              {/* Decorative Corner */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#C5A059]/5 -translate-y-1/2 translate-x-1/2 rotate-45"></div>

              <h2 className="font-heading font-normal text-2xl uppercase tracking-wide mb-8 flex items-center gap-3 text-[#121212]">
                Order Summary
              </h2>
              
              {/* COUPON SECTION */}
              <div className="mb-10">
                  {appliedCoupon && (
                    <div className="p-4 mb-5 flex justify-between items-center border border-[#C5A059]/30 bg-white">
                      <div className="flex items-center gap-4">
                          {appliedCoupon.isAuto ? <Zap size={16} className="text-[#C5A059]" /> : <Ticket size={16} className="text-[#121212]" />}
                          <div>
                             <span className="text-[11px] font-bold uppercase tracking-widest text-[#121212] block mb-0.5">
                                {appliedCoupon.isAuto ? "Auto Applied" : appliedCoupon.code}
                             </span>
                             <span className="text-[10px] font-medium text-[#C5A059]">{appliedCoupon.desc}</span>
                          </div>
                       </div>
                       {!appliedCoupon.isAuto && (
                          <button onClick={handleRemove} className="text-[#8C8279] hover:text-[#121212] transition-colors"><X size={16}/></button>
                       )}
                    </div>
                  )}

                  {(!appliedCoupon || appliedCoupon.isAuto) && (
                    <div className="flex gap-0 border border-[#C5A059]/30 bg-white">
                        <input 
                          value={inputVal}
                          onChange={(e) => setInputVal(e.target.value.toUpperCase())}
                          placeholder="PROMO CODE"
                          className="flex-1 bg-transparent py-3 px-5 text-xs font-bold uppercase tracking-widest outline-none text-[#121212] placeholder-[#8C8279]/50"
                        />
                        <button 
                          onClick={handleApply}
                          disabled={!inputVal}
                          className="px-6 bg-[#121212] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#C5A059] disabled:opacity-50 disabled:hover:bg-[#121212] transition-colors border-l border-[#121212]"
                        >
                          Apply
                        </button>
                    </div>
                  )}
                  {couponError && <p className="text-[10px] text-[#B91C1C] mt-3 font-bold uppercase tracking-wide flex items-center gap-1.5"><AlertTriangle size={12}/> {couponError}</p>}
              </div>

              {/* CALCULATIONS */}
              <div className="space-y-4 mb-10 border-t border-[#C5A059]/10 pt-8">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-[#57534E]">
                  <span>Subtotal</span>
                  <span className="text-[#121212] flex items-center gap-1">
                    <Taka size={12} />{localSubTotal.toLocaleString()}
                  </span>
                </div>
                
                {appliedCoupon && (
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-[#C5A059]">
                    <span>Discount</span>
                    <span className="flex items-center gap-1">
                      -<Taka size={12} />{appliedCoupon.amount.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-[#57534E]">
                  <span>Delivery</span>
                  <span className="text-[9px] bg-[#121212] text-white px-2 py-0.5">Calculated Next</span>
                </div>
              </div>

              {/* TOTAL */}
              <div className="flex justify-between items-end mb-10 pt-8 border-t border-[#121212] border-dashed">
                <span className="text-sm font-bold uppercase tracking-widest text-[#121212]">Total</span>
                <span className="font-heading font-normal text-4xl text-[#121212] leading-none flex items-center gap-1">
                   <Taka size={28} />{localGrandTotal.toLocaleString()}
                </span>
              </div>

              {/* ACTIONS */}
              <Link href="/checkout" className="group block w-full bg-[#C5A059] text-white text-center py-5 text-[11px] font-bold uppercase tracking-[0.25em] hover:bg-[#121212] transition-all shadow-md hover:shadow-xl">
                  Secure Checkout <ArrowRight size={14} className="inline ml-3 mb-0.5 group-hover:translate-x-2 transition-transform duration-300" />
              </Link>
              
              <div className="mt-6 text-center">
                <Link href="/category" className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C8279] hover:text-[#121212] border-b border-transparent hover:border-[#121212] transition-all pb-0.5">
                  Continue Shopping
                </Link>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}