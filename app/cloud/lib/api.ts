/**
 * API client functions for cloud operations
 */

export interface CreateProjectDocumentParams {
  name: string
}

export interface SetProjectNameParams {
  docId: string
  name: string
}

export interface SetProjectDescriptionParams {
  docId: string
  description: string
}

export interface DeleteProjectDocumentParams {
  docId: string
}

export interface CreateProjectDocumentResponse {
  success: boolean
  data: {
    id: string
    name: string
    driveId: string
  }
}

export interface SetProjectNameResponse {
  success: boolean
  data: {
    id: string
    name: string
  }
}

export interface SetProjectDescriptionResponse {
  success: boolean
  data: {
    id: string
    description: string
  }
}

export interface DeleteProjectDocumentResponse {
  success: boolean
  data: {
    id: string
    success: boolean
  }
}

export interface HostingDbQueriesResponse {
  success: boolean
  data: unknown
}

/**
 * Create a new project document using Project_createDocument mutation
 */
export async function createProjectDocument(
  params: CreateProjectDocumentParams,
): Promise<CreateProjectDocumentResponse> {
  const response = await fetch('/api/cloud', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      operation: 'createDocument',
      name: params.name,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create project document')
  }

  return response.json()
}

/**
 * Update project name using the Project_setProjectName mutation
 */
export async function setProjectName(
  params: SetProjectNameParams,
): Promise<SetProjectNameResponse> {
  const response = await fetch('/api/cloud', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      operation: 'setProjectName',
      docId: params.docId,
      name: params.name,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update project name')
  }

  return response.json()
}

/**
 * Update project description using the Project_setProjectDescription mutation
 */
export async function setProjectDescription(
  params: SetProjectDescriptionParams,
): Promise<SetProjectDescriptionResponse> {
  const response = await fetch('/api/cloud', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      operation: 'setProjectDescription',
      docId: params.docId,
      description: params.description,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update project description')
  }

  return response.json()
}

/**
 * Delete a project document using Project_deleteDocument mutation
 */
export async function deleteProjectDocument(
  params: DeleteProjectDocumentParams,
): Promise<DeleteProjectDocumentResponse> {
  const response = await fetch('/api/cloud', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      operation: 'deleteDocument',
      docId: params.docId,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete project document')
  }

  return response.json()
}

/**
 * Fetch hosting data using HostingDbQueries
 */
export async function fetchHostingQueries(): Promise<HostingDbQueriesResponse> {
  const response = await fetch('/api/cloud', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch hosting data')
  }

  console.log('Response ok')

  return response.json()
}
