import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['@prisma/client', 'prisma'],
  turbopack: {
    // Empty config to acknowledge we're using Turbopack
  },
};

export default nextConfig;
