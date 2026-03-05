/**
 * API client functions for cloud operations
 */

import type { CloudEnvironment } from '../types'

export interface CreateEnvironmentParams {
  name: string
}

export interface SetEnvironmentNameParams {
  docId: string
  name: string
}

export interface DeleteDocumentParams {
  docId: string
}

export interface AddPackageParams {
  docId: string
  packageName: string
  version?: string
}

export interface CreateEnvironmentResponse {
  success: boolean
  data: {
    id: string
    name: string
    driveId: string
  }
}

export interface SetEnvironmentNameResponse {
  success: boolean
  data: {
    id: string
    name: string
  }
}

export interface DeleteDocumentResponse {
  success: boolean
  data: {
    id: string
    success: boolean
  }
}

export interface AddPackageResponse {
  success: boolean
  data: {
    id: string
    packageName: string
    version?: string
  }
}

/**
 * Create a new environment document
 */
export async function createEnvironment(
  params: CreateEnvironmentParams,
): Promise<CreateEnvironmentResponse> {
  const response = await fetch('/api/cloud', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation: 'createEnvironment',
      name: params.name,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.details || error.error || 'Failed to create environment')
  }

  return response.json()
}

/**
 * Update environment name
 */
export async function setEnvironmentName(
  params: SetEnvironmentNameParams,
): Promise<SetEnvironmentNameResponse> {
  const response = await fetch('/api/cloud', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation: 'setEnvironmentName',
      docId: params.docId,
      name: params.name,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.details || error.error || 'Failed to update environment name')
  }

  return response.json()
}

/**
 * Delete a document
 */
export async function deleteDocument(
  params: DeleteDocumentParams,
): Promise<DeleteDocumentResponse> {
  const response = await fetch('/api/cloud', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation: 'deleteDocument',
      docId: params.docId,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.details || error.error || 'Failed to delete document')
  }

  return response.json()
}

/**
 * Add a package to an environment
 */
export async function addPackage(params: AddPackageParams): Promise<AddPackageResponse> {
  const response = await fetch('/api/cloud', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation: 'addPackage',
      docId: params.docId,
      packageName: params.packageName,
      version: params.version,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.details || error.error || 'Failed to add package')
  }

  return response.json()
}

/**
 * Fetch all environments
 */
export async function fetchEnvironments(): Promise<{
  success: boolean
  data: CloudEnvironment[]
}> {
  const response = await fetch('/api/cloud', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch environments')
  }

  return response.json()
}

/**
 * Fetch a single environment by docId
 */
export async function fetchEnvironment(docId: string): Promise<{
  success: boolean
  data: CloudEnvironment | null
}> {
  const response = await fetch(`/api/cloud?docId=${encodeURIComponent(docId)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch environment')
  }

  return response.json()
}
