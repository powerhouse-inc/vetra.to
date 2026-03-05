'use client'

import { useMemo } from 'react'
import { getProject, getProjects, getEnvironmentFormValues } from './mock-data'
import type { CloudProject, CloudEnvironment, CloudEnvironmentFormValues } from './types'

/**
 * Hook to get all Predefined form values
 */
export function useCloudEnvironmentFormValues(): CloudEnvironmentFormValues {
  return useMemo(() => getEnvironmentFormValues(), [])
}

/**
 * Hook to get all cloud projects
 */
export function useProjects(): CloudProject[] {
  return useMemo(() => getProjects(), [])
}

/**
 * Hook to get a single cloud project by ID
 */
export function useProject(id: string): CloudProject | undefined {
  return useMemo(() => getProject(id), [id])
}

/**
 * Hook to get a specific environment from a project
 */
export function useEnvironment(
  projectId: string,
  environmentId: string,
): CloudEnvironment | undefined {
  return useMemo(() => {
    const project = getProject(projectId)
    return project?.environments.find((env) => env.id === environmentId)
  }, [projectId, environmentId])
}

/**
 * Hook to get all environments for a project
 */
export function useProjectEnvironments(projectId: string): CloudEnvironment[] {
  return useMemo(() => {
    const project = getProject(projectId)
    return project?.environments ?? []
  }, [projectId])
}
