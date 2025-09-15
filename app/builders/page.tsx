import { BuilderTeamCard } from '@/modules/builders/components/list-card'

const builderTeams = [
  {
    teamName: 'BAI Team',
    description:
      'Officially affiliated team of Powerhouse.inc. Seasoned builder on the powerhouse techstack. Strong ability to explore a problem space in any domain and develop solutions.',
    xUrl: 'https://x.com/baiteam',
    githubUrl: 'https://github.com/bai-team',
    websiteUrl: 'https://bai-team.org',
  },
  {
    teamName: 'Core-Dev Team',
    description:
      'Officially affiliated team of Powerhouse.inc. Seasoned builder on the powerhouse techstack. Strong ability to explore a problem space in any domain and develop solutions.',
    xUrl: 'https://x.com/coredev',
    githubUrl: 'https://github.com/core-dev',
    websiteUrl: 'https://core-dev.org',
  },
  {
    teamName: 'SKY Fintech Automations Team',
    description:
      'Officially affiliated team of Powerhouse.inc. Seasoned builder on the powerhouse techstack. Strong ability to explore a problem space in any domain and develop solutions.',
    xUrl: 'https://x.com/sky-fintech',
    githubUrl: 'https://github.com/sky-fintech',
    websiteUrl: 'https://sky-fintech.org',
  },
  {
    teamName: 'Jetstream',
    description:
      'Officially affiliated team of Powerhouse.inc. Seasoned builder on the powerhouse techstack. Strong ability to explore a problem space in any domain and develop solutions.',
    xUrl: 'https://x.com/jetstream',
    githubUrl: 'https://github.com/jetstream',
    websiteUrl: 'https://jetstream.org',
  },
]

export default function BuildersPage() {
  return (
    <main className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">Builder Teams</h1>
        <p className="mt-2 text-gray-600">
          Meet our officially affiliated teams building on the Powerhouse techstack
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
        {builderTeams.map((team, index) => (
          <BuilderTeamCard
            key={index}
            teamName={team.teamName}
            description={team.description}
            xUrl={team.xUrl}
            githubUrl={team.githubUrl}
            websiteUrl={team.websiteUrl}
            actions={[{ link: `/builders/${team.teamName}`, title: 'View Profile' }]}
          />
        ))}
      </div>
    </main>
  )
}
