'use client';

import { useState, useEffect } from 'react';
import { getDashboardStats } from '@/actions/dashboard'; // Your existing action
import { getLiveActiveUsers } from '@/actions/analytics'; // We will create this
import { LayoutDashboard, TrendingUp, Users, ShoppingBag, Clock, ArrowUpRight, AlertTriangle, Radio } from 'lucide-react';
import { motion } from 'framer-motion';

// --- TAKA SVG ---
const Taka = ({ size = 20, className = "" }) => (
  <svg width={size} height={size+2} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block align-middle ${className}`}>
    <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="20" fontWeight="bold" fill="currentColor" style={{ fontFamily: "var(--font-heading)" }}>৳</text>
  </svg>
);

export default function DashboardPage() {
  const [stats, setStats] = useState({
    revenue: 0,
    pendingOrders: 0,
    totalUsers: 0,
    lowStockItems: 0,
    recentOrders: [],
    systemStatus: 'Checking...'
  });
  const [loading, setLoading] = useState(true);
  
  // --- NEW: Live Users State ---
  const [liveUsers, setLiveUsers] = useState(0);

  // Load Main Dashboard Data
  useEffect(() => {
    async function loadData() {
      const data = await getDashboardStats();
      if (!data.error) {
        setStats(data);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  // --- NEW: Live User Polling Logic ---
  useEffect(() => {
    async function fetchLiveUsers() {
      try {
        // Calls the backend action to get active sessions in the last 5 minutes
        const count = await getLiveActiveUsers();
        setLiveUsers(count || 0);
      } catch (error) {
        console.error("Failed to fetch live users", error);
      }
    }

    // Fetch immediately on mount
    fetchLiveUsers();

    // Poll every 10 seconds
    const interval = setInterval(fetchLiveUsers, 10000);
    return () => clearInterval(interval);
  }, []);

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { ease: "easeOut", duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-[#F9F6F0] text-[#121212] font-body p-4 md:p-8 pt-24 lg:pt-8 relative overflow-hidden selection:bg-[#C5A059] selection:text-white">
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8 max-w-7xl mx-auto"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="border-b border-[#C5A059]/20 pb-6 flex justify-between items-end">
          <div>
             <h2 className="text-4xl font-heading text-[#121212] uppercase tracking-tight mb-2">Overview</h2>
             <p className="text-[#8C8279] text-[10px] font-bold uppercase tracking-[0.2em]">Welcome back to the KNM Command Center.</p>
          </div>
          <div className="text-right hidden md:block">
             <p className="text-[9px] font-bold uppercase text-[#C5A059] tracking-widest">Last Updated</p>
             <p className="text-xs font-mono text-[#8C8279] mt-1">{new Date().toLocaleTimeString()}</p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          
          {/* NEW: Live Visitors Card */}
          <StatCard 
             title="Live Visitors" 
             value={liveUsers} 
             icon={Radio} 
             isLive={true} // Triggers the pulsing red/green dot UI
             loading={false}
          />

          {/* Card 1: Revenue */}
          <StatCard 
             title="Total Revenue" 
             value={stats.revenue.toLocaleString()} 
             icon={TrendingUp} 
             isCurrency 
             loading={loading}
          />

          {/* Card 2: Pending Orders */}
          <StatCard 
             title="Pending Orders" 
             value={stats.pendingOrders} 
             icon={ShoppingBag} 
             loading={loading}
             highlight={stats.pendingOrders > 0} // Highlights dark if there are pending orders
          />

          {/* Card 3: Total Users */}
          <StatCard 
             title="Total Customers" 
             value={stats.totalUsers} 
             icon={Users} 
             loading={loading}
          />

          {/* Card 4: Low Stock Alert */}
          <StatCard 
             title="Low Stock Items" 
             value={stats.lowStockItems} 
             icon={AlertTriangle} 
             loading={loading}
             color="text-[#B91C1C] bg-red-50/50 border-red-200"
          />

        </div>

        {/* Recent Activity Section */}
        <motion.div variants={itemVariants} className="bg-white rounded-sm border border-[#C5A059]/20 shadow-sm overflow-hidden">
           <div className="p-6 border-b border-[#C5A059]/10 flex justify-between items-center bg-[#F9F6F0]">
              <h3 className="font-heading text-xl text-[#121212] uppercase tracking-wide flex items-center gap-3">
                 <Clock size={18} className="text-[#C5A059]"/> Recent Activity
              </h3>
              <button className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#8C8279] hover:text-[#C5A059] transition-colors flex items-center gap-1">
                 View All <ArrowUpRight size={12}/>
              </button>
           </div>
           
           <div className="divide-y divide-[#F9F6F0]">
              {loading ? (
                 <div className="p-10 text-center text-[#8C8279] text-[10px] font-bold uppercase tracking-widest">Loading activity...</div>
              ) : stats.recentOrders.length === 0 ? (
                 <div className="p-10 text-center text-[#8C8279] text-[10px] font-bold uppercase tracking-widest">No recent activity</div>
              ) : (
                 stats.recentOrders.map((order) => (
                    <div key={order._id} className="p-4 px-6 flex items-center justify-between hover:bg-[#F9F6F0]/50 transition-colors group">
                       <div className="flex items-center gap-4">
                          <div className={`w-2 h-2 rounded-full shadow-sm ${getStatusColor(order.status)}`}></div>
                          <div>
                             <p className="text-sm font-bold text-[#121212] font-heading uppercase tracking-wide">{order.guestInfo?.firstName || 'Guest'}</p>
                             <p className="text-[10px] text-[#8C8279] font-mono mt-0.5">#{order.orderId}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-sm font-bold text-[#121212] flex items-center justify-end gap-1"><Taka size={12}/>{order.totalAmount.toLocaleString()}</p>
                          <p className="text-[9px] text-[#8C8279] font-bold uppercase tracking-widest mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                       </div>
                    </div>
                 ))
              )}
           </div>
        </motion.div>

      </motion.div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

const StatCard = ({ title, value, icon: Icon, isCurrency, loading, highlight, color, isLive }) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className={`p-6 rounded-sm border shadow-sm transition-all duration-300 relative overflow-hidden group 
      ${highlight ? 'bg-[#121212] border-[#121212] shadow-xl' : (color || 'bg-white border-[#C5A059]/20 hover:border-[#C5A059]')}`}
  >
     {/* Decorative BG Icon */}
     <Icon className={`absolute -right-4 -bottom-4 w-24 h-24 transition-colors pointer-events-none ${highlight ? 'text-white/5' : 'text-[#F9F6F0] group-hover:text-[#C5A059]/5'}`} strokeWidth={1} />

     <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start mb-4">
            <div className={`w-10 h-10 rounded-sm flex items-center justify-center transition-colors 
              ${highlight ? 'bg-[#C5A059] text-white shadow-lg shadow-[#C5A059]/20' : 'bg-[#F9F6F0] text-[#C5A059] group-hover:bg-[#C5A059] group-hover:text-white'}`}>
               <Icon size={20} className={isLive ? 'animate-pulse' : ''} />
            </div>

            {/* Live Indicator Dot */}
            {isLive && (
              <div className="flex items-center gap-2 px-2.5 py-1 bg-green-50 border border-green-100 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[8px] font-bold uppercase tracking-widest text-green-700">Live</span>
              </div>
            )}
        </div>

        <div>
            <p className={`text-[9px] font-bold uppercase tracking-[0.2em] mb-1 ${highlight ? 'text-gray-400' : 'text-[#8C8279]'}`}>{title}</p>
            <div className={`text-3xl font-heading flex items-center gap-1 ${highlight ? 'text-white' : 'text-[#121212]'}`}>
               {loading ? (
                  <div className={`h-8 w-24 rounded-sm animate-pulse ${highlight ? 'bg-white/10' : 'bg-[#F9F6F0]'}`}/>
               ) : (
                  <>
                     {isCurrency && <Taka size={24}/>}
                     {value}
                  </>
               )}
            </div>
        </div>
     </div>
  </motion.div>
);

const getStatusColor = (status) => {
   switch(status) {
      case 'Pending': return 'bg-[#C5A059]'; // Gold for pending
      case 'Processing': return 'bg-blue-500';
      case 'Delivered': return 'bg-green-500';
      case 'Cancelled': return 'bg-red-500';
      default: return 'bg-gray-300';
   }
};