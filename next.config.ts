import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async rewrites() {
    // Only apply rewrites if HOMEPAGE_REMOTE_URL is set (for production)
    if (process.env.HOMEPAGE_REMOTE_URL) {
      return [
        {
          source: '/',
          destination:
            process.env.HOMEPAGE_REMOTE_URL ||
            'https://understanding-assistant-316991.framer.app/page',
        },
      ]
    }

    // In development, return empty array to allow normal routing
    return []
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
