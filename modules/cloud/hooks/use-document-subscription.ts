'use client'

import { createClient } from 'graphql-ws'
import { useEffect, useRef } from 'react'

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
  
  useEffect(() => {
    onEventRef.current = onEvent
  })

  useEffect(() => {
    if (!documentId) return

    const url = getWsEndpoint()
    const client = createClient({
      url,
      retryAttempts: 5,
      shouldRetry: () => true,
      lazy: true,
    })

    const unsubscribe = client.subscribe(
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
      void client.dispose()
    }
  }, [documentId])
}

/**
 * Subscribes to all document change events via WebSocket.
 * Useful for list pages that need to react to any environment change.
 */
export function useDocumentListSubscription(onEvent: () => void) {
  const onEventRef = useRef(onEvent)
  
  useEffect(() => {
    onEventRef.current = onEvent
  })

  useEffect(() => {
    const url = getWsEndpoint()
    const client = createClient({
      url,
      retryAttempts: 5,
      shouldRetry: () => true,
      lazy: true,
    })

    const unsubscribe = client.subscribe(
      {
        query: SUBSCRIPTION_QUERY,
      },
      {
        next: () => {
          onEventRef.current()
        },
        error: (err) => {
          console.warn('[ws-subscription] list error:', err)
        },
        complete: () => {
          // Connection closed normally
        },
      },
    )

    return () => {
      unsubscribe()
      void client.dispose()
    }
  }, [])
}
