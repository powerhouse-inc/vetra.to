import { type NextRequest, NextResponse } from 'next/server'
import { gql } from 'graphql-request'
import { request } from 'graphql-request'

// GraphQL endpoint - use environment variable or default to localhost
const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT || 'http://localhost:4001/graphql'

// Global driveId constant
const DRIVE_ID = 'powerhouse'

// GraphQL mutation for VetraCloudEnvironment_createDocument
const CREATE_ENVIRONMENT_MUTATION = gql`
  mutation VetraCloudEnvironment_createDocument($name: String!, $driveId: String) {
    VetraCloudEnvironment_createDocument(name: $name, driveId: $driveId)
  }
`

// GraphQL mutation for VetraCloudEnvironment_setEnvironmentName
const SET_ENVIRONMENT_NAME_MUTATION = gql`
  mutation VetraCloudEnvironment_setEnvironmentName(
    $driveId: String
    $docId: PHID!
    $input: VetraCloudEnvironment_SetEnvironmentNameInput!
  ) {
    VetraCloudEnvironment_setEnvironmentName(driveId: $driveId, docId: $docId, input: $input)
  }
`

// GraphQL mutation for deleteDocument
const DELETE_DOCUMENT_MUTATION = gql`
  mutation deleteDocument($id: PHID!) {
    deleteDocument(id: $id)
  }
`

// GraphQL mutation for VetraCloudEnvironment_addPackage
const ADD_PACKAGE_MUTATION = gql`
  mutation VetraCloudEnvironment_addPackage(
    $driveId: String
    $docId: PHID!
    $input: VetraCloudEnvironment_AddPackageInput!
  ) {
    VetraCloudEnvironment_addPackage(driveId: $driveId, docId: $docId, input: $input)
  }
`

// GraphQL query for VetraCloudEnvironment getDocuments
const GET_ENVIRONMENTS_QUERY = gql`
  query GetEnvironments($driveId: String!) {
    VetraCloudEnvironment {
      getDocuments(driveId: $driveId) {
        id
        name
        documentType
        revision
        createdAtUtcIso
        lastModifiedAtUtcIso
        state {
          name
          services
          packages {
            name
            version
          }
          status
        }
      }
    }
  }
`

// GraphQL query for VetraCloudEnvironment getDocument
const GET_ENVIRONMENT_QUERY = gql`
  query GetEnvironment($docId: PHID!, $driveId: PHID) {
    VetraCloudEnvironment {
      getDocument(docId: $docId, driveId: $driveId) {
        id
        name
        documentType
        revision
        createdAtUtcIso
        lastModifiedAtUtcIso
        state {
          name
          services
          packages {
            name
            version
          }
          status
        }
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
          VetraCloudEnvironment_createDocument: string
        }>(CREATE_ENVIRONMENT_MUTATION, {
          name,
          driveId: DRIVE_ID,
        })

        resultData = {
          id: mutationResponse.VetraCloudEnvironment_createDocument,
          name,
          driveId: DRIVE_ID,
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
          VetraCloudEnvironment_setEnvironmentName: number
        }>(SET_ENVIRONMENT_NAME_MUTATION, {
          docId,
          driveId: DRIVE_ID,
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
          id: docId,
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
          VetraCloudEnvironment_addPackage: number
        }>(ADD_PACKAGE_MUTATION, {
          docId,
          driveId: DRIVE_ID,
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
        VetraCloudEnvironment: {
          getDocument: {
            id: string
            name: string
            documentType: string
            revision: number
            createdAtUtcIso: string
            lastModifiedAtUtcIso: string
            state: {
              name: string | null
              services: string[]
              packages: Array<{ name: string; version: string | null }> | null
              status: string
            }
          } | null
        }
      }>(GET_ENVIRONMENT_QUERY, {
        docId,
        driveId: DRIVE_ID,
      })

      const result = NextResponse.json({
        success: true,
        data: response.VetraCloudEnvironment.getDocument,
      })

      result.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      result.headers.set('Pragma', 'no-cache')
      result.headers.set('Expires', '0')

      return result
    }

    // Otherwise, fetch all environments
    const response = await serverGraphqlRequest<{
      VetraCloudEnvironment: {
        getDocuments: Array<{
          id: string
          name: string
          documentType: string
          revision: number
          createdAtUtcIso: string
          lastModifiedAtUtcIso: string
          state: {
            name: string | null
            services: string[]
            packages: Array<{ name: string; version: string | null }> | null
            status: string
          }
        }>
      }
    }>(GET_ENVIRONMENTS_QUERY, {
      driveId: DRIVE_ID,
    })

    const result = NextResponse.json({
      success: true,
      data: response.VetraCloudEnvironment.getDocuments,
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
