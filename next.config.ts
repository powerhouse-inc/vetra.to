import type { NextConfig } from 'next'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Pin Next/Turbopack's workspace root to this project's directory. Without
// it, Next walks up the parent dir trying to find lockfiles and ends up
// using /home/froid/projects/powerhouse as the root (it holds ~70 sibling
// projects, no node_modules). The CSS pipeline then loops resolving
// `tailwindcss` from that wrong context and OOM-kills the build.
const projectRoot = path.dirname(fileURLToPath(import.meta.url))

/** Next.js configuration for Vetra application */
const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'euc.li',
      },
      {
        protocol: 'https',
        hostname: '*.ipfs.w3s.link',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.io',
      },
    ],
  },
  experimental: {
    externalDir: true,
  },
  output: 'standalone',
  turbopack: {
    root: projectRoot,
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
}

export default nextConfig
