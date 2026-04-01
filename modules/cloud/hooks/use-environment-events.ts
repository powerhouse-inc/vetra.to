'use client'

import { useRenown } from '@powerhousedao/reactor-browser'
import { useState, useEffect, useCallback, useRef } from 'react'
import { getAuthToken, fetchEnvironmentEvents } from '../graphql'
import { useDocumentSubscription } from './use-document-subscription'
import type { KubeEvent } from '../types'

export function useEnvironmentEvents(
  subdomain: string | null,
  tenantId: string | null,
  limit = 50,
  documentId?: string | null,
) {
  const renown = useRenown()
  const renownRef = useRef(renown)
  renownRef.current = renown
  const [events, setEvents] = useState<KubeEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    if (!subdomain || !tenantId) return
    try {
      setIsLoading(true)
      const token = await getAuthToken(renownRef.current)
      const data = await fetchEnvironmentEvents(subdomain, tenantId, limit, token)
      setEvents(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load events'))
    } finally {
      setIsLoading(false)
    }
  }, [subdomain, tenantId, limit])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Subscribe to document changes via WebSocket — triggers refresh on any update
  useDocumentSubscription(documentId ?? null, refresh)

  return { events, isLoading, error, refresh }
}
