'use client'

import { useEffect, useRef } from 'react'
import { createClient } from 'graphql-ws'

/**
 * Returns the WebSocket URL for the switchboard subscription endpoint.
 * Converts the HTTP(S) GraphQL endpoint to its WS(S) counterpart.
 */
function getWsEndpoint(): string {
  let base: string | undefined
  if (typeof window !== 'undefined') {
    const windowEnv = (window as unknown as { __ENV?: Record<string, string> }).__ENV
    base = windowEnv?.NEXT_PUBLIC_CLOUD_SWITCHBOARD_URL || windowEnv?.NEXT_PUBLIC_SWITCHBOARD_URL
  }
  base =
    base ||
    process.env.NEXT_PUBLIC_CLOUD_SWITCHBOARD_URL ||
    process.env.NEXT_PUBLIC_SWITCHBOARD_URL ||
    'https://switchboard.vetra.io/graphql'

  // Strip /graphql suffix to get base URL, then append subscription path
  const origin = base.replace(/\/graphql\/?$/, '')
  const wsOrigin = origin.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:')
  return `${wsOrigin}/graphql/subscriptions`
}

const SUBSCRIPTION_QUERY = `
  subscription DocumentChanges($search: SearchFilterInput) {
    documentChanges(search: $search) {
      type
      documents { id }
    }
  }
`

/**
 * Subscribes to document change events via WebSocket (graphql-ws protocol).
 * Calls `onEvent` whenever the specified document is updated.
 * Falls back to doing nothing if the connection fails.
 */
export function useDocumentSubscription(documentId: string | null, onEvent: () => void) {
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    if (!documentId) return

    const url = getWsEndpoint()
    const client = createClient({
      url,
      // Retry with exponential back-off, max 5 retries
      retryAttempts: 5,
      shouldRetry: () => true,
      // No auth needed for subscriptions (public read)
      lazy: true,
    })

    let unsubscribe: (() => void) | undefined

    // graphql-ws .subscribe returns an unsubscribe function via the cleanup
    unsubscribe = client.subscribe(
      {
        query: SUBSCRIPTION_QUERY,
        variables: {
          search: { identifiers: [documentId] },
        },
      },
      {
        next: () => {
          onEventRef.current()
        },
        error: (err) => {
          console.warn('[ws-subscription] error:', err)
        },
        complete: () => {
          // Connection closed normally
        },
      },
    )

    return () => {
      unsubscribe?.()
      client.dispose()
    }
  }, [documentId])
}
