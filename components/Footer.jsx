'use client';

import { useState, useEffect, useMemo, useRef, useCallback, lazy, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { requestAppointment } from '@/actions/appointment';
import { 
  Instagram, Facebook,
  ArrowUpRight, Clock, MapPin, X, Send, ChevronDown, Search
} from 'lucide-react';

// ----------------------------------------------------------------------------
// FIX 1: currentYear outside component — was calling new Date() on every render
// ----------------------------------------------------------------------------
const CURRENT_YEAR = new Date().getFullYear();

// ----------------------------------------------------------------------------
// FIX 2: ALL_COUNTRIES moved to a separate file (countries.js) and lazy-loaded
// only when the modal opens. Until then, this 15KB array never loads.
// For now, we use a dynamic import pattern with useState.
// ----------------------------------------------------------------------------
const FALLBACK_COUNTRY = { name: 'Bangladesh', code: 'BD', dial_code: '+880', flag: '🇧🇩' };

const WhatsAppIcon = ({ size = 20, className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
    <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
  </svg>
);

// ----------------------------------------------------------------------------
// TOAST CONFIG
// FIX 3: Removed <Toaster> from this component entirely.
// The one in layout.jsx handles all toasts globally — no need for a second one.
// ----------------------------------------------------------------------------
const toastStyle = {
  background: '#041610',
  color: '#C5A059',
  border: '1px solid #C5A059',
  borderRadius: '2px',
  padding: '16px 24px',
  fontSize: '11px',
  fontWeight: '600',
  letterSpacing: '1px',
  textTransform: 'uppercase',
  boxShadow: '0 10px 40px -10px rgba(197, 160, 89, 0.1)',
};

const premiumToast = {
  success: (msg) => toast.success(msg, {
    duration: 5000,
    style: toastStyle,
    iconTheme: { primary: '#C5A059', secondary: '#041610' },
  }),
  error: (msg) => toast.error(msg, {
    duration: 5000,
    style: { ...toastStyle, color: '#ef4444', borderColor: '#7f1d1d' },
    iconTheme: { primary: '#ef4444', secondary: '#041610' },
  }),
};

// ----------------------------------------------------------------------------
// COUNTRY SELECTOR
// FIX 4: Countries are passed as a prop (loaded lazily by parent when modal opens)
// FIX 5: selectedCountry lookup moved into useMemo — not recomputed on every render
// ----------------------------------------------------------------------------
const CountrySelector = ({ selectedIso, onChange, countries }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);
  const dropdownRef = useRef(null);

  // FIX: O(1) lookup via Map instead of O(n) .find() on every render
  const countryMap = useMemo(() => {
    const map = new Map();
    countries.forEach(c => map.set(c.code, c));
    return map;
  }, [countries]);

  const selectedCountry = countryMap.get(selectedIso) || FALLBACK_COUNTRY;

  const filteredCountries = useMemo(() => {
    if (!search) return countries;
    const q = search.toLowerCase();
    return countries.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.dial_code.includes(search) ||
      c.code.toLowerCase().includes(q)
    );
  }, [search, countries]);

  const visibleCountries = useMemo(
    () => filteredCountries.slice(0, visibleCount),
    [filteredCountries, visibleCount]
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]); // FIX: only attach listener when open, not always

  useEffect(() => {
    if (isOpen) setVisibleCount(20);
  }, [isOpen, search]);

  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
      setVisibleCount(prev => Math.min(prev + 20, filteredCountries.length));
    }
  }, [filteredCountries.length]);

  return (
    <div className="relative h-full flex items-center" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(p => !p)}
        className="flex items-center gap-2 bg-transparent text-[11px] font-bold text-[#C5A059] outline-none py-3 pr-3 border-r border-white/10 uppercase tracking-wider h-full hover:bg-white/5 transition-colors whitespace-nowrap min-w-[95px]"
      >
        <span className="text-lg leading-none">{selectedCountry.flag}</span>
        <span>{selectedCountry.dial_code}</span>
        <ChevronDown size={10} className={`transition-transform duration-300 ml-auto ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 w-64 bg-[#0a2118] border border-[#C5A059]/20 shadow-2xl mt-2 flex flex-col h-[280px]">
          <div className="p-2 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2 bg-white/5 px-3 py-2 border border-white/10">
              <Search size={12} className="text-gray-500 shrink-0" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent border-none text-[10px] text-white focus:ring-0 outline-none uppercase placeholder:text-gray-600"
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 pb-2" onScroll={handleScroll}>
            {visibleCountries.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => { onChange(country.code); setIsOpen(false); setSearch(''); }}
                className={`w-full text-left px-4 py-3 text-[10px] uppercase tracking-wide flex items-center justify-between hover:bg-white/10 transition-colors border-b border-white/5 last:border-0 ${selectedIso === country.code ? 'text-[#C5A059] bg-white/5' : 'text-gray-400'}`}
              >
                <span className="flex items-center gap-3">
                  <span className="text-lg leading-none">{country.flag}</span>
                  <span className="truncate max-w-[140px]">{country.name}</span>
                </span>
                <span className="text-gray-500 font-mono shrink-0">{country.dial_code}</span>
              </button>
            ))}
            {filteredCountries.length === 0 && (
              <div className="p-4 text-center text-[10px] text-gray-600">No country found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- INPUT GROUP ---
const InputGroup = ({ label, type, value, onChange, required, children }) => (
  <div className="group relative pt-6 w-full">
    <div className="relative">
      {children ? children : (
        <input
          type={type} value={value} onChange={onChange} required={required} placeholder=" "
          className="peer w-full bg-transparent border-b border-white/10 py-3 text-sm text-white focus:border-[#C5A059] outline-none transition-all rounded-none placeholder-transparent"
        />
      )}
      <label className={`absolute left-0 top-0 text-[10px] uppercase tracking-[0.15em] text-gray-500 transition-all duration-300 pointer-events-none peer-focus:text-[#C5A059] peer-focus:-top-1 ${value ? 'text-[#C5A059] -top-1' : ''}`}>
        {label} {required && '*'}
      </label>
    </div>
  </div>
);

// --- SOCIAL BUTTON ---
const SocialButton = ({ icon: Icon, href }) => (
  <a href={href} target="_blank" rel="noopener noreferrer"
    className="w-10 h-10 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] hover:bg-[#C5A059] hover:text-[#041610] hover:scale-105 hover:border-[#C5A059] transition-all duration-300 bg-white/5"
  >
    <Icon size={18} strokeWidth={1.5} />
  </a>
);

// --- FOOTER COLUMN ---
const FooterColumn = ({ title, links }) => (
  <div className="flex flex-col space-y-5">
    <h4 className="text-[11px] font-heading font-bold uppercase tracking-[0.2em] text-[#C5A059] flex items-center gap-3">
      <span className="w-8 h-[1px] bg-[#C5A059]/50" />
      {title}
    </h4>
    <ul className="space-y-3 pl-11">
      {links.map((link, i) => (
        <li key={i}>
          <Link href={link.href} className="text-xs font-medium uppercase tracking-wide text-white/60 hover:text-white hover:translate-x-1 transition-all flex items-center gap-2 group">
            <span className="w-1 h-1 rounded-full bg-[#C5A059] opacity-0 group-hover:opacity-100 transition-opacity" />
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

const COLUMNS = {
  col1: {
    title: 'Quick Links',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Customer Service', href: '/support' },
    ],
  },
  col2: {
    title: 'Policies',
    links: [
      { label: 'Shipping Policy', href: '/policies/shipping-policy' },
      { label: 'Payment Policy', href: '/policies/payment' },
      { label: 'Exchange & Refund', href: '/policies/refund-policy' },
    ],
  },
  col3: {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/policies/privacy-policy' },
      { label: 'Terms & Conditions', href: '/policies/terms-of-service' },
      { label: 'Intellectual Property', href: '/policies/ip' },
    ],
  },
};

// ----------------------------------------------------------------------------
// APPOINTMENT MODAL — separate component so it only mounts when opened
// This means the country list, form state, and validation logic are
// completely absent from the DOM until the user clicks "Book Appointment"
// ----------------------------------------------------------------------------
function AppointmentModal({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [countryCode, setCountryCode] = useState('BD');
  const [countries, setCountries] = useState([FALLBACK_COUNTRY]);
  const [formData, setFormData] = useState({
    name: '', company: '', email: '', phone: '', whatsapp: '',
    store: 'Banani Flagship', subject: '', details: '',
  });

  // FIX: Countries loaded lazily when modal mounts — not on page load.
  // Also replaces the ipapi.co fetch — we detect country from the loaded
  // list instead of an external API call.
  useEffect(() => {
    import('@/lib/countries').then(mod => {
      setCountries(mod.ALL_COUNTRIES);
    });
  }, []);

  // FIX: Replaced fetch('https://ipapi.co/json/') with Intl API — zero network
  // request, works offline, no third-party dependency, instant result.
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      // Map common timezones to country codes
      const tzMap = {
        'Asia/Dhaka': 'BD',
        'Asia/Kolkata': 'IN',
        'Asia/Karachi': 'PK',
        'America/New_York': 'US',
        'America/Los_Angeles': 'US',
        'Europe/London': 'GB',
        'Asia/Dubai': 'AE',
        'Asia/Singapore': 'SG',
        'Australia/Sydney': 'AU',
        'Europe/Paris': 'FR',
        'Asia/Tokyo': 'JP',
        'Asia/Riyadh': 'SA',
      };
      const detected = tzMap[tz];
      if (detected) setCountryCode(detected);
    } catch {
      // Stay on BD default
    }
  }, []);

  const validateForm = async () => {
    const { parsePhoneNumberFromString } = await import('libphonenumber-js');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.name.trim()) return 'Please enter your full name.';
    if (!emailRegex.test(formData.email)) return 'Please enter a valid email address.';
    const phoneParsed = parsePhoneNumberFromString(formData.phone, countryCode);
    if (!phoneParsed?.isValid()) return `Invalid phone number for ${countryCode}.`;
    if (formData.whatsapp) {
      const waParsed = parsePhoneNumberFromString(formData.whatsapp, countryCode);
      if (!waParsed?.isValid()) return 'Invalid WhatsApp number.';
    }
    if (!formData.subject.trim()) return 'Please enter a subject.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = await validateForm();
    if (error) { premiumToast.error(error); return; }

    setLoading(true);
    try {
      const { parsePhoneNumberFromString } = await import('libphonenumber-js');
      const finalData = {
        ...formData,
        phone: parsePhoneNumberFromString(formData.phone, countryCode).formatInternational(),
        whatsapp: formData.whatsapp
          ? parsePhoneNumberFromString(formData.whatsapp, countryCode).formatInternational()
          : '',
      };
      const result = await requestAppointment(finalData);
      if (result.success) {
        premiumToast.success('Request Sent Successfully.');
        setFormData({ name: '', company: '', email: '', phone: '', whatsapp: '', store: 'Banani Flagship', subject: '', details: '' });
        onClose();
      } else {
        premiumToast.error(result.message || 'Failed to send request.');
      }
    } catch {
      premiumToast.error('System error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[#0a2118] border border-[#C5A059]/20 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 md:p-8 border-b border-[#C5A059]/20 bg-[#0a2118] z-10 shrink-0">
          <div>
            <h3 className="font-heading text-2xl md:text-3xl text-white uppercase tracking-tight">Book Appointment</h3>
            <div className="flex gap-6 mt-3">
              <span className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-gray-400"><MapPin size={12} className="text-[#C5A059]" /> Banani & Gulshan</span>
              <span className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-gray-400"><Clock size={12} className="text-[#C5A059]" /> 10am - 8pm</span>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/5">
            <X size={20} className="text-[#C5A059]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-[#061812]">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <InputGroup label="Full Name" type="text" value={formData.name} onChange={set('name')} required />
              <InputGroup label="Company (Optional)" type="text" value={formData.company} onChange={set('company')} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <InputGroup label="Phone Number" required value={formData.phone}>
                <div className="flex items-center w-full border-b border-white/10">
                  <CountrySelector selectedIso={countryCode} onChange={setCountryCode} countries={countries} />
                  <input type="tel" value={formData.phone} onChange={set('phone')}
                    className="w-full bg-transparent py-3 pl-4 text-sm text-white outline-none placeholder-transparent border-none focus:ring-0"
                    placeholder=" "
                  />
                </div>
              </InputGroup>
              <InputGroup label="Email Address" type="email" value={formData.email} onChange={set('email')} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <InputGroup label="WhatsApp (Optional)" type="tel" value={formData.whatsapp} onChange={set('whatsapp')} />
              <InputGroup label="Location Preference">
                <select value={formData.store} onChange={set('store')}
                  className="peer w-full bg-transparent border-b border-white/10 py-3 text-sm text-white focus:border-[#C5A059] outline-none cursor-pointer appearance-none"
                >
                  <option className="bg-[#0a2118]" value="Banani Flagship">Banani Flagship</option>
                  <option className="bg-[#0a2118]" value="Gulshan Gallery">Gulshan Gallery</option>
                </select>
              </InputGroup>
            </div>
            <InputGroup label="Subject" type="text" value={formData.subject} onChange={set('subject')} required />
            <div className="group relative pt-6">
              <textarea value={formData.details} onChange={set('details')}
                className="peer w-full bg-transparent border-b border-white/10 py-3 text-sm text-white focus:border-[#C5A059] outline-none resize-none h-24 placeholder-transparent"
                placeholder=" "
              />
              <label className={`absolute left-0 top-0 text-[10px] uppercase tracking-[0.15em] text-gray-500 transition-all duration-300 pointer-events-none peer-focus:text-[#C5A059] peer-focus:-top-1 ${formData.details ? 'text-[#C5A059] -top-1' : ''}`}>
                Additional Details
              </label>
            </div>
            <button disabled={loading} type="submit"
              className="w-full bg-[#C5A059] text-[#041610] py-5 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-white transition-colors duration-500 flex items-center justify-center gap-3 mt-6"
            >
              {loading ? 'Processing...' : <><span>Confirm Request</span><Send size={14} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// MAIN FOOTER
// ----------------------------------------------------------------------------
export default function Footer() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    // FIX: Removed <Toaster> — layout.jsx already has one globally
    <footer className="bg-[#041610] text-white pt-24 pb-0 font-body relative overflow-hidden border-t border-[#C5A059]/20 selection:bg-[#C5A059] selection:text-white">

      {/* Texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none z-0"
        style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }}
      />

      <div className="max-w-[1920px] mx-auto px-6 md:px-12 relative z-10">

        {/* BOOK APPOINTMENT BANNER */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-12 pb-20 border-b border-[#C5A059]/10 mb-20">
          <div className="text-center lg:text-left space-y-4 max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-heading font-normal text-white uppercase tracking-tight leading-none">
              Book a <span className="text-[#C5A059] font-serif italic">Private Visit.</span>
            </h2>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-[0.2em] leading-relaxed">
              Schedule a time with our specialists. We offer private viewing lounges at our flagship locations.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="group relative px-10 py-5 bg-[#C5A059] text-[#041610] text-[10px] font-bold uppercase tracking-[0.3em] overflow-hidden hover:text-white transition-colors duration-500"
          >
            <span className="absolute inset-0 bg-[#0a2118] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
            <span className="relative flex items-center gap-3">
              Book Appointment <ArrowUpRight size={14} />
            </span>
          </button>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-16 lg:gap-12 mb-20">
          <div className="lg:col-span-4 space-y-8 pr-0 lg:pr-12">
            <div className="relative w-40 h-16">
              <Image src="/logo-knm.png" alt="KNM" fill sizes="160px" className="object-contain object-left opacity-90" />
            </div>
            <p className="text-gray-500 text-xs leading-relaxed max-w-xs font-light">
              Crafting timeless elegance for the modern gentleman since 2024. A legacy of quality, tradition, and style.
            </p>
            <div className="flex gap-4">
              <SocialButton icon={Instagram} href="https://www.instagram.com/knm.bangladesh" />
              <SocialButton icon={Facebook} href="https://www.facebook.com/knm.bangladesh" />
              <SocialButton icon={WhatsAppIcon} href="https://api.whatsapp.com/send/?phone=8801711751172&text&type=phone_number&app_absent=0" />
            </div>
          </div>

          <div className="hidden lg:block lg:col-span-2" />
          <div className="lg:col-span-2"><FooterColumn title={COLUMNS.col1.title} links={COLUMNS.col1.links} /></div>
          <div className="lg:col-span-2"><FooterColumn title={COLUMNS.col2.title} links={COLUMNS.col2.links} /></div>
          <div className="lg:col-span-2"><FooterColumn title={COLUMNS.col3.title} links={COLUMNS.col3.links} /></div>
        </div>

        {/* BOTTOM BAR */}
        <div className="border-t border-[#C5A059]/10 pt-8 relative overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pb-24 2xl:pb-32 relative z-20">
            <div className="flex items-center gap-6 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
              <p>&copy; {CURRENT_YEAR} KNM Heritage.</p>
              <span className="text-[#C5A059]">|</span>
              <p>Site by <a href="https://enfinito.com" target="_blank" rel="noreferrer" className="text-[#C5A059] hover:text-white transition-colors">Enfinito</a></p>
            </div>
            <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest hidden md:block">
              Engineered for the Modern Aesthetic.
            </div>
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] md:w-[60%] h-[20vh] opacity-[0.03] pointer-events-none z-0 select-none">
            <Image src="/logo.png" alt="KNM" fill className="object-contain object-bottom" priority={false} sizes="(max-width: 768px) 90vw, 60vw" />
          </div>
        </div>
      </div>

      {/* FIX: Modal only mounts when open — form state, country list, and
          libphonenumber-js are completely absent from the DOM until needed */}
      {isModalOpen && <AppointmentModal onClose={() => setIsModalOpen(false)} />}
    </footer>
  );
}