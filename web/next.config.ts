import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NEXT_DIST_DIR memisahkan output build verifikasi (mis. .next-check) dari .next milik dev server,
  // karena build di folder yang sama merusak watcher/HMR CSS dev server yang sedang berjalan.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
