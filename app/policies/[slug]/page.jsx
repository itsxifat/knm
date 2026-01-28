import Navbar from '@/components/Navbar';
import SiteContent from '@/models/SiteContent';
import mongoose from 'mongoose';
import { notFound } from 'next/navigation';

const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  await mongoose.connect(process.env.MONGODB_URI);
};

// --- STATIC POLICY CONTENT ---
// You can move this to your Database later if you want editable policies.
const policies = {
  'privacy-policy': {
    title: 'Privacy Policy',
    updated: 'January 2026',
    content: `
      <p>At KNM Heritage, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information.</p>
      <h3>1. Information We Collect</h3>
      <p>We collect information you provide directly to us, such as when you create an account, make a purchase, or sign up for our newsletter.</p>
      <h3>2. How We Use Your Information</h3>
      <p>We use your information to process transactions, provide customer support, and improve our services.</p>
      <h3>3. Data Security</h3>
      <p>We implement appropriate technical measures to protect your personal data against unauthorized access.</p>
    `
  },
  'terms-of-service': {
    title: 'Terms of Service',
    updated: 'January 2026',
    content: `
      <p>Welcome to KNM Heritage. By accessing our website, you agree to be bound by these Terms of Service.</p>
      <h3>1. Use of Site</h3>
      <p>You may use our site for lawful purposes only. You may not use our site to violate any applicable laws.</p>
      <h3>2. Intellectual Property</h3>
      <p>All content on this site, including text, graphics, and logos, is the property of KNM Heritage.</p>
    `
  },
  'refund-policy': {
    title: 'Return & Refund Policy',
    updated: 'January 2026',
    content: `
      <p>We want you to love your purchase. If you are not completely satisfied, we are here to help.</p>
      <h3>1. Returns</h3>
      <p>You have 30 calendar days to return an item from the date you received it. To be eligible for a return, your item must be unused and in the same condition that you received it.</p>
      <h3>2. Refunds</h3>
      <p>Once we receive your item, we will inspect it and notify you. If your return is approved, we will initiate a refund to your original method of payment.</p>
    `
  },
  'shipping-policy': {
    title: 'Shipping Policy',
    updated: 'January 2026',
    content: `
      <p>We strive to deliver your order as quickly and safely as possible.</p>
      <h3>1. Processing Time</h3>
      <p>All orders are processed within 1-3 business days.</p>
      <h3>2. Shipping Rates</h3>
      <p>Shipping charges for your order will be calculated and displayed at checkout.</p>
    `
  }
};

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const policy = policies[slug];
  if (!policy) return { title: 'Page Not Found' };
  return { title: `${policy.title} | KNM Heritage` };
}

export default async function PolicyPage({ params }) {
  await connectDB();
  const { slug } = await params;
  const policy = policies[slug];

  if (!policy) return notFound();

  // Fetch Navbar Data
  const siteContent = await SiteContent.findOne({ identifier: 'main_layout' }).lean();
  const navData = {
    logoImage: "/logo.png",
    logoText: "KNM",
    links: siteContent?.navbarLinks ? JSON.parse(JSON.stringify(siteContent.navbarLinks)) : []
  };

  return (
    <div className="bg-white min-h-screen font-body text-[#121212] selection:bg-[#C5A059] selection:text-white">
      <Navbar navData={navData} />

      <div className="max-w-[800px] mx-auto px-6 py-28 md:py-36">
        
        <header className="text-center mb-16">
          <span className="text-[#C5A059] text-xs font-bold uppercase tracking-[0.25em] mb-4 block">Legal</span>
          <h1 className="text-4xl md:text-5xl font-heading mb-4 uppercase tracking-tight">{policy.title}</h1>
          <p className="text-[#8C8279] text-xs uppercase tracking-widest">Last Updated: {policy.updated}</p>
        </header>

        <div className="prose prose-stone prose-lg max-w-none 
          prose-headings:font-heading prose-headings:font-normal prose-headings:uppercase prose-headings:tracking-wide
          prose-h3:text-lg prose-h3:mt-10 prose-h3:mb-4 prose-h3:text-[#121212]
          prose-p:text-[#57534E] prose-p:text-sm prose-p:leading-8 prose-p:mb-6
          prose-a:text-[#C5A059] prose-a:no-underline hover:prose-a:underline">
            
            <div dangerouslySetInnerHTML={{ __html: policy.content }} />
            
        </div>

      </div>
    </div>
  );
}