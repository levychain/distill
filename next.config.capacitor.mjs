/**
 * Next.js config for Capacitor (static export)
 * Use with: NEXT_CONFIG_FILE=next.config.capacitor.mjs next build
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Point API calls to production backend
  env: {
    NEXT_PUBLIC_API_URL: 'https://distill-production.up.railway.app',
  },
};

export default nextConfig;


