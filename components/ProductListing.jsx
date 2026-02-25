'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Filter, ChevronDown, LayoutGrid, List, X, Search, RefreshCw, XCircle } from 'lucide-react';
import gsap from 'gsap';
import ProductCard from '@/components/ProductCard';

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------
const getValidTagName = (t) => {
  if (!t) return null;
  if (typeof t === 'object' && t.name) return t.name;
  if (typeof t === 'string' && !/^[a-f\d]{24}$/i.test(t)) return t;
  return null;
};

// ----------------------------------------------------------------------------
// SUB-COMPONENTS
// ----------------------------------------------------------------------------
const FilterOption = ({ label, count, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-1 py-3 text-[11px] uppercase tracking-widest transition-all duration-300 border-b border-[#E5E5E5] hover:pl-2 group
      ${active ? 'text-[#121212] font-bold' : 'text-[#57534E] hover:text-[#C5A059]'}`}
  >
    <span className="flex items-center gap-3">
      <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
        active ? 'bg-[#C5A059] scale-125' : 'bg-[#E5E5E5] group-hover:bg-[#C5A059]'
      }`} />
      {label}
    </span>
    <span className="text-[9px] font-mono text-[#8C8279]">{count}</span>
  </button>
);

const ProductSkeleton = () => (
  <div className="flex flex-col gap-2 animate-pulse">
    <div className="aspect-[3/4] bg-[#F5F2EA] w-full" />
    <div className="h-2 bg-[#F5F2EA] w-2/3 mx-auto" />
    <div className="h-2 bg-[#F5F2EA] w-1/3 mx-auto" />
  </div>
);

// ----------------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------------
export default function ProductListing({ initialProducts, initialSearch = '' }) {
  // Handle both plain array and legacy { products: [] } shape
  const [products] = useState(() =>
    Array.isArray(initialProducts)
      ? initialProducts
      : initialProducts?.products ?? []
  );

  const [searchInput, setSearchInput] = useState(initialSearch);
  const [debouncedQuery, setDebouncedQuery] = useState(initialSearch);
  const [activeFilters, setActiveFilters] = useState({ categories: [], tags: [] });
  const [sortOption, setSortOption] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Incrementing key forces grid re-mount → CSS animations reset cleanly on filter change
  const [animKey, setAnimKey] = useState(0);

  const filterPanelRef = useRef(null);

  // ----------------------------------------------------------------------------
  // SEARCH DEBOUNCE
  // ----------------------------------------------------------------------------
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchInput), 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  useEffect(() => {
    setSearchInput(initialSearch);
    setDebouncedQuery(initialSearch);
  }, [initialSearch]);

  // ----------------------------------------------------------------------------
  // FACETS — computed once from full unfiltered product list
  // ----------------------------------------------------------------------------
  const facets = useMemo(() => {
    const cats = {};
    const tags = {};
    products.forEach((p) => {
      if (p.category?.name) cats[p.category.name] = (cats[p.category.name] || 0) + 1;
      if (Array.isArray(p.tags)) {
        p.tags.forEach((t) => {
          const name = getValidTagName(t);
          if (name) tags[name] = (tags[name] || 0) + 1;
        });
      }
    });
    return {
      categories: Object.entries(cats).map(([name, count]) => ({ name, count })),
      tags: Object.entries(tags).map(([name, count]) => ({ name, count })),
    };
  }, [products]);

  // ----------------------------------------------------------------------------
  // FILTER + SORT ENGINE
  // FIX: Pre-parse createdAt dates ONCE before sorting.
  // Old code called new Date() inside the comparator function — that runs
  // O(N log N) times, meaning 200 products = ~1400+ Date allocations per sort.
  // Now we parse once, sort on raw timestamps, then discard the wrapper.
  // ----------------------------------------------------------------------------
  const processedData = useMemo(() => {
    let result = [...products];

    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category?.name?.toLowerCase().includes(q) ||
          p.tags?.some((t) => getValidTagName(t)?.toLowerCase().includes(q))
      );
    }

    if (activeFilters.categories.length > 0) {
      result = result.filter(
        (p) => p.category && activeFilters.categories.includes(p.category.name)
      );
    }

    if (activeFilters.tags.length > 0) {
      result = result.filter((p) =>
        p.tags?.some((t) => {
          const name = getValidTagName(t);
          return name && activeFilters.tags.includes(name);
        })
      );
    }

    const getPrice = (p) => p.discountPrice || p.price;

    if (sortOption === 'newest') {
      // Parse dates once, sort on number, unwrap
      result = result
        .map((p) => ({ p, t: p.createdAt ? new Date(p.createdAt).getTime() : 0 }))
        .sort((a, b) => b.t - a.t)
        .map(({ p }) => p);
    } else {
      result.sort((a, b) => {
        if (sortOption === 'priceAsc') return getPrice(a) - getPrice(b);
        if (sortOption === 'priceDesc') return getPrice(b) - getPrice(a);
        if (sortOption === 'nameAsc') return a.name.localeCompare(b.name);
        return 0;
      });
    }

    return result;
  }, [products, debouncedQuery, activeFilters, sortOption]);

  // Re-trigger CSS animations when results change
  useEffect(() => {
    setAnimKey((k) => k + 1);
  }, [debouncedQuery, activeFilters, sortOption]);

  // ----------------------------------------------------------------------------
  // GSAP — filter drawer ONLY
  // The product grid uses CSS @keyframes instead (compositor thread = no JS cost)
  // ----------------------------------------------------------------------------
  useEffect(() => {
    if (!filterPanelRef.current) return;
    gsap.to(filterPanelRef.current, {
      x: isFilterOpen ? '0%' : '100%',
      duration: isFilterOpen ? 0.55 : 0.45,
      ease: isFilterOpen ? 'power3.out' : 'power3.in',
    });
  }, [isFilterOpen]);

  // ----------------------------------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------------------------------
  const toggleFilter = (type, value) => {
    setActiveFilters((prev) => {
      const list = prev[type];
      return {
        ...prev,
        [type]: list.includes(value) ? list.filter((i) => i !== value) : [...list, value],
      };
    });
  };

  const clearFilters = () => {
    setActiveFilters({ categories: [], tags: [] });
    setSearchInput('');
  };

  const activeFilterCount = activeFilters.categories.length + activeFilters.tags.length;

  return (
    <>
      {/*
        CSS keyframe animation — runs entirely on the GPU compositor thread.
        No JS involvement during scroll whatsoever.
        Stagger is applied via inline animation-delay per card (pure CSS).
      */}
      <style>{`
        @keyframes knm-fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        .product-item {
          animation: knm-fadeUp 0.32s ease-out both;
        }
      `}</style>

      <main className="bg-white min-h-screen pb-32 font-body selection:bg-[#C5A059] selection:text-white overflow-x-hidden">

        {/* ------------------------------------------------------------------ */}
        {/* FILTER DRAWER                                                        */}
        {/* ------------------------------------------------------------------ */}
        <div className={`fixed inset-0 z-[100] transition-opacity duration-500 ${
          isFilterOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}>
          <div
            onClick={() => setIsFilterOpen(false)}
            className="absolute inset-0 bg-[#121212]/40 backdrop-blur-sm"
          />
          <div
            ref={filterPanelRef}
            style={{ transform: 'translateX(100%)' }}
            className="absolute top-0 right-0 h-full w-[380px] max-w-[85vw] bg-[#F9F6F0] shadow-2xl flex flex-col border-l border-[#C5A059]/20"
          >
            <div className="px-8 py-10 border-b border-[#C5A059]/10 flex justify-between items-center bg-white shrink-0">
              <div>
                <h2 className="font-heading font-normal text-3xl text-[#121212] uppercase tracking-tight">
                  Filter
                </h2>
                <p className="text-[10px] uppercase tracking-widest text-[#8C8279] mt-1">
                  {processedData.length} Items Found
                </p>
              </div>
              <button onClick={() => setIsFilterOpen(false)} className="hover:text-[#C5A059] transition-colors">
                <X size={24} strokeWidth={1} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-12">
              {facets.categories.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C5A059] mb-5">
                    Category
                  </h3>
                  <div className="space-y-1">
                    {facets.categories.map((cat) => (
                      <FilterOption
                        key={cat.name} label={cat.name} count={cat.count}
                        active={activeFilters.categories.includes(cat.name)}
                        onClick={() => toggleFilter('categories', cat.name)}
                      />
                    ))}
                  </div>
                </div>
              )}
              {facets.tags.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C5A059] mb-5">
                    Collection
                  </h3>
                  <div className="space-y-1">
                    {facets.tags.map((tag) => (
                      <FilterOption
                        key={tag.name} label={tag.name} count={tag.count}
                        active={activeFilters.tags.includes(tag.name)}
                        onClick={() => toggleFilter('tags', tag.name)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 border-t border-[#C5A059]/10 bg-white space-y-4 shrink-0">
              <button
                onClick={() => setIsFilterOpen(false)}
                className="w-full bg-[#121212] text-white h-12 text-[10px] font-bold uppercase tracking-[0.25em] hover:bg-[#C5A059] transition-colors"
              >
                View Results
              </button>
              <button
                onClick={clearFilters}
                className="w-full h-10 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#8C8279] hover:text-[#121212] transition-colors"
              >
                <RefreshCw size={12} /> Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* TOOLBAR                                                              */}
        {/* ------------------------------------------------------------------ */}
        <section className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#C5A059]/10">
          <div className="max-w-[1920px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
            <button
              onClick={() => setIsFilterOpen(true)}
              className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-[#C5A059] transition pl-1 text-[#121212]"
            >
              <Filter size={16} strokeWidth={1.5} />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 bg-[#C5A059] text-white text-[8px] flex items-center justify-center rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <div className="hidden lg:flex items-center gap-3 border-b border-transparent hover:border-[#E5E5E5] transition-colors w-72 pb-1">
              <Search size={14} className="text-[#8C8279]" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="SEARCH COLLECTIONS..."
                className="bg-transparent text-[10px] font-bold uppercase tracking-widest outline-none w-full placeholder:text-[#E5E5E5] text-[#121212]"
              />
              {searchInput && (
                <button onClick={() => setSearchInput('')} className="text-[#8C8279] hover:text-[#C5A059]">
                  <XCircle size={12} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-8">
              <div className="relative">
                <button
                  onClick={() => setIsSortOpen((p) => !p)}
                  className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-[#C5A059] transition text-[#121212]"
                >
                  Sort <ChevronDown size={12} />
                </button>
                <div className={`absolute top-full right-0 mt-5 w-48 bg-white shadow-xl border border-[#C5A059]/10 py-2 z-50 transition-all duration-200 ${
                  isSortOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                }`}>
                  {[
                    { l: 'Newest Arrivals', v: 'newest' },
                    { l: 'Price: Low to High', v: 'priceAsc' },
                    { l: 'Price: High to Low', v: 'priceDesc' },
                  ].map((opt) => (
                    <button
                      key={opt.v}
                      onClick={() => { setSortOption(opt.v); setIsSortOpen(false); }}
                      className={`w-full text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-[#F9F6F0] ${
                        sortOption === opt.v ? 'text-[#C5A059]' : 'text-[#57534E]'
                      }`}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="hidden md:flex items-center gap-4 border-l border-[#E5E5E5] pl-8">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`opacity-40 hover:opacity-100 hover:text-[#C5A059] transition-all ${
                    viewMode === 'grid' ? '!opacity-100 text-[#121212]' : ''
                  }`}
                >
                  <LayoutGrid size={16} strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`opacity-40 hover:opacity-100 hover:text-[#C5A059] transition-all ${
                    viewMode === 'list' ? '!opacity-100 text-[#121212]' : ''
                  }`}
                >
                  <List size={18} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* PRODUCT GRID                                                         */}
        {/* ------------------------------------------------------------------ */}
        <div className="max-w-[1920px] mx-auto px-3 md:px-8 pt-12 min-h-[60vh]">
          {processedData.length > 0 ? (
            <div
              key={animKey}
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3 gap-y-10 md:gap-x-6 md:gap-y-14 lg:gap-x-8 lg:gap-y-20'
                  : 'flex flex-col gap-8 max-w-5xl mx-auto'
              }
            >
              {processedData.map((product, index) => (
                <div
                  key={product._id}
                  className={`product-item will-change-transform ${
                    viewMode === 'list'
                      ? 'w-full max-w-[150px] mx-auto border-b border-[#F5F2EA] pb-8'
                      : ''
                  }`}
                  style={{
                    // CSS stagger: 12ms per card, capped at 400ms
                    // Items far down the page don't wait unreasonably long
                    animationDelay: `${Math.min(index * 12, 400)}ms`,
                  }}
                >
                  {/* Only first 6 cards (above the fold) get priority loading */}
                  <ProductCard product={product} priority={index < 6} />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-40 text-center">
              <h3 className="font-heading font-normal text-2xl text-[#121212] mb-3 uppercase tracking-tight">
                No Matches Found
              </h3>
              <button
                onClick={clearFilters}
                className="text-[10px] font-bold uppercase tracking-widest text-[#C5A059] border-b border-[#C5A059] pb-0.5 hover:text-[#121212] hover:border-[#121212] transition-all"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}