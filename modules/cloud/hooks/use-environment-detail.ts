'use client'

import { useRenown } from '@powerhousedao/reactor-browser'
import { useState, useEffect, useCallback, useRef } from 'react'
import type { CloudEnvironment, CloudEnvironmentServiceType } from '../types'
import {
  getAuthToken,
  fetchEnvironment,
  setLabel as gqlSetLabel,
  setGenericSubdomain as gqlSetGenericSubdomain,
  enableService as gqlEnableService,
  disableService as gqlDisableService,
  toggleService as gqlToggleService,
  addPackage as gqlAddPackage,
  removePackage as gqlRemovePackage,
  initializeEnvironment as gqlInitialize,
  terminateEnvironment as gqlTerminate,
} from '../graphql'

export function useEnvironmentDetail(documentId: string) {
  const renown = useRenown()
  const renownRef = useRef(renown)
  renownRef.current = renown
  const [environment, setEnvironment] = useState<CloudEnvironment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setIsLoading(true)
        setError(null)
        const token = await getAuthToken(renownRef.current)
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
  }, [documentId])

  const mutate = useCallback(
    async (fn: (token: string | null) => Promise<CloudEnvironment>) => {
      const token = await getAuthToken(renownRef.current)
      const updated = await fn(token)
      setEnvironment(updated)
    },
    [renown],
  )

  const setLabel = useCallback(
    (label: string) => mutate((t) => gqlSetLabel(documentId, label, t)),
    [documentId, mutate],
  )
  const setGenericSubdomain = useCallback(
    (subdomain: string) => mutate((t) => gqlSetGenericSubdomain(documentId, subdomain, t)),
    [documentId, mutate],
  )
  const enableService = useCallback(
    (type: CloudEnvironmentServiceType, prefix: string) =>
      mutate((t) => gqlEnableService(documentId, type, prefix, t)),
    [documentId, mutate],
  )
  const disableService = useCallback(
    (type: CloudEnvironmentServiceType) => mutate((t) => gqlDisableService(documentId, type, t)),
    [documentId, mutate],
  )
  const toggleServiceEnabled = useCallback(
    (type: CloudEnvironmentServiceType) => mutate((t) => gqlToggleService(documentId, type, t)),
    [documentId, mutate],
  )
  const addPackage = useCallback(
    (name: string, version?: string) =>
      mutate((t) => gqlAddPackage(documentId, name, version, undefined, t)),
    [documentId, mutate],
  )
  const removePackage = useCallback(
    (name: string) => mutate((t) => gqlRemovePackage(documentId, name, t)),
    [documentId, mutate],
  )
  const initialize = useCallback(
    (subdomain: string, baseDomain: string, defaultRegistry?: string) =>
      mutate((t) => gqlInitialize(documentId, subdomain, baseDomain, defaultRegistry, t)),
    [documentId, mutate],
  )
  const terminate = useCallback(
    () => mutate((t) => gqlTerminate(documentId, t)),
    [documentId, mutate],
  )

  return {
    environment,
    isLoading,
    error,
    setLabel,
    setGenericSubdomain,
    enableService,
    disableService,
    toggleServiceEnabled,
    addPackage,
    removePackage,
    initialize,
    terminate,
  }
}
