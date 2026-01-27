/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false,

  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },

  // IMAGE SETTINGS
  images: {
    // Disable Next.js image optimizer completely
    unoptimized: true,

    // Allow loading from same domain & local dev
    domains: ['oura-lifestyle.com', 'localhost'],
  },

  // Important: prevent static output caching
  headers: async () => [
    {
      source: '/uploads/:path*',
      headers: [
        { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' },
      ],
    },
  ],
};

export default nextConfig;
