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

    // Replaced 'domains' with 'remotePatterns' to fix deprecation warning
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'knm.bd' ,
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
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