'use client'

import { useState, useEffect, useMemo } from 'react'
import { fetchHostingQueries } from './lib/api'
import { getEnvironmentFormValues } from './mock-data'
import type { CloudProject, CloudEnvironment, CloudEnvironmentFormValues } from './types'

/**
 * Hook to get all Predefined form values
 */
export function useCloudEnvironmentFormValues(): CloudEnvironmentFormValues {
  return useMemo(() => getEnvironmentFormValues(), [])
}

/**
 * Hook to get all cloud projects from the API
 */
export function useProjects(): CloudProject[] {
  const [projects, setProjects] = useState<CloudProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetchHostingQueries()
        console.log('Hosting queries fetched:', response)

        // Transform the GraphQL response to CloudProject[]
        const data = response.data as {
          projects?: Array<{
            id: string
            documentId: string
            driveId: string
            name: string
            description: string | null
            createdAt: string
            updatedAt: string
            environments?: Array<{
              id: string
              documentId: string
              driveId: string
              name: string
              username: string
              status: string
              connectEnabled: boolean
              switchboardEnabled: boolean
              appDockerImage: string | null
              appTag: string | null
              appPort: number | null
              databaseEnabled: boolean
              backupsEnabled: boolean
              createdAt: string
              updatedAt: string
            }>
          }>
        }

        if (data?.projects) {
          // Transform GraphQL DbProject to CloudProject
          console.log('Transformed projects:', data?.projects)
          const transformedProjects: CloudProject[] = data.projects.map((project) => ({
            id: project.id,
            title: project.name, // Map name to title
            description: project.description || '',
            environments: (project.environments || []).map((env) => ({
              id: env.id,
              projectId: project.id,
              address: env.name || '', // Map name to address (or use appropriate field)
              packages: env.appDockerImage || '', // Map appDockerImage to packages
              resources: '', // Not available in GraphQL schema, set empty
              label: env.status || '', // Map status to label
              admin: env.username || '', // Map username to admin
              backup: env.backupsEnabled, // Map backupsEnabled to backup
            })),
          }))
          setProjects(transformedProjects)
        } else {
          console.warn('Unexpected API response structure:', data)
          setProjects([])
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch projects'))
        console.error('Failed to fetch projects:', err)
        setProjects([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjects()

    // Listen for refresh events
    const handleRefresh = () => {
      setRefreshTrigger((prev) => prev + 1)
    }

    window.addEventListener('refresh-projects', handleRefresh)
    return () => {
      window.removeEventListener('refresh-projects', handleRefresh)
    }
  }, [refreshTrigger])

  // Return empty array while loading or on error to prevent breaking the UI
  if (isLoading || error) {
    return []
  }

  return projects
}

/**
 * Hook to refresh projects list
 */
export function useRefreshProjects(): () => void {
  return () => {
    window.dispatchEvent(new CustomEvent('refresh-projects'))
  }
}

/**
 * Hook to get a single cloud project by ID
 */
export function useProject(id: string): CloudProject | undefined {
  const projects = useProjects()
  return useMemo(() => {
    return projects.find((project) => project.id === id)
  }, [projects, id])
}

/**
 * Hook to get a specific environment from a project
 */
export function useEnvironment(
  projectId: string,
  environmentId: string,
): CloudEnvironment | undefined {
  const project = useProject(projectId)
  return useMemo(() => {
    return project?.environments.find((env) => env.id === environmentId)
  }, [project, environmentId])
}

/**
 * Hook to get all environments for a project
 */
export function useProjectEnvironments(projectId: string): CloudEnvironment[] {
  const project = useProject(projectId)
  return useMemo(() => {
    return project?.environments ?? []
  }, [project])
}
