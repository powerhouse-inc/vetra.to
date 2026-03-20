'use client'

import { useState, useEffect, useCallback } from 'react'
import type { CloudEnvironment, CloudEnvironmentService } from '../types'
import {
  fetchEnvironment,
  setEnvironmentName as gqlSetName,
  setSubdomain as gqlSetSubdomain,
  enableService as gqlEnableService,
  disableService as gqlDisableService,
  addPackage as gqlAddPackage,
  removePackage as gqlRemovePackage,
  startEnvironment as gqlStart,
  stopEnvironment as gqlStop,
} from '../graphql'

export function useEnvironmentDetail(documentId: string) {
  const [environment, setEnvironment] = useState<CloudEnvironment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setIsLoading(true)
        setError(null)
        const env = await fetchEnvironment(documentId)
        if (!cancelled) setEnvironment(env)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err : new Error('Failed to load'))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [documentId])

  const mutate = useCallback(async (fn: () => Promise<CloudEnvironment>) => {
    const updated = await fn()
    setEnvironment(updated)
  }, [])

  const setName = useCallback(
    (name: string) => mutate(() => gqlSetName(documentId, name)),
    [documentId, mutate],
  )
  const setSubdomain = useCallback(
    (subdomain: string) => mutate(() => gqlSetSubdomain(documentId, subdomain)),
    [documentId, mutate],
  )
  const enableService = useCallback(
    (service: CloudEnvironmentService) => mutate(() => gqlEnableService(documentId, service)),
    [documentId, mutate],
  )
  const disableService = useCallback(
    (service: CloudEnvironmentService) => mutate(() => gqlDisableService(documentId, service)),
    [documentId, mutate],
  )
  const addPackage = useCallback(
    (name: string, version?: string) => mutate(() => gqlAddPackage(documentId, name, version)),
    [documentId, mutate],
  )
  const removePackage = useCallback(
    (name: string) => mutate(() => gqlRemovePackage(documentId, name)),
    [documentId, mutate],
  )
  const start = useCallback(() => mutate(() => gqlStart(documentId)), [documentId, mutate])
  const stop = useCallback(() => mutate(() => gqlStop(documentId)), [documentId, mutate])

  return {
    environment,
    isLoading,
    error,
    setName,
    setSubdomain,
    enableService,
    disableService,
    addPackage,
    removePackage,
    start,
    stop,
  }
}
