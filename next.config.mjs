/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Serve images as-is (no Vercel Image Optimization). Our menu photos are
    // pre-downscaled to web size, and the optimizer hit the plan quota (HTTP 402).
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
