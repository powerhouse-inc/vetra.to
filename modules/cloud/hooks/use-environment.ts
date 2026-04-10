'use client'

import { useRenown } from '@powerhousedao/reactor-browser'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { getAuthToken, fetchEnvironments } from '../graphql'
import { useDocumentListSubscription } from './use-document-subscription'
import type { CloudEnvironment } from '../types'

/**
 * Hook to get all cloud environments from the API.
 * Subscribes to document changes via WebSocket for real-time updates
 * and polls every 30s as fallback.
 */
export function useEnvironments(): CloudEnvironment[] {
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
      const data = await fetchEnvironments(token)
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
  }, [])

  // Initial load
  useEffect(() => {
    void refetch()
  }, [refetch])

  // Subscribe to all document changes via WebSocket — triggers refetch on any update
  useDocumentListSubscription(() => void refetch())

  // Fallback: poll every 30s in case WebSocket is disconnected
  useEffect(() => {
    const interval = setInterval(() => void refetch(), 10_000)
    return () => clearInterval(interval)
  }, [refetch])

  // Listen for manual refresh events (e.g. after deletion)
  useEffect(() => {
    const handleRefresh = () => void refetch()
    window.addEventListener('refresh-environments', handleRefresh)
    return () => window.removeEventListener('refresh-environments', handleRefresh)
  }, [refetch])

  if (isLoading || error) {
    return []
  }

  return environments
}

/**
 * Hook to refresh environments list
 */
export function useRefreshEnvironments(): () => void {
  return () => {
    window.dispatchEvent(new CustomEvent('refresh-environments'))
  }
}

/**
 * Hook to get a single environment by ID
 */
export function useEnvironment(id: string): CloudEnvironment | undefined {
  const environments = useEnvironments()
  return useMemo(() => {
    return environments.find((env) => env.id === id)
  }, [environments, id])
}
