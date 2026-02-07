'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCategoryPageData } from '@/app/actions';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard'; 
import { Search, SlidersHorizontal, ChevronDown, Loader2 } from 'lucide-react';

export default function CategoryPage({ params }) {
  const [data, setData] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) setInitialLoading(true);
    else setIsFiltering(true);
    try {
      const resolvedParams = await params;
      const result = await getCategoryPageData(resolvedParams.slug, {
        search: searchQuery,
        minPrice: priceRange.min,
        maxPrice: priceRange.max
      });
      setData(result);
    } catch (e) { console.error(e); }
    finally { setInitialLoading(false); setIsFiltering(false); }
  }, [params, searchQuery, priceRange.min, priceRange.max]);

  useEffect(() => { fetchData(true); }, []);

  if (initialLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center">Category Not Found</div>;

  return (
    <div className="min-h-screen bg-white">
      {/* Passing navData retrieved from the server action */}
      <Navbar navData={data.navData} />
      
      <main className="pt-32 px-6 max-w-7xl mx-auto">
        <h1 className="text-5xl font-heading mb-12 text-center uppercase tracking-tighter">
          {data.mainCategory.name}
        </h1>

        {/* --- PRODUCTS --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          {data.mainProducts.map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>

        {/* --- SUB-SECTIONS (Optional if you want grouped rows) --- */}
        {data.sections.map(section => (
          <div key={section._id} className="mb-20">
            <h2 className="text-2xl font-heading mb-6 uppercase border-b pb-2">{section.name}</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {section.products.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}