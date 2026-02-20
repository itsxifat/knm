'use client';

import React, { useEffect, useState, useMemo } from 'react'; 
import { getAdminOrders, updateOrderStatus } from '@/actions/orders'; // Adjust path if needed
import { checkFraud } from '@/actions/fraud'; 
import { sendToSteadfast, bulkShipToSteadfast } from '@/actions/steadfast'; 
import { 
  Package, Truck, Check, X, Search, 
  ChevronDown, ChevronUp, MapPin, 
  User, CreditCard, ShoppingBag, 
  ShieldAlert, Send, Loader2, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast'; 
import Barcode from 'react-barcode'; 

// --- TAKA SVG COMPONENT ---
const Taka = ({ size = 14, className = "", weight = "bold" }) => (
  <svg width={size} height={size+2} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block align-middle ${className}`}>
    <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="20" fontWeight={weight === 'bold' ? 'bold' : 'normal'} fill="currentColor" style={{ fontFamily: "var(--font-heading)" }}>৳</text>
  </svg>
);

// --- HELPER: FORMAT ID ---
const formatOrderId = (id) => {
  if (!id) return '';
  return id.startsWith('#') ? id : `#${id}`;
};

// --- COMPONENT: FRAUD CHECK MODAL ---
const FraudCheckModal = ({ isOpen, onClose, customer }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (isOpen && customer) {
      setLoading(true);
      checkFraud(customer.phone)
        .then(result => { setData(result); setLoading(false); })
        .catch(err => { console.error(err); setLoading(false); });
    } else {
      setData(null);
    }
  }, [isOpen, customer]);

  if (!isOpen) return null;

  const getSteadfastStats = () => {
      if (!data?.sources?.steadfast) return { total: 0, delivered: 0, returned: 0 };
      const s = data.sources.steadfast;
      return {
          total: (s.total_delivered || 0) + (s.total_cancelled || 0),
          delivered: s.total_delivered || 0,
          returned: s.total_cancelled || 0
      };
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#121212]/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-sm w-full max-w-md shadow-2xl overflow-hidden font-body border border-[#C5A059]/20"
      >
        <div className="bg-[#041610] text-[#F9F6F0] p-6 flex justify-between items-center relative overflow-hidden border-b border-[#C5A059]/30">
           {/* Decorative Corner */}
           <div className="absolute top-0 right-0 w-20 h-20 bg-[#C5A059]/10 rounded-bl-full -mr-8 -mt-8 pointer-events-none"></div>
           
           <div className="relative z-10">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#C5A059] block mb-1">Risk Analysis</span>
              <h3 className="font-heading uppercase tracking-wide text-2xl text-white">{customer?.firstName}</h3>
           </div>
           <button onClick={onClose} className="text-[#8C8279] hover:text-[#C5A059] transition-colors relative z-10"><X size={20}/></button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar bg-[#F9F6F0]">
           {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                 <Loader2 className="animate-spin text-[#C5A059] mb-4" size={32}/>
                 <p className="text-[10px] font-bold uppercase text-[#8C8279] tracking-[0.2em]">Scanning Databases...</p>
              </div>
           ) : data ? (
              <>
                 {data.sources.steadfast.frauds && data.sources.steadfast.frauds.length > 0 && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-sm">
                       <div className="flex gap-3 items-center mb-2">
                          <ShieldAlert size={20} className="text-red-600"/>
                          <h4 className="font-bold text-red-700 text-[11px] uppercase tracking-widest">Fraud Record Found</h4>
                       </div>
                       <div className="space-y-2">
                          {data.sources.steadfast.frauds.map((f, i) => (
                             <div key={i} className="text-xs bg-white p-3 rounded-sm border border-red-100 text-gray-700 shadow-sm leading-relaxed">
                                {f.details || "No details available."}
                             </div>
                          ))}
                       </div>
                    </div>
                 )}

                 <div className="flex items-center gap-5 bg-white p-5 rounded-sm border border-[#C5A059]/20 shadow-sm">
                    <div className={`text-4xl font-heading font-bold ${data.score < 50 ? 'text-[#C5A059]' : 'text-green-600'}`}>{data.score}%</div>
                    <div className="flex-1 border-l border-[#C5A059]/20 pl-5">
                       <h4 className="font-bold text-[11px] uppercase text-[#121212] tracking-widest">{data.level} Risk</h4>
                       <p className="text-xs text-[#8C8279] mt-1 leading-snug">{data.suggestion}</p>
                    </div>
                 </div>

                 <div className="bg-white border border-[#C5A059]/20 rounded-sm overflow-hidden divide-y divide-[#F9F6F0] shadow-sm">
                    <StatRow label="Internal" data={data.sources.internal} />
                    <StatRow label="Steadfast" data={getSteadfastStats()} />
                    <StatRow label="Pathao" data={data.sources.pathao} />
                 </div>
              </>
           ) : (
              <div className="text-center py-10 text-[#8C8279]">
                 <p className="text-[10px] font-bold uppercase tracking-widest">No analysis data available.</p>
              </div>
           )}
        </div>
      </motion.div>
    </div>
  );
};

const StatRow = ({ label, data }) => {
  if (!data) return null;
  return (
    <div className="flex justify-between items-center text-[11px] p-4 hover:bg-[#F9F6F0]/50 transition-colors">
       <div className="font-bold text-[#121212] w-1/3 uppercase tracking-widest flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#C5A059]"></div>
          {label}
       </div>
       <div className="flex gap-6 w-2/3 justify-end">
          <div className="text-center">
             <span className="block font-heading font-bold text-lg text-[#121212]">{data.total || 0}</span>
             <span className="text-[9px] text-[#8C8279] uppercase font-bold tracking-[0.2em]">Total</span>
          </div>
          <div className="text-center">
             <span className="block font-heading font-bold text-lg text-green-600">{data.delivered || 0}</span>
             <span className="text-[9px] text-[#8C8279] uppercase font-bold tracking-[0.2em]">Done</span>
          </div>
          <div className="text-center">
             <span className="block font-heading font-bold text-lg text-red-600">{data.returned || 0}</span>
             <span className="text-[9px] text-[#8C8279] uppercase font-bold tracking-[0.2em]">Return</span>
          </div>
       </div>
    </div>
  );
};

// --- COMPONENT: CANCEL MODAL ---
const CancelModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  const reasons = ["Customer Request", "Stock Issue", "Duplicate Order", "Fraud Suspected", "Other"];
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#121212]/80 backdrop-blur-sm p-4">
      <motion.div initial={{scale:0.95, opacity: 0}} animate={{scale:1, opacity: 1}} className="bg-[#F9F6F0] rounded-sm p-8 max-w-sm w-full shadow-2xl border border-[#C5A059]/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-full -mr-8 -mt-8 pointer-events-none"></div>
        
        <h3 className="font-heading uppercase tracking-wide text-2xl text-[#121212] mb-2">Cancel Order</h3>
        <p className="text-[10px] text-[#8C8279] uppercase tracking-widest font-bold mb-6">Select a reason for cancellation.</p>
        
        <div className="space-y-2">
           {reasons.map((reason) => (
              <button 
                key={reason} 
                onClick={() => onConfirm(reason)} 
                className="w-full text-left px-4 py-3 bg-white hover:bg-red-50 hover:text-red-700 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all border border-[#C5A059]/10 hover:border-red-200 group flex justify-between items-center"
              >
                {reason}
                <ChevronDown size={14} className="opacity-0 group-hover:opacity-100 -rotate-90 transition-all"/>
              </button>
           ))}
        </div>
        <button onClick={onClose} className="mt-6 w-full py-3 text-[10px] text-[#8C8279] font-bold uppercase tracking-widest hover:text-[#121212] transition-colors">Dismiss</button>
      </motion.div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  
  // Action States
  const [shippingId, setShippingId] = useState(null);
  const [bulkShipping, setBulkShipping] = useState(false);

  // Modals
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [fraudCheckCustomer, setFraudCheckCustomer] = useState(null);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    const data = await getAdminOrders();
    setOrders(data);
    setLoading(false);
  };

  const handleShipToSteadfast = async (id) => {
      setShippingId(id);
      try {
          const res = await sendToSteadfast(id);
          if(res.success) {
              toast.success(`Shipped! Tracking: ${res.tracking_code}`);
              loadOrders();
          } else {
              toast.error(res.error || "Failed to send");
          }
      } catch (e) {
          toast.error("Network Error");
      }
      setShippingId(null);
  };

  // ✅ FIX: BULK COURIER LOGIC
  const handleBulkShip = async () => {
      // 1. Explicitly filter eligible orders on the frontend first
      const eligibleOrders = orders.filter(o => o.status === 'Processing' && !o.consignment_id);
      
      if (eligibleOrders.length === 0) {
          toast.error("No eligible 'Processing' orders found to ship.");
          return;
      }

      if(!confirm(`Send ${eligibleOrders.length} 'Processing' orders to Steadfast?`)) return;
      
      setBulkShipping(true);
      try {
          // 2. Pass the explicit array of IDs to the backend
          const orderIds = eligibleOrders.map(o => o._id);
          const res = await bulkShipToSteadfast(orderIds); 
          
          if(res.success) {
              toast.success(`Successfully shipped ${res.count || eligibleOrders.length} orders.`);
              loadOrders();
          } else {
              toast.error(res.error || "Bulk ship failed");
          }
      } catch(e) {
          toast.error("Network Error");
      }
      setBulkShipping(false);
  };

  const handleStatusChange = async (id, status, reason = null) => {
    setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
    await updateOrderStatus(id, status, reason);
    const data = await getAdminOrders();
    setOrders(data);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (statusFilter !== 'All' && order.status !== statusFilter) return false;
      const searchLower = searchTerm.toLowerCase();
      const orderIdStr = order.orderId ? order.orderId.toString().toLowerCase() : '';
      return orderIdStr.includes(searchLower) || 
             (order.guestInfo?.firstName + ' ' + order.guestInfo?.lastName).toLowerCase().includes(searchLower) ||
             order.guestInfo?.phone?.includes(searchLower);
    });
  }, [orders, searchTerm, statusFilter]);

  // Premium Status Colors
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Pending': return 'bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/30'; 
      case 'Processing': return 'bg-blue-50 text-blue-700 border-blue-200'; 
      case 'Shipped': return 'bg-purple-50 text-purple-700 border-purple-200'; 
      case 'Delivered': return 'bg-green-50 text-green-700 border-green-200'; 
      case 'Cancelled': return 'bg-red-50 text-red-700 border-red-200'; 
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F9F6F0] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
         <Loader2 className="animate-spin text-[#C5A059]" size={40}/>
         <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#8C8279]">Loading Orders...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9F6F0] font-body text-[#121212] w-full overflow-x-hidden pt-16 lg:pt-0 selection:bg-[#C5A059] selection:text-white">
      
      <CancelModal isOpen={!!cancelOrderId} onClose={() => setCancelOrderId(null)} onConfirm={(r) => { handleStatusChange(cancelOrderId, 'Cancelled', r); setCancelOrderId(null); }} />
      <FraudCheckModal isOpen={!!fraudCheckCustomer} onClose={() => setFraudCheckCustomer(null)} customer={fraudCheckCustomer} />

      {/* --- HEADER --- */}
      <div className="bg-[#F9F6F0]/90 border-b border-[#C5A059]/20 sticky top-0 z-30 shadow-sm backdrop-blur-md">
        <div className="w-full max-w-[1920px] mx-auto px-4 md:px-8 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="font-heading uppercase tracking-tight text-3xl font-bold text-[#121212]">Orders</h1>
            <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]"></span>
                <p className="text-[10px] text-[#8C8279] font-bold uppercase tracking-[0.2em]">
                  {filteredOrders.length} Records Found
                </p>
            </div>
          </div>
          <button 
            onClick={handleBulkShip} 
            disabled={bulkShipping}
            className="bg-[#121212] text-white px-6 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#C5A059] transition-all shadow-xl disabled:opacity-50 flex items-center gap-2"
          >
            {bulkShipping ? <Loader2 className="animate-spin" size={14}/> : <Truck size={14}/>}
            Bulk Courier
          </button>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="w-full max-w-[1920px] mx-auto px-4 md:px-8 py-8 space-y-6">
        
        {/* CONTROLS */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-2 rounded-sm shadow-sm border border-[#C5A059]/10">
          <div className="relative w-full xl:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8C8279] group-focus-within:text-[#C5A059] transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search ID, Name, Phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-transparent text-sm font-medium focus:outline-none placeholder:text-[#8C8279]/60 text-[#121212]"
            />
          </div>
          
          <div className="w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 px-2 custom-scrollbar">
            <div className="flex gap-2">
              {['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
                <button 
                  key={status} 
                  onClick={() => setStatusFilter(status)} 
                  className={`px-5 py-2.5 rounded-sm text-[9px] font-bold uppercase tracking-[0.15em] transition-all whitespace-nowrap border ${
                    statusFilter === status 
                    ? 'bg-[#121212] text-white border-[#121212] shadow-md' 
                    : 'bg-[#F9F6F0] text-[#57534E] border-transparent hover:border-[#C5A059]/40 hover:text-[#121212]'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* --- ORDER CARDS --- */}
        <div className="space-y-4">
           {filteredOrders.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-sm border border-dashed border-[#C5A059]/30">
                 <div className="w-16 h-16 bg-[#F9F6F0] rounded-full flex items-center justify-center mb-4 text-[#C5A059] mx-auto">
                    <Package size={24} />
                 </div>
                 <p className="text-[#121212] text-xs font-bold uppercase tracking-[0.2em]">No matching orders found</p>
              </div>
           ) : filteredOrders.map(order => (
              <motion.div 
                layout 
                key={order._id} 
                className="bg-white rounded-sm border border-[#C5A059]/10 shadow-sm hover:shadow-md hover:border-[#C5A059]/30 transition-all duration-300 overflow-hidden group"
              >
                 {/* MAIN ROW */}
                 <div 
                    className="p-5 flex flex-col lg:flex-row gap-6 lg:items-center cursor-pointer relative"
                    onClick={() => setExpandedOrderId(expandedOrderId === order._id ? null : order._id)}
                 >
                    {/* Status Indicator Bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                       order.status === 'Cancelled' ? 'bg-red-600' : 
                       order.status === 'Delivered' ? 'bg-green-600' : 
                       order.status === 'Shipped' ? 'bg-purple-500' :
                       order.status === 'Processing' ? 'bg-blue-500' :
                       'bg-[#C5A059]'
                    }`}></div>

                    {/* ID & Status */}
                    <div className="flex items-center gap-4 lg:w-1/4 pl-3">
                       <div className="w-10 h-10 bg-[#F9F6F0] rounded-sm flex items-center justify-center text-[#8C8279] group-hover:text-[#C5A059] transition-colors border border-[#C5A059]/10">
                          <Package size={18}/>
                       </div>
                       <div>
                          <h3 className="font-mono font-bold text-sm text-[#121212] tracking-wide">{formatOrderId(order.orderId)}</h3>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-widest border ${getStatusStyle(order.status)}`}>
                             {order.status}
                          </span>
                       </div>
                    </div>

                    {/* Customer */}
                    <div className="lg:w-1/4">
                       <div className="flex items-center gap-2 text-sm font-bold text-[#121212]">
                          <User size={14} className="text-[#C5A059]"/>
                          {order.guestInfo?.firstName} {order.guestInfo?.lastName}
                       </div>
                       <div className="text-[9px] text-[#8C8279] font-bold mt-1 pl-6 uppercase tracking-[0.2em]">
                          {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                       </div>
                    </div>

                    {/* Quick Stats / Items */}
                    <div className="lg:w-1/4 flex items-center gap-8">
                       <div>
                          <p className="text-[9px] text-[#8C8279] uppercase font-bold tracking-[0.2em] mb-0.5">Items</p>
                          <p className="font-bold text-sm text-[#121212]">{order.items.length}</p>
                       </div>
                       <div>
                          <p className="text-[9px] text-[#8C8279] uppercase font-bold tracking-[0.2em] mb-0.5">Total</p>
                          <p className="font-heading font-bold text-lg text-[#C5A059] flex items-center gap-1"><Taka/>{order.totalAmount?.toLocaleString()}</p>
                       </div>
                    </div>

                    {/* Expand Toggle */}
                    <div className="ml-auto text-[#8C8279] group-hover:text-[#C5A059] transition-colors pr-2">
                       {expandedOrderId === order._id ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                    </div>
                 </div>

                 {/* EXPANDED DETAILS */}
                 <AnimatePresence>
                    {expandedOrderId === order._id && (
                       <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="border-t border-[#C5A059]/10 bg-[#F9F6F0]/50"
                       >
                          <div className="p-6 lg:p-8 grid grid-cols-1 xl:grid-cols-3 gap-8">
                             
                             {/* LEFT: INFO */}
                             <div className="space-y-6">
                                {/* Shipping Info */}
                                <div className="bg-white p-5 rounded-sm border border-[#C5A059]/20 shadow-sm relative overflow-hidden">
                                   <div className="absolute top-0 right-0 w-12 h-12 bg-[#F9F6F0] rounded-bl-full -mr-6 -mt-6"></div>
                                   <div className="flex items-center gap-2 mb-4">
                                      <MapPin size={16} className="text-[#C5A059]"/>
                                      <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#121212]">Delivery Details</h4>
                                   </div>
                                   <div className="space-y-4 text-sm text-[#57534E]">
                                      <div className="flex justify-between border-b border-[#F9F6F0] pb-2">
                                         <span className="text-[9px] text-[#8C8279] uppercase font-bold tracking-widest">Phone</span>
                                         <span className="font-mono font-bold text-[#121212] tracking-wide">{order.guestInfo?.phone}</span>
                                      </div>
                                      <div className="pt-1">
                                         <span className="text-[9px] text-[#8C8279] uppercase font-bold block mb-1 tracking-widest">Address</span>
                                         <p className="leading-relaxed text-[#121212] text-xs font-medium bg-[#F9F6F0] p-3 rounded-sm border border-[#C5A059]/10">{order.shippingAddress?.address}, {order.shippingAddress?.city}</p>
                                      </div>
                                   </div>
                                </div>

                                {/* Payment Breakdown */}
                                <div className="bg-white p-5 rounded-sm border border-[#C5A059]/20 shadow-sm">
                                   <div className="flex items-center gap-2 mb-4">
                                      <CreditCard size={16} className="text-[#C5A059]"/>
                                      <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#121212]">Payment</h4>
                                   </div>
                                   <div className="space-y-3 text-sm">
                                      <div className="flex justify-between text-[#8C8279] text-xs font-medium">
                                         <span>Subtotal</span>
                                         <span className="flex items-center gap-1 font-bold text-[#121212]"><Taka/>{order.subTotal ? order.subTotal.toLocaleString() : order.totalAmount}</span>
                                      </div>
                                      <div className="flex justify-between text-[#8C8279] text-xs font-medium">
                                         <span>Shipping</span>
                                         <span className="flex items-center gap-1 font-bold text-[#121212]"><Taka/>{order.shippingAddress?.method === 'outside' ? '150' : '80'}</span>
                                      </div>
                                      {order.discountAmount > 0 && (
                                         <div className="flex justify-between text-[#C5A059] bg-[#C5A059]/10 p-2 rounded-sm text-[10px] font-bold uppercase tracking-widest border border-[#C5A059]/20">
                                            <span>Discount ({order.couponCode})</span>
                                            <span className="flex items-center gap-1">-<Taka size={10}/>{order.discountAmount.toLocaleString()}</span>
                                         </div>
                                      )}
                                      <div className="border-t border-dashed border-[#C5A059]/30 pt-3 flex justify-between font-bold text-[#121212] text-base">
                                         <span className="text-xs uppercase tracking-widest mt-1">Total Payable</span>
                                         <span className="font-heading text-[#C5A059] flex items-center gap-1"><Taka size={16}/>{order.totalAmount.toLocaleString()}</span>
                                      </div>
                                   </div>
                                </div>
                             </div>

                             {/* MIDDLE & RIGHT: ITEMS & ACTIONS */}
                             <div className="xl:col-span-2 space-y-6">
                                {/* Items */}
                                <div className="bg-white rounded-sm border border-[#C5A059]/20 shadow-sm overflow-hidden">
                                   <div className="bg-[#F9F6F0] px-5 py-3 border-b border-[#C5A059]/10 flex items-center gap-2">
                                      <ShoppingBag size={14} className="text-[#C5A059]"/>
                                      <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#121212]">Order Items</h4>
                                   </div>
                                   <div className="divide-y divide-[#F9F6F0]">
                                      {order.items.map((item, i) => (
                                         <div key={i} className="p-4 flex gap-4 hover:bg-[#F9F6F0]/50 transition-colors">
                                            <div className="w-16 h-20 bg-[#F9F6F0] rounded-sm overflow-hidden flex-shrink-0 border border-[#C5A059]/10">
                                               <img src={item.image || '/placeholder.jpg'} className="w-full h-full object-cover"/>
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                               <div className="flex justify-between items-start">
                                                  <div>
                                                     <p className="font-heading uppercase tracking-wide font-bold text-sm text-[#121212] line-clamp-1">{item.name}</p>
                                                     <div className="flex items-center gap-3 mt-1.5">
                                                        <span className="bg-[#121212] text-white px-2 py-0.5 rounded-sm text-[9px] font-bold tracking-[0.2em] uppercase">Size: {item.size}</span>
                                                        <span className="text-xs text-[#8C8279] font-bold">x {item.quantity}</span>
                                                     </div>
                                                  </div>
                                                  <p className="font-heading font-bold text-base text-[#121212] flex items-center gap-1"><Taka/>{(item.price * item.quantity).toLocaleString()}</p>
                                               </div>
                                               {(item.sku || item.barcode) && (
                                                  <div className="mt-3 flex gap-3 opacity-80 hover:opacity-100 transition-opacity">
                                                     {item.sku && <span className="text-[9px] font-mono bg-white px-1.5 py-0.5 rounded-sm text-[#121212] border border-[#C5A059]/20 tracking-wide">{item.sku}</span>}
                                                     {item.barcode && <div className="mix-blend-multiply opacity-80"><Barcode value={item.barcode} width={1} height={12} fontSize={0} displayValue={false} margin={0} background="transparent" /></div>}
                                                  </div>
                                               )}
                                            </div>
                                         </div>
                                      ))}
                                   </div>
                                </div>

                                {/* Action Toolbar */}
                                <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-sm border border-[#C5A059]/20 shadow-sm">
                                   
                                   {/* Stage 1: Pending */}
                                   {order.status === 'Pending' && (
                                      <>
                                         <button onClick={() => setFraudCheckCustomer(order.guestInfo)} className="flex items-center gap-2 px-4 py-2.5 bg-[#C5A059]/10 text-[#C5A059] hover:bg-[#C5A059] hover:text-white border border-[#C5A059]/20 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-colors">
                                            <ShieldAlert size={14}/> Risk Check
                                         </button>
                                         <ActionButton onClick={() => handleStatusChange(order._id, 'Processing')} icon={<Package size={14}/>} label="Approve & Process" color="blue" />
                                      </>
                                   )}

                                   {/* Stage 2: Processing */}
                                   {order.status === 'Processing' && (
                                      <>
                                         {!order.consignment_id ? (
                                            <button onClick={() => handleShipToSteadfast(order._id)} disabled={shippingId === order._id} className="flex items-center gap-2 px-5 py-2.5 bg-[#121212] text-white hover:bg-[#C5A059] rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed">
                                               {shippingId === order._id ? <Loader2 className="animate-spin" size={14}/> : <Send size={14}/>} 
                                               Send to Courier
                                            </button>
                                         ) : (
                                            <div className="flex items-center gap-2 px-4 py-2 bg-[#F9F6F0] text-[#121212] border border-[#C5A059]/20 rounded-sm text-xs font-mono font-bold">
                                               <Truck size={14} className="text-[#C5A059]"/> {order.tracking_code}
                                            </div>
                                         )}
                                         <ActionButton onClick={() => handleStatusChange(order._id, 'Shipped')} icon={<Truck size={14}/>} label="Mark Shipped" color="purple" />
                                      </>
                                   )}

                                   {/* Stage 3: Shipped */}
                                   {order.status === 'Shipped' && (
                                      <ActionButton onClick={() => handleStatusChange(order._id, 'Delivered')} icon={<Check size={14}/>} label="Mark Delivered" color="green" />
                                   )}

                                   {/* Common: Cancel */}
                                   {order.status !== 'Cancelled' && order.status !== 'Delivered' && (
                                      <button onClick={() => setCancelOrderId(order._id)} className="ml-auto px-4 py-2 text-red-600 hover:bg-red-50 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] border border-transparent hover:border-red-200 transition-colors flex items-center gap-2">
                                         <X size={14}/> Cancel Order
                                      </button>
                                   )}
                                </div>
                             </div>

                          </div>
                       </motion.div>
                    )}
                 </AnimatePresence>
              </motion.div>
           ))}
        </div>

      </div>
    </div>
  );
}

// Helper for Action Buttons
function ActionButton({ onClick, icon, label, color }) {
  const styles = { 
     blue: 'bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border-blue-200', 
     purple: 'bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white border-purple-200', 
     green: 'bg-green-50 text-green-700 hover:bg-green-600 hover:text-white border-green-200' 
  };
  return (
     <button onClick={onClick} className={`flex items-center gap-2 px-5 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-[0.15em] transition-all border ${styles[color]}`}>
        {icon} <span>{label}</span>
     </button>
  );
}