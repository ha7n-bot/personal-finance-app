import type { NextConfig } from "next";
const nextConfig: NextConfig = { distDir: ".next-cache", experimental: { authInterrupts: true } };
export default nextConfig;
