'use client'

import { useRenown } from '@powerhousedao/reactor-browser'
import { useState, useEffect, useCallback, useRef } from 'react'
import type { MetricSeries, MetricRange } from '../types'
import { getAuthToken, fetchMetrics } from '../graphql'
import { useDocumentSubscription } from './use-document-subscription'

export type Metrics = {
  cpu: MetricSeries[]
  memory: MetricSeries[]
  requestRate: MetricSeries[]
  latency: MetricSeries[]
}

export function useEnvironmentMetrics(
  subdomain: string | null,
  tenantId: string | null,
  range: MetricRange,
  documentId?: string | null,
) {
  const renown = useRenown()
  const renownRef = useRef(renown)
  renownRef.current = renown
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    if (!subdomain || !tenantId) return
    try {
      const token = await getAuthToken(renownRef.current)
      const data = await fetchMetrics(subdomain, tenantId, range, token)
      setMetrics(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load metrics'))
    } finally {
      setIsLoading(false)
    }
  }, [subdomain, tenantId, range])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 30_000)
    return () => clearInterval(interval)
  }, [refresh])

  // Subscribe to document changes via WebSocket — triggers refresh on any update
  useDocumentSubscription(documentId ?? null, refresh)

  return { metrics, isLoading, error, refresh }
}
