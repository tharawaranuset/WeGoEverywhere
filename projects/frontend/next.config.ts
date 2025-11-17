import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  env: {
    JWT_SECRET: process.env.JWT_SECRET,
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "999mb", // ⬅️ เพิ่มตรงนี้
    },
  },
};

export default nextConfig;
