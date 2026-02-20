'use client';

import { createCategory, deleteCategory, updateCategory } from '@/actions/categories';
import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Folder, ImageIcon, X, Layers, Loader2, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';

// --- SUB-COMPONENT: CREATE/EDIT MODAL ---
const CategoryModal = ({ parent, editData, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(editData?.image || null);

  // ✅ FIX: Use a standard onSubmit handler to control the flow perfectly
  async function handleSubmit(e) {
    e.preventDefault(); // Stop default HTML form submission
    setLoading(true);
    
    // Create FormData from the event target
    const formData = new FormData(e.currentTarget);
    
    try {
      if (editData) {
        // Edit Mode: Pass formData directly (ID is inside the form now)
        await updateCategory(formData);
      } else {
        // Create Mode
        await createCategory(formData);
      }
      onClose(); // Close only on success
    } catch (error) {
      console.error("Action failed:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const isEditing = !!editData;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-[#121212]/80 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-lg shadow-2xl overflow-hidden border border-[#C5A059]/20 relative z-10"
      >
        {/* Modal Header */}
        <div className="bg-[#F9F6F0] px-8 py-6 border-b border-[#C5A059]/10 flex justify-between items-center">
          <div>
            <h3 className="font-heading text-2xl text-[#121212] uppercase tracking-tight">
              {isEditing ? 'Edit Category' : (parent ? 'New Sub-Category' : 'New Root Category')}
            </h3>
            {parent && !isEditing && (
              <div className="flex items-center gap-2 mt-1">
                 <span className="text-[9px] uppercase font-bold text-[#8C8279] tracking-widest">Inside:</span>
                 <span className="text-[10px] font-bold text-[#C5A059] bg-[#C5A059]/10 px-2 py-0.5 rounded-sm">{parent.name}</span>
              </div>
            )}
          </div>
          <button onClick={onClose} type="button" className="p-2 bg-white rounded-full text-[#8C8279] hover:text-[#C5A059] hover:bg-[#C5A059]/10 transition-colors border border-transparent">
            <X size={18}/>
          </button>
        </div>

        {/* Form */}
        <div className="p-8">
          {/* ✅ FIX: Changed 'action' to 'onSubmit' for better control */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* ✅ FIX: HIDDEN INPUTS FOR IDs */}
            {isEditing && <input type="hidden" name="categoryId" value={editData._id} />}
            {!isEditing && <input type="hidden" name="parentId" value={parent ? parent._id : ''} />}
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#8C8279] uppercase tracking-[0.2em]">Category Name</label>
              <input 
                name="name" 
                defaultValue={editData?.name || ''}
                placeholder={parent ? `e.g. ${parent.name} Accessories` : "e.g. Summer Collection"} 
                className="w-full p-4 bg-[#F9F6F0] border border-transparent focus:bg-white focus:border-[#C5A059] text-sm font-body outline-none transition-all placeholder:text-gray-400 rounded-sm"
                autoFocus
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#8C8279] uppercase tracking-[0.2em]">Thumbnail Image (4:5 Ratio)</label>
              
              <div className="relative aspect-[4/5] w-32 md:w-40 mx-auto border border-dashed border-[#C5A059]/40 bg-[#F9F6F0] overflow-hidden hover:border-[#C5A059] hover:bg-white transition-all text-center cursor-pointer group flex flex-col items-center justify-center rounded-sm">
                <input 
                    type="file" 
                    name="image" 
                    accept="image/*" 
                    onChange={handleImageChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-20"
                />
                {preview ? (
                    <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover z-10" />
                ) : (
                    <>
                        <div className="w-10 h-10 bg-white shadow-sm rounded-full flex items-center justify-center mx-auto mb-2 text-[#C5A059]/50 group-hover:text-[#C5A059] transition-colors relative z-0">
                           <ImageIcon size={20}/>
                        </div>
                        <span className="text-[10px] uppercase tracking-widest text-[#8C8279] font-bold group-hover:text-[#C5A059] block relative z-0">Upload</span>
                    </>
                )}
                {/* Edit overlay on hover if image exists */}
                {preview && (
                   <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity z-15 flex items-center justify-center">
                       <span className="text-white text-[10px] font-bold uppercase tracking-widest">Change Photo</span>
                   </div>
                )}
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading} 
              className="w-full bg-[#121212] text-white py-4 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-[#C5A059] transition-colors duration-500 flex items-center justify-center gap-2 shadow-xl disabled:opacity-70 rounded-sm mt-4"
            >
              {loading ? <Loader2 size={16} className="animate-spin"/> : (isEditing ? 'Save Changes' : (parent ? 'Add Sub-Category' : 'Create Category'))}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function CategoryClient({ categories }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null); 
  const [editData, setEditData] = useState(null); 
  const containerRef = useRef(null);

  // Animation on Load
  useEffect(() => {
    if (containerRef.current) {
        gsap.fromTo(".anim-node", 
            { opacity: 0, y: 15 }, 
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: "power2.out", force3D: true }
        );
    }
  }, [categories]);

  const openCreateModal = (parent = null) => {
    setEditData(null);
    setSelectedParent(parent);
    setModalOpen(true);
  };

  const openEditModal = (node) => {
    setEditData(node);
    setSelectedParent(null);
    setModalOpen(true);
  };

  // --- RECURSIVE NODE RENDERER ---
  const CategoryNode = ({ node, depth = 0 }) => {
    const hasChildren = node.children && node.children.length > 0;
    
    return (
      <div className="anim-node relative will-change-transform backface-hidden">
        {depth > 0 && (
           <>
             <div className="absolute top-[-10px] bottom-1/2 border-l border-[#C5A059]/20" style={{ left: '-24px' }}></div>
             <div className="absolute top-1/2 w-6 border-t border-[#C5A059]/20" style={{ left: '-24px' }}></div>
           </>
        )}

        <div className={`
           group flex items-center justify-between p-4 mb-3 border transition-all duration-300 rounded-sm
           ${depth === 0 
             ? 'bg-white shadow-sm border-gray-100 hover:border-[#C5A059]/40' 
             : 'bg-[#F9F6F0]/50 hover:bg-white border-dashed border-[#C5A059]/20 hover:border-solid hover:border-[#C5A059]/40'
           }
        `}>
           <div className="flex items-center gap-4">
              <div className={`
                 w-12 h-12 rounded-[1px] flex items-center justify-center transition-colors border
                 ${node.image ? 'bg-[#F9F6F0] border-transparent overflow-hidden' : 'bg-[#F9F6F0] border-[#C5A059]/20 group-hover:border-[#C5A059]'}
              `}>
                 {node.image ? (
                   <img src={node.image} alt={node.name} className="w-full h-full object-cover"/>
                 ) : (
                   <Folder size={20} className="text-[#8C8279] group-hover:text-[#C5A059] transition-colors"/>
                 )}
              </div>
              
              <div>
                 <h4 className={`font-heading uppercase tracking-wide leading-tight group-hover:text-[#C5A059] transition-colors ${depth === 0 ? 'text-lg text-[#121212]' : 'text-sm text-[#121212]/80'}`}>
                    {node.name}
                 </h4>
                 <p className="text-[10px] text-[#8C8279] font-mono mt-0.5 tracking-wide">/{node.slug}</p>
              </div>
           </div>

           <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
              <button 
                onClick={() => openCreateModal(node)}
                className="flex items-center gap-2 px-3 py-2 bg-[#121212] text-white hover:bg-[#C5A059] transition-colors shadow-sm rounded-sm"
                title="Add Sub-Category"
              >
                 <Plus size={12} /> <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Add Sub</span>
              </button>

              <button 
                onClick={() => openEditModal(node)}
                className="p-2 bg-white border border-gray-200 text-gray-500 hover:text-[#C5A059] hover:border-[#C5A059] hover:bg-[#F9F6F0] transition-colors shadow-sm rounded-sm"
                title="Edit Category"
              >
                 <Edit3 size={14} />
              </button>
              
              <button 
                onClick={() => { if(confirm(`Delete ${node.name} and ALL its sub-categories & photos? This cannot be undone.`)) deleteCategory(node._id); }}
                className="p-2 bg-white border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors shadow-sm rounded-sm"
                title="Delete Category"
              >
                 <Trash2 size={14} />
              </button>
           </div>
        </div>

        {hasChildren && (
           <div className="pl-12 ml-6 border-l border-dashed border-[#C5A059]/20">
              {node.children.map(child => (
                 <CategoryNode key={child._id} node={child} depth={depth + 1} />
              ))}
           </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F9F6F0] font-body p-4 md:p-8 pt-24 lg:pt-8 selection:bg-[#C5A059] selection:text-white" ref={containerRef}>
      
      <AnimatePresence>
        {modalOpen && (
          <CategoryModal 
            parent={selectedParent} 
            editData={editData}
            onClose={() => setModalOpen(false)} 
          />
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 border-b border-[#C5A059]/20 pb-6">
          <div>
            <span className="text-[#C5A059] font-bold uppercase tracking-[0.3em] text-[10px]">Organization</span>
            <h1 className="font-heading text-4xl mt-2 text-[#121212] uppercase tracking-tight">Categories</h1>
            <p className="text-[#8C8279] text-xs mt-2 font-medium tracking-widest uppercase">Manage your store hierarchy efficiently.</p>
          </div>
          <button 
            onClick={() => openCreateModal(null)} 
            className="mt-4 md:mt-0 bg-[#121212] text-white px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#C5A059] flex items-center gap-2 transition-all duration-500 shadow-xl rounded-sm"
          >
            <Plus size={16} /> New Root Category
          </button>
        </div>

        <div className="space-y-2">
           {categories.length > 0 ? (
              categories.map(cat => <CategoryNode key={cat._id} node={cat} />)
           ) : (
              <div className="py-32 flex flex-col items-center justify-center text-[#8C8279] border border-dashed border-[#C5A059]/30 bg-white shadow-sm rounded-sm">
                 <div className="w-16 h-16 bg-[#F9F6F0] rounded-full flex items-center justify-center mb-4 text-[#C5A059]">
                    <Layers size={28} strokeWidth={1.5} />
                 </div>
                 <p className="text-sm font-heading uppercase tracking-widest text-[#121212]">No categories yet</p>
                 <p className="text-xs mt-2 uppercase tracking-widest">Start by creating a root category above.</p>
              </div>
           )}
        </div>
      </div>
    </div>
  );
}