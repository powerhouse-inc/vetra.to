import { notFound } from 'next/navigation'
import { BuilderSpaces } from '@/modules/builders/components/builder-spaces'
import { fetchBuilderAccount } from '@/modules/builders/lib/server-data'

interface TeamPageProps {
  params: {
    'team-name': string
  }
}

export default async function TeamPage({ params }: TeamPageProps) {
  const teamName = await params['team-name']

  // Fetch team data server-side
  const teamData = await fetchBuilderAccount(teamName)

  // If no team data found, show 404
  if (!teamData) {
    notFound()
  }

  // Transform the team data to match the expected format
  // For now, we'll use the sample data as the team data structure
  // might need to be adapted based on the actual GraphQL schema
  const spaces =
    teamData.spaces?.length > 0
      ? teamData.spaces.map((space) => ({
          title: space.title || 'Team Packages', // This might need to be adjusted based on actual schema
          packages:
            space.packages?.map((pkg) => ({
              title: pkg.name || 'Unknown Package',
              description: pkg.description || 'Package description', // This would need to come from the GraphQL schema
              githubUrl: pkg.githubUrl,
              npmUrl: pkg.npmUrl,
            })) || [],
        }))
      : []

  return (
    <main className="container mx-auto py-8">
      <BuilderSpaces
        spaces={spaces}
        teamName={teamData.profileName || teamName}
        discordUrl="https://discord.com/invite/powerhouse"
      />
    </main>
  )
}
