'use client';

import { useEffect, useState, useMemo } from 'react';
import { getUserOrders, submitReview, getOrderReview } from '@/app/actions'; 
import { CheckCircle, XCircle, Clock, ShoppingBag, Loader2, MapPin, Receipt, Ticket, Zap, ScanLine, Star, PenLine, Send, X, AlertCircle, Search, Filter, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import InvoiceModal from './InvoiceTemplate';
import Barcode from 'react-barcode';

// --- CUSTOM TAKA ICON ---
const Taka = ({ size = 12, className = "" }) => (
  <svg width={size} height={size+2} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block align-middle ${className}`} style={{ transform: 'translateY(-1px)' }}>
    <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fontSize="22" fontWeight="bold" fill="currentColor" style={{ fontFamily: "var(--font-heading)" }}>৳</text>
  </svg>
);

const PLACEHOLDER_IMG = "/placeholder.jpg";

// --- VARIANTS ---
const containerVariants = { 
  hidden: { opacity: 0 }, 
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } } 
};
const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

// --- NOTIFICATION ---
const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, scale: 0.9 }} 
      animate={{ opacity: 1, y: 0, scale: 1 }} 
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] flex items-center gap-4 px-6 py-4 rounded-sm shadow-2xl min-w-[320px] border-l-4 ${
        type === 'success' ? 'bg-[#121212] border-[#C5A059] text-white' : 'bg-[#121212] border-red-500 text-white'
      }`}
    >
      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${type === 'success' ? 'bg-[#C5A059]/20 text-[#C5A059]' : 'bg-red-500/20 text-red-500'}`}>
         {type === 'success' ? <CheckCircle size={14}/> : <AlertCircle size={14}/>}
      </div>
      <div className="flex-1">
         <h4 className="font-heading font-bold uppercase text-[10px] tracking-widest mb-0.5 text-[#C5A059]">{type === 'success' ? 'Success' : 'Notice'}</h4>
         <p className="text-xs text-[#8C8279] font-medium leading-tight">{message}</p>
      </div>
      <button onClick={onClose}><X size={14} className="text-[#57534E] hover:text-white transition-colors"/></button>
    </motion.div>
  );
};

// --- REVIEW MODAL ---
const ReviewModal = ({ isOpen, onClose, product, orderId, showNotification, refreshOrders }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [editInfo, setEditInfo] = useState({ isEdit: false, count: 0 });

  useEffect(() => {
    const checkReview = async () => {
       if(!isOpen) return;
       setFetching(true);
       const rawId = product.product?._id || product.product || product.productId || product._id;
       const res = await getOrderReview({ productId: rawId, orderId });
       
       if (res.found) {
          setRating(res.rating);
          setComment(res.comment);
          setEditInfo({ isEdit: true, count: res.editCount });
       }
       setFetching(false);
    };
    checkReview();
  }, [isOpen, product, orderId]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!comment.trim()) return showNotification("Please write a comment.", "error");
    if (editInfo.isEdit && editInfo.count >= 3) return showNotification("Edit limit (3) reached.", "error");

    setSubmitting(true);
    const rawId = product.product?._id || product.product || product.productId || product._id;

    try {
      const result = await submitReview({ productId: rawId, rating, comment, orderId });
      if (result.success) {
        showNotification(editInfo.isEdit ? "Review updated." : "Review submitted.", "success");
        refreshOrders(); 
        onClose();
      } else {
        showNotification(result.error || "Submission failed", "error");
      }
    } catch (error) {
      showNotification("An unexpected error occurred.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#121212]/90 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#F9F6F0] w-full max-w-md shadow-2xl overflow-hidden border border-[#C5A059]/20 relative flex flex-col max-h-[90vh] rounded-sm"
      >
        {fetching && (
            <div className="absolute inset-0 bg-[#F9F6F0]/95 z-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="animate-spin text-[#C5A059]" size={32}/>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C8279]">Loading Review...</span>
            </div>
        )}

        <div className="bg-[#121212] text-white p-6 flex justify-between items-start border-b border-[#C5A059]/20">
          <div>
            <div className="flex items-center gap-3 mb-1">
                <h3 className="font-heading font-normal text-xl uppercase tracking-wide text-[#C5A059]">
                    {editInfo.isEdit ? "Update Review" : "Write Review"}
                </h3>
                {editInfo.isEdit && (
                    <span className={`text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider ${editInfo.count >= 3 ? 'bg-red-900 text-red-200' : 'bg-[#C5A059]/20 text-[#C5A059]'}`}>
                        Edit {editInfo.count}/3
                    </span>
                )}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#8C8279] line-clamp-1">{product.name}</p>
          </div>
          <button onClick={onClose} className="text-[#8C8279] hover:text-[#C5A059] transition-colors"><X size={20}/></button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar font-body">
          <div className="flex flex-col items-center mb-8">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C8279] mb-4">Rate Quality</span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)} className="p-1 transition-transform hover:scale-110 focus:outline-none group">
                  <Star size={28} fill={star <= rating ? "#C5A059" : "transparent"} className={star <= rating ? "text-[#C5A059]" : "text-[#E5E5E5] group-hover:text-[#C5A059]/50"} strokeWidth={1.2} />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C8279] mb-3 block">Your Feedback</label>
            <textarea 
              className="w-full border border-[#E5E5E5] bg-white p-4 text-sm font-medium text-[#121212] focus:border-[#C5A059] outline-none min-h-[140px] resize-none placeholder:text-[#E5E5E5] transition-all rounded-sm"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>

        <div className="p-6 border-t border-[#E5E5E5] bg-white">
            <button 
                onClick={handleSubmit} 
                disabled={submitting || (editInfo.isEdit && editInfo.count >= 3)} 
                className="w-full bg-[#C5A059] text-white py-4 text-[11px] font-bold uppercase tracking-[0.25em] hover:bg-[#121212] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3 shadow-md"
            >
                {submitting ? <Loader2 className="animate-spin" size={14}/> : (editInfo.isEdit ? <PenLine size={14}/> : <Send size={14}/>)}
                {editInfo.isEdit ? "Update Review" : "Submit Review"}
            </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- MAIN CLIENT ---
export default function OrdersClient() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const [notification, setNotification] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewProduct, setReviewProduct] = useState(null);
  const [reviewOrderId, setReviewOrderId] = useState(null);

  const fetchOrders = async () => {
    if(orders.length === 0) setLoading(true);
    try {
      const data = await getUserOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load orders", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const openReviewModal = (item, orderId) => {
    setReviewProduct(item);
    setReviewOrderId(orderId);
    setReviewModalOpen(true);
  };

  const triggerNotification = (message, type = 'success') => {
      setNotification({ message, type });
  };

  const filteredOrders = useMemo(() => {
      return orders.filter(order => {
          const q = searchQuery.toLowerCase();
          const matchesSearch = !q || order.orderId?.toLowerCase().includes(q) || order.items.some(i => i.name.toLowerCase().includes(q) || i.sku?.toLowerCase().includes(q));
          const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
          const total = order.totalAmount || 0;
          const minP = priceRange.min ? parseFloat(priceRange.min) : 0;
          const maxP = priceRange.max ? parseFloat(priceRange.max) : Infinity;
          const matchesPrice = total >= minP && total <= maxP;
          const orderDate = new Date(order.createdAt);
          const startD = dateRange.start ? new Date(dateRange.start) : null;
          const endD = dateRange.end ? new Date(dateRange.end) : null;
          if (endD) endD.setHours(23, 59, 59, 999);
          const matchesDate = (!startD || orderDate >= startD) && (!endD || orderDate <= endD);
          return matchesSearch && matchesStatus && matchesPrice && matchesDate;
      });
  }, [orders, searchQuery, filterStatus, priceRange, dateRange]);

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center font-body bg-white">
      <div className="w-12 h-12 border border-[#C5A059] border-t-transparent rounded-full animate-spin mb-6"></div>
      <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#121212]">Loading History...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-white pb-32 font-body px-4 md:px-8 selection:bg-[#C5A059] selection:text-white">
      
      <AnimatePresence>
        {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {selectedInvoiceOrder && <InvoiceModal order={selectedInvoiceOrder} onClose={() => setSelectedInvoiceOrder(null)} />}
      </AnimatePresence>

      {reviewModalOpen && (
        <ReviewModal 
          isOpen={reviewModalOpen} 
          onClose={() => setReviewModalOpen(false)} 
          product={reviewProduct}
          orderId={reviewOrderId}
          showNotification={triggerNotification}
          refreshOrders={fetchOrders} 
        />
      )}

      <div className="max-w-6xl mx-auto">
        <div className="mb-10 border-b border-[#C5A059]/20 pb-8 flex flex-col md:flex-row justify-between items-end gap-8">
           <div>
              <h1 className="font-heading font-normal text-4xl md:text-5xl text-[#121212] uppercase tracking-tight leading-none">Order History</h1>
           </div>
           <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C8279]">Total Orders</span>
              <p className="text-3xl font-heading text-[#121212] leading-none mt-1">{orders.length}</p>
           </div>
        </div>

        {/* --- FILTER BAR --- */}
        <div className="mb-14 bg-[#F9F6F0] p-8 border border-[#C5A059]/10 rounded-sm shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="relative group">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-[#8C8279] mb-2 block">Search</label>
                    <div className="relative">
                        <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-[#8C8279] w-4 h-4 group-focus-within:text-[#C5A059] transition-colors"/>
                        <input type="text" placeholder="ID, SKU, Product..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-6 pr-4 py-2 bg-transparent border-b border-[#E5E5E5] text-xs font-bold text-[#121212] focus:border-[#C5A059] outline-none transition-colors placeholder:font-normal placeholder:text-[#E5E5E5] rounded-none"/>
                    </div>
                </div>
                <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-[#8C8279] mb-2 block">Status</label>
                    <div className="relative">
                        <Filter className="absolute left-0 top-1/2 -translate-y-1/2 text-[#8C8279] w-3 h-3"/>
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full pl-6 pr-8 py-2 bg-transparent border-b border-[#E5E5E5] text-xs font-bold text-[#121212] focus:border-[#C5A059] outline-none appearance-none cursor-pointer rounded-none">
                            <option value="All">All Status</option>
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                        <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-[#8C8279] w-3 h-3 pointer-events-none"/>
                    </div>
                </div>
                <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-[#8C8279] mb-2 block">Date</label>
                    <div className="flex gap-4">
                        <input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} className="w-full py-2 bg-transparent border-b border-[#E5E5E5] text-[10px] font-bold text-[#121212] focus:border-[#C5A059] outline-none uppercase rounded-none"/>
                        <input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} className="w-full py-2 bg-transparent border-b border-[#E5E5E5] text-[10px] font-bold text-[#121212] focus:border-[#C5A059] outline-none uppercase rounded-none"/>
                    </div>
                </div>
                <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-[#8C8279] mb-2 block">Price (৳)</label>
                    <div className="flex gap-4 items-center">
                        <input type="number" placeholder="MIN" value={priceRange.min} onChange={(e) => setPriceRange({...priceRange, min: e.target.value})} className="w-full py-2 bg-transparent border-b border-[#E5E5E5] text-xs font-bold text-[#121212] focus:border-[#C5A059] outline-none placeholder:text-[#E5E5E5] rounded-none"/>
                        <span className="text-[#E5E5E5]">-</span>
                        <input type="number" placeholder="MAX" value={priceRange.max} onChange={(e) => setPriceRange({...priceRange, max: e.target.value})} className="w-full py-2 bg-transparent border-b border-[#E5E5E5] text-xs font-bold text-[#121212] focus:border-[#C5A059] outline-none placeholder:text-[#E5E5E5] rounded-none"/>
                    </div>
                </div>
            </div>
        </div>

        {/* --- ORDERS LIST --- */}
        {filteredOrders.length === 0 ? (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32 bg-[#F9F6F0] border border-[#C5A059]/10 border-dashed rounded-sm">
             <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 border border-[#E5E5E5] shadow-sm">
                <ShoppingBag size={24} className="text-[#C5A059]" strokeWidth={1.2}/>
             </div>
             <h2 className="font-heading font-normal text-2xl text-[#121212] uppercase mb-4 tracking-wide">No Matching Orders</h2>
             <button onClick={() => { setSearchQuery(''); setFilterStatus('All'); setPriceRange({min:'', max:''}); setDateRange({start:'', end:''}); }} className="text-[10px] font-bold uppercase tracking-widest text-[#C5A059] border-b border-[#C5A059] pb-0.5 hover:text-[#121212] hover:border-[#121212] transition-colors">
                Clear All Filters
             </button>
           </motion.div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-12">
            {filteredOrders.map(order => {
              const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
              const shipping = order.shippingAddress?.method === 'outside' ? 150 : 80;
              const hasDiscount = order.totalAmount < (subtotal + shipping);

              return (
                <motion.div key={order._id} variants={itemVariants} className="bg-white border border-[#E5E5E5] group hover:border-[#C5A059]/30 transition-all shadow-sm hover:shadow-md overflow-hidden rounded-sm">
                  
                  {/* --- ORDER HEADER --- */}
                  <div className="px-8 py-5 border-b border-[#E5E5E5] bg-[#F9F6F0] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="flex items-center gap-8">
                          <div className="flex flex-col">
                             <span className="text-[9px] font-bold uppercase tracking-widest text-[#8C8279] mb-1">Order ID</span>
                             <span className="text-sm font-heading text-[#121212] tracking-wide">#{order.orderId ? order.orderId.slice(-6) : 'REF'}</span>
                          </div>
                          <div className="w-[1px] h-8 bg-[#C5A059]/20 hidden md:block"></div>
                          <div className="flex flex-col">
                             <span className="text-[9px] font-bold uppercase tracking-widest text-[#8C8279] mb-1">Date</span>
                             <span className="text-xs font-bold text-[#121212]">
                                {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                             </span>
                          </div>
                      </div>
                      
                      <div className={`inline-flex items-center gap-2 px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest border rounded-sm
                        ${order.status === 'Delivered' ? 'bg-[#121212] text-[#C5A059] border-[#121212]' : 
                          order.status === 'Cancelled' ? 'bg-[#121212] text-red-400 border-red-900' : 
                          'bg-white text-[#57534E] border-[#E5E5E5]'
                        }`}>
                        {order.status === 'Delivered' ? <CheckCircle size={10}/> : order.status === 'Cancelled' ? <XCircle size={10}/> : <Clock size={10}/>}
                        {order.status}
                      </div>
                  </div>

                  {/* --- ITEMS --- */}
                  <div className="p-8 space-y-10">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex gap-8 items-start">
                        <div className="w-24 h-28 bg-[#F5F2EA] overflow-hidden flex-shrink-0 relative border border-[#E5E5E5] shadow-sm group-hover:border-[#C5A059]/30 transition-colors">
                          <Image 
                            src={item.image || PLACEHOLDER_IMG} 
                            alt={item.name}
                            fill
                            sizes="100px"
                            className="object-cover"
                            onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMG; }}
                          />
                        </div>
                        <div className="flex-1 min-w-0 py-1">
                          <div className="flex justify-between items-start">
                             <div className="flex-1">
                                <h4 className="font-heading font-normal text-lg text-[#121212] uppercase tracking-wide leading-tight mb-3">{item.name}</h4>
                                <div className="flex flex-wrap gap-6 text-[10px] font-bold uppercase tracking-widest text-[#8C8279]">
                                   {item.size && <span>Size: <span className="text-[#121212]">{item.size}</span></span>}
                                   <span>Qty: <span className="text-[#121212]">{item.quantity}</span></span>
                                </div>
                                <div className="mt-3 text-[10px] text-[#8C8279] font-mono flex items-center gap-3 opacity-60">
                                   <span className="flex items-center gap-1"><ScanLine size={10}/> {item.sku || 'N/A'}</span>
                                   {item.barcode && (
                                      <div className="opacity-80 mix-blend-multiply origin-left scale-75 h-5 overflow-hidden w-24">
                                          <Barcode value={item.barcode} width={1} height={20} fontSize={0} displayValue={false} margin={0} background="transparent" />
                                      </div>
                                   )}
                                </div>
                                
                                {item.hasReviewed && (
                                    <div className="mt-5 p-4 bg-[#F9F6F0] border-l-2 border-[#C5A059] max-w-lg">
                                            <div className="flex items-center gap-3 mb-1.5">
                                                <div className="flex text-[#C5A059]">
                                                    {[...Array(5)].map((_, idx) => (
                                                        <Star key={idx} size={10} fill={idx < (item.userRating || 5) ? "#C5A059" : "transparent"} strokeWidth={1} />
                                                    ))}
                                                </div>
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-[#8C8279]">Your Review</span>
                                            </div>
                                            <p className="text-xs text-[#57534E] italic leading-relaxed">"{item.userComment}"</p>
                                    </div>
                                )}
                             </div>
                             
                             <div className="text-right flex flex-col items-end gap-3 pl-6">
                                <span className="text-sm font-heading font-bold flex items-center gap-1 text-[#121212]"><Taka size={14}/> {item.price.toLocaleString()}</span>
                                
                                {order.status === 'Delivered' && (
                                  <button 
                                    onClick={() => openReviewModal(item, order._id)}
                                    className={`flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest transition-colors mt-2 group/btn border-b pb-0.5
                                        ${item.hasReviewed ? 'text-[#8C8279] border-transparent hover:text-[#121212]' : 'text-[#C5A059] border-[#C5A059] hover:text-[#121212] hover:border-[#121212]'}
                                    `}
                                  >
                                    <PenLine size={12} className="group-hover/btn:-translate-y-0.5 transition-transform" />
                                    <span>{item.hasReviewed ? "Edit Review" : "Write Review"}</span>
                                  </button>
                                )}
                             </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* --- FOOTER INFO --- */}
                  <div className="bg-[#F9F6F0]/50 border-t border-[#E5E5E5] p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div>
                      <h5 className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#C5A059] mb-4 flex items-center gap-2"><MapPin size={12}/> Destination</h5>
                      <div className="text-xs font-medium text-[#57534E] leading-loose pl-4 border-l border-[#C5A059]/30">
                        <p className="font-bold text-[#121212] uppercase tracking-wide">{order.guestInfo?.firstName} {order.guestInfo?.lastName}</p>
                        <p>{order.shippingAddress?.address || order.guestInfo?.address}</p>
                        <p>{order.shippingAddress?.city}, {order.shippingAddress?.postalCode}</p>
                        <p className="mt-2 font-mono text-[#8C8279]">{order.guestInfo?.phone}</p>
                      </div>
                    </div>
                    <div>
                        <div className="bg-white p-6 border border-[#E5E5E5] shadow-sm relative overflow-hidden">
                           {hasDiscount && (
                             <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-[#C5A059] border-b border-dashed border-[#E5E5E5] pb-3 mb-3">
                                <span className="flex items-center gap-2">{order.couponCode ? <Ticket size={12}/> : <Zap size={12}/>}{order.couponCode ? `Code: ${order.couponCode}` : 'Discount'}</span>
                                <span>Active</span>
                             </div>
                           )}
                           <div className="space-y-3 mb-5">
                              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[#8C8279]"><span>Subtotal</span><span className="text-[#121212]"><Taka size={10}/> {subtotal.toLocaleString()}</span></div>
                              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[#8C8279]"><span>Shipping</span><span className="text-[#121212]"><Taka size={10}/> {shipping.toLocaleString()}</span></div>
                           </div>
                           <div className="flex justify-between items-center pt-4 border-t-2 border-[#121212]">
                              <span className="text-xs font-bold text-[#121212] uppercase tracking-widest">Total Paid</span>
                              <span className="font-heading font-bold text-2xl text-[#121212] flex items-center gap-1"><Taka size={18}/> {order.totalAmount?.toLocaleString()}</span>
                           </div>
                        </div>
                        <div className="mt-5 flex justify-end">
                           <button onClick={() => setSelectedInvoiceOrder(order)} className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.2em] border border-[#121212] px-6 py-3.5 hover:bg-[#121212] hover:text-white transition-all shadow-sm hover:shadow-md"><Receipt size={14} /> View Invoice</button>
                        </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}