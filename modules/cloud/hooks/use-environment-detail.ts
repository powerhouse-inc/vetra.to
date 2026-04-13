'use client'

/**
 * Backwards-compatible API for the environment detail page.
 *
 * Internally backed by `RemoteDocumentController` (signed actions via Renown).
 * Reads:
 *   - When the user is logged in, state comes from the controller and updates
 *     reactively via its `onChange` event.
 *   - When the user is NOT logged in, state falls back to a plain GraphQL
 *     fetch (so the page is still viewable in read-only mode).
 * Mutations:
 *   - Always go through the controller. Throw a clear error if the user has
 *     no signer (login required).
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchEnvironment, getAuthToken } from '../graphql'
import type { CloudEnvironment, CloudEnvironmentServiceType } from '../types'
import { useDocumentSubscription } from './use-document-subscription'
import { useEnvironmentController } from './use-environment-controller'
import { useCanSign } from './use-can-sign'
import { useRenown } from '@powerhousedao/reactor-browser'

const NOT_LOGGED_IN_ERROR = 'You must be logged in with Renown to perform this action'

/** Construct a CloudEnvironment-shaped object from controller state + id. */
function projectFromController(
  documentId: string,
  state: unknown,
  revision: number,
): CloudEnvironment {
  const s = state as CloudEnvironment['state']
  return {
    id: documentId,
    name: s?.label ?? documentId,
    documentType: 'powerhouse/vetra-cloud-environment',
    createdAtUtcIso: '',
    lastModifiedAtUtcIso: '',
    revision,
    state: s,
  }
}

export function useEnvironmentDetail(documentId: string) {
  const renown = useRenown()
  const renownRef = useRef(renown)
  renownRef.current = renown
  const { canSign } = useCanSign()

  const ctrlResult = useEnvironmentController(canSign ? documentId : null)
  const { controller, state: ctrlState, isLoading: ctrlLoading, error: ctrlError } = ctrlResult

  // Read-only fallback for unauthenticated viewers (no controller available).
  const [fallbackEnv, setFallbackEnv] = useState<CloudEnvironment | null>(null)
  const [fallbackLoading, setFallbackLoading] = useState<boolean>(true)
  const [fallbackError, setFallbackError] = useState<Error | null>(null)
  const fallbackRef = useRef<CloudEnvironment | null>(null)
  fallbackRef.current = fallbackEnv

  const refetchFallback = useCallback(async () => {
    if (canSign) return // controller path handles state when signed in
    try {
      if (!fallbackRef.current) setFallbackLoading(true)
      const token = await getAuthToken(renownRef.current as never)
      const env = await fetchEnvironment(documentId, token)
      if (env) {
        const prev = fallbackRef.current
        if (!prev || prev.revision !== env.revision || prev.state.status !== env.state.status) {
          setFallbackEnv(env)
        }
      }
    } catch (err) {
      setFallbackError(err instanceof Error ? err : new Error('Failed to load'))
    } finally {
      setFallbackLoading(false)
    }
  }, [documentId, canSign])

  useEffect(() => {
    if (!canSign) {
      void refetchFallback()
    }
  }, [canSign, refetchFallback])

  // Subscribe to remote changes for the read-only fallback path
  useDocumentSubscription(canSign ? null : documentId, refetchFallback)

  // Polling fallback for read-only path
  useEffect(() => {
    if (canSign) return
    const interval = setInterval(() => void refetchFallback(), 30_000)
    return () => clearInterval(interval)
  }, [canSign, refetchFallback])

  // Track controller revision to surface re-renders when state changes
  const [, setRev] = useState(0)
  useEffect(() => {
    if (!controller) return
    const unsub = controller.onChange(() => setRev((r) => r + 1))
    return () => {
      unsub()
    }
  }, [controller])

  // Effective environment: controller state when signed in, fallback otherwise
  const environment: CloudEnvironment | null = canSign
    ? ctrlState
      ? projectFromController(documentId, ctrlState, 0)
      : null
    : fallbackEnv

  const isLoading = canSign ? ctrlLoading : fallbackLoading
  const error = canSign ? ctrlError : fallbackError

  // ---- Mutations: dispatch on controller, then push (signed) ----

  const mutate = useCallback(
    async (fn: (c: NonNullable<typeof controller>) => void) => {
      if (!controller) {
        throw new Error(NOT_LOGGED_IN_ERROR)
      }
      fn(controller)
      await controller.push()
    },
    [controller],
  )

  const setLabel = useCallback((label: string) => mutate((c) => c.setLabel({ label })), [mutate])
  const setGenericSubdomain = useCallback(
    (subdomain: string) => mutate((c) => c.setGenericSubdomain({ genericSubdomain: subdomain })),
    [mutate],
  )
  const setCustomDomain = useCallback(
    (enabled: boolean, domain?: string | null) =>
      mutate((c) => c.setCustomDomain({ enabled, domain: domain ?? undefined })),
    [mutate],
  )
  const setDefaultPackageRegistry = useCallback(
    (registry: string) =>
      mutate((c) => c.setDefaultPackageRegistry({ defaultPackageRegistry: registry })),
    [mutate],
  )
  const enableService = useCallback(
    (type: CloudEnvironmentServiceType, prefix: string) =>
      mutate((c) => c.enableService({ type, prefix })),
    [mutate],
  )
  const disableService = useCallback(
    (type: CloudEnvironmentServiceType) => mutate((c) => c.disableService({ type })),
    [mutate],
  )
  const toggleServiceEnabled = useCallback(
    (type: CloudEnvironmentServiceType) => mutate((c) => c.toggleService({ type })),
    [mutate],
  )
  const addPackage = useCallback(
    (name: string, version?: string) =>
      mutate((c) => c.addPackage({ packageName: name, version: version ?? undefined })),
    [mutate],
  )
  const removePackage = useCallback(
    (name: string) => mutate((c) => c.removePackage({ packageName: name })),
    [mutate],
  )
  const initialize = useCallback(
    (subdomain: string, baseDomain: string, defaultRegistry?: string) =>
      mutate((c) =>
        c.initialize({
          genericSubdomain: subdomain,
          genericBaseDomain: baseDomain,
          defaultPackageRegistry: defaultRegistry ?? undefined,
        }),
      ),
    [mutate],
  )
  const approveChanges = useCallback(() => mutate((c) => c.approveChanges({})), [mutate])
  const terminate = useCallback(() => mutate((c) => c.terminateEnvironment({})), [mutate])
  const setServiceVersion = useCallback(
    (type: CloudEnvironmentServiceType, version: string) =>
      mutate((c) => c.setServiceVersion({ type, version })),
    [mutate],
  )
  const setPackageVersion = useCallback(
    (packageName: string, version: string) =>
      mutate((c) => c.setPackageVersion({ packageName, version })),
    [mutate],
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
