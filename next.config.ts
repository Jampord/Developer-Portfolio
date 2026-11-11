import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.10.12.8"],
  images: {
    // 75 is Next's default; project screenshots use 90 so small UI text stays crisp
    qualities: [75, 90],
  },
};

export default nextConfig;
