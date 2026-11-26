import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  serverExternalPackages: ['typescript', 'twoslash'],
  // Allow opening the dev server from the current LAN IP.
  // Without this, Next.js can block dev-only assets/endpoints for non-localhost origins,
  // which makes client-side UI like the docs sidebar appear unresponsive.
  allowedDevOrigins: ['192.168.124.9'],
  output: 'export',
  trailingSlash: true,
  turbopack: {
    root: process.cwd(),
  },
};

export default withMDX(config);
