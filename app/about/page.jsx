import React from 'react';
import AboutContent from './AboutContent';
import Navbar from '@/components/Navbar';
import connectDB from '@/lib/db';
import SiteContent from '@/models/SiteContent';

export const metadata = {
  title: 'About Us | KNM Lifestyle',
  description: 'The story of K&M, the High-End Retailer.',
};

export default async function AboutPage() {
  // ✅ 1. Connect to the database
  await connectDB();
  
  // ✅ 2. Fetch Navbar links from the database
  const siteContent = await SiteContent.findOne({ identifier: 'main_layout' }).lean();

  // ✅ 3. Structure the data for the Navbar
  const navData = {
    logoImage: "/logo.png",
    logoText: "KNM",
    links: siteContent?.navbarLinks ? JSON.parse(JSON.stringify(siteContent.navbarLinks)) : [] 
  };

  return (
    <main className="min-h-screen bg-[#F9F6F0] font-body selection:bg-[#C5A059] selection:text-white">
      {/* ✅ 4. Render Navbar with fetched data */}
      <Navbar navData={navData} />
      
      {/* ✅ 5. Render Page Content */}
      <AboutContent />
    </main>
  );
}