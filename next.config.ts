import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30, // cache dynamic pages for 30 seconds to restore SPA-like transitions
    },
  },
  async redirects() {
    return [
      {
        source: '/privacy',
        destination: '/legal/privacy',
        permanent: true,
      },
      {
        source: '/terms',
        destination: '/legal/terms',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
