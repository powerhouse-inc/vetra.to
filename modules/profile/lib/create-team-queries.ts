import { gql, request } from 'graphql-request'

export const FETCH_BUILDER_TEAM_BY_SLUG = gql`
  query fetchBuilderTeamBySlug($slug: String!) {
    fetchBuilderTeam(slug: $slug) {
      id
      profileSlug
    }
  }
`

export const FETCH_FULL_BUILDER_TEAM_BY_SLUG = gql`
  query fetchFullBuilderTeamBySlug($slug: String!) {
    fetchBuilderTeam(slug: $slug) {
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
      members {
        id
        ethAddress
        name
        profileImage
      }
      spaces {
        id
        title
        description
        packages {
          id
          spaceId
          name
          description
          githubUrl: github
          npmUrl: npm
        }
      }
    }
  }
`

type Response = {
  fetchBuilderTeam: { id: string; profileSlug: string } | null
}

export type FullTeamMember = {
  id: string
  ethAddress: string
  name: string | null
  profileImage: string | null
}

export type FullTeamPackage = {
  id: string
  spaceId: string
  name: string
  description: string | null
  githubUrl: string | null
  npmUrl: string | null
}

export type FullTeamSpace = {
  id: string
  title: string
  description: string | null
  packages: FullTeamPackage[]
}

export type FullTeam = {
  id: string
  profileName: string
  profileSlug: string
  profileLogo: string | null
  profileDescription: string | null
  profileSocialsX: string | null
  profileSocialsGithub: string | null
  profileSocialsWebsite: string | null
  createdAt: string
  updatedAt: string
  members: FullTeamMember[]
  spaces: FullTeamSpace[]
}

type FullResponse = {
  fetchBuilderTeam: FullTeam | null
}

function getEndpoint(): string {
  if (typeof window !== 'undefined') {
    const env = (window as unknown as { __ENV?: Record<string, string> }).__ENV
    if (env?.NEXT_PUBLIC_SWITCHBOARD_URL) return env.NEXT_PUBLIC_SWITCHBOARD_URL
  }
  return process.env.NEXT_PUBLIC_SWITCHBOARD_URL || 'https://switchboard.staging.vetra.io/graphql'
}

export async function fetchBuilderTeamBySlug(slug: string): Promise<{ id: string } | null> {
  const data = await request<Response>(getEndpoint(), FETCH_BUILDER_TEAM_BY_SLUG, { slug })
  return data.fetchBuilderTeam ? { id: data.fetchBuilderTeam.id } : null
}

export async function fetchFullBuilderTeamBySlug(slug: string): Promise<FullTeam | null> {
  const data = await request<FullResponse>(getEndpoint(), FETCH_FULL_BUILDER_TEAM_BY_SLUG, {
    slug,
  })
  return data.fetchBuilderTeam
}
