import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow loading images from the local icon-set directory
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
