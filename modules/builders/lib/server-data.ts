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
  builderAccountId: string
  title: string
  description?: string
  sortOrder: number
  createdAt: string
  updatedAt: string
  packages: BuilderPackage[]
}

export interface BuilderAccountMember {
  id: string
  builderAccountId: string
  ethAddress: string
  createdAt: string
}

export interface BuilderAccount {
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
  members: BuilderAccountMember[]
}

export interface FetchBuilderAccountResponse {
  fetchBuilderAccount: BuilderAccount
}

export interface FetchAllBuilderAccountsResponse {
  fetchAllBuilderAccounts: BuilderAccount[]
}

// GraphQL queries
const FETCH_BUILDER_ACCOUNT = gql`
  query fetchBuilderAccount($fetchBuilderAccountId: String!) {
    fetchBuilderAccount(id: $fetchBuilderAccountId) {
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
        sortOrder
        createdAt
        updatedAt
        packages {
          id
          spaceId
          name
          description
          category
          authorName
          authorWebsite
          githubUrl
          npmUrl
          vetraDriveUrl
          driveId
          sortOrder
          createdAt
          updatedAt
          keywords {
            id
            packageId
            label
            createdAt
          }
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

const FETCH_ALL_BUILDER_ACCOUNTS = gql`
  query fetchAllBuilderAccounts($search: String) {
    fetchAllBuilderAccounts(search: $search) {
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
        sortOrder
        createdAt
        updatedAt
        packages {
          id
          spaceId
          name
          description
          category
          authorName
          authorWebsite
          githubUrl
          npmUrl
          vetraDriveUrl
          driveId
          sortOrder
          createdAt
          updatedAt
          keywords {
            id
            packageId
            label
            createdAt
          }
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
export async function fetchBuilderAccount(accountId: string): Promise<BuilderAccount | null> {
  try {
    const response = await serverGraphqlRequest<FetchBuilderAccountResponse>(
      FETCH_BUILDER_ACCOUNT,
      { fetchBuilderAccountId: accountId },
    )
    return response.fetchBuilderAccount
  } catch (error) {
    console.error('Failed to fetch builder account:', error)
    return null
  }
}

export async function fetchAllBuilderAccounts(search?: string): Promise<BuilderAccount[]> {
  try {
    const response = await serverGraphqlRequest<FetchAllBuilderAccountsResponse>(
      FETCH_ALL_BUILDER_ACCOUNTS,
      { search },
    )

    console.log(FETCH_ALL_BUILDER_ACCOUNTS, { search })

    console.log('response', response)
    return response.fetchAllBuilderAccounts
  } catch (error) {
    console.error('Failed to fetch all builder accounts:', error)
    return []
  }
}
