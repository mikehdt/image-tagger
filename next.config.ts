import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Turn off to stop double-rendering in dev mode (eg. console logging twice)
  reactStrictMode: true,
  devIndicators: false,

  // Allow images from our API route
  images: {
    domains: ['localhost'],
    minimumCacheTTL: 300, // Minimum cache time, in seconds
    unoptimized: true, // Disable Next.js image optimization for local files
    // writeToCacheDir: false,
  },
};

export default nextConfig;
