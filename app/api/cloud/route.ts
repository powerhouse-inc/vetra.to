import { gql, request } from 'graphql-request'
import { type NextRequest, NextResponse } from 'next/server'

// GraphQL endpoint - use environment variable or default to localhost
const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT || 'http://localhost:4001/graphql'

// Global drive identifier
const DRIVE_ID = 'powerhouse'

// Shared fragment for document fields
const ENVIRONMENT_FIELDS = `
  id
  name
  documentType
  revisionsList {
    revision
  }
  createdAtUtcIso
  lastModifiedAtUtcIso
  state {
    document {
      isDeleted
    }
    global {
      name
      services
      packages {
        name
        version
      }
      status
    }
  }
`

// GraphQL mutation for VetraCloudEnvironment_createDocument
const CREATE_ENVIRONMENT_MUTATION = gql`
  mutation VetraCloudEnvironment_createDocument($name: String!, $parentIdentifier: String) {
    VetraCloudEnvironment_createDocument(name: $name, parentIdentifier: $parentIdentifier) {
      id
    }
  }
`

// GraphQL mutation for VetraCloudEnvironment_setEnvironmentName
const SET_ENVIRONMENT_NAME_MUTATION = gql`
  mutation VetraCloudEnvironment_setEnvironmentName(
    $docId: PHID!
    $input: VetraCloudEnvironment_SetEnvironmentNameInput!
  ) {
    VetraCloudEnvironment_setEnvironmentName(docId: $docId, input: $input) {
      id
    }
  }
`

// GraphQL mutation for deleteDocument
const DELETE_DOCUMENT_MUTATION = gql`
  mutation deleteDocument($identifier: String!) {
    deleteDocument(identifier: $identifier)
  }
`

// GraphQL mutation for VetraCloudEnvironment_addPackage
const ADD_PACKAGE_MUTATION = gql`
  mutation VetraCloudEnvironment_addPackage(
    $docId: PHID!
    $input: VetraCloudEnvironment_AddPackageInput!
  ) {
    VetraCloudEnvironment_addPackage(docId: $docId, input: $input) {
      id
    }
  }
`

// GraphQL query for finding all VetraCloudEnvironment documents
const GET_ENVIRONMENTS_QUERY = gql`
  query GetEnvironments($parentId: String) {
    VetraCloudEnvironment_findDocuments(search: { parentId: $parentId }) {
      items {
        ${ENVIRONMENT_FIELDS}
      }
    }
  }
`

// GraphQL query for a single VetraCloudEnvironment document
const GET_ENVIRONMENT_QUERY = gql`
  query GetEnvironment($identifier: String!) {
    VetraCloudEnvironment_document(identifier: $identifier) {
      document {
        ${ENVIRONMENT_FIELDS}
      }
    }
  }
`

// Server-side GraphQL request function
async function serverGraphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  try {
    return await request<T>(GRAPHQL_ENDPOINT, query, variables)
  } catch (error) {
    console.error('Server-side GraphQL request failed:', error)
    if (error && typeof error === 'object' && 'response' in error) {
      const graphqlError = error as { response?: { errors?: Array<{ message: string }> } }
      if (graphqlError.response?.errors) {
        const errorMessages = graphqlError.response.errors.map((e) => e.message).join(', ')
        throw new Error(`GraphQL error: ${errorMessages}`)
      }
    }
    throw error instanceof Error ? error : new Error('Unknown GraphQL error')
  }
}

// Transform v6 document shape to the flat shape the frontend expects
function transformDocument(doc: V6Document) {
  return {
    id: doc.id,
    name: doc.name,
    documentType: doc.documentType,
    revision: doc.revisionsList?.at(-1)?.revision ?? 0,
    createdAtUtcIso: doc.createdAtUtcIso,
    lastModifiedAtUtcIso: doc.lastModifiedAtUtcIso,
    state: doc.state.global,
  }
}

type V6Document = {
  id: string
  name: string
  documentType: string
  revisionsList: Array<{ revision: number }>
  createdAtUtcIso: string
  lastModifiedAtUtcIso: string
  state: {
    document: {
      isDeleted: boolean | null
    }
    global: {
      name: string | null
      services: string[]
      packages: Array<{ name: string; version: string | null }> | null
      status: string
    }
  }
}

// Disable caching for this API route
export const dynamic = 'force-dynamic'
export const revalidate = 0

// POST endpoint for various mutations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { operation, ...params } = body

    let resultData: unknown

    switch (operation) {
      case 'createEnvironment': {
        const { name } = params
        if (!name) {
          return NextResponse.json(
            { error: 'name is required for createEnvironment' },
            { status: 400 },
          )
        }

        const mutationResponse = await serverGraphqlRequest<{
          VetraCloudEnvironment_createDocument: { id: string }
        }>(CREATE_ENVIRONMENT_MUTATION, {
          name,
          parentIdentifier: DRIVE_ID,
        })

        resultData = {
          id: mutationResponse.VetraCloudEnvironment_createDocument.id,
          name,
        }
        break
      }

      case 'setEnvironmentName': {
        const { docId, name } = params
        if (!docId || !name) {
          return NextResponse.json(
            { error: 'docId and name are required for setEnvironmentName' },
            { status: 400 },
          )
        }

        await serverGraphqlRequest<{
          VetraCloudEnvironment_setEnvironmentName: { id: string }
        }>(SET_ENVIRONMENT_NAME_MUTATION, {
          docId,
          input: { name },
        })

        resultData = {
          id: docId,
          name,
        }
        break
      }

      case 'deleteDocument': {
        const { docId } = params
        if (!docId) {
          return NextResponse.json(
            { error: 'docId is required for deleteDocument' },
            { status: 400 },
          )
        }

        await serverGraphqlRequest<{
          deleteDocument: boolean
        }>(DELETE_DOCUMENT_MUTATION, {
          identifier: docId,
        })

        resultData = {
          id: docId,
          success: true,
        }
        break
      }

      case 'addPackage': {
        const { docId, packageName, version } = params
        if (!docId || !packageName) {
          return NextResponse.json(
            { error: 'docId and packageName are required for addPackage' },
            { status: 400 },
          )
        }

        await serverGraphqlRequest<{
          VetraCloudEnvironment_addPackage: { id: string }
        }>(ADD_PACKAGE_MUTATION, {
          docId,
          input: { packageName, version: version || undefined },
        })

        resultData = {
          id: docId,
          packageName,
          version,
        }
        break
      }

      default:
        return NextResponse.json(
          {
            error: `Unknown operation: ${operation}. Supported operations: createEnvironment, setEnvironmentName, deleteDocument, addPackage`,
          },
          { status: 400 },
        )
    }

    const result = NextResponse.json({
      success: true,
      data: resultData,
    })

    result.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    result.headers.set('Pragma', 'no-cache')
    result.headers.set('Expires', '0')

    return result
  } catch (error) {
    console.error('Mutation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to execute mutation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

// GET endpoint for querying environments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const docId = searchParams.get('docId')

    // If docId is provided, fetch a single environment
    if (docId) {
      const response = await serverGraphqlRequest<{
        VetraCloudEnvironment_document: {
          document: V6Document
        } | null
      }>(GET_ENVIRONMENT_QUERY, {
        identifier: docId,
      })

      const doc = response.VetraCloudEnvironment_document?.document
      const isDeleted = doc?.state.document.isDeleted
      const result = NextResponse.json({
        success: true,
        data: doc && !isDeleted ? transformDocument(doc) : null,
      })

      result.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      result.headers.set('Pragma', 'no-cache')
      result.headers.set('Expires', '0')

      return result
    }

    // Otherwise, fetch all environments
    const response = await serverGraphqlRequest<{
      VetraCloudEnvironment_findDocuments: {
        items: V6Document[]
      }
    }>(GET_ENVIRONMENTS_QUERY, {
      parentId: DRIVE_ID,
    })

    const items = response.VetraCloudEnvironment_findDocuments.items
      .filter((doc) => !doc.state.document.isDeleted)
      .map(transformDocument)

    const result = NextResponse.json({
      success: true,
      data: items,
    })

    result.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    result.headers.set('Pragma', 'no-cache')
    result.headers.set('Expires', '0')

    return result
  } catch (error) {
    console.error('Query error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch environment data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
