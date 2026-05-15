'use client'

import { useRenown } from '@powerhousedao/reactor-browser'
import { createClient } from 'graphql-ws'
import { useEffect, useRef } from 'react'
import { getAuthToken } from '../graphql'

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

/**
 * Builds the `connectionParams` callback graphql-ws uses to authenticate each
 * new WS connection. Mints a fresh Renown bearer token per-connect so token
 * rotation is handled transparently on reconnect.
 *
 * Returns `{}` (no auth) if renown is unavailable — the server will close the
 * socket with code 4500 and the caller can treat it as "no subscription" and
 * fall back to polling.
 */
function makeConnectionParams(renown: ReturnType<typeof useRenown>) {
  return async () => {
    const token = await getAuthToken(renown as never)
    // Key MUST be lowercase. Server reads connectionParams.authorization
    // (see reactor-api authenticateWebSocketConnection). Unlike HTTP headers,
    // connectionParams is a plain JSON object and property lookup is
    // case-sensitive — sending `Authorization` silently fails with a
    // CloseEvent(4500, "Missing authorization in connection parameters").
    return token ? { authorization: `Bearer ${token}` } : {}
  }
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
  // eslint-disable-next-line react-hooks/refs
  onEventRef.current = onEvent
  const renown = useRenown()

  useEffect(() => {
    if (!documentId) return
    // Server requires auth on WS; skip if we have no way to mint a token.
    if (!renown) return

    const url = getWsEndpoint()
    const client = createClient({
      url,
      retryAttempts: 5,
      shouldRetry: () => true,
      lazy: true,
      connectionParams: makeConnectionParams(renown),
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
      unsubscribe()
      void client.dispose()
    }
  }, [documentId, renown])
}

/**
 * Subscribes to all document change events via WebSocket.
 * Useful for list pages that need to react to any environment change.
 */
export function useDocumentListSubscription(onEvent: () => void) {
  const onEventRef = useRef(onEvent)
  // eslint-disable-next-line react-hooks/refs
  onEventRef.current = onEvent
  const renown = useRenown()

  useEffect(() => {
    if (!renown) return

    const url = getWsEndpoint()
    const client = createClient({
      url,
      retryAttempts: 5,
      shouldRetry: () => true,
      lazy: true,
      connectionParams: makeConnectionParams(renown),
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
  }, [renown])
}
