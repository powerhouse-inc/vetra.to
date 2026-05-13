import { gql, request } from 'graphql-request'

export const FETCH_BUILDER_TEAM_BY_SLUG = gql`
  query fetchBuilderTeamBySlug($slug: String!) {
    fetchBuilderTeam(slug: $slug) {
      id
      profileSlug
    }
  }
`

type Response = {
  fetchBuilderTeam: { id: string; profileSlug: string } | null
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
