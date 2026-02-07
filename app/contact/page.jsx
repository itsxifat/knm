import Navbar from '@/components/Navbar';
import SiteContent from '@/models/SiteContent';
import connectDB from '@/lib/db'; // ✅ Use shared connection
import { Mail, Phone, MapPin } from 'lucide-react';

export const metadata = {
  title: 'Contact Us | KNM',
  description: 'Get in touch with KNM Heritage.',
};

export default async function ContactPage() {
  await connectDB(); // ✅ Uses the cached connection with buffering enabled
  
  const siteContent = await SiteContent.findOne({ identifier: 'main_layout' }).lean();
  
  const navData = {
    logoImage: "/logo.png",
    logoText: "KNM",
    links: siteContent?.navbarLinks ? JSON.parse(JSON.stringify(siteContent.navbarLinks)) : []
  };

  return (
    <div className="bg-white min-h-screen font-body text-[#121212] selection:bg-[#C5A059] selection:text-white">
      <Navbar navData={navData} />

      <div className="pt-32 pb-20 max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
        
        {/* Left: Info */}
        <div>
          <span className="text-[#C5A059] text-xs font-bold uppercase tracking-[0.3em] block mb-4">Get In Touch</span>
          <h1 className="text-4xl md:text-5xl font-heading mb-8 uppercase tracking-tight">We'd Love To<br/>Hear From You</h1>
          <p className="text-[#57534E] mb-12 leading-relaxed">
            Whether you have a question about our collections, need assistance with an order, or simply want to share your experience, our dedicated concierge team is here to assist you.
          </p>

          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#F9F6F0] flex items-center justify-center text-[#C5A059] shrink-0"><Phone size={18}/></div>
              <div>
                <h3 className="font-bold uppercase tracking-wider text-xs mb-1">Phone</h3>
                <p className="text-[#57534E] text-sm">01711-751172</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#F9F6F0] flex items-center justify-center text-[#C5A059] shrink-0"><Mail size={18}/></div>
              <div>
                <h3 className="font-bold uppercase tracking-wider text-xs mb-1">Email</h3>
                <p className="text-[#57534E] text-sm">info@knm.international</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#F9F6F0] flex items-center justify-center text-[#C5A059] shrink-0"><MapPin size={18}/></div>
              <div>
                <h3 className="font-bold uppercase tracking-wider text-xs mb-1">Atelier</h3>
                <p className="text-[#57534E] text-sm">Level 4, KNM Tower, Gulshan Avenue<br/>Dhaka, Bangladesh</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="bg-[#F9F6F0] p-10 md:p-12 border border-[#C5A059]/20 shadow-xl shadow-[#C5A059]/5">
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#8C8279]">Name</label>
                <input type="text" className="w-full bg-white border-b border-[#E5E5E5] px-4 py-3 text-sm focus:border-[#C5A059] outline-none transition-colors rounded-sm" placeholder="Your Name" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#8C8279]">Email</label>
                <input type="email" className="w-full bg-white border-b border-[#E5E5E5] px-4 py-3 text-sm focus:border-[#C5A059] outline-none transition-colors rounded-sm" placeholder="email@example.com" />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#8C8279]">Subject</label>
              <input type="text" className="w-full bg-white border-b border-[#E5E5E5] px-4 py-3 text-sm focus:border-[#C5A059] outline-none transition-colors rounded-sm" placeholder="How can we help?" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#8C8279]">Message</label>
              <textarea rows="4" className="w-full bg-white border-b border-[#E5E5E5] px-4 py-3 text-sm focus:border-[#C5A059] outline-none transition-colors rounded-sm resize-none" placeholder="Write your message here..."></textarea>
            </div>

            <button type="submit" className="w-full bg-[#121212] text-white py-4 text-xs font-bold uppercase tracking-[0.25em] hover:bg-[#C5A059] transition-all duration-500 shadow-md">
              Send Message
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}