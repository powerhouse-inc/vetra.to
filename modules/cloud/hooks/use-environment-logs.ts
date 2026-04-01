'use client'

import { useRenown } from '@powerhousedao/reactor-browser'
import { useState, useEffect, useCallback, useRef } from 'react'
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
  const renownRef = useRef(renown)
  renownRef.current = renown
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const logsRef = useRef(logs)
  logsRef.current = logs

  const refresh = useCallback(async () => {
    if (!subdomain || !tenantId) return
    try {
      const token = await getAuthToken(renownRef.current)
      const data = await fetchLogs(subdomain, tenantId, service, range, 500, errorsOnly, token)
      if (JSON.stringify(data) !== JSON.stringify(logsRef.current)) {
        setLogs(data)
      }
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load logs'))
    } finally {
      setIsLoading(false)
    }
  }, [subdomain, tenantId, service, range, errorsOnly])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 10_000)
    return () => clearInterval(interval)
  }, [refresh])

  return { logs, isLoading, error, refresh }
}
