import { type NextRequest, NextResponse } from 'next/server'
import { gql } from 'graphql-request'
import { request } from 'graphql-request'

// GraphQL endpoint - use environment variable or default to localhost
const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT || 'http://localhost:4001/graphql'

// Global driveId constant
const DRIVE_ID = 'powerhouse'

// GraphQL mutation for Project_createDocument
const CREATE_PROJECT_DOCUMENT_MUTATION = gql`
  mutation Project_createDocument($name: String!, $driveId: String!) {
    Project_createDocument(name: $name, driveId: $driveId)
  }
`

// GraphQL mutation for Project_setProjectName
const SET_PROJECT_NAME_MUTATION = gql`
  mutation Project_setProjectName(
    $docId: PHID!
    $driveId: String!
    $input: Project_SetProjectNameInput!
  ) {
    Project_setProjectName(docId: $docId, driveId: $driveId, input: $input)
  }
`

// GraphQL mutation for Project_setProjectDescription
const SET_PROJECT_DESCRIPTION_MUTATION = gql`
  mutation Project_setProjectDescription(
    $docId: PHID!
    $driveId: String!
    $input: Project_SetProjectDescriptionInput!
  ) {
    Project_setProjectDescription(docId: $docId, driveId: $driveId, input: $input)
  }
`

// GraphQL mutation for deleteDocument
const DELETE_PROJECT_DOCUMENT_MUTATION = gql`
  mutation deleteDocument($identifier: String!) {
    deleteDocument(identifier: $identifier)
  }
`

// GraphQL mutation for Environment_createDocument
const CREATE_ENVIRONMENT_DOCUMENT_MUTATION = gql`
  mutation Environment_createDocument($name: String!) {
    Environment_createDocument(name: $name)
  }
`

// GraphQL mutation for Project_addEnvironment
const ADD_ENVIRONMENT_MUTATION = gql`
  mutation Project_addEnvironment($docId: PHID!, $driveId: String!, $input: Project_AddEnvironmentInput!) {
    Project_addEnvironment(docId: $docId, driveId: $driveId, input: $input)
  }
`

// GraphQL query for HostingDb
const HOSTING_DB_QUERIES = gql`
  query HostingDbQueries {
    HostingDb {
      projects(driveId: "powerhouse") {
        id
        documentId
        driveId
        name
        description
        createdAt
        updatedAt
      }
    }
  }
`

// GraphQL query for ProjectEnvironments
const PROJECT_ENVIRONMENTS_QUERY = gql`
  query ProjectEnvironments($driveId: String!, $projectDocumentId: String!) {
    HostingDb {
      projectEnvironments(driveId: $driveId, projectDocumentId: $projectDocumentId) {
        id
        name
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
    // Extract more detailed error information
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

// POST endpoint for various project mutations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { operation, ...params } = body

    let response: unknown
    let resultData: unknown

        switch (operation) {
            case 'createDocument': {
                const { name } = params
                if (!name) {
                    return NextResponse.json(
                        { error: 'name is required for createDocument' },
                        { status: 400 },
                    )
                }

                const mutationResponse = await serverGraphqlRequest<{
                    Project_createDocument: string
                }>(CREATE_PROJECT_DOCUMENT_MUTATION, {
                    name,
                    driveId: DRIVE_ID,
                })

                // The mutation returns just the ID as a string
                resultData = {
                    id: mutationResponse.Project_createDocument,
                    name,
                    driveId: DRIVE_ID,
                }
                break
            }

            case 'setProjectName': {
                const { docId, name } = params
                if (!docId || !name) {
                    return NextResponse.json(
                        { error: 'docId and name are required for setProjectName' },
                        { status: 400 },
                    )
                }

                const mutationResponse = await serverGraphqlRequest<{
                    Project_setProjectName: number
                }>(SET_PROJECT_NAME_MUTATION, {
                    docId,
                    driveId: DRIVE_ID,
                    input: { name },
                })

                // The mutation returns an Int (likely a version number or status code)
                // Construct the response with the provided docId and name
                resultData = {
                    id: docId,
                    name,
                }
                break
            }

            case 'setProjectDescription': {
                const { docId, description } = params
                if (!docId || !description) {
                    return NextResponse.json(
                        { error: 'docId and description are required for setProjectDescription' },
                        { status: 400 },
                    )
                }

                const mutationResponse = await serverGraphqlRequest<{
                    Project_setProjectDescription: number
                }>(SET_PROJECT_DESCRIPTION_MUTATION, {
                    docId,
                    driveId: DRIVE_ID,
                    input: { description },
                })

                // The mutation returns an Int (likely a version number or status code)
                // Construct the response with the provided docId and description
                resultData = {
                    id: docId,
                    description,
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

                const mutationResponse = await serverGraphqlRequest<{
                    deleteDocument: number | boolean
                }>(DELETE_PROJECT_DOCUMENT_MUTATION, {
                    identifier: docId,
                })

                // The mutation returns an Int or Boolean (likely a status code)
                resultData = {
                    id: docId,
                    success: true,
                }
                break
            }

            case 'createEnvironmentDocument': {
                const { name } = params
                if (!name) {
                    return NextResponse.json(
                        { error: 'name is required for createEnvironmentDocument' },
                        { status: 400 },
                    )
                }

                const mutationResponse = await serverGraphqlRequest<{
                    Environment_createDocument: string
                }>(CREATE_ENVIRONMENT_DOCUMENT_MUTATION, {
                    name,
                })

                // The mutation returns the PHID as a string
                resultData = {
                    id: mutationResponse.Environment_createDocument,
                    name,
                }
                break
            }

            case 'addEnvironment': {
                const { projectId, environmentPHID, name } = params
                if (!projectId || !environmentPHID || !name) {
                    return NextResponse.json(
                        { error: 'projectId, environmentPHID, and name are required for addEnvironment' },
                        { status: 400 },
                    )
                }

                // The id field might be the same as environmentPHID or might need to be extracted
                // Using environmentPHID for both - may need adjustment based on actual API
                const mutationResponse = await serverGraphqlRequest<{
                    Project_addEnvironment: number
                }>(ADD_ENVIRONMENT_MUTATION, {
                    docId: projectId,
                    driveId: DRIVE_ID,
                    input: {
                        environmentPHID,
                        id: environmentPHID, // Using PHID as ID - may need adjustment
                        name,
                    },
                })

                // The mutation returns an Int (likely a version number or status code)
                resultData = {
                    id: projectId,
                    environmentId: environmentPHID,
                    name,
                }
                break
            }

            default:
                return NextResponse.json(
                    { error: `Unknown operation: ${operation}. Supported operations: createDocument, setProjectName, setProjectDescription, deleteDocument, createEnvironmentDocument, addEnvironment` },
                    { status: 400 },
                )
        }

        const mutationResponse = await serverGraphqlRequest<{
          Project_createDocument: string
        }>(CREATE_PROJECT_DOCUMENT_MUTATION, {
          name,
          driveId: DRIVE_ID,
        })

        // The mutation returns just the ID as a string
        resultData = {
          id: mutationResponse.Project_createDocument,
          name,
          driveId: DRIVE_ID,
        }
        break
      }

      case 'setProjectName': {
        const { docId, name } = params
        if (!docId || !name) {
          return NextResponse.json(
            { error: 'docId and name are required for setProjectName' },
            { status: 400 },
          )
        }

        const mutationResponse = await serverGraphqlRequest<{
          Project_setProjectName: number
        }>(SET_PROJECT_NAME_MUTATION, {
          docId,
          driveId: DRIVE_ID,
          input: { name },
        })

        // The mutation returns an Int (likely a version number or status code)
        // Construct the response with the provided docId and name
        resultData = {
          id: docId,
          name,
        }
        break
      }

      case 'setProjectDescription': {
        const { docId, description } = params
        if (!docId || !description) {
          return NextResponse.json(
            { error: 'docId and description are required for setProjectDescription' },
            { status: 400 },
          )
        }

        const mutationResponse = await serverGraphqlRequest<{
          Project_setProjectDescription: number
        }>(SET_PROJECT_DESCRIPTION_MUTATION, {
          docId,
          driveId: DRIVE_ID,
          input: { description },
        })

        // The mutation returns an Int (likely a version number or status code)
        // Construct the response with the provided docId and description
        resultData = {
          id: docId,
          description,
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

        const mutationResponse = await serverGraphqlRequest<{
          deleteDocument: number | boolean
        }>(DELETE_PROJECT_DOCUMENT_MUTATION, {
          identifier: docId,
        })

        // The mutation returns an Int or Boolean (likely a status code)
        resultData = {
          id: docId,
          success: true,
        }
        break
      }

      default:
        return NextResponse.json(
          {
            error: `Unknown operation: ${operation}. Supported operations: createDocument, setProjectName, setProjectDescription, deleteDocument`,
          },
          { status: 400 },
        )
    }

    const result = NextResponse.json({
      success: true,
      data: resultData,
    })

    // Add cache control headers to prevent caching
    result.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    result.headers.set('Pragma', 'no-cache')
    result.headers.set('Expires', '0')

    return result
  } catch (error) {
    console.error('Project mutation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to execute mutation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

// GET endpoint for HostingDbQueries query
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const projectDocumentId = searchParams.get('projectDocumentId')

        // If projectDocumentId is provided, fetch environments for that project
        if (projectDocumentId) {
            const response = await serverGraphqlRequest<{
                HostingDb: {
                    projectEnvironments?: Array<{
                        id: string
                        name: string
                    }>
                }
            }>(PROJECT_ENVIRONMENTS_QUERY, {
                driveId: DRIVE_ID,
                projectDocumentId,
            })

            const result = NextResponse.json({
                success: true,
                data: response.HostingDb.projectEnvironments || [],
            })

            result.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
            result.headers.set('Pragma', 'no-cache')
            result.headers.set('Expires', '0')

            return result
        }

        // Otherwise, fetch all projects
        const response = await serverGraphqlRequest<{
            HostingDb: unknown
        }>(HOSTING_DB_QUERIES)

    const result = NextResponse.json({
      success: true,
      data: response.HostingDb,
    })

    // Add cache control headers to prevent caching
    result.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    result.headers.set('Pragma', 'no-cache')
    result.headers.set('Expires', '0')

    return result
  } catch (error) {
    console.error('HostingDbQueries query error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch hosting data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
