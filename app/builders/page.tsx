import { BuilderTeamCard } from '@/modules/builders/components/list-card'
import { fetchAllBuilderAccounts } from '@/modules/builders/lib/server-data'

export default async function BuildersPage() {
  const builderTeams = await fetchAllBuilderAccounts()

  return (
    <main className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold md:text-4xl">Builder Teams</h1>
        <p className="mt-2">
          Meet our officially affiliated teams building on the Powerhouse techstack
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
        {builderTeams.map((team) => (
          <BuilderTeamCard
            key={team.id}
            teamName={team.profileName || team.profileSlug || 'Unnamed Team'}
            description={team.profileDescription ?? ''}
            xUrl={team.profileSocialsX ?? ''}
            githubUrl={team.profileSocialsGithub ?? ''}
            websiteUrl={team.profileSocialsWebsite ?? ''}
            actions={[{ link: `/builders/${team.id}`, title: 'View Profile' }]}
          />
        ))}
      </div>
    </main>
  )
}
