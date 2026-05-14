'use client'
import { useQuery } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'

export type BuilderAccount = {
  id: string
  sourceDriveId: string
  profileName: string | null
  profileSlug: string | null
  profileLogo: string | null
  profileDescription: string | null
  profileSocialsX: string | null
  profileSocialsGithub: string | null
  profileSocialsWebsite: string | null
  createdAt: string
  updatedAt: string
}

const FETCH_BUILDER_ACCOUNT = gql`
  query fetchBuilderAccount($ethAddress: String!) {
    fetchBuilderAccount(ethAddress: $ethAddress) {
      id
      sourceDriveId
      profileName
      profileSlug
      profileLogo
      profileDescription
      profileSocialsX
      profileSocialsGithub
      profileSocialsWebsite
      createdAt
      updatedAt
    }
  }
`

type Response = {
  fetchBuilderAccount: BuilderAccount | null
}

function getEndpoint(): string {
  if (typeof window !== 'undefined') {
    const env = (window as unknown as { __ENV?: Record<string, string> }).__ENV
    if (env?.NEXT_PUBLIC_SWITCHBOARD_URL) return env.NEXT_PUBLIC_SWITCHBOARD_URL
  }
  return process.env.NEXT_PUBLIC_SWITCHBOARD_URL || 'https://switchboard.staging.vetra.io/graphql'
}

export async function fetchBuilderAccount(ethAddress: string): Promise<BuilderAccount | null> {
  const data = await request<Response>(getEndpoint(), FETCH_BUILDER_ACCOUNT, {
    ethAddress: ethAddress.toLowerCase(),
  })
  return data.fetchBuilderAccount
}

export function useBuilderAccount(ethAddress: string | null | undefined) {
  return useQuery<BuilderAccount | null>({
    queryKey: ['builder-account', ethAddress?.toLowerCase() ?? null],
    queryFn: () => fetchBuilderAccount(ethAddress!.toLowerCase()),
    enabled: Boolean(ethAddress),
    staleTime: 10_000,
  })
}
