import { createClient } from '@powerhousedao/reactor-browser'

// Read env vars from window.__ENV (injected at runtime by the server layout)
// with fallback to process.env (inlined at build time by Next.js).
function readEnv(key: string): string {
  if (typeof window !== 'undefined') {
    const windowEnv = (window as unknown as { __ENV?: Record<string, string> }).__ENV
    if (windowEnv?.[key]) return windowEnv[key]
  }
  return process.env[key] ?? ''
}

function getEndpoint(): string {
  return (
    readEnv('NEXT_PUBLIC_CLOUD_SWITCHBOARD_URL') ||
    readEnv('NEXT_PUBLIC_SWITCHBOARD_URL') ||
    'https://switchboard.vetra.io/graphql'
  )
}

function getDriveId(): string {
  return readEnv('NEXT_PUBLIC_CLOUD_DRIVE_ID') || 'powerhouse'
}

/** Reactor GraphQL client used for signed action push/pull. */
export const client = createClient(getEndpoint())

/** ID of the drive that holds vetra-cloud-environment documents. */
export const DRIVE_ID = getDriveId()
