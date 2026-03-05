'use client'

import { useState, useEffect, useMemo } from 'react'
import { fetchEnvironments } from './lib/api'
import { getEnvironmentFormValues } from './mock-data'
import type { CloudEnvironment, CloudEnvironmentFormValues } from './types'

/**
 * Hook to get all Predefined form values
 */
export function useCloudEnvironmentFormValues(): CloudEnvironmentFormValues {
  return useMemo(() => getEnvironmentFormValues(), [])
}

/**
 * Hook to get all cloud environments from the API
 */
export function useEnvironments(): CloudEnvironment[] {
  const [environments, setEnvironments] = useState<CloudEnvironment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetchEnvironments()
        setEnvironments(response.data || [])
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
