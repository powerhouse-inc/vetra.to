import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async rewrites() {
    if (!process.env.HOMEPAGE_REMOTE_URL) {
      throw new Error(
        'Environment variable HOMEPAGE_REMOTE_URL is not set. Please add HOMEPAGE_REMOTE_URL to your environment variables (e.g., in .env.local) and restart the development server.',
      )
    }

    return [
      {
        source: '/',
        destination: process.env.HOMEPAGE_REMOTE_URL ?? '',
      },
    ]
  },
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
