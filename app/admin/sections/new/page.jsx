'use client';

import { useState, useEffect } from 'react';
import { createSection } from '@/actions/sectionActions';
import { getAllProducts, getAllCategories } from '@/actions/products';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Video, Image as ImageIcon, Loader2, Filter, X, UploadCloud } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function NewSectionPage() {
  const router = useRouter();
  
  // Data State
  const [allProducts, setAllProducts] = useState([]); 
  const [filteredProducts, setFilteredProducts] = useState([]); 
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('All');
  
  // File State
  const [mediaFile, setMediaFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '', type: 'image', heading: '', subHeading: '', link: '', order: 1, products: []
  });

  // 1. Load Data
  useEffect(() => {
    async function initData() {
        try {
            const [productRes, categoryRes] = await Promise.all([
                getAllProducts(),
                getAllCategories()
            ]);

            setAllProducts(productRes.products || []);
            setFilteredProducts(productRes.products || []);
            setCategories(categoryRes || []);
            setLoading(false);
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("Failed to load data");
        }
    }
    initData();
  }, []);

  // 2. Filter Logic
  useEffect(() => {
    if (selectedCategoryId === 'All') {
        setFilteredProducts(allProducts);
    } else {
        setFilteredProducts(allProducts.filter(p => 
            p.category && p.category._id === selectedCategoryId
        ));
    }
  }, [selectedCategoryId, allProducts]);

  // 3. File Handler
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        setMediaFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!mediaFile) {
        toast.error('Please upload a banner image or video');
        return;
    }

    setSaving(true);
    
    try {
        // Create FormData for file upload
        const data = new FormData();
        data.append('title', formData.title);
        data.append('type', formData.type);
        data.append('heading', formData.heading);
        data.append('subHeading', formData.subHeading);
        data.append('link', formData.link);
        data.append('order', formData.order);
        data.append('mediaFile', mediaFile); // Append File
        data.append('products', JSON.stringify(formData.products)); // Append Products Array

        const res = await createSection(data);
        
        if (res.error) throw new Error(res.error);

        toast.success('Campaign Created Successfully');
        router.push('/admin/sections');
    } catch (error) {
        toast.error(error.message || 'Failed to create campaign');
    } finally {
        setSaving(false);
    }
  };

  const toggleProduct = (id) => {
    setFormData(prev => ({
        ...prev,
        products: prev.products.includes(id) 
            ? prev.products.filter(p => p !== id) 
            : [...prev.products, id]
    }));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F9F6F0]"><Loader2 className="animate-spin text-[#C5A059]" /></div>;

  return (
    <div className="min-h-screen bg-[#F9F6F0] pb-20 font-body text-[#121212]">
       
       {/* TOP BAR */}
       <div className="bg-white border-b border-[#F0F0F0] sticky top-0 z-30 px-8 py-4 flex justify-between items-center shadow-sm">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8C8279] hover:text-[#121212]">
             <ArrowLeft size={16}/> Cancel
          </button>
          <span className="font-heading text-lg text-[#121212]">New Campaign Section</span>
          <button 
             onClick={handleSubmit} 
             disabled={saving}
             className="bg-[#121212] text-[#C5A059] px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#C5A059] hover:text-white transition-all disabled:opacity-50 flex items-center gap-2"
          >
             {saving && <Loader2 size={14} className="animate-spin"/>}
             {saving ? 'Uploading...' : 'Publish Live'}
          </button>
       </div>

       <div className="max-w-5xl mx-auto mt-12 px-6">
          <form className="space-y-16">
             
             {/* 01. TEMPLATE */}
             <section>
                <div className="flex items-center gap-4 mb-6">
                    <span className="text-[#C5A059] font-heading text-4xl">01</span>
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#121212]">Choose Template</h3>
                </div>
                <div className="grid grid-cols-2 gap-6">
                   <div 
                     onClick={() => setFormData({...formData, type: 'image'})}
                     className={`cursor-pointer border p-8 flex flex-col items-center gap-4 transition-all duration-300 ${formData.type === 'image' ? 'bg-white border-[#C5A059] shadow-xl shadow-[#C5A059]/10' : 'bg-[#F5F5F5] border-transparent opacity-60 hover:opacity-100'}`}
                   >
                      <ImageIcon size={32} className={formData.type === 'image' ? 'text-[#C5A059]' : 'text-gray-400'}/>
                      <span className="font-heading text-lg">Image Banner</span>
                   </div>
                   <div 
                     onClick={() => setFormData({...formData, type: 'video'})}
                     className={`cursor-pointer border p-8 flex flex-col items-center gap-4 transition-all duration-300 ${formData.type === 'video' ? 'bg-white border-[#C5A059] shadow-xl shadow-[#C5A059]/10' : 'bg-[#F5F5F5] border-transparent opacity-60 hover:opacity-100'}`}
                   >
                      <Video size={32} className={formData.type === 'video' ? 'text-[#C5A059]' : 'text-gray-400'}/>
                      <span className="font-heading text-lg">Cinematic Video</span>
                   </div>
                </div>
             </section>

             {/* 02. CONTENT & MEDIA */}
             <section>
                <div className="flex items-center gap-4 mb-6">
                    <span className="text-[#C5A059] font-heading text-4xl">02</span>
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#121212]">Campaign Details</h3>
                </div>
                <div className="bg-white p-8 shadow-sm border border-[#F0F0F0] space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold uppercase tracking-widest text-[#8C8279]">Internal Name</label>
                           <input className="w-full bg-[#F9F6F0] border-b border-[#E5E5E5] px-4 py-3 text-sm focus:border-[#C5A059] outline-none transition-colors" placeholder="e.g. Winter 2026" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold uppercase tracking-widest text-[#8C8279]">Sort Order</label>
                           <input type="number" className="w-full bg-[#F9F6F0] border-b border-[#E5E5E5] px-4 py-3 text-sm focus:border-[#C5A059] outline-none transition-colors" value={formData.order} onChange={e => setFormData({...formData, order: e.target.value})} />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold uppercase tracking-widest text-[#8C8279]">Public Heading</label>
                           <input className="w-full bg-[#F9F6F0] border-b border-[#E5E5E5] px-4 py-3 text-sm focus:border-[#C5A059] outline-none font-heading text-[#121212]" placeholder="NEW ARRIVALS" value={formData.heading} onChange={e => setFormData({...formData, heading: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold uppercase tracking-widest text-[#8C8279]">Sub Heading</label>
                           <input className="w-full bg-[#F9F6F0] border-b border-[#E5E5E5] px-4 py-3 text-sm focus:border-[#C5A059] outline-none transition-colors" placeholder="Limited Edition" value={formData.subHeading} onChange={e => setFormData({...formData, subHeading: e.target.value})} />
                        </div>
                    </div>

                    {/* ✅ FIX: FILE UPLOAD AREA */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#8C8279]">
                            Upload {formData.type === 'video' ? 'Video (MP4)' : 'Image (JPG/PNG)'}
                        </label>
                        
                        <div className="relative group">
                            <input 
                                type="file" 
                                accept={formData.type === 'video' ? "video/mp4" : "image/*"}
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                            />
                            
                            <div className={`w-full border-2 border-dashed border-[#E5E5E5] rounded-sm p-8 flex flex-col items-center justify-center transition-all ${mediaFile ? 'bg-white' : 'bg-[#FAFAFA] group-hover:border-[#C5A059]'}`}>
                                {previewUrl ? (
                                    <div className="relative w-full max-w-md aspect-video bg-black rounded-sm overflow-hidden shadow-lg">
                                        {formData.type === 'video' ? (
                                            <video src={previewUrl} className="w-full h-full object-cover" controls autoPlay muted loop />
                                        ) : (
                                            <img src={previewUrl} className="w-full h-full object-cover" />
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold uppercase tracking-widest transition-opacity pointer-events-none">
                                            Click to Change File
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 bg-[#F9F6F0] rounded-full flex items-center justify-center mb-3">
                                            <UploadCloud size={24} className="text-[#C5A059]"/>
                                        </div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-[#121212]">Click to upload file</p>
                                        <p className="text-[10px] text-[#8C8279] mt-1">
                                            {formData.type === 'video' ? 'Max size 50MB. MP4 format.' : 'Max size 5MB. JPG, PNG, WEBP.'}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#8C8279]">Destination Link</label>
                        <input className="w-full bg-[#F9F6F0] border-b border-[#E5E5E5] px-4 py-3 text-sm focus:border-[#C5A059] outline-none transition-colors" placeholder="/category/new" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} />
                    </div>
                </div>
             </section>

             {/* 03. PRODUCT SELECTION */}
             <section>
                <div className="flex justify-between items-end mb-6">
                    <div className="flex items-center gap-4">
                        <span className="text-[#C5A059] font-heading text-4xl">03</span>
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#121212]">Select Products</h3>
                    </div>
                    
                    {/* Selected Count Indicator */}
                    <div className="text-right">
                        <span className="text-[10px] font-bold uppercase text-[#C5A059] block mb-1">Total Selected</span>
                        <span className="font-heading text-2xl text-[#121212]">{formData.products.length}</span>
                    </div>
                </div>

                <div className="bg-white border border-[#F0F0F0] shadow-sm">
                    
                    {/* A. FILTER BAR */}
                    <div className="p-4 border-b border-[#F0F0F0] flex flex-col md:flex-row gap-4 items-center justify-between bg-[#FAFAFA]">
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Filter size={14} className="text-[#8C8279]"/>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#121212]">Filter Category:</span>
                            <select 
                                value={selectedCategoryId} 
                                onChange={(e) => setSelectedCategoryId(e.target.value)}
                                className="bg-white border border-[#E5E5E5] text-xs px-3 py-2 rounded-sm focus:border-[#C5A059] outline-none min-w-[150px] font-medium text-[#121212]"
                            >
                                <option value="All">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="text-[10px] text-[#8C8279] uppercase font-bold tracking-wide">
                            Showing {filteredProducts.length} Results
                        </div>
                    </div>

                    {/* B. SELECTED PRODUCTS PREVIEW (Horizontal Scroll) */}
                    {formData.products.length > 0 && (
                        <div className="p-4 bg-[#F9F6F0] border-b border-[#F0F0F0]">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#C5A059] mb-3">Selected Items:</p>
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                {allProducts.filter(p => formData.products.includes(p._id)).map(p => (
                                    <div key={p._id} className="w-16 h-20 shrink-0 relative border border-[#C5A059] group cursor-pointer" onClick={() => toggleProduct(p._id)}>
                                        <img src={p.images?.[0] || '/placeholder.jpg'} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <X size={12}/>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* C. PRODUCT GRID */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-px bg-[#E5E5E5]">
                        {filteredProducts.map(product => {
                           const isSelected = formData.products.includes(product._id);
                           return (
                              <div 
                                 key={product._id} 
                                 onClick={() => toggleProduct(product._id)}
                                 className={`cursor-pointer group relative aspect-[3/4] bg-white transition-all duration-300`}
                              >
                                 <img src={product.images?.[0] || '/placeholder.jpg'} className={`w-full h-full object-cover transition-opacity ${isSelected ? 'opacity-40' : 'opacity-100'}`} />
                                 
                                 {/* Selection Overlay */}
                                 {isSelected ? (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                       <div className="w-10 h-10 bg-[#121212] text-[#C5A059] flex items-center justify-center rounded-full shadow-lg scale-100 transition-transform">
                                          <Check size={20} strokeWidth={3} />
                                       </div>
                                    </div>
                                 ) : (
                                    <div className="absolute inset-0 bg-[#C5A059]/0 group-hover:bg-[#C5A059]/10 transition-colors" />
                                 )}

                                 <div className="absolute bottom-0 left-0 right-0 p-3">
                                     <p className="text-[10px] font-bold truncate uppercase text-[#121212]">{product.name}</p>
                                     <p className="text-[10px] text-[#8C8279]">৳{product.price}</p>
                                 </div>
                              </div>
                           );
                        })}
                    </div>

                    {filteredProducts.length === 0 && (
                        <div className="p-12 text-center text-[#8C8279]">
                            <p className="text-xs uppercase tracking-widest">No products found in this category</p>
                        </div>
                    )}
                </div>
             </section>

          </form>
       </div>
    </div>
  );
}