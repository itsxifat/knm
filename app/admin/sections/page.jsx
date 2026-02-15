'use client';

import { useState, useEffect } from 'react';
import { getAllSectionsAdmin, deleteSection } from '@/actions/sectionActions';
import { Trash2, Edit2, Plus, Video, Image as ImageIcon, ArrowRight, Loader2, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function AdminSections() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await getAllSectionsAdmin(); // Ensure this action is imported
      setSections(data);
    } catch (error) {
      toast.error('Failed to load sections');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (confirm('Delete this campaign? This will remove the file from storage.')) {
      await deleteSection(id);
      setSections(prev => prev.filter(s => s._id !== id));
      toast.success('Campaign deleted');
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F9F6F0]"><Loader2 className="animate-spin text-[#C5A059]" /></div>;

  return (
    <div className="min-h-screen bg-[#F9F6F0] text-[#121212] font-body p-8 md:p-12">
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[#121212]/10 pb-8">
        <div>
          <span className="text-[#C5A059] text-xs font-bold uppercase tracking-[0.25em] block mb-2">Admin Dashboard</span>
          <h1 className="font-heading text-4xl md:text-5xl text-[#121212]">Homepage Sections</h1>
        </div>
        <Link 
          href="/admin/sections/new" 
          className="bg-[#121212] text-[#C5A059] px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#C5A059] hover:text-white transition-all shadow-xl shadow-[#C5A059]/10 flex items-center gap-3"
        >
          <Plus size={16} /> New Campaign
        </Link>
      </div>

      {/* CAMPAIGN LIST */}
      <div className="max-w-7xl mx-auto space-y-6">
        {sections.length === 0 ? (
           <div className="text-center py-32 border border-dashed border-[#121212]/20 rounded-sm">
              <p className="font-heading text-2xl text-[#121212]/40">No active campaigns</p>
           </div>
        ) : (
          sections.map((section) => (
            <div key={section._id} className="group bg-white border border-[#E5E5E5] p-2 flex flex-col md:flex-row gap-6 hover:border-[#C5A059]/30 transition-all duration-500 shadow-sm hover:shadow-md">
              
              {/* Preview Thumbnail */}
              <div className="w-full md:w-64 aspect-video bg-[#F5F5F5] relative overflow-hidden">
                 {section.type === 'image' ? (
                    <img src={section.mediaUrl} alt={section.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#121212] text-[#C5A059]"><Video size={24}/></div>
                 )}
                 <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#121212]">
                    Order {section.order}
                 </div>
              </div>

              {/* Info */}
              <div className="flex-1 py-4 flex flex-col justify-center px-4 md:px-0">
                 <div className="flex items-center gap-3 mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 border ${section.type === 'video' ? 'border-purple-200 text-purple-600 bg-purple-50' : 'border-[#C5A059]/20 text-[#C5A059] bg-[#C5A059]/5'}`}>
                       {section.type} Template
                    </span>
                    <span className="text-[10px] text-[#8C8279] uppercase tracking-wider">{section.title}</span>
                 </div>
                 <h3 className="font-heading text-2xl text-[#121212] mb-1">{section.heading}</h3>
                 <p className="text-sm text-[#57534E] font-medium">{section.subHeading}</p>
                 
                 <div className="flex items-center gap-4 mt-4 text-[10px] font-bold uppercase tracking-wider text-[#8C8279]">
                    <span>{section.products?.length || 0} Products</span>
                    {section.link && <span className="flex items-center gap-1"><LinkIcon size={10}/> {section.link}</span>}
                 </div>
              </div>

              {/* Actions */}
              <div className="flex md:flex-col border-t md:border-t-0 md:border-l border-[#F0F0F0] w-full md:w-20 shrink-0">
                 {/* Note: You can create an Edit page later, for now we assume Delete/Create flow */}
                 <button 
                    onClick={() => handleDelete(section._id)}
                    className="flex-1 flex items-center justify-center text-[#121212] hover:bg-red-600 hover:text-white transition-colors py-4 md:py-0"
                    title="Delete"
                 >
                    <Trash2 size={18} />
                 </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}