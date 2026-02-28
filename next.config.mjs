/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false,

  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },

  images: {
    // Enable Next.js image optimization (IMPORTANT)
    unoptimized: false,

    // Allow remote images if needed
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'knm.bd',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },

  // Let images cache properly (very important for performance)
  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;