'use client'

import { useRenown } from '@powerhousedao/reactor-browser'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  cancelEnvironmentDump,
  fetchEnvironmentDumps,
  getAuthToken,
  requestEnvironmentDump,
} from '../graphql'
import type { DatabaseDump, DatabaseDumpStatus } from '../types'

const POLL_INTERVAL_MS = 5000
const IN_FLIGHT: ReadonlySet<DatabaseDumpStatus> = new Set(['PENDING', 'RUNNING'])

type State = {
  dumps: DatabaseDump[]
  isLoading: boolean
  error: string | null
}

/**
 * Owner-gated query for the env's dump history. Polls every 5s while
 * any dump is PENDING/RUNNING; otherwise idle. The presigned URL on
 * each ready dump is minted server-side at query time, so re-fetching
 * always returns a fresh URL with 15-min validity.
 */
export function useEnvironmentDumps(tenantId: string | null) {
  const renown = useRenown()
  const renownRef = useRef(renown)
  renownRef.current = renown

  const [state, setState] = useState<State>({
    dumps: [],
    isLoading: true,
    error: null,
  })
  const [isRequesting, setIsRequesting] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refetch = useCallback(async () => {
    if (!tenantId) return
    try {
      const token = await getAuthToken(renownRef.current)
      const dumps = await fetchEnvironmentDumps(tenantId, token)
      setState({ dumps, isLoading: false, error: null })
    } catch (err) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load dumps',
      }))
    }
  }, [tenantId])

  useEffect(() => {
    if (!tenantId) return
    void refetch()
  }, [tenantId, refetch])

  useEffect(() => {
    const hasInFlight = state.dumps.some((d) => IN_FLIGHT.has(d.status))
    if (hasInFlight && !pollRef.current) {
      pollRef.current = setInterval(() => void refetch(), POLL_INTERVAL_MS)
    } else if (!hasInFlight && pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [state.dumps, refetch])

  const request = useCallback(async () => {
    if (!tenantId) return
    setIsRequesting(true)
    try {
      const token = await getAuthToken(renownRef.current)
      await requestEnvironmentDump(tenantId, token)
      await refetch()
    } finally {
      setIsRequesting(false)
    }
  }, [tenantId, refetch])

  const cancel = useCallback(
    async (dumpId: string) => {
      setCancellingId(dumpId)
      try {
        const token = await getAuthToken(renownRef.current)
        await cancelEnvironmentDump(dumpId, token)
        await refetch()
      } finally {
        setCancellingId(null)
      }
    },
    [refetch],
  )

  return {
    dumps: state.dumps,
    isLoading: state.isLoading,
    error: state.error,
    isRequesting,
    cancellingId,
    request,
    cancel,
    refetch,
  }
}
