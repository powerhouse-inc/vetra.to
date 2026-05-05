'use client'

import { useSearch } from './builders-page-client'
import { BuilderTeamCard } from './list-card'

export function BuilderList() {
  const { builders, isLoading, error } = useSearch()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-foreground-70">Loading Builder Teams...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-destructive">Error: {error}</div>
      </div>
    )
  }

  if (builders.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-foreground-70">No builder team found :(</div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {builders.map((team) => (
        <BuilderTeamCard
          key={team.id}
          teamName={team.profileName || team.profileSlug || 'Unnamed Team'}
          description={
            team.profileDescription ??
            'Officially affiliated team of Powerhouse.inc. Seasoned builder on the powerhouse techstack. Strong ability to explore a problem space in any domain and develop solutions.'
          }
          profileLogo={team.profileLogo}
          xUrl={team.profileSocialsX ?? ''}
          githubUrl={team.profileSocialsGithub ?? ''}
          websiteUrl={team.profileSocialsWebsite ?? ''}
          actions={[{ link: `/builders/${team.profileSlug}`, title: 'View Profile' }]}
        />
      ))}
    </div>
  )
}
