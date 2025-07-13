import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Turn off to stop double-rendering in dev mode (eg. console logging twice)
  reactStrictMode: true,
  devIndicators: false,

  // Allow images from our API route
  images: {
    domains: ['localhost'],
    unoptimized: true, // Disable Next.js image optimization for local files
    // writeToCacheDir: false,
  },
};

export default nextConfig;
