import { GraphQLClient } from 'graphql-request'
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

/**
 * A function that resolves the current user's Renown bearer token, or null
 * if the user is not logged in. Set at runtime via `setAuthTokenProvider`
 * (typically from a React component that has access to `useRenown()`).
 */
export type AuthTokenProvider = () => Promise<string | null>

let authTokenProvider: AuthTokenProvider | null = null

/**
 * Register the bearer-token provider for all reactor client requests.
 * Call this once at app startup (after Renown is available) so every
 * request carries the caller's identity.
 */
export function setAuthTokenProvider(provider: AuthTokenProvider | null): void {
  authTokenProvider = provider
}

/**
 * Inject auth at the transport level so ALL requests — including batch
 * methods that bypass the SDK wrapper — carry the bearer token.
 */
const gqlClient = new GraphQLClient(getEndpoint(), {
  requestMiddleware: async (request) => {
    if (!authTokenProvider) return request
    try {
      const token = await authTokenProvider()
      if (!token) return request
      return {
        ...request,
        headers: {
          ...(request.headers as Record<string, string>),
          authorization: `Bearer ${token}`,
        },
      }
    } catch {
      return request
    }
  },
})

/** Reactor GraphQL client used for signed action push/pull. */
export const client = createClient(gqlClient)

/** ID of the drive that holds vetra-cloud-environment documents. */
export const DRIVE_ID = getDriveId()
