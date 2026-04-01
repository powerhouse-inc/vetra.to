'use client'

import { useRenown } from '@powerhousedao/reactor-browser'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getAuthToken,
  fetchEnvironment,
  setLabel as gqlSetLabel,
  setGenericSubdomain as gqlSetGenericSubdomain,
  setCustomDomain as gqlSetCustomDomain,
  setDefaultPackageRegistry as gqlSetDefaultPackageRegistry,
  enableService as gqlEnableService,
  disableService as gqlDisableService,
  toggleService as gqlToggleService,
  addPackage as gqlAddPackage,
  removePackage as gqlRemovePackage,
  initializeEnvironment as gqlInitialize,
  approveChanges as gqlApproveChanges,
  terminateEnvironment as gqlTerminate,
  setServiceVersion as gqlSetServiceVersion,
  setPackageVersion as gqlSetPackageVersion,
} from '../graphql'
import { useDocumentSubscription } from './use-document-subscription'
import type { CloudEnvironment, CloudEnvironmentServiceType } from '../types'

export function useEnvironmentDetail(documentId: string) {
  const renown = useRenown()
  const renownRef = useRef(renown)
  renownRef.current = renown
  const [environment, setEnvironment] = useState<CloudEnvironment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const envRef = useRef(environment)
  envRef.current = environment

  // Refetch function — used by both initial load and subscription events
  const refetch = useCallback(async () => {
    try {
      if (!envRef.current) setIsLoading(true)
      const token = await getAuthToken(renownRef.current)
      const env = await fetchEnvironment(documentId, token)
      if (env) {
        const prev = envRef.current
        if (!prev || prev.revision !== env.revision || prev.state.status !== env.state.status) {
          setEnvironment(env)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load'))
    } finally {
      setIsLoading(false)
    }
  }, [documentId])

  // Initial load
  useEffect(() => {
    refetch()
  }, [refetch])

  // Subscribe to document changes via WebSocket — triggers refetch on any update
  useDocumentSubscription(documentId, refetch)

  // Fallback: poll every 30s in case WebSocket is disconnected
  useEffect(() => {
    const interval = setInterval(refetch, 30_000)
    return () => clearInterval(interval)
  }, [refetch])

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
  const setCustomDomain = useCallback(
    (enabled: boolean, domain?: string | null) =>
      mutate((t) => gqlSetCustomDomain(documentId, enabled, domain, t)),
    [documentId, mutate],
  )
  const setDefaultPackageRegistry = useCallback(
    (registry: string) => mutate((t) => gqlSetDefaultPackageRegistry(documentId, registry, t)),
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
  const approveChanges = useCallback(
    () => mutate((t) => gqlApproveChanges(documentId, t)),
    [documentId, mutate],
  )
  const terminate = useCallback(
    () => mutate((t) => gqlTerminate(documentId, t)),
    [documentId, mutate],
  )
  const setServiceVersion = useCallback(
    (type: CloudEnvironmentServiceType, version: string) =>
      mutate((t) => gqlSetServiceVersion(documentId, type, version, t)),
    [documentId, mutate],
  )
  const setPackageVersion = useCallback(
    (packageName: string, version: string) =>
      mutate((t) => gqlSetPackageVersion(documentId, packageName, version, t)),
    [documentId, mutate],
  )
  return {
    environment,
    isLoading,
    error,
    setLabel,
    setGenericSubdomain,
    setCustomDomain,
    setDefaultPackageRegistry,
    enableService,
    disableService,
    toggleServiceEnabled,
    addPackage,
    removePackage,
    initialize,
    approveChanges,
    terminate,
    setServiceVersion,
    setPackageVersion,
  }
}
