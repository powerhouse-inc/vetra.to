import { gql } from 'graphql-request'
import { request } from 'graphql-request'

// GraphQL endpoint - use server-side environment variable
const GRAPHQL_ENDPOINT =
  process.env.GRAPHQL_ENDPOINT || 'https://switchboard.staging.vetra.io/graphql'

// Types for the GraphQL responses
export interface BuilderPackageKeyword {
  id: string
  packageId: string
  label: string
  createdAt: string
}

export interface BuilderPackage {
  id: string
  spaceId: string
  name: string
  description?: string
  category?: string
  authorName: string
  authorWebsite?: string
  githubUrl?: string
  npmUrl?: string
  vetraDriveUrl?: string
  driveId?: string
  sortOrder: number
  createdAt: string
  updatedAt: string
  keywords: BuilderPackageKeyword[]
}

export interface BuilderSpace {
  id: string
  builderTeamId: string
  title: string
  description?: string
  sortOrder: number
  createdAt: string
  updatedAt: string
  packages: BuilderPackage[]
}

export interface BuilderTeamMember {
  id: string
  builderTeamId: string
  ethAddress: string
  createdAt: string
}

export interface BuilderTeam {
  id: string
  profileName: string
  profileSlug: string
  profileLogo?: string
  profileDescription?: string
  profileSocialsX?: string
  profileSocialsGithub?: string
  profileSocialsWebsite?: string
  createdAt: string
  updatedAt: string
  spaces: BuilderSpace[]
  members: BuilderTeamMember[]
}

// Alias for backward compatibility
export type BuilderAccount = BuilderTeam

export interface FetchBuilderTeamResponse {
  fetchBuilderTeam: BuilderTeam
}

export interface FetchAllBuilderTeamsResponse {
  fetchAllBuilderTeams: BuilderTeam[]
}

// GraphQL queries
const FETCH_BUILDER_Team = gql`
  query fetchBuilderTeam($fetchBuilderTeamId: String!) {
    fetchBuilderTeam(id: $fetchBuilderTeamId) {
      id
      profileName
      profileSlug
      profileLogo
      profileDescription
      profileSocialsX
      profileSocialsGithub
      profileSocialsWebsite
      createdAt
      updatedAt
      spaces {
        id
        builderAccountId
        title
        description
        createdAt
        updatedAt
        packages {
          id
          spaceId
          name
          description
          github
          npm
          vetraDriveUrl
          driveId
          sortOrder
          createdAt
          updatedAt
        }
      }
      members {
        id
        builderAccountId
        ethAddress
        createdAt
      }
    }
  }
`

const FETCH_ALL_BUILDER_TeamS = gql`
  query fetchAllBuilderTeams($search: String, $sortOrder: String) {
    fetchAllBuilderTeams(search: $search, sortOrder: $sortOrder) {
      id
      profileName
      profileSlug
      profileLogo
      profileDescription
      profileSocialsX
      profileSocialsGithub
      profileSocialsWebsite
      createdAt
      updatedAt
      spaces {
        id
        builderAccountId
        title
        description
        createdAt
        updatedAt
        packages {
          id
          spaceId
          name
          description
          github
          npm
          vetraDriveUrl
          driveId
          sortOrder
          createdAt
          updatedAt
        }
      }
      members {
        id
        builderAccountId
        ethAddress
        createdAt
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
    throw error
  }
}

// Server-side data fetching functions
export async function fetchBuilderTeam(TeamId: string): Promise<BuilderTeam | null> {
  try {
    const response = await serverGraphqlRequest<FetchBuilderTeamResponse>(FETCH_BUILDER_Team, {
      fetchBuilderTeamId: TeamId,
    })
    console.log('response', response)
    return response.fetchBuilderTeam
  } catch (error) {
    console.error('Failed to fetch builder Team:', error)
    return null
  }
}

export async function fetchAllBuilderTeams(
  search?: string,
  sortOrder?: string,
): Promise<BuilderTeam[]> {
  try {
    const response = await serverGraphqlRequest<FetchAllBuilderTeamsResponse>(
      FETCH_ALL_BUILDER_TeamS,
      { search, sortOrder },
    )
    return response.fetchAllBuilderTeams
  } catch (error) {
    console.error('Failed to fetch all builder Teams:', error)
    return []
  }
}
