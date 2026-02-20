'use client';

import { createProduct, getCategories, getTags } from '@/actions/products'; // Ensure correct path
import { getSizesData } from '@/actions/sizes'; 
import { useState, useEffect, useRef, memo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Loader2, UploadCloud, Save, ArrowLeft, X, Check, 
  Image as ImageIcon, Tag, AlertCircle, ChevronDown, 
  Barcode, Percent, Ruler 
} from 'lucide-react';
import Link from 'next/link';
import gsap from 'gsap';
import { AnimatePresence, motion } from 'framer-motion';
import StockVariantManager from '../../components/StockVariantManager'; // Ensure correct path

// --- UTILITY: Prevent Input Scroll Change ---
const preventScroll = (e) => e.target.blur();

// --- OPTIMIZED IMAGE COMPONENT (FIXED MEMORY LEAK) ---
const ImagePreview = memo(({ file, index, onRemove }) => {
  const [imageUrl, setImageUrl] = useState(null);
  
  useEffect(() => {
    // Create the object URL
    const url = URL.createObjectURL(file);
    setImageUrl(url);

    // CLEANUP: Revoke the URL when component unmounts or file changes
    // This is CRITICAL to prevent browser memory leaks causing lag.
    return () => URL.revokeObjectURL(url);
  }, [file]);
  
  if (!imageUrl) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      layout
      className="aspect-[3/4] relative rounded-sm overflow-hidden shadow-sm border border-[#C5A059]/20 group transform-gpu"
    >
      {/* Intentionally using native img for local blob previews (Next/Image requires domains) */}
      <img 
        src={imageUrl} 
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
        alt="Preview"
        loading="lazy"
        decoding="async"
      />
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"/>
      <button 
        type="button" 
        onClick={() => onRemove(index)} 
        className="absolute top-2 right-2 p-1.5 bg-white rounded-full text-red-600 shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-20"
        aria-label="Remove Image"
      >
        <X size={14}/>
      </button>
      <div className="absolute bottom-2 left-2 bg-[#121212]/70 text-[#C5A059] text-[9px] px-2 py-0.5 rounded-sm backdrop-blur-md font-bold z-10 tracking-widest uppercase">
        {index === 0 ? 'COVER' : `#${index + 1}`}
      </div>
    </motion.div>
  );
});
ImagePreview.displayName = 'ImagePreview';

// --- HELPER: FLATTEN CATEGORIES ---
const flattenCategories = (categories, depth = 0) => {
  let flat = [];
  categories.forEach(cat => {
    flat.push({ 
      _id: cat._id, 
      name: cat.name, 
      depth: depth, 
      label: `${'\u00A0\u00A0'.repeat(depth * 3)}${depth > 0 ? '↳ ' : ''}${cat.name}` 
    });
    if (cat.children?.length > 0) flat = flat.concat(flattenCategories(cat.children, depth + 1));
  });
  return flat;
};

// --- TOAST COMPONENT ---
const Toast = ({ message, type, onClose }) => (
  <motion.div 
    initial={{ opacity: 0, y: 50, x: '-50%' }} 
    animate={{ opacity: 1, y: 0, x: '-50%' }} 
    exit={{ opacity: 0, y: 20, x: '-50%' }} 
    className={`fixed bottom-8 left-1/2 z-[100] flex items-center gap-4 px-6 py-4 rounded-sm shadow-2xl border backdrop-blur-md min-w-[340px] 
        ${type === 'error' ? 'bg-red-50/95 border-red-200 text-red-800' : 'bg-[#121212] border-[#C5A059]/30 text-white'}`}
  >
    <div className={`p-2 rounded-full ${type === 'error' ? 'bg-red-100 text-red-600' : 'bg-[#C5A059]/20 text-[#C5A059]'}`}>
       {type === 'error' ? <AlertCircle size={20} /> : <Check size={20} />}
    </div>
    <div className="flex-1">
       <p className={`text-[9px] font-bold uppercase tracking-[0.2em] ${type === 'error' ? 'opacity-60' : 'text-[#C5A059]'}`}>
           {type === 'error' ? 'Error' : 'System'}
       </p>
       <p className="text-sm font-heading tracking-wide mt-0.5">{message}</p>
    </div>
    <button onClick={onClose} className="opacity-40 hover:opacity-100 transition-opacity"><X size={18}/></button>
  </motion.div>
);

export default function NewProductPage() {
  const router = useRouter();
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false);
  
  const [flatCategories, setFlatCategories] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [sizeGuides, setSizeGuides] = useState([]);
  const [masterSizes, setMasterSizes] = useState([]);
  
  const [images, setImages] = useState([]);
  const [variants, setVariants] = useState([]); 
  const [toast, setToast] = useState(null); 
  const [autoGenSKU, setAutoGenSKU] = useState(false);
  const [autoGenBarcode, setAutoGenBarcode] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
          const catTree = await getCategories();
          if(!isMounted) return;
          setFlatCategories(flattenCategories(catTree));
          
          const tags = await getTags();
          if(!isMounted) return;
          setAvailableTags(tags);
          
          const sizeData = await getSizesData();
          if(!isMounted) return;
          if(sizeData.success) {
            setSizeGuides(sizeData.guides);
            setMasterSizes(sizeData.masterSizes);
          }
      } catch (error) {
          console.error("Initialization error:", error);
      }
    }
    init();

    // GSAP Entry Animation
    gsap.fromTo(".anim-entry", 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" }
    );

    return () => { isMounted = false; };
  }, []);

  const showToast = (message, type = 'error') => { 
     setToast({ message, type }); 
     setTimeout(() => setToast(null), 4000); 
  };

  const handleImageChange = (e) => { 
     if (e.target.files) {
        setImages(prev => [...prev, ...Array.from(e.target.files)]); 
     }
  };

  const removeImage = (index) => { 
     setImages(prev => prev.filter((_, i) => i !== index)); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0) {
        showToast("At least one image is required.", "error");
        return;
    }

    setLoading(true);
    try {
        const formData = new FormData(e.target);
        
        // Handle images
        formData.delete('images');
        images.forEach(file => formData.append('images', file));
        
        // Handle auto-generation flags
        if(autoGenSKU) formData.set('sku', 'AUTO');
        if(autoGenBarcode) formData.set('barcode', 'AUTO');
        
        // Handle complex JSON structures
        formData.append('variants', JSON.stringify(variants));
        
        // Send to Server Action
        const res = await createProduct(formData);
        
        if (res.success) {
          showToast("Product successfully published!", 'success');
          setTimeout(() => router.push('/admin/products'), 1500);
        } else {
          showToast(res.error || "Failed to create product.", 'error');
          setLoading(false);
        }
    } catch (err) { 
        showToast("An unexpected error occurred.", 'error'); 
        setLoading(false); 
    }
  };

  const Taka = ({ size = 12, className = "", weight = "normal" }) => (
    <svg width={size} height={size+2} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block align-middle ${className}`}>
      <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="20" fontWeight={weight === 'bold' ? 'bold' : 'normal'} fill="currentColor" style={{ fontFamily: "var(--font-heading)" }}>৳</text>
    </svg>
  );

  return (
    <div className="min-h-screen bg-[#F9F6F0] font-body pb-40 text-[#121212] selection:bg-[#C5A059] selection:text-white">
      <AnimatePresence>
          {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* --- STICKY HEADER --- */}
      <div className="bg-[#F9F6F0]/90 backdrop-blur-md border-b border-[#C5A059]/20 sticky top-0 z-40 px-6 md:px-10 py-4 shadow-sm">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/products" className="p-2 hover:bg-[#C5A059]/10 rounded-sm text-[#8C8279] hover:text-[#C5A059] transition-colors border border-transparent hover:border-[#C5A059]/30">
               <ArrowLeft size={20} />
            </Link>
            <div>
               <h1 className="text-2xl font-heading uppercase tracking-wide text-[#121212]">New Product</h1>
               <p className="text-[9px] uppercase tracking-[0.3em] text-[#C5A059] font-bold">Catalog Management</p>
            </div>
          </div>
          <div className="flex gap-3">
             <button type="button" onClick={() => router.back()} className="hidden md:block px-6 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-widest text-[#57534E] hover:bg-white hover:text-[#121212] border border-transparent hover:border-[#E5E5E5] transition-all">Discard</button>
             <button onClick={(e) => formRef.current?.requestSubmit()} disabled={loading} className="bg-[#121212] text-white px-6 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#C5A059] disabled:opacity-70 transition-all shadow-xl flex items-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={16}/> : <><Save size={14} /> Publish</>}
             </button>
          </div>
        </div>
      </div>

      {/* --- FORM CONTAINER --- */}
      <div className="max-w-[1920px] mx-auto p-4 md:p-8">
        <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Main Details */}
          <div className="lg:col-span-8 space-y-8">
            
            <div className="anim-entry bg-white p-8 rounded-sm shadow-sm border border-[#C5A059]/10">
              <div className="flex items-center gap-3 mb-8 border-b border-[#C5A059]/10 pb-4">
                 <Tag size={20} className="text-[#C5A059]"/>
                 <h3 className="font-heading text-xl text-[#121212] uppercase tracking-wide">Basic Information</h3>
              </div>
              <div className="space-y-6">
                <div>
                   <label className="block text-[10px] font-bold text-[#8C8279] uppercase tracking-[0.2em] mb-2">Product Name</label>
                   <input name="name" required className="w-full p-4 bg-[#F9F6F0] border border-transparent focus:bg-white focus:border-[#C5A059] rounded-sm text-lg font-medium outline-none transition-all placeholder:text-[#8C8279]/50" placeholder="e.g. Classic Tailored Suit" />
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-[#8C8279] uppercase tracking-[0.2em] mb-2">Description</label>
                   <textarea name="description" required rows="6" className="w-full p-4 bg-[#F9F6F0] border border-transparent focus:bg-white focus:border-[#C5A059] rounded-sm text-sm outline-none resize-none placeholder:text-[#8C8279]/50" placeholder="Detailed product description..." />
                </div>
              </div>
            </div>

            <div className="anim-entry bg-white p-8 rounded-sm shadow-sm border border-[#C5A059]/10">
              <div className="flex items-center gap-3 mb-8 border-b border-[#C5A059]/10 pb-4">
                 <ImageIcon size={20} className="text-[#C5A059]"/>
                 <h3 className="font-heading text-xl text-[#121212] uppercase tracking-wide">Visuals</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <div className="aspect-[3/4] relative group cursor-pointer border border-dashed border-[#C5A059]/40 rounded-sm flex flex-col items-center justify-center bg-[#F9F6F0] hover:border-[#C5A059] hover:bg-white transition-all">
                  <input type="file" multiple accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  <div className="p-4 rounded-full bg-white shadow-sm mb-3 group-hover:scale-110 transition-transform text-[#C5A059]">
                      <UploadCloud size={24}/>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#8C8279] group-hover:text-[#C5A059]">Upload</span>
                </div>
                
                <AnimatePresence>
                   {images.map((file, i) => (
                      <ImagePreview key={`${file.name}-${i}`} file={file} index={i} onRemove={removeImage} />
                   ))}
                </AnimatePresence>
              </div>
            </div>

            <div className="anim-entry bg-white p-8 rounded-sm shadow-sm border border-[#C5A059]/10">
               <div className="flex items-center gap-3 mb-8 border-b border-[#C5A059]/10 pb-4">
                  <Barcode size={20} className="text-[#C5A059]"/>
                  <h3 className="font-heading text-xl text-[#121212] uppercase tracking-wide">Inventory Codes</h3>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div>
                     <label className="flex justify-between items-end text-[10px] font-bold text-[#8C8279] uppercase tracking-[0.2em] mb-2">
                       <span>SKU</span> 
                       <button type="button" className="text-[#C5A059] hover:text-[#121212] tracking-wider transition-colors" onClick={() => setAutoGenSKU(!autoGenSKU)}>{autoGenSKU ? '(Will Regenerate)' : 'Auto Generate?'}</button>
                     </label>
                     <div className={`relative rounded-sm border transition-colors ${autoGenSKU ? 'bg-[#F9F6F0] border-[#E5E5E5]' : 'bg-white border-[#E5E5E5] focus-within:border-[#C5A059]'}`}>
                        <input name="sku" disabled={autoGenSKU} className="w-full p-4 bg-transparent outline-none text-sm font-mono font-bold text-[#121212] disabled:text-[#8C8279]" placeholder={autoGenSKU ? "System will generate SKU" : "Enter custom SKU"} />
                        {autoGenSKU && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#C5A059]"><Check size={16}/></div>}
                     </div>
                 </div>
                 <div>
                     <label className="flex justify-between items-end text-[10px] font-bold text-[#8C8279] uppercase tracking-[0.2em] mb-2">
                       <span>Barcode</span>
                       <button type="button" className="text-[#C5A059] hover:text-[#121212] tracking-wider transition-colors" onClick={() => setAutoGenBarcode(!autoGenBarcode)}>{autoGenBarcode ? '(Will Regenerate)' : 'Auto Generate?'}</button>
                     </label>
                     <div className={`relative rounded-sm border transition-colors ${autoGenBarcode ? 'bg-[#F9F6F0] border-[#E5E5E5]' : 'bg-white border-[#E5E5E5] focus-within:border-[#C5A059]'}`}>
                        <input name="barcode" disabled={autoGenBarcode} className="w-full p-4 bg-transparent outline-none text-sm font-mono font-bold text-[#121212] disabled:text-[#8C8279]" placeholder={autoGenBarcode ? "System will generate Barcode" : "Enter Barcode"} />
                        {autoGenBarcode && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#C5A059]"><Check size={16}/></div>}
                     </div>
                 </div>
               </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Sidebar Settings */}
          <div className="lg:col-span-4 space-y-8">
            <div className="anim-entry bg-white p-8 rounded-sm shadow-sm border border-[#C5A059]/10">
              <h3 className="font-heading text-xl text-[#121212] uppercase tracking-wide mb-6">Organization</h3>
              <div className="space-y-6">
                
                <div className="relative group">
                  <label className="block text-[10px] font-bold text-[#8C8279] uppercase tracking-[0.2em] mb-2 group-focus-within:text-[#C5A059] transition-colors">Category</label>
                  <div className="relative">
                    <select name="category" required className="w-full p-4 bg-[#F9F6F0] border border-transparent focus:bg-white focus:border-[#C5A059] rounded-sm text-sm font-bold outline-none appearance-none cursor-pointer text-[#121212]" defaultValue="">
                      <option value="" disabled>Select Category</option>
                      {flatCategories.map(cat => <option key={cat._id} value={cat._id}>{cat.label}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#8C8279]"/>
                  </div>
                </div>

                <div className="relative group">
                  <label className="block text-[10px] font-bold text-[#8C8279] uppercase tracking-[0.2em] mb-2 group-focus-within:text-[#C5A059] transition-colors">Size Chart</label>
                  <div className="relative">
                    <select name="sizeGuide" className="w-full p-4 bg-[#F9F6F0] border border-transparent focus:bg-white focus:border-[#C5A059] rounded-sm text-sm font-bold outline-none appearance-none cursor-pointer text-[#121212]" defaultValue="">
                      <option value="">No Size Guide</option>
                      {sizeGuides.map(guide => <option key={guide._id} value={guide._id}>{guide.name}</option>)}
                    </select>
                    <Ruler size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#8C8279]"/>
                  </div>
                </div>

                <StockVariantManager masterSizes={masterSizes} value={variants} onChange={setVariants} />
                
                <div>
                   <label className="block text-[10px] font-bold text-[#8C8279] uppercase tracking-[0.2em] mb-3">Tags</label>
                   <div className="flex flex-wrap gap-2">
                      {availableTags.map(tag => (
                         <label key={tag._id} className="cursor-pointer group">
                            <input type="checkbox" name="tags" value={tag._id} className="peer sr-only"/>
                            <span className="px-3 py-1.5 rounded-sm text-[9px] font-bold uppercase tracking-[0.1em] bg-[#F9F6F0] text-[#57534E] border border-transparent peer-checked:bg-[#121212] peer-checked:text-white peer-checked:border-[#121212] transition-all select-none block group-hover:border-[#C5A059]">
                               {tag.name}
                            </span>
                         </label>
                      ))}
                   </div>
                </div>

              </div>
            </div>

            <div className="anim-entry bg-white p-8 rounded-sm shadow-sm border border-[#C5A059]/10 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-[#C5A059]/5 rounded-bl-full -mr-8 -mt-8 pointer-events-none"></div>
               <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="p-2 bg-[#F9F6F0] rounded-sm text-[#C5A059]"><Percent size={18} /></div>
                  <h3 className="font-heading text-xl text-[#121212] uppercase tracking-wide">Pricing</h3>
               </div>
               
               <div className="space-y-6 relative z-10">
                 <div>
                     <label className="block text-[10px] font-bold text-[#8C8279] uppercase tracking-[0.2em] mb-2">Regular Price</label>
                     <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8C8279] group-focus-within:text-[#C5A059] transition-colors"><Taka/></span>
                        <input name="price" type="number" onWheel={preventScroll} required className="w-full pl-10 p-4 bg-[#F9F6F0] border border-transparent focus:bg-white focus:border-[#C5A059] rounded-sm text-lg font-bold outline-none transition-all text-[#121212]"/>
                     </div>
                 </div>
                 
                 <div className="p-5 bg-[#F9F6F0]/50 rounded-sm border border-dashed border-[#C5A059]/30 relative">
                     <div className="absolute -top-3 left-4 bg-[#F9F6F0] px-2 text-[9px] font-bold text-[#C5A059] uppercase tracking-widest border border-[#C5A059]/10 rounded-sm">Special Offer</div>
                     <div className="space-y-4 pt-2">
                        <div className="relative group">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C5A059]"><Taka/></span>
                           <input name="discountPrice" type="number" onWheel={preventScroll} placeholder="Sale Price" className="w-full pl-10 p-3 bg-white rounded-sm text-[#C5A059] font-bold outline-none border border-[#E5E5E5] focus:border-[#C5A059] transition-all"/>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                           <div className="space-y-1">
                              <label className="text-[8px] text-[#8C8279] uppercase tracking-widest font-bold ml-1">Starts</label>
                              <input name="saleStartDate" type="date" className="w-full p-2.5 text-[10px] font-bold text-[#121212] bg-white border border-[#E5E5E5] rounded-sm outline-none focus:border-[#C5A059]"/>
                           </div>
                           <div className="space-y-1">
                              <label className="text-[8px] text-[#8C8279] uppercase tracking-widest font-bold ml-1">Ends</label>
                              <input name="saleEndDate" type="date" className="w-full p-2.5 text-[10px] font-bold text-[#121212] bg-white border border-[#E5E5E5] rounded-sm outline-none focus:border-[#C5A059]"/>
                           </div>
                        </div>
                     </div>
                 </div>
               </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}