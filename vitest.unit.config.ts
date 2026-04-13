import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url))

/**
 * Standalone unit-test config used for hooks and component logic.
 * Separate from `vitest.config.ts` (which loads the Storybook addon and
 * pulls in next.js modules that aren't available at config-load time).
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': dirname,
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['modules/**/__tests__/**/*.test.{ts,tsx}'],
  },
})
