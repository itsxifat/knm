'use client';

import { updateProduct, getCategories, getTags, getProductById } from '@/actions/products'; // Adjust path
import { getSizesData } from '@/actions/sizes'; 
import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, UploadCloud, Save, ArrowLeft, X, Check, Image as ImageIcon, Box, Tag, AlertCircle, ChevronDown, Barcode, Percent, Ruler, Layers } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import gsap from 'gsap';
import { AnimatePresence, motion } from 'framer-motion';
import StockVariantManager from '../../components/StockVariantManager'; // Adjust path

// --- UTILITY: Prevent Input Scroll Change ---
const preventScroll = (e) => e.target.blur();

// --- OPTIMIZED IMAGE COMPONENTS ---

// 1. New Image Preview (Fast Object URL, no canvas blocking)
const ImagePreviewItem = memo(({ file, index, onRemove }) => {
  const [thumb, setThumb] = useState(null);

  useEffect(() => {
    // Instant, non-blocking preview creation
    const url = URL.createObjectURL(file);
    setThumb(url);
    // CRITICAL: Prevent memory leaks
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!thumb) return <div className="aspect-square bg-[#F9F6F0] rounded-sm border border-[#C5A059]/20 animate-pulse" />;

  return (
    <div className="aspect-square relative rounded-sm overflow-hidden shadow-sm border border-[#C5A059]/20 group bg-white hover:border-[#C5A059] transition-colors">
      <img src={thumb} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="New" loading="lazy" decoding="async" />
      <button 
        type="button" 
        onClick={() => onRemove(index)} 
        className="absolute top-2 right-2 p-1.5 bg-white rounded-sm text-red-600 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:scale-105 shadow-md z-10"
      >
        <X size={14}/>
      </button>
      <span className="absolute bottom-2 left-2 text-[9px] font-bold bg-[#C5A059] text-white px-2 py-0.5 rounded-sm shadow-sm uppercase tracking-wide z-10">NEW</span>
    </div>
  );
});
ImagePreviewItem.displayName = 'ImagePreviewItem';

// 2. Existing Image Preview (Using Next/Image)
const ExistingImageItem = memo(({ url, index, onRemove }) => (
  <div className="aspect-square relative rounded-sm overflow-hidden shadow-sm group bg-[#F9F6F0] border border-[#C5A059]/20 hover:border-[#C5A059] transition-colors">
      <Image src={url} alt="Existing" fill sizes="150px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
      <button 
        type="button" 
        onClick={() => onRemove(index)} 
        className="absolute top-2 right-2 p-1.5 bg-white rounded-sm text-red-600 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:scale-105 shadow-md z-10"
      >
        <X size={14}/>
      </button>
  </div>
));
ExistingImageItem.displayName = 'ExistingImageItem';

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

const flattenCategories = (categories, depth = 0) => {
  let flat = [];
  categories.forEach(cat => {
    flat.push({ _id: cat._id, name: cat.name, depth: depth, label: `${'\u00A0\u00A0'.repeat(depth * 3)}${depth > 0 ? '↳ ' : ''}${cat.name}` });
    if (cat.children?.length > 0) flat = flat.concat(flattenCategories(cat.children, depth + 1));
  });
  return flat;
};

// --- TAKA SVG ---
const Taka = ({ size = 12, className = "", weight = "normal" }) => (
  <svg width={size} height={size+2} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block align-middle ${className}`}>
    <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="20" fontWeight={weight === 'bold' ? 'bold' : 'normal'} fill="currentColor" style={{ fontFamily: "var(--font-heading)" }}>৳</text>
  </svg>
);

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const formRef = useRef(null);
  const dataFetchedRef = useRef(false);

  // State
  const [initLoading, setInitLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); 
  
  const [productData, setProductData] = useState(null);
  const [flatCategories, setFlatCategories] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [sizeGuides, setSizeGuides] = useState([]);
  const [masterSizes, setMasterSizes] = useState([]);

  // Complex Form State
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [variants, setVariants] = useState([]); 
  const [autoGenSKU, setAutoGenSKU] = useState(false);
  const [autoGenBarcode, setAutoGenBarcode] = useState(false);

  // --- INITIAL LOAD ---
  useEffect(() => {
    if (dataFetchedRef.current) return;
    dataFetchedRef.current = true;

    async function load() {
      try {
        const [catTree, tags, sizeData, product] = await Promise.all([
            getCategories(), getTags(), getSizesData(), getProductById(params.id)
        ]);

        setFlatCategories(flattenCategories(catTree));
        setAvailableTags(tags);
        if(sizeData.success) {
            setSizeGuides(sizeData.guides);
            setMasterSizes(sizeData.masterSizes);
        }

        if (product) {
            setProductData(product);
            setExistingImages(product.images || []);
            if (product.variants?.length > 0) {
                setVariants(product.variants);
            } else if (product.sizes?.length > 0) {
                const stockPerSize = Math.floor((product.stock || 0) / product.sizes.length);
                setVariants(product.sizes.map(s => ({ size: s, stock: stockPerSize })));
            }
        } else {
            router.push('/admin/products');
        }
      } catch (err) { console.error(err); } 
      finally { setInitLoading(false); }
    }
    load();
  }, [params.id, router]);

  // Animation
  useEffect(() => {
    if (!initLoading && formRef.current) {
        gsap.fromTo(".anim-entry", { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: "power2.out" });
    }
  }, [initLoading]);

  // Handlers (Memoized)
  const showToast = useCallback((message, type = 'error') => { 
      setToast({ message, type }); setTimeout(() => setToast(null), 4000); 
  }, []);
  
  const handleNewImageChange = useCallback((e) => { 
      if (e.target.files?.length) setNewImages(prev => [...prev, ...Array.from(e.target.files)]); 
  }, []);
  
  const removeExistingImage = useCallback((index) => setExistingImages(prev => prev.filter((_, i) => i !== index)), []);
  const removeNewImage = useCallback((index) => setNewImages(prev => prev.filter((_, i) => i !== index)), []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
        const formData = new FormData(e.target);
        formData.append('id', params.id);
        
        existingImages.forEach(url => formData.append('keptImages', url));
        newImages.forEach(file => formData.append('newImages', file));
        formData.delete('images'); // Prevent double sending

        formData.append('variants', JSON.stringify(variants));

        if(autoGenSKU) formData.set('sku', 'AUTO');
        if(autoGenBarcode) formData.set('barcode', 'AUTO');

        const res = await updateProduct(formData);
        
        if (res.success) {
          showToast("Product updated successfully!", 'success');
          setTimeout(() => router.push('/admin/products'), 800);
        } else {
          showToast(res.error || "Update failed.", 'error');
          setSaving(false);
        }
    } catch (err) { 
        showToast("An unexpected error occurred.", 'error'); 
        setSaving(false); 
    }
  };

  if (initLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9F6F0] text-[#C5A059]">
        <Loader2 className="animate-spin mb-4" size={40} />
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#8C8279]">Loading Data...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9F6F0] font-body pb-40 text-[#121212] selection:bg-[#C5A059] selection:text-white">
      <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

      {/* --- HEADER --- */}
      <div className="bg-[#F9F6F0]/90 backdrop-blur-md border-b border-[#C5A059]/20 sticky top-0 z-40 px-6 md:px-10 py-4 shadow-sm">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/products" className="p-2 hover:bg-[#C5A059]/10 rounded-sm transition text-[#8C8279] hover:text-[#C5A059]">
               <ArrowLeft size={20} />
            </Link>
            <div>
               <h1 className="text-2xl font-heading text-[#121212] uppercase tracking-wide">Edit Product</h1>
               <p className="text-[9px] uppercase tracking-[0.3em] text-[#C5A059] font-bold">Catalog Management</p>
            </div>
          </div>
          <div className="flex gap-3">
             <button type="button" onClick={() => router.back()} className="px-6 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-widest text-[#57534E] hover:bg-white border border-transparent hover:border-[#E5E5E5] transition-all">Cancel</button>
             <button onClick={() => formRef.current?.requestSubmit()} disabled={saving} className="bg-[#121212] text-white px-6 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#C5A059] disabled:opacity-70 transition-all shadow-xl">
               {saving ? <Loader2 className="animate-spin" size={16}/> : <Check size={16} />} Save Changes
             </button>
          </div>
        </div>
      </div>

      {/* --- CONTENT --- */}
      <div className="max-w-[1920px] mx-auto p-4 md:p-8">
        <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Main Details */}
          <div className="lg:col-span-8 space-y-8">
            {/* DETAILS */}
            <div className="anim-entry bg-white p-8 rounded-sm shadow-sm border border-[#C5A059]/10">
              <div className="flex items-center gap-3 mb-8 border-b border-[#C5A059]/10 pb-4">
                 <Tag size={20} className="text-[#C5A059]"/>
                 <h3 className="font-heading text-xl text-[#121212] uppercase tracking-wide">Basic Information</h3>
              </div>
              <div className="space-y-6">
                <div>
                   <label className="block text-[10px] font-bold text-[#8C8279] uppercase tracking-[0.2em] mb-2">Product Name</label>
                   <input name="name" defaultValue={productData.name} required className="w-full p-4 bg-[#F9F6F0] border border-transparent focus:bg-white focus:border-[#C5A059] rounded-sm text-lg font-medium transition-all outline-none placeholder:text-[#8C8279]/50" />
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-[#8C8279] uppercase tracking-[0.2em] mb-2">Description</label>
                   <textarea name="description" defaultValue={productData.description} required rows="6" className="w-full p-4 bg-[#F9F6F0] border border-transparent focus:bg-white focus:border-[#C5A059] rounded-sm text-sm outline-none resize-none placeholder:text-[#8C8279]/50" />
                </div>
              </div>
            </div>

            {/* GALLERY */}
            <div className="anim-entry bg-white p-8 rounded-sm shadow-sm border border-[#C5A059]/10">
              <div className="flex items-center gap-3 mb-8 border-b border-[#C5A059]/10 pb-4">
                 <ImageIcon size={20} className="text-[#C5A059]"/>
                 <h3 className="font-heading text-xl text-[#121212] uppercase tracking-wide">Visuals</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <div className="aspect-square relative group cursor-pointer border border-dashed border-[#C5A059]/40 rounded-sm flex flex-col items-center justify-center bg-[#F9F6F0] hover:border-[#C5A059] hover:bg-white transition-all">
                  <input type="file" multiple accept="image/*" onChange={handleNewImageChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  <div className="p-4 rounded-full bg-white shadow-sm mb-3 group-hover:scale-110 transition-transform text-[#C5A059]">
                      <UploadCloud size={24}/>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#8C8279] group-hover:text-[#C5A059]">Add New</span>
                </div>
                
                {/* Optimized Existing Images */}
                {existingImages.map((url, i) => (
                    <ExistingImageItem key={`ex-${i}`} url={url} index={i} onRemove={removeExistingImage} />
                ))}
                
                {/* Optimized New Images */}
                <AnimatePresence>
                    {newImages.map((file, i) => (
                        <ImagePreviewItem key={`new-${i}-${file.name}`} file={file} index={i} onRemove={removeNewImage} />
                    ))}
                </AnimatePresence>
              </div>
            </div>

            {/* INVENTORY */}
            <div className="anim-entry bg-white p-8 rounded-sm shadow-sm border border-[#C5A059]/10">
               <div className="flex items-center gap-3 mb-8 border-b border-[#C5A059]/10 pb-4">
                  <Barcode size={20} className="text-[#C5A059]"/>
                  <h3 className="font-heading text-xl text-[#121212] uppercase tracking-wide">Inventory Codes</h3>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div>
                     <label className="flex justify-between items-end text-[10px] font-bold text-[#8C8279] uppercase tracking-[0.2em] mb-2">
                       <span>SKU</span> 
                       <button type="button" className="text-[#C5A059] hover:text-[#121212] tracking-wider transition-colors" onClick={() => setAutoGenSKU(!autoGenSKU)}>{autoGenSKU ? '(Will Regenerate)' : 'Regenerate?'}</button>
                     </label>
                     <div className={`relative rounded-sm border transition-colors ${autoGenSKU ? 'bg-[#F9F6F0] border-[#E5E5E5]' : 'bg-white border-[#E5E5E5] focus-within:border-[#C5A059]'}`}>
                        <input name="sku" defaultValue={productData.sku} disabled={autoGenSKU} className="w-full p-4 bg-transparent outline-none text-sm font-mono font-bold text-[#121212] disabled:text-[#8C8279]" placeholder={autoGenSKU ? "Auto-Generating..." : "Custom SKU"} />
                        {autoGenSKU && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#C5A059]"><Check size={16}/></div>}
                     </div>
                 </div>
                 <div>
                     <label className="flex justify-between items-end text-[10px] font-bold text-[#8C8279] uppercase tracking-[0.2em] mb-2">
                       <span>Barcode</span> 
                       <button type="button" className="text-[#C5A059] hover:text-[#121212] tracking-wider transition-colors" onClick={() => setAutoGenBarcode(!autoGenBarcode)}>{autoGenBarcode ? '(Will Regenerate)' : 'Regenerate?'}</button>
                     </label>
                     <div className={`relative rounded-sm border transition-colors ${autoGenBarcode ? 'bg-[#F9F6F0] border-[#E5E5E5]' : 'bg-white border-[#E5E5E5] focus-within:border-[#C5A059]'}`}>
                        <input name="barcode" defaultValue={productData.barcode} disabled={autoGenBarcode} className="w-full p-4 bg-transparent outline-none text-sm font-mono font-bold text-[#121212] disabled:text-[#8C8279]" placeholder={autoGenBarcode ? "Auto-Generating..." : "Custom Barcode"} />
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
                
                {/* Category */}
                <div className="relative group">
                  <label className="block text-[10px] font-bold text-[#8C8279] uppercase tracking-[0.2em] mb-2 group-focus-within:text-[#C5A059] transition-colors">Category</label>
                  <div className="relative">
                    <select name="category" className="w-full p-4 bg-[#F9F6F0] border border-transparent focus:bg-white focus:border-[#C5A059] rounded-sm text-sm font-bold outline-none appearance-none cursor-pointer text-[#121212]" defaultValue={productData.category?._id || productData.category}>
                      <option value="" disabled>Select Category</option>
                      {flatCategories.map(cat => <option key={cat._id} value={cat._id}>{cat.label}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#8C8279]"/>
                  </div>
                </div>

                {/* Size Guide */}
                <div className="relative group">
                  <label className="block text-[10px] font-bold text-[#8C8279] uppercase tracking-[0.2em] mb-2 group-focus-within:text-[#C5A059] transition-colors">Size Chart</label>
                  <div className="relative">
                    <select name="sizeGuide" className="w-full p-4 bg-[#F9F6F0] border border-transparent focus:bg-white focus:border-[#C5A059] rounded-sm text-sm font-bold outline-none appearance-none cursor-pointer text-[#121212]" defaultValue={productData.sizeGuide?._id || productData.sizeGuide || ""}>
                      <option value="">No Size Guide</option>
                      {sizeGuides.map(guide => <option key={guide._id} value={guide._id}>{guide.name}</option>)}
                    </select>
                    <Ruler size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#8C8279]"/>
                  </div>
                </div>

                <StockVariantManager masterSizes={masterSizes} value={variants} onChange={setVariants} />
                
                {/* Tags */}
                <div>
                   <label className="block text-[10px] font-bold text-[#8C8279] uppercase tracking-[0.2em] mb-3">Tags</label>
                   <div className="flex flex-wrap gap-2">
                      {availableTags.map(tag => (
                         <label key={tag._id} className="cursor-pointer group">
                            <input type="checkbox" name="tags" value={tag._id} defaultChecked={productData.tags?.some(t => t._id === tag._id || t === tag._id)} className="peer sr-only"/>
                            <span className="px-3 py-1.5 rounded-sm text-[9px] font-bold uppercase tracking-[0.1em] bg-[#F9F6F0] text-[#57534E] border border-transparent peer-checked:bg-[#121212] peer-checked:text-white peer-checked:border-[#121212] transition-all select-none block group-hover:border-[#C5A059]">
                               {tag.name}
                            </span>
                         </label>
                      ))}
                   </div>
                </div>

              </div>
            </div>

            {/* Pricing Engine */}
            <div className="anim-entry bg-white p-8 rounded-sm shadow-sm border border-[#C5A059]/10 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-[#C5A059]/5 rounded-bl-full -mr-8 -mt-8 pointer-events-none"></div>
               
               <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="p-2 bg-[#F9F6F0] rounded-sm text-[#C5A059]">
                     <Percent size={18} />
                  </div>
                  <h3 className="font-heading text-xl text-[#121212] uppercase tracking-wide">Pricing</h3>
               </div>
               
               <div className="space-y-6 relative z-10">
                 <div>
                     <label className="block text-[10px] font-bold text-[#8C8279] uppercase tracking-[0.2em] mb-2">Regular Price</label>
                     <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8C8279] group-focus-within:text-[#C5A059] transition-colors"><Taka/></span>
                        <input name="price" type="number" onWheel={preventScroll} defaultValue={productData.price} required className="w-full pl-10 p-4 bg-[#F9F6F0] border border-transparent focus:bg-white focus:border-[#C5A059] rounded-sm text-lg font-bold outline-none transition-all text-[#121212]"/>
                     </div>
                 </div>
                 
                 <div className="p-5 bg-[#F9F6F0]/50 rounded-sm border border-dashed border-[#C5A059]/30 relative">
                     <div className="absolute -top-3 left-4 bg-[#F9F6F0] px-2 text-[9px] font-bold text-[#C5A059] uppercase tracking-widest border border-[#C5A059]/10 rounded-sm">Special Offer</div>
                     
                     <div className="space-y-4 pt-2">
                        <div className="relative group">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C5A059]"><Taka/></span>
                           <input name="discountPrice" type="number" onWheel={preventScroll} defaultValue={productData.discountPrice} placeholder="Sale Price" className="w-full pl-10 p-3 bg-white rounded-sm text-[#C5A059] font-bold outline-none border border-[#E5E5E5] focus:border-[#C5A059] transition-all"/>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                           <div className="space-y-1">
                              <label className="text-[8px] text-[#8C8279] uppercase tracking-widest font-bold ml-1">Starts</label>
                              <input name="saleStartDate" type="date" defaultValue={productData.saleStartDate ? new Date(productData.saleStartDate).toISOString().split('T')[0] : ''} className="w-full p-2.5 text-[10px] font-bold text-[#121212] bg-white border border-[#E5E5E5] rounded-sm outline-none focus:border-[#C5A059]"/>
                           </div>
                           <div className="space-y-1">
                              <label className="text-[8px] text-[#8C8279] uppercase tracking-widest font-bold ml-1">Ends</label>
                              <input name="saleEndDate" type="date" defaultValue={productData.saleEndDate ? new Date(productData.saleEndDate).toISOString().split('T')[0] : ''} className="w-full p-2.5 text-[10px] font-bold text-[#121212] bg-white border border-[#E5E5E5] rounded-sm outline-none focus:border-[#C5A059]"/>
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