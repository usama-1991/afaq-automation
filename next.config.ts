import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30, // cache dynamic pages for 30 seconds to restore SPA-like transitions
    },
  },
};

export default nextConfig;
