'use client'

import { useRenown } from '@powerhousedao/reactor-browser'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { fetchMyEnvironments, fetchViewer, getAuthToken } from '../graphql'
import type { EnvironmentSummary, ListScope, Viewer } from '../graphql'
import { useDocumentListSubscription } from './use-document-subscription'
import type { CloudEnvironment } from '../types'

/**
 * Convert an EnvironmentSummary (lightweight projection from the
 * vetra-cloud-observability subgraph) into the heavier CloudEnvironment shape
 * the existing UI expects. Fields not exposed by the summary are filled with
 * sensible defaults — the list view only needs id/name/status/etc.
 */
function summaryToCloudEnvironment(summary: EnvironmentSummary): CloudEnvironment {
  return {
    id: summary.id,
    name: summary.name ?? summary.id,
    documentType: 'powerhouse/vetra-cloud-environment',
    createdAtUtcIso: '',
    lastModifiedAtUtcIso: '',
    revision: 0,
    state: {
      label: summary.name,
      genericSubdomain: summary.subdomain,
      genericBaseDomain: 'vetra.io',
      customDomain: summary.customDomain
        ? { enabled: true, domain: summary.customDomain, dnsRecords: [] }
        : null,
      defaultPackageRegistry: null,
      services: [],
      packages: [],
      // status is a string from the DB; cast to the union type the UI expects
      status: (summary.status ?? 'DRAFT') as CloudEnvironment['state']['status'],
    },
  }
}

/**
 * Hook to get cloud environments scoped to the calling user.
 *
 * Pass `scope: 'ALL'` to request all environments — the server enforces that
 * non-admins are silently restricted to their own envs even with this flag.
 *
 * Subscribes to document changes via WebSocket for real-time updates and
 * polls every 10s as fallback.
 */
export function useEnvironments(scope: ListScope = 'MINE'): CloudEnvironment[] {
  const renown = useRenown()
  const renownRef = useRef(renown)
  renownRef.current = renown
  const [environments, setEnvironments] = useState<CloudEnvironment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const envsRef = useRef(environments)
  envsRef.current = environments

  const refetch = useCallback(async () => {
    try {
      if (!envsRef.current.length) setIsLoading(true)
      setError(null)
      const token = await getAuthToken(renownRef.current)
      const summaries = await fetchMyEnvironments(scope, token)
      const data = summaries.map(summaryToCloudEnvironment)
      const prev = JSON.stringify(envsRef.current)
      if (JSON.stringify(data) !== prev) {
        setEnvironments(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch environments'))
      console.error('Failed to fetch environments:', err)
    } finally {
      setIsLoading(false)
    }
  }, [scope])

  // Initial load + refetch when scope changes
  useEffect(() => {
    refetch()
  }, [refetch])

  // Subscribe to all document changes via WebSocket — triggers refetch on any update
  useDocumentListSubscription(refetch)

  // Fallback: poll every 10s in case WebSocket is disconnected
  useEffect(() => {
    const interval = setInterval(refetch, 10_000)
    return () => clearInterval(interval)
  }, [refetch])

  // Listen for manual refresh events (e.g. after deletion)
  useEffect(() => {
    const handleRefresh = () => refetch()
    window.addEventListener('refresh-environments', handleRefresh)
    return () => window.removeEventListener('refresh-environments', handleRefresh)
  }, [refetch])

  if (isLoading || error) {
    return []
  }

  return environments
}

/** Hook to refresh the environments list (e.g. after a delete). */
export function useRefreshEnvironments(): () => void {
  return () => {
    window.dispatchEvent(new CustomEvent('refresh-environments'))
  }
}

/** Hook to get a single environment by ID, looked up in the user's MINE list. */
export function useEnvironment(id: string): CloudEnvironment | undefined {
  const environments = useEnvironments()
  return useMemo(() => {
    return environments.find((env) => env.id === id)
  }, [environments, id])
}

/**
 * Hook returning the caller's identity + admin status from switchboard.
 * Used by the `/cloud` page to show the "Mine | All" toggle only for admins.
 */
export function useViewer(): { viewer: Viewer | null; isLoading: boolean } {
  const renown = useRenown()
  const renownRef = useRef(renown)
  renownRef.current = renown
  const [viewer, setViewer] = useState<Viewer | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const token = await getAuthToken(renownRef.current)
        const v = await fetchViewer(token)
        if (!cancelled) setViewer(v)
      } catch (err) {
        if (!cancelled) {
          console.warn('Failed to fetch viewer:', err)
          setViewer({ address: null, isAdmin: false })
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [renown])

  return { viewer, isLoading }
}
