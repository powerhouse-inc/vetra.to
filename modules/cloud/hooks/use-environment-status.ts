'use client'

import { useRenown } from '@powerhousedao/reactor-browser'
import { useState, useEffect, useCallback } from 'react'
import type { EnvironmentStatus, Pod } from '../types'
import { getAuthToken, fetchEnvironmentStatus, fetchEnvironmentPods } from '../graphql'

export function useEnvironmentStatus(subdomain: string | null, tenantId: string | null) {
  const renown = useRenown()
  const [status, setStatus] = useState<EnvironmentStatus | null>(null)
  const [pods, setPods] = useState<Pod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    if (!subdomain || !tenantId) return
    try {
      const token = await getAuthToken(renown)
      const [s, p] = await Promise.all([
        fetchEnvironmentStatus(subdomain, tenantId, token),
        fetchEnvironmentPods(subdomain, tenantId, token),
      ])
      setStatus(s)
      setPods(p)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load status'))
    } finally {
      setIsLoading(false)
    }
  }, [subdomain, tenantId, renown])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 15_000)
    return () => clearInterval(interval)
  }, [refresh])

  return { status, pods, isLoading, error, refresh }
}
