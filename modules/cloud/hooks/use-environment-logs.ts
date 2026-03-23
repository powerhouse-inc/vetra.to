'use client'

import { useRenown } from '@powerhousedao/reactor-browser'
import { useState, useEffect, useCallback } from 'react'
import type { LogEntry, MetricRange, TenantService } from '../types'
import { getAuthToken, fetchLogs } from '../graphql'

export function useEnvironmentLogs(
  subdomain: string | null,
  tenantId: string | null,
  service: TenantService | null,
  range: MetricRange,
  errorsOnly: boolean,
) {
  const renown = useRenown()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    if (!subdomain || !tenantId) return
    try {
      const token = await getAuthToken(renown)
      const data = await fetchLogs(subdomain, tenantId, service, range, 500, errorsOnly, token)
      setLogs(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load logs'))
    } finally {
      setIsLoading(false)
    }
  }, [subdomain, tenantId, service, range, errorsOnly, renown])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 10_000)
    return () => clearInterval(interval)
  }, [refresh])

  return { logs, isLoading, error, refresh }
}
