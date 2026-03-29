'use client'

import { useRenown } from '@powerhousedao/reactor-browser'
import { useState, useEffect, useMemo, useRef } from 'react'
import { getAuthToken, fetchEnvironments } from '../graphql'
import type { CloudEnvironment } from '../types'

/**
 * Hook to get all cloud environments from the API
 */
export function useEnvironments(): CloudEnvironment[] {
  const renown = useRenown()
  const renownRef = useRef(renown)
  renownRef.current = renown
  const [environments, setEnvironments] = useState<CloudEnvironment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const token = await getAuthToken(renownRef.current)
        const data = await fetchEnvironments(token)
        setEnvironments(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch environments'))
        console.error('Failed to fetch environments:', err)
        setEnvironments([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    const handleRefresh = () => {
      setRefreshTrigger((prev) => prev + 1)
    }

    window.addEventListener('refresh-environments', handleRefresh)
    return () => {
      window.removeEventListener('refresh-environments', handleRefresh)
    }
  }, [refreshTrigger])

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
