import { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import CategorySection from '@/components/CategorySection';
import RecommendedSection from '@/components/RecommendedSection';
import connectDB from '@/lib/db';
import HeroModel from '@/models/Hero';
import SiteContent from '@/models/SiteContent';

export const revalidate = 3600;

export default async function Home() {
  await connectDB();

  const [siteContent, slides] = await Promise.all([
    SiteContent.findOne(
      { identifier: 'main_layout' },
      { navbarLinks: 1, _id: 0 }
    ).lean(),
    HeroModel.find(
      {},
      { image: 1, mobileImage: 1, link: 1 }
    ).sort({ createdAt: -1 }).lean(),
  ]);

  const navData = {
    logoImage: '/logo.png',
    logoText: 'KNM',
    links: JSON.parse(JSON.stringify(siteContent?.navbarLinks ?? [])),
  };

  const heroData = slides.map((slide) => ({
    id: slide._id.toString(),
    link: slide.link || '/',
    imageDesktop: slide.image || '/placeholder.jpg',
    imageMobile: slide.mobileImage || null,
  }));

  return (
    <main className="min-h-screen bg-[#F9F6F0] font-body selection:bg-[#C5A059] selection:text-white">
      <Navbar navData={navData} />

      {heroData.length > 0 ? (
        <Hero heroData={heroData} />
      ) : (
        <div className="h-[500px] flex flex-col items-center justify-center bg-[#F9F6F0] border-b border-[#C5A059]/10">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8C8279]">
            Carousel Empty
          </p>
        </div>
      )}

      <CategorySection />

      <Suspense fallback={null}>
        <RecommendedSection />
      </Suspense>
    </main>
  );
}