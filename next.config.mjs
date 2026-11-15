import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: __dirname,
  },
  // Old .jpg team photo paths (e.g. stored in DB before migration 0005) -> .webp
  async rewrites() {
    return [
      { source: '/team/:name(gulay|paula|karam|gjent|haji|about-team).jpg', destination: '/team/:name.webp' },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

export default nextConfig;
