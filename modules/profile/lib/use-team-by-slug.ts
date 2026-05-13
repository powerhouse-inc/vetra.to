import { useQuery } from '@tanstack/react-query'
import { fetchFullBuilderTeamBySlug, type FullTeam } from './create-team-queries'

export function useTeamBySlug(slug: string | undefined) {
  return useQuery<FullTeam | null>({
    queryKey: ['team-by-slug', slug],
    queryFn: () => fetchFullBuilderTeamBySlug(slug!),
    enabled: Boolean(slug),
    staleTime: 10_000,
  })
}
