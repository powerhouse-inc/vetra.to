'use client'

import { useRenown } from '@powerhousedao/reactor-browser'
import { useState, useEffect, useCallback } from 'react'
import type { MetricSeries, MetricRange } from '../types'
import { getAuthToken, fetchMetrics } from '../graphql'

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
) {
  const renown = useRenown()
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    if (!subdomain || !tenantId) return
    try {
      const token = await getAuthToken(renown)
      const data = await fetchMetrics(subdomain, tenantId, range, token)
      setMetrics(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load metrics'))
    } finally {
      setIsLoading(false)
    }
  }, [subdomain, tenantId, range, renown])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 30_000)
    return () => clearInterval(interval)
  }, [refresh])

  return { metrics, isLoading, error, refresh }
}
