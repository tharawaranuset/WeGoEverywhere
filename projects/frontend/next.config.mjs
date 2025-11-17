// projects/frontend/next.config.mjs
import { config as loadEnv } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ➜ สร้าง __dirname เอง
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// โหลด .env ที่อยู่สองระดับเหนือ frontend/
loadEnv({ path: path.resolve(__dirname, "../../.env") });

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ไม่ต้องใส่ env:{} เพราะ process.env.* ใช้ได้แล้ว
  images: {
    unoptimized: true, // Disable image optimization for local images
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "999mb", //  ← เพิ่มตรงนี้
    },
  },
};

export default nextConfig;
