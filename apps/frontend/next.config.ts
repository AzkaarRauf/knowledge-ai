import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  // Proxy to the Nest backend so the browser stays same-origin (no CORS).
  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'http://localhost:8090/api/:path*' },
      { source: '/health', destination: 'http://localhost:8090/health' },
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
