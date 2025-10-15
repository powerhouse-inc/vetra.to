import { gql, GraphQLClient } from 'graphql-request'

const SWITCHBOARD_URL =
  process.env.NEXT_PUBLIC_SWITCHBOARD_URL || 'https://switchboard.staging.vetra.io/graphql'

const client = new GraphQLClient(SWITCHBOARD_URL)

export interface VetraPackage {
  documentId: string
  name: string
  description?: string | null
  category?: string | null
  authorName?: string | null
  authorWebsite?: string | null
  githubUrl?: string | null
  npmUrl?: string | null
  driveId?: string | null
}

const GET_VETRA_PACKAGES = gql`
  query GetVetraPackages {
    vetraPackages {
      documentId
      name
      description
      category
      authorName
      authorWebsite
      githubUrl
      npmUrl
      driveId
    }
  }
`

export interface GetVetraPackagesParams {
  search?: string
  sortOrder?: string
  documentId_in?: string[]
}

export async function getVetraPackages(params?: GetVetraPackagesParams): Promise<VetraPackage[]> {
  try {
    // For now, fetch all packages without filtering
    // TODO: Add server-side filtering when needed
    const data = await client.request<{ vetraPackages: VetraPackage[] }>(GET_VETRA_PACKAGES)
    return data.vetraPackages
  } catch (error) {
    console.error('Failed to fetch vetra packages:', error)
    return []
  }
}
