'use client'

import { useRenown } from '@powerhousedao/reactor-browser'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { fetchMyEnvironments, fetchViewer, getAuthToken } from '../graphql'
import type { EnvironmentSummary, ListScope, Viewer } from '../graphql'
import { useDocumentListSubscription } from './use-document-subscription'
import type { CloudEnvironment } from '../types'

/**
 * UI scope for the env list toggle. Maps to backend `ListScope` + client-side
 * partition of the `owner` / `createdBy` fields (the backend's `MINE` scope
 * returns the caller's envs plus any unclaimed env, so we split that bucket
 * here rather than adding a new server enum).
 *
 * - `MINE`: owner == me, OR (owner == null AND createdBy == me). The second
 *   clause covers the gap between a user creating an env and `SET_OWNER`
 *   landing, so a newly-created env never disappears from its creator's view.
 * - `UNCLAIMED`: owner == null AND createdBy != me. Envs available for anyone
 *   to claim, with the caller's own pending creations filtered out (those
 *   belong in MINE).
 * - `ALL`: every env. Admin-only on the server — non-admins passing ALL get
 *   the same results as MINE from the backend.
 */
export type ViewScope = 'MINE' | 'UNCLAIMED' | 'ALL'

function filterByScope(
  envs: EnvironmentSummary[],
  viewScope: ViewScope,
  viewerAddress: string | null,
): EnvironmentSummary[] {
  if (viewScope === 'ALL') return envs
  const me = viewerAddress?.toLowerCase() ?? null
  if (viewScope === 'MINE') {
    // Without a known identity we can't decide what is "mine"; returning
    // nothing avoids the `null === null` trap where every unclaimed env would
    // otherwise match. The hook re-filters once viewer resolves.
    if (me === null) return []
    return envs.filter((e) => {
      const owner = e.owner?.toLowerCase() ?? null
      const createdBy = e.createdBy?.toLowerCase() ?? null
      return owner === me || (owner === null && createdBy === me)
    })
  }
  // UNCLAIMED: owner == null. When we know the viewer, also exclude envs
  // they created (those belong in MINE) so a pending-SET_OWNER env doesn't
  // appear in both tabs.
  return envs.filter((e) => {
    const owner = e.owner?.toLowerCase() ?? null
    if (owner !== null) return false
    if (me === null) return true
    const createdBy = e.createdBy?.toLowerCase() ?? null
    return createdBy !== me
  })
}

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
      // `owner` comes from document state via the processor; fall back to the
      // legacy `createdBy` column for envs the backfill hasn't touched yet.
      owner: summary.owner ?? summary.createdBy,
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
 * Hook to get cloud environments scoped to the caller's view.
 *
 * Switching between `MINE` and `UNCLAIMED` filters in-memory (no refetch);
 * switching to/from `ALL` triggers a new server query. `viewerAddress` is
 * required to distinguish MINE from UNCLAIMED — pass `null` while the viewer
 * is still loading and the hook will show an empty list until it resolves.
 *
 * Subscribes to document changes via WebSocket for real-time updates and
 * polls every 10s as fallback.
 */
export function useEnvironments(
  viewScope: ViewScope = 'MINE',
  viewerAddress: string | null = null,
): CloudEnvironment[] {
  const renown = useRenown()
  const renownRef = useRef(renown)
  renownRef.current = renown
  const backendScope: ListScope = viewScope === 'ALL' ? 'ALL' : 'MINE'
  const [summaries, setSummaries] = useState<EnvironmentSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const summariesRef = useRef(summaries)
  summariesRef.current = summaries

  const refetch = useCallback(async () => {
    try {
      if (!summariesRef.current.length) setIsLoading(true)
      setError(null)
      const token = await getAuthToken(renownRef.current)
      const data = await fetchMyEnvironments(backendScope, token)
      const prev = JSON.stringify(summariesRef.current)
      if (JSON.stringify(data) !== prev) {
        setSummaries(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch environments'))
      console.error('Failed to fetch environments:', err)
    } finally {
      setIsLoading(false)
    }
  }, [backendScope])

  // Initial load + refetch when backend scope changes or auth becomes available.
  // `renown` transitions from undefined → instance once the SDK initialises,
  // ensuring we re-fetch with a valid bearer token instead of waiting for the
  // 10-second polling fallback.
  useEffect(() => {
    void refetch()
  }, [refetch, renown])

  // Subscribe to all document changes via WebSocket — triggers refetch on any update
  useDocumentListSubscription(() => {
    void refetch()
  })

  // Fallback: poll every 10s in case WebSocket is disconnected
  useEffect(() => {
    const interval = setInterval(() => {
      void refetch()
    }, 10_000)
    return () => clearInterval(interval)
  }, [refetch])

  // Listen for manual refresh events (e.g. after deletion)
  useEffect(() => {
    const handleRefresh = () => {
      void refetch()
    }
    window.addEventListener('refresh-environments', handleRefresh)
    return () => window.removeEventListener('refresh-environments', handleRefresh)
  }, [refetch])

  return useMemo(() => {
    if (isLoading || error) return []
    return filterByScope(summaries, viewScope, viewerAddress).map(summaryToCloudEnvironment)
  }, [isLoading, error, summaries, viewScope, viewerAddress])
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
    void (async () => {
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
