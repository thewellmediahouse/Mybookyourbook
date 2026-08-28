import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // OpenNext on Workers has no Vercel image pipeline. `/_next/image` resizes
  // inside the Worker and can hit Error 1102 (CPU/memory). Public webps are
  // already small; serve them as static files.
  images: {
    unoptimized: true,
  },
};

initOpenNextCloudflareForDev();

export default nextConfig;
