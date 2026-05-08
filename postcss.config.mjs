import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Pin Tailwind v4's resolution base to this config's directory. Without it,
// the plugin falls back to process.cwd(), which under Turbopack worker
// processes can resolve to the parent of vetra.to (which holds ~70 sibling
// projects with no node_modules), triggering an infinite resolve loop and
// OOM-killing the build.
const projectRoot = path.dirname(fileURLToPath(import.meta.url))

const config = {
  plugins: {
    '@tailwindcss/postcss': { base: projectRoot },
  },
}

export default config
