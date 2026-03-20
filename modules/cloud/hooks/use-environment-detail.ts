'use client'

import { useRenown } from '@powerhousedao/reactor-browser'
import { useState, useEffect, useCallback } from 'react'
import type { CloudEnvironment, CloudEnvironmentService } from '../types'
import {
  getAuthToken,
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
  const renown = useRenown()
  const [environment, setEnvironment] = useState<CloudEnvironment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setIsLoading(true)
        setError(null)
        const token = await getAuthToken(renown)
        const env = await fetchEnvironment(documentId, token)
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
  }, [documentId, renown])

  const mutate = useCallback(
    async (fn: (token: string | null) => Promise<CloudEnvironment>) => {
      const token = await getAuthToken(renown)
      const updated = await fn(token)
      setEnvironment(updated)
    },
    [renown],
  )

  const setName = useCallback(
    (name: string) => mutate((t) => gqlSetName(documentId, name, t)),
    [documentId, mutate],
  )
  const setSubdomain = useCallback(
    (subdomain: string) => mutate((t) => gqlSetSubdomain(documentId, subdomain, t)),
    [documentId, mutate],
  )
  const enableService = useCallback(
    (service: CloudEnvironmentService) => mutate((t) => gqlEnableService(documentId, service, t)),
    [documentId, mutate],
  )
  const disableService = useCallback(
    (service: CloudEnvironmentService) => mutate((t) => gqlDisableService(documentId, service, t)),
    [documentId, mutate],
  )
  const addPackage = useCallback(
    (name: string, version?: string) => mutate((t) => gqlAddPackage(documentId, name, version, t)),
    [documentId, mutate],
  )
  const removePackage = useCallback(
    (name: string) => mutate((t) => gqlRemovePackage(documentId, name, t)),
    [documentId, mutate],
  )
  const start = useCallback(() => mutate((t) => gqlStart(documentId, t)), [documentId, mutate])
  const stop = useCallback(() => mutate((t) => gqlStop(documentId, t)), [documentId, mutate])

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
