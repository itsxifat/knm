// RecommendedSection.jsx — Server component (fetches data, passes to client)
import { getRecommendedProducts } from '@/app/analytics-actions';
import RecommendedClient from './RecommendedClient';

export default async function RecommendedSection() {
  let products = [];
  try {
    products = await getRecommendedProducts();
  } catch (e) {
    console.error('[RecommendedSection] Failed:', e);
    return null;
  }
  if (!products?.length) return null;

  // Pass serialized data to the stable client component
  return <RecommendedClient products={products} />;
}