import { VetraCloudEnvironment } from '@powerhousedao/vetra-cloud-package/document-models'
import { client, DRIVE_ID } from './client'
import type { CloudEnvironment } from './types'

type FindDocumentsState = {
  document: { isDeleted: boolean | null }
  global: {
    name: string | null
    services: string[]
    packages: Array<{ name: string; version: string | null }> | null
    status: string
  }
}

function transformDocument(doc: {
  id: string
  name: string
  documentType: string
  revisionsList: ReadonlyArray<{ scope: string; revision: number }>
  createdAtUtcIso: string | Date
  lastModifiedAtUtcIso: string | Date
  state: FindDocumentsState
}): CloudEnvironment {
  return {
    id: doc.id,
    name: doc.name,
    documentType: doc.documentType,
    revision: doc.revisionsList.find((r) => r.scope === 'global')?.revision ?? 0,
    createdAtUtcIso:
      typeof doc.createdAtUtcIso === 'string'
        ? doc.createdAtUtcIso
        : doc.createdAtUtcIso.toISOString(),
    lastModifiedAtUtcIso:
      typeof doc.lastModifiedAtUtcIso === 'string'
        ? doc.lastModifiedAtUtcIso
        : doc.lastModifiedAtUtcIso.toISOString(),
    state: doc.state.global,
  }
}

/**
 * Fetch all environments from the remote
 */
export async function fetchEnvironments(): Promise<CloudEnvironment[]> {
  const documentType = VetraCloudEnvironment.documentModel.global.id
  const response = await client.FindDocuments({
    search: {
      parentId: DRIVE_ID,
      type: documentType,
    },
  })

  return response.findDocuments.items
    .filter((doc) => {
      const state = doc.state as FindDocumentsState
      return !state.document?.isDeleted
    })
    .map((doc) => transformDocument(doc as Parameters<typeof transformDocument>[0]))
}

/**
 * Fetch a single environment by ID
 */
export async function fetchEnvironment(docId: string): Promise<CloudEnvironment | null> {
  const response = await client.FindDocuments({
    search: {
      identifiers: [docId],
    },
  })

  const doc = response.findDocuments.items[0]
  if (!doc) return null

  const state = doc.state as FindDocumentsState
  if (state.document?.isDeleted) return null

  return transformDocument(doc as Parameters<typeof transformDocument>[0])
}

/**
 * Delete an environment document directly via GraphQL (no controller needed)
 */
export async function deleteDocument(docId: string): Promise<void> {
  await client.DeleteDocument({ identifier: docId })
}
