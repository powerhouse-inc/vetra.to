import { request } from 'graphql-request'
import {
  FETCH_BUILDER_TEAMS_BY_MEMBER,
  type FetchBuilderTeamsByMemberResponse,
  type ProfileTeam,
} from './queries'

function getEndpoint(): string {
  if (typeof window !== 'undefined') {
    const windowEnv = (window as unknown as { __ENV?: Record<string, string> }).__ENV
    if (windowEnv?.NEXT_PUBLIC_SWITCHBOARD_URL) return windowEnv.NEXT_PUBLIC_SWITCHBOARD_URL
  }
  return process.env.NEXT_PUBLIC_SWITCHBOARD_URL || 'https://switchboard.staging.vetra.io/graphql'
}

export async function fetchBuilderTeamsByMember(ethAddress: string): Promise<ProfileTeam[]> {
  const data = await request<FetchBuilderTeamsByMemberResponse>(
    getEndpoint(),
    FETCH_BUILDER_TEAMS_BY_MEMBER,
    { ethAddress },
  )
  return data.fetchBuilderTeamsByMember
}
