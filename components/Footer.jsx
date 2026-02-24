'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Toaster, toast } from 'react-hot-toast';
import { requestAppointment } from '@/actions/appointment';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { 
  Instagram, Facebook, Linkedin, 
  ArrowUpRight, Clock, MapPin, X, Send, ChevronDown, Search
} from 'lucide-react';

const WhatsAppIcon = ({ size = 20, className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
    <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
  </svg>
);

// --- PREMIUM TOAST CONFIG ---
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
  fontFamily: 'var(--font-body)',
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
  })
};

// --- HIGH-PERFORMANCE COUNTRY SELECTOR (Pure CSS Transitions) ---
const CountrySelector = ({ selectedIso, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(20); 
  const dropdownRef = useRef(null);

  const filteredCountries = useMemo(() => {
    if (!search) return ALL_COUNTRIES;
    const lowerSearch = search.toLowerCase();
    return ALL_COUNTRIES.filter(c => 
      c.name.toLowerCase().includes(lowerSearch) || 
      c.dial_code.includes(search) ||
      c.code.toLowerCase().includes(lowerSearch)
    );
  }, [search]);

  const visibleCountries = useMemo(() => {
     return filteredCountries.slice(0, visibleCount);
  }, [filteredCountries, visibleCount]);

  const selectedCountry = ALL_COUNTRIES.find(c => c.code === selectedIso) || ALL_COUNTRIES[0] || { flag: '🌐', dial_code: '+00' };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-transparent text-[11px] font-bold text-[#C5A059] outline-none py-3 pr-3 border-r border-white/10 uppercase tracking-wider h-full hover:bg-white/5 transition-colors whitespace-nowrap min-w-[95px]"
      >
        <span className="text-lg leading-none">{selectedCountry.flag}</span>
        <span>{selectedCountry.dial_code}</span>
        <ChevronDown size={10} className={`transition-transform duration-300 ml-auto ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* ✅ OPTIMIZED: Native CSS Dropdown */}
      {isOpen && (
         <div className="absolute top-full left-0 z-50 w-64 bg-[#0a2118] border border-[#C5A059]/20 shadow-2xl mt-2 flex flex-col h-[280px] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-2 border-b border-white/10 shrink-0 bg-[#0a2118] z-10">
              <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-sm border border-white/10">
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
            
            <div className="overflow-y-auto flex-1 custom-scrollbar pb-2" onScroll={handleScroll}>
              {visibleCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => {
                    onChange(country.code);
                    setIsOpen(false);
                    setSearch('');
                  }}
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
          type={type} 
          value={value} 
          onChange={onChange} 
          required={required}
          placeholder=" "
          className="peer w-full bg-transparent border-b border-white/10 py-3 text-sm font-body text-white focus:border-[#C5A059] outline-none transition-all rounded-none placeholder-transparent"
        />
      )}
      <label className={`absolute left-0 top-0 text-[10px] uppercase tracking-[0.15em] text-gray-500 transition-all duration-300 pointer-events-none 
        peer-focus:text-[#C5A059] peer-not-placeholder-shown:text-[#C5A059] peer-focus:-top-1
        ${value ? 'text-[#C5A059] -top-1' : ''}
      `}>
        {label} {required && '*'}
      </label>
    </div>
  </div>
);

// --- SOCIAL BUTTON (Pure CSS Transition) ---
const SocialButton = ({ icon: Icon, href }) => (
  <a 
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="w-10 h-10 rounded-sm border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] hover:bg-[#C5A059] hover:text-[#041610] hover:scale-105 hover:border-[#C5A059] cursor-pointer transition-all duration-300 bg-white/5"
  >
    <Icon size={18} strokeWidth={1.5} />
  </a>
);

// --- FOOTER LINKS COLUMN ---
const FooterColumn = ({ title, links }) => (
  <div className="flex flex-col space-y-5">
    <h4 className="text-[11px] font-heading font-bold uppercase tracking-[0.2em] text-[#C5A059] flex items-center gap-3">
        <span className="w-8 h-[1px] bg-[#C5A059]/50"></span>
        {title}
    </h4>
    <ul className="space-y-3 pl-11">
      {links.map((link, i) => (
        <li key={i}>
          <Link href={link.href} className="text-xs font-medium uppercase tracking-wide text-white/60 hover:text-white hover:translate-x-1 transition-all flex items-center gap-2 group">
            <span className="w-1 h-1 rounded-full bg-[#C5A059] opacity-0 group-hover:opacity-100 transition-opacity"></span>
            {link.label} 
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

// --- MAIN COMPONENT ---
export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countryCode, setCountryCode] = useState('BD'); 
  const [formData, setFormData] = useState({
    name: '', company: '', email: '', phone: '', whatsapp: '', store: 'Banani Flagship', subject: '', details: ''
  });

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data && data.country_code) {
          const exists = ALL_COUNTRIES.find(c => c.code === data.country_code);
          if (exists) setCountryCode(data.country_code);
        }
      })
      .catch(() => {});
  }, []);

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!formData.name.trim()) return "Please enter your full name.";
    if (!emailRegex.test(formData.email)) return "Please enter a valid email address.";
    
    const phoneParsed = parsePhoneNumberFromString(formData.phone, countryCode);
    if (!phoneParsed || !phoneParsed.isValid()) return `Invalid phone number for ${countryCode}.`;

    if (formData.whatsapp) {
      const waParsed = parsePhoneNumberFromString(formData.whatsapp, countryCode);
      if (!waParsed || !waParsed.isValid()) return "Invalid WhatsApp number.";
    }

    if (!formData.subject.trim()) return "Please enter a subject.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateForm();
    if (error) { premiumToast.error(error); return; }

    setLoading(true);
    try {
      const finalData = {
        ...formData,
        phone: parsePhoneNumberFromString(formData.phone, countryCode).formatInternational(),
        whatsapp: formData.whatsapp ? parsePhoneNumberFromString(formData.whatsapp, countryCode).formatInternational() : ''
      };

      const result = await requestAppointment(finalData);
      
      if (result.success) {
        premiumToast.success("Request Sent Successfully.");
        setFormData({ name: '', company: '', email: '', phone: '', whatsapp: '', store: 'Banani Flagship', subject: '', details: '' });
        setIsModalOpen(false);
      } else {
        premiumToast.error(result.message || "Failed to send request.");
      }
    } catch (err) {
      premiumToast.error("System error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const columns = {
    col1: {
      title: "Quick Links",
      links: [
        { label: 'About Us', href: '/about' },
        { label: 'Contact Us', href: '/contact' },
        { label: 'Customer Service', href: '/support' },
      ]
    },
    col2: {
      title: "Policies",
      links: [
        { label: 'Shipping Policy', href: '/policies/shipping-policy' },
        { label: 'Payment Policy', href: '/policies/payment' },
        { label: 'Exchange & Refund', href: '/policies/refund-policy' },
      ]
    },
    col3: {
      title: "Legal",
      links: [
        { label: 'Privacy Policy', href: '/policies/privacy-policy' },
        { label: 'Terms & Conditions', href: '/policies/terms-of-service' },
        { label: 'Intellectual Property', href: '/policies/ip' },
      ]
    }
  };

  return (
    <footer className="bg-[#041610] text-white pt-24 pb-0 font-body relative overflow-hidden border-t border-[#C5A059]/20 selection:bg-[#C5A059] selection:text-white">
      
      <Toaster position="top-right" containerStyle={{ zIndex: 999999 }} />

      {/* Texture Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none z-0"
        style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }}
      />
      
      <div className="max-w-[1920px] mx-auto px-6 md:px-12 relative z-10">
        
        <div className="flex flex-col lg:flex-row justify-between items-center gap-12 pb-20 border-b border-[#C5A059]/10 mb-20">
          <div className="text-center lg:text-left space-y-4 max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-heading font-normal text-white uppercase tracking-tight leading-none">
              Book a <span className="text-[#C5A059] font-serif italic">Private Visit.</span>
            </h2>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-[0.2em] leading-relaxed">
              Schedule a time with our specialists. We offer private viewing lounges at our flagship locations.
            </p>
          </div>
          <div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="group relative px-10 py-5 bg-[#C5A059] text-[#041610] text-[10px] font-bold uppercase tracking-[0.3em] overflow-hidden hover:text-white transition-colors duration-500"
            >
              <span className="absolute inset-0 bg-[#0a2118] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></span>
              <span className="relative flex items-center gap-3">
                Book Appointment <ArrowUpRight size={14} />
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-16 lg:gap-12 mb-20">
          
          <div className="lg:col-span-4 flex flex-col justify-between h-full space-y-8 lg:space-y-0 pr-0 lg:pr-12">
              <div className="space-y-8">
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
          </div>

          <div className="hidden lg:block lg:col-span-2"></div>

          <div className="lg:col-span-2"><FooterColumn title={columns.col1.title} links={columns.col1.links} /></div>
          <div className="lg:col-span-2"><FooterColumn title={columns.col2.title} links={columns.col2.links} /></div>
          <div className="lg:col-span-2"><FooterColumn title={columns.col3.title} links={columns.col3.links} /></div>
        </div>

        <div className="relative border-t border-[#C5A059]/10 pt-8 overflow-hidden">
           <div className="flex flex-col md:flex-row justify-between items-center gap-6 pb-24 2xl:pb-32 relative z-20">
              <div className="flex items-center gap-6 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                  <p>&copy; {currentYear} KNM Heritage.</p>
                  <span className="text-[#C5A059]">|</span>
                  <p>Site by <a href="https://enfinito.com" target="_blank" rel="noreferrer" className="text-[#C5A059] hover:text-white transition-colors cursor-pointer">Enfinito</a></p>
              </div>
              <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest hidden md:block">
                  Engineered for the Modern Aesthetic.
              </div>
           </div>
           
           <div className="absolute bottom-[0%] left-1/2 -translate-x-1/2 w-[90%] md:w-[60%] h-[20vh] opacity-[0.03] pointer-events-none z-0 select-none">
              <Image 
                src="/logo.png" 
                alt="KNM" 
                fill 
                className="object-contain object-bottom"
                priority={false}
                sizes="(max-width: 768px) 90vw, 60vw"
              />
           </div>
        </div>
      </div>

      {/* ✅ OPTIMIZED: Native CSS Modal (No Framer Motion) */}
      <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${isModalOpen ? 'visible' : 'invisible pointer-events-none'}`}>
        
        {/* Backdrop */}
        <div 
           className={`absolute inset-0 bg-[#000000]/90 backdrop-blur-md transition-opacity duration-300 ${isModalOpen ? 'opacity-100' : 'opacity-0'}`}
           onClick={() => setIsModalOpen(false)}
        />
        
        {/* Modal Window */}
        <div 
           className={`relative w-full max-w-2xl bg-[#0a2118] border border-[#C5A059]/20 shadow-2xl flex flex-col max-h-[90vh] transition-all duration-300 ease-out transform ${isModalOpen ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'}`}
        >
          
          <div className="flex items-center justify-between p-6 md:p-8 border-b border-[#C5A059]/20 bg-[#0a2118] z-10 shrink-0">
            <div>
              <h3 className="font-heading text-2xl md:text-3xl text-white uppercase tracking-tight">Book Appointment</h3>
              <div className="flex gap-6 mt-3">
                <span className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-gray-400"><MapPin size={12} className="text-[#C5A059]"/> Banani & Gulshan</span>
                <span className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-gray-400"><Clock size={12} className="text-[#C5A059]"/> 10am - 8pm</span>
              </div>
            </div>
            <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors border border-white/5">
              <X size={20} className="text-[#C5A059]"/>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-[#061812]">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InputGroup label="Full Name" type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                <InputGroup label="Company (Optional)" type="text" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InputGroup label="Phone Number" required value={formData.phone}>
                  <div className="flex items-center w-full border-b border-white/10">
                    <CountrySelector selectedIso={countryCode} onChange={setCountryCode} />
                    <input 
                      type="tel" 
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})} 
                      className="w-full bg-transparent py-3 pl-4 text-sm font-body text-white outline-none placeholder-transparent border-none focus:ring-0"
                      placeholder=" "
                    />
                  </div>
                </InputGroup>
                <InputGroup label="Email Address" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InputGroup label="WhatsApp (Optional)" type="tel" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
                <InputGroup label="Location Preference">
                  <select 
                    value={formData.store} onChange={e => setFormData({...formData, store: e.target.value})} 
                    className="peer w-full bg-transparent border-b border-white/10 py-3 text-sm font-body text-white focus:border-[#C5A059] outline-none rounded-none cursor-pointer appearance-none"
                  >
                    <option className="bg-[#0a2118]" value="Banani Flagship">Banani Flagship</option>
                    <option className="bg-[#0a2118]" value="Gulshan Gallery">Gulshan Gallery</option>
                  </select>
                </InputGroup>
              </div>

              <InputGroup label="Subject" type="text" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} required />

              <div className="group relative pt-6">
                <textarea 
                  value={formData.details} onChange={e => setFormData({...formData, details: e.target.value})} 
                  className="peer w-full bg-transparent border-b border-white/10 py-3 text-sm font-body text-white focus:border-[#C5A059] outline-none transition-all resize-none h-24 placeholder-transparent"
                  placeholder=" "
                />
                <label className={`absolute left-0 top-0 text-[10px] uppercase tracking-[0.15em] text-gray-500 transition-all duration-300 pointer-events-none 
                  peer-focus:text-[#C5A059] peer-not-placeholder-shown:text-[#C5A059] peer-focus:-top-1
                  ${formData.details ? 'text-[#C5A059] -top-1' : ''}
                `}>
                  Additional Details
                </label>
              </div>

              <button 
                disabled={loading} 
                type="submit" 
                className="w-full bg-[#C5A059] text-[#041610] py-5 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-white transition-colors duration-500 flex items-center justify-center gap-3 mt-6 shadow-[0_0_20px_rgba(197,160,89,0.1)]"
              >
                {loading ? "Processing..." : <>Confirm Request <Send size={14}/></>}
              </button>

            </form>
          </div>
        </div>
      </div>
    </footer>
  );
}

// --- FULL COUNTRY DATA ---
const ALL_COUNTRIES = [
  { name: "Afghanistan", code: "AF", dial_code: "+93", flag: "🇦🇫" },
  { name: "Albania", code: "AL", dial_code: "+355", flag: "🇦🇱" },
  { name: "Algeria", code: "DZ", dial_code: "+213", flag: "🇩🇿" },
  { name: "American Samoa", code: "AS", dial_code: "+1684", flag: "🇦🇸" },
  { name: "Andorra", code: "AD", dial_code: "+376", flag: "🇦🇩" },
  { name: "Angola", code: "AO", dial_code: "+244", flag: "🇦🇴" },
  { name: "Anguilla", code: "AI", dial_code: "+1264", flag: "🇦🇮" },
  { name: "Antarctica", code: "AQ", dial_code: "+672", flag: "🇦🇶" },
  { name: "Antigua and Barbuda", code: "AG", dial_code: "+1268", flag: "🇦🇬" },
  { name: "Argentina", code: "AR", dial_code: "+54", flag: "🇦🇷" },
  { name: "Armenia", code: "AM", dial_code: "+374", flag: "🇦🇲" },
  { name: "Aruba", code: "AW", dial_code: "+297", flag: "🇦🇼" },
  { name: "Australia", code: "AU", dial_code: "+61", flag: "🇦🇺" },
  { name: "Austria", code: "AT", dial_code: "+43", flag: "🇦🇹" },
  { name: "Azerbaijan", code: "AZ", dial_code: "+994", flag: "🇦🇿" },
  { name: "Bahamas", code: "BS", dial_code: "+1242", flag: "🇧🇸" },
  { name: "Bahrain", code: "BH", dial_code: "+973", flag: "🇧🇭" },
  { name: "Bangladesh", code: "BD", dial_code: "+880", flag: "🇧🇩" },
  { name: "Barbados", code: "BB", dial_code: "+1246", flag: "🇧🇧" },
  { name: "Belarus", code: "BY", dial_code: "+375", flag: "🇧🇾" },
  { name: "Belgium", code: "BE", dial_code: "+32", flag: "🇧🇪" },
  { name: "Belize", code: "BZ", dial_code: "+501", flag: "🇧🇿" },
  { name: "Benin", code: "BJ", dial_code: "+229", flag: "🇧🇯" },
  { name: "Bermuda", code: "BM", dial_code: "+1441", flag: "🇧🇲" },
  { name: "Bhutan", code: "BT", dial_code: "+975", flag: "🇧🇹" },
  { name: "Bolivia", code: "BO", dial_code: "+591", flag: "🇧🇴" },
  { name: "Bosnia and Herzegovina", code: "BA", dial_code: "+387", flag: "🇧🇦" },
  { name: "Botswana", code: "BW", dial_code: "+267", flag: "🇧🇼" },
  { name: "Brazil", code: "BR", dial_code: "+55", flag: "🇧🇷" },
  { name: "British Indian Ocean Territory", code: "IO", dial_code: "+246", flag: "🇮🇴" },
  { name: "Brunei Darussalam", code: "BN", dial_code: "+673", flag: "🇧🇳" },
  { name: "Bulgaria", code: "BG", dial_code: "+359", flag: "🇧🇬" },
  { name: "Burkina Faso", code: "BF", dial_code: "+226", flag: "🇧🇫" },
  { name: "Burundi", code: "BI", dial_code: "+257", flag: "🇧🇮" },
  { name: "Cambodia", code: "KH", dial_code: "+855", flag: "🇰🇭" },
  { name: "Cameroon", code: "CM", dial_code: "+237", flag: "🇨🇲" },
  { name: "Canada", code: "CA", dial_code: "+1", flag: "🇨🇦" },
  { name: "Cape Verde", code: "CV", dial_code: "+238", flag: "🇨🇻" },
  { name: "Cayman Islands", code: "KY", dial_code: "+1345", flag: "🇰🇾" },
  { name: "Central African Republic", code: "CF", dial_code: "+236", flag: "🇨🇫" },
  { name: "Chad", code: "TD", dial_code: "+235", flag: "🇹🇩" },
  { name: "Chile", code: "CL", dial_code: "+56", flag: "🇨🇱" },
  { name: "China", code: "CN", dial_code: "+86", flag: "🇨🇳" },
  { name: "Christmas Island", code: "CX", dial_code: "+61", flag: "🇨🇽" },
  { name: "Cocos (Keeling) Islands", code: "CC", dial_code: "+61", flag: "🇨🇨" },
  { name: "Colombia", code: "CO", dial_code: "+57", flag: "🇨🇴" },
  { name: "Comoros", code: "KM", dial_code: "+269", flag: "🇰🇲" },
  { name: "Congo", code: "CG", dial_code: "+242", flag: "🇨🇬" },
  { name: "Congo, Democratic Republic of the", code: "CD", dial_code: "+243", flag: "🇨🇩" },
  { name: "Cook Islands", code: "CK", dial_code: "+682", flag: "🇨🇰" },
  { name: "Costa Rica", code: "CR", dial_code: "+506", flag: "🇨🇷" },
  { name: "Cote d'Ivoire", code: "CI", dial_code: "+225", flag: "🇨🇮" },
  { name: "Croatia", code: "HR", dial_code: "+385", flag: "🇭🇷" },
  { name: "Cuba", code: "CU", dial_code: "+53", flag: "🇨🇺" },
  { name: "Cyprus", code: "CY", dial_code: "+357", flag: "🇨🇾" },
  { name: "Czech Republic", code: "CZ", dial_code: "+420", flag: "🇨🇿" },
  { name: "Denmark", code: "DK", dial_code: "+45", flag: "🇩🇰" },
  { name: "Djibouti", code: "DJ", dial_code: "+253", flag: "🇩🇯" },
  { name: "Dominica", code: "DM", dial_code: "+1767", flag: "🇩🇲" },
  { name: "Dominican Republic", code: "DO", dial_code: "+1849", flag: "🇩🇴" },
  { name: "Ecuador", code: "EC", dial_code: "+593", flag: "🇪🇨" },
  { name: "Egypt", code: "EG", dial_code: "+20", flag: "🇪🇬" },
  { name: "El Salvador", code: "SV", dial_code: "+503", flag: "🇸🇻" },
  { name: "Equatorial Guinea", code: "GQ", dial_code: "+240", flag: "🇬🇶" },
  { name: "Eritrea", code: "ER", dial_code: "+291", flag: "🇪🇷" },
  { name: "Estonia", code: "EE", dial_code: "+372", flag: "🇪🇪" },
  { name: "Ethiopia", code: "ET", dial_code: "+251", flag: "🇪🇹" },
  { name: "Falkland Islands (Malvinas)", code: "FK", dial_code: "+500", flag: "🇫🇰" },
  { name: "Faroe Islands", code: "FO", dial_code: "+298", flag: "🇫🇴" },
  { name: "Fiji", code: "FJ", dial_code: "+679", flag: "🇫🇯" },
  { name: "Finland", code: "FI", dial_code: "+358", flag: "🇫🇮" },
  { name: "France", code: "FR", dial_code: "+33", flag: "🇫🇷" },
  { name: "French Guiana", code: "GF", dial_code: "+594", flag: "🇬🇫" },
  { name: "French Polynesia", code: "PF", dial_code: "+689", flag: "🇵🇫" },
  { name: "Gabon", code: "GA", dial_code: "+241", flag: "🇬🇦" },
  { name: "Gambia", code: "GM", dial_code: "+220", flag: "🇬🇲" },
  { name: "Georgia", code: "GE", dial_code: "+995", flag: "🇬🇪" },
  { name: "Germany", code: "DE", dial_code: "+49", flag: "🇩🇪" },
  { name: "Ghana", code: "GH", dial_code: "+233", flag: "🇬🇭" },
  { name: "Gibraltar", code: "GI", dial_code: "+350", flag: "🇬🇮" },
  { name: "Greece", code: "GR", dial_code: "+30", flag: "🇬🇷" },
  { name: "Greenland", code: "GL", dial_code: "+299", flag: "🇬🇱" },
  { name: "Grenada", code: "GD", dial_code: "+1473", flag: "🇬🇩" },
  { name: "Guadeloupe", code: "GP", dial_code: "+590", flag: "🇬🇵" },
  { name: "Guam", code: "GU", dial_code: "+1671", flag: "🇬🇺" },
  { name: "Guatemala", code: "GT", dial_code: "+502", flag: "🇬🇹" },
  { name: "Guernsey", code: "GG", dial_code: "+44", flag: "🇬🇬" },
  { name: "Guinea", code: "GN", dial_code: "+224", flag: "🇬🇳" },
  { name: "Guinea-Bissau", code: "GW", dial_code: "+245", flag: "🇬🇼" },
  { name: "Guyana", code: "GY", dial_code: "+592", flag: "🇬🇾" },
  { name: "Haiti", code: "HT", dial_code: "+509", flag: "🇭🇹" },
  { name: "Honduras", code: "HN", dial_code: "+504", flag: "🇭🇳" },
  { name: "Hong Kong", code: "HK", dial_code: "+852", flag: "🇭🇰" },
  { name: "Hungary", code: "HU", dial_code: "+36", flag: "🇭🇺" },
  { name: "Iceland", code: "IS", dial_code: "+354", flag: "🇮🇸" },
  { name: "India", code: "IN", dial_code: "+91", flag: "🇮🇳" },
  { name: "Indonesia", code: "ID", dial_code: "+62", flag: "🇮🇩" },
  { name: "Iran", code: "IR", dial_code: "+98", flag: "🇮🇷" },
  { name: "Iraq", code: "IQ", dial_code: "+964", flag: "🇮🇶" },
  { name: "Ireland", code: "IE", dial_code: "+353", flag: "🇮🇪" },
  { name: "Isle of Man", code: "IM", dial_code: "+44", flag: "🇮🇲" },
  { name: "Israel", code: "IL", dial_code: "+972", flag: "🇮🇱" },
  { name: "Italy", code: "IT", dial_code: "+39", flag: "🇮🇹" },
  { name: "Jamaica", code: "JM", dial_code: "+1876", flag: "🇯🇲" },
  { name: "Japan", code: "JP", dial_code: "+81", flag: "🇯🇵" },
  { name: "Jersey", code: "JE", dial_code: "+44", flag: "🇯🇪" },
  { name: "Jordan", code: "JO", dial_code: "+962", flag: "🇯🇴" },
  { name: "Kazakhstan", code: "KZ", dial_code: "+7", flag: "🇰🇿" },
  { name: "Kenya", code: "KE", dial_code: "+254", flag: "🇰🇪" },
  { name: "Kiribati", code: "KI", dial_code: "+686", flag: "🇰🇮" },
  { name: "North Korea", code: "KP", dial_code: "+850", flag: "🇰🇵" },
  { name: "South Korea", code: "KR", dial_code: "+82", flag: "🇰🇷" },
  { name: "Kuwait", code: "KW", dial_code: "+965", flag: "🇰🇼" },
  { name: "Kyrgyzstan", code: "KG", dial_code: "+996", flag: "🇰🇬" },
  { name: "Laos", code: "LA", dial_code: "+856", flag: "🇱🇦" },
  { name: "Latvia", code: "LV", dial_code: "+371", flag: "🇱🇻" },
  { name: "Lebanon", code: "LB", dial_code: "+961", flag: "🇱🇧" },
  { name: "Lesotho", code: "LS", dial_code: "+266", flag: "🇱🇸" },
  { name: "Liberia", code: "LR", dial_code: "+231", flag: "🇱🇷" },
  { name: "Libya", code: "LY", dial_code: "+218", flag: "🇱🇾" },
  { name: "Liechtenstein", code: "LI", dial_code: "+423", flag: "🇱🇮" },
  { name: "Lithuania", code: "LT", dial_code: "+370", flag: "🇱🇹" },
  { name: "Luxembourg", code: "LU", dial_code: "+352", flag: "🇱🇺" },
  { name: "Macao", code: "MO", dial_code: "+853", flag: "🇲🇴" },
  { name: "Macedonia", code: "MK", dial_code: "+389", flag: "🇲🇰" },
  { name: "Madagascar", code: "MG", dial_code: "+261", flag: "🇲🇬" },
  { name: "Malawi", code: "MW", dial_code: "+265", flag: "🇲🇼" },
  { name: "Malaysia", code: "MY", dial_code: "+60", flag: "🇲🇾" },
  { name: "Maldives", code: "MV", dial_code: "+960", flag: "🇲🇻" },
  { name: "Mali", code: "ML", dial_code: "+223", flag: "🇲🇱" },
  { name: "Malta", code: "MT", dial_code: "+356", flag: "🇲🇹" },
  { name: "Marshall Islands", code: "MH", dial_code: "+692", flag: "🇲🇭" },
  { name: "Martinique", code: "MQ", dial_code: "+596", flag: "🇲🇶" },
  { name: "Mauritania", code: "MR", dial_code: "+222", flag: "🇲🇷" },
  { name: "Mauritius", code: "MU", dial_code: "+230", flag: "🇲🇺" },
  { name: "Mayotte", code: "YT", dial_code: "+262", flag: "🇾🇹" },
  { name: "Mexico", code: "MX", dial_code: "+52", flag: "🇲🇽" },
  { name: "Micronesia", code: "FM", dial_code: "+691", flag: "🇫🇲" },
  { name: "Moldova", code: "MD", dial_code: "+373", flag: "🇲🇩" },
  { name: "Monaco", code: "MC", dial_code: "+377", flag: "🇲🇨" },
  { name: "Mongolia", code: "MN", dial_code: "+976", flag: "🇲🇳" },
  { name: "Montenegro", code: "ME", dial_code: "+382", flag: "🇲🇪" },
  { name: "Montserrat", code: "MS", dial_code: "+1664", flag: "🇲🇸" },
  { name: "Morocco", code: "MA", dial_code: "+212", flag: "🇲🇦" },
  { name: "Mozambique", code: "MZ", dial_code: "+258", flag: "🇲🇿" },
  { name: "Myanmar", code: "MM", dial_code: "+95", flag: "🇲🇲" },
  { name: "Namibia", code: "NA", dial_code: "+264", flag: "🇳🇦" },
  { name: "Nauru", code: "NR", dial_code: "+674", flag: "🇳🇷" },
  { name: "Nepal", code: "NP", dial_code: "+977", flag: "🇳🇵" },
  { name: "Netherlands", code: "NL", dial_code: "+31", flag: "🇳🇱" },
  { name: "New Caledonia", code: "NC", dial_code: "+687", flag: "🇳🇨" },
  { name: "New Zealand", code: "NZ", dial_code: "+64", flag: "🇳🇿" },
  { name: "Nicaragua", code: "NI", dial_code: "+505", flag: "🇳🇮" },
  { name: "Niger", code: "NE", dial_code: "+227", flag: "🇳🇪" },
  { name: "Nigeria", code: "NG", dial_code: "+234", flag: "🇳🇬" },
  { name: "Niue", code: "NU", dial_code: "+683", flag: "🇳🇺" },
  { name: "Norfolk Island", code: "NF", dial_code: "+672", flag: "🇳🇫" },
  { name: "Northern Mariana Islands", code: "MP", dial_code: "+1670", flag: "🇲🇵" },
  { name: "Norway", code: "NO", dial_code: "+47", flag: "🇳🇴" },
  { name: "Oman", code: "OM", dial_code: "+968", flag: "🇴🇲" },
  { name: "Pakistan", code: "PK", dial_code: "+92", flag: "🇵🇰" },
  { name: "Palau", code: "PW", dial_code: "+680", flag: "🇵🇼" },
  { name: "Palestine, State of", code: "PS", dial_code: "+970", flag: "🇵🇸" },
  { name: "Panama", code: "PA", dial_code: "+507", flag: "🇵🇦" },
  { name: "Papua New Guinea", code: "PG", dial_code: "+675", flag: "🇵🇬" },
  { name: "Paraguay", code: "PY", dial_code: "+595", flag: "🇵🇾" },
  { name: "Peru", code: "PE", dial_code: "+51", flag: "🇵🇪" },
  { name: "Philippines", code: "PH", dial_code: "+63", flag: "🇵🇭" },
  { name: "Pitcairn", code: "PN", dial_code: "+64", flag: "🇵🇳" },
  { name: "Poland", code: "PL", dial_code: "+48", flag: "🇵🇱" },
  { name: "Portugal", code: "PT", dial_code: "+351", flag: "🇵🇹" },
  { name: "Puerto Rico", code: "PR", dial_code: "+1939", flag: "🇵🇷" },
  { name: "Qatar", code: "QA", dial_code: "+974", flag: "🇶🇦" },
  { name: "Romania", code: "RO", dial_code: "+40", flag: "🇷🇴" },
  { name: "Russia", code: "RU", dial_code: "+7", flag: "🇷🇺" },
  { name: "Rwanda", code: "RW", dial_code: "+250", flag: "🇷🇼" },
  { name: "Reunion", code: "RE", dial_code: "+262", flag: "🇷🇪" },
  { name: "Saint Barthelemy", code: "BL", dial_code: "+590", flag: "🇧🇱" },
  { name: "Saint Helena", code: "SH", dial_code: "+290", flag: "🇸🇭" },
  { name: "Saint Kitts and Nevis", code: "KN", dial_code: "+1869", flag: "🇰🇳" },
  { name: "Saint Lucia", code: "LC", dial_code: "+1758", flag: "🇱🇨" },
  { name: "Saint Martin (French part)", code: "MF", dial_code: "+590", flag: "🇲🇫" },
  { name: "Saint Pierre and Miquelon", code: "PM", dial_code: "+508", flag: "🇵🇲" },
  { name: "Saint Vincent and the Grenadines", code: "VC", dial_code: "+1784", flag: "🇻🇨" },
  { name: "Samoa", code: "WS", dial_code: "+685", flag: "🇼🇸" },
  { name: "San Marino", code: "SM", dial_code: "+378", flag: "🇸🇲" },
  { name: "Sao Tome and Principe", code: "ST", dial_code: "+239", flag: "🇸🇹" },
  { name: "Saudi Arabia", code: "SA", dial_code: "+966", flag: "🇸🇦" },
  { name: "Senegal", code: "SN", dial_code: "+221", flag: "🇸🇳" },
  { name: "Serbia", code: "RS", dial_code: "+381", flag: "🇷🇸" },
  { name: "Seychelles", code: "SC", dial_code: "+248", flag: "🇸🇨" },
  { name: "Sierra Leone", code: "SL", dial_code: "+232", flag: "🇸🇱" },
  { name: "Singapore", code: "SG", dial_code: "+65", flag: "🇸🇬" },
  { name: "Sint Maarten (Dutch part)", code: "SX", dial_code: "+1721", flag: "🇸🇽" },
  { name: "Slovakia", code: "SK", dial_code: "+421", flag: "🇸🇰" },
  { name: "Slovenia", code: "SI", dial_code: "+386", flag: "🇸🇮" },
  { name: "Solomon Islands", code: "SB", dial_code: "+677", flag: "🇸🇧" },
  { name: "Somalia", code: "SO", dial_code: "+252", flag: "🇸🇴" },
  { name: "South Africa", code: "ZA", dial_code: "+27", flag: "🇿🇦" },
  { name: "South Sudan", code: "SS", dial_code: "+211", flag: "🇸🇸" },
  { name: "Spain", code: "ES", dial_code: "+34", flag: "🇪🇸" },
  { name: "Sri Lanka", code: "LK", dial_code: "+94", flag: "🇱🇰" },
  { name: "Sudan", code: "SD", dial_code: "+249", flag: "🇸🇩" },
  { name: "Suriname", code: "SR", dial_code: "+597", flag: "🇸🇷" },
  { name: "Svalbard and Jan Mayen", code: "SJ", dial_code: "+47", flag: "🇸🇯" },
  { name: "Swaziland", code: "SZ", dial_code: "+268", flag: "🇸🇿" },
  { name: "Sweden", code: "SE", dial_code: "+46", flag: "🇸🇪" },
  { name: "Switzerland", code: "CH", dial_code: "+41", flag: "🇨🇭" },
  { name: "Syrian Arab Republic", code: "SY", dial_code: "+963", flag: "🇸🇾" },
  { name: "Taiwan", code: "TW", dial_code: "+886", flag: "🇹🇼" },
  { name: "Tajikistan", code: "TJ", dial_code: "+992", flag: "🇹🇯" },
  { name: "Tanzania, United Republic of", code: "TZ", dial_code: "+255", flag: "🇹🇿" },
  { name: "Thailand", code: "TH", dial_code: "+66", flag: "🇹🇭" },
  { name: "Timor-Leste", code: "TL", dial_code: "+670", flag: "🇹🇱" },
  { name: "Togo", code: "TG", dial_code: "+228", flag: "🇹🇬" },
  { name: "Tokelau", code: "TK", dial_code: "+690", flag: "🇹🇰" },
  { name: "Tonga", code: "TO", dial_code: "+676", flag: "🇹🇴" },
  { name: "Trinidad and Tobago", code: "TT", dial_code: "+1868", flag: "🇹🇹" },
  { name: "Tunisia", code: "TN", dial_code: "+216", flag: "🇹🇳" },
  { name: "Turkey", code: "TR", dial_code: "+90", flag: "🇹🇷" },
  { name: "Turkmenistan", code: "TM", dial_code: "+993", flag: "🇹🇲" },
  { name: "Turks and Caicos Islands", code: "TC", dial_code: "+1649", flag: "🇹🇨" },
  { name: "Tuvalu", code: "TV", dial_code: "+688", flag: "🇹🇻" },
  { name: "Uganda", code: "UG", dial_code: "+256", flag: "🇺🇬" },
  { name: "Ukraine", code: "UA", dial_code: "+380", flag: "🇺🇦" },
  { name: "United Arab Emirates", code: "AE", dial_code: "+971", flag: "🇦🇪" },
  { name: "United Kingdom", code: "GB", dial_code: "+44", flag: "🇬🇧" },
  { name: "United States", code: "US", dial_code: "+1", flag: "🇺🇸" },
  { name: "Uruguay", code: "UY", dial_code: "+598", flag: "🇺🇾" },
  { name: "Uzbekistan", code: "UZ", dial_code: "+998", flag: "🇺🇿" },
  { name: "Vanuatu", code: "VU", dial_code: "+678", flag: "🇻🇺" },
  { name: "Venezuela", code: "VE", dial_code: "+58", flag: "🇻🇪" },
  { name: "Viet Nam", code: "VN", dial_code: "+84", flag: "🇻🇳" },
  { name: "Virgin Islands, British", code: "VG", dial_code: "+1284", flag: "🇻🇬" },
  { name: "Virgin Islands, U.S.", code: "VI", dial_code: "+1340", flag: "🇻🇮" },
  { name: "Wallis and Futuna", code: "WF", dial_code: "+681", flag: "🇼🇫" },
  { name: "Yemen", code: "YE", dial_code: "+967", flag: "🇾🇪" },
  { name: "Zambia", code: "ZM", dial_code: "+260", flag: "🇿🇲" },
  { name: "Zimbabwe", code: "ZW", dial_code: "+263", flag: "🇿🇼" }
];