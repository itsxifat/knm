import connectDB from '@/lib/db';
import SiteContent from '@/models/SiteContent';
import { getAllProducts } from '@/app/actions';
import Navbar from '@/components/Navbar';
import ProductListing from '@/components/ProductListing';

// ----------------------------------------------------------------------------
// FIX 1: Remove `force-dynamic` — it disables ALL caching and re-runs the full
// DB pipeline on every request, even when data hasn't changed.
// ISR (Incremental Static Regeneration) gives you fresh data without the cost.
// Adjust the number (seconds) based on how often your products change.
// ----------------------------------------------------------------------------
export const revalidate = 60;

// ----------------------------------------------------------------------------
// FIX 2: Add meaningful metadata for SEO (free performance win — avoids a
// separate client-side metadata fetch)
// ----------------------------------------------------------------------------
export const metadata = {
  title: 'Shop All | KNM',
  description: 'Browse the full KNM collection.',
};

export default async function ProductsPage({ searchParams }) {
  await connectDB();

  const params = await searchParams;
  const initialSearch = params?.search || '';

  // ----------------------------------------------------------------------------
  // FIX 3: Fetch navbar data and products IN PARALLEL — previously they ran
  // sequentially (await A, then await B). Parallel cuts total wait time roughly
  // in half if both queries take similar time.
  // ----------------------------------------------------------------------------
  const [siteContent, products] = await Promise.all([
    SiteContent.findOne(
      { identifier: 'main_layout' },
      // FIX 4: Project only the fields you actually use — don't pull the full doc
      { navbarLinks: 1, _id: 0 }
    ).lean(),
    getAllProducts(),
  ]);

  const sanitizedLinks = JSON.parse(JSON.stringify(siteContent?.navbarLinks ?? []));

  const navData = {
    logoImage: '/logo.png',
    logoText: 'KNM',
    links: sanitizedLinks,
  };

  return (
    <div className="bg-white min-h-screen text-black selection:bg-[#C5A059] selection:text-white">
      <Navbar navData={navData} />
      <ProductListing initialProducts={products} initialSearch={initialSearch} />
    </div>
  );
}