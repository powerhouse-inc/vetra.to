import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async rewrites() {
    // Only apply rewrites if HOMEPAGE_REMOTE_URL is set (for production)
    if (process.env.HOMEPAGE_REMOTE_URL) {
      return [
        {
          source: '/',
          destination: process.env.HOMEPAGE_REMOTE_URL,
        },
        {
          source: '/cloud',
          destination: 'https://understanding-assistant-316991.framer.app/cloud',
        },
      ]
    } else {
      return [
        {
          source: '/',
          destination: 'https://understanding-assistant-316991.framer.app',
        },
        {
          source: '/cloud',
          destination: 'https://understanding-assistant-316991.framer.app/cloud',
        },
      ]
    }
  },
  output: 'standalone',
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
}

export default nextConfig
