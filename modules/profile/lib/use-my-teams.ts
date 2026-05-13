import { useQuery } from '@tanstack/react-query'
import { fetchBuilderTeamsByMember } from './fetcher'
import type { ProfileTeam } from './queries'

export function useMyTeams(address: string | undefined) {
  return useQuery<ProfileTeam[]>({
    queryKey: ['my-teams', address?.toLowerCase()],
    queryFn: () => fetchBuilderTeamsByMember(address!.toLowerCase()),
    enabled: Boolean(address),
    staleTime: 30_000,
  })
}
