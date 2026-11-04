import type { NextConfig } from 'next'

// Read at build time (rewrites are baked in). Set BACKEND_URL on Vercel.
const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:8090'

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
    agentUpgrade: 'security',
    // rewrites proxy times out after 30s by default, which cuts long uploads and chat streams.
    // 5 mins
    proxyTimeout: 5 * 60 * 1000,
  },
  cacheComponents: true,
  partialPrefetching: true,
  // Proxy to the Nest backend so the browser stays same-origin (no CORS).
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${backendUrl}/api/:path*` },
      { source: '/health', destination: `${backendUrl}/health` },
    ]
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
}

export default nextConfig
