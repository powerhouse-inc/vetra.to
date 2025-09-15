import { BuilderSpaces } from '@/modules/builders/components/builder-spaces'

// Sample data for demonstration
const sampleSpaces = [
  {
    title: 'Governance & Automation',
    packages: [
      {
        title: 'Atlas - Automated Governance',
        description: 'The atlas is the rulebook for your AI driven governance practices',
        githubUrl: 'https://github.com/powerhouse/atlas',
        npmUrl: 'https://www.npmjs.com/package/@powerhouse/atlas',
      },
      {
        title: 'Vetra - Cloud Infrastructure',
        description: 'Comprehensive cloud infrastructure management and deployment tools',
        githubUrl: 'https://github.com/powerhouse/vetra',
        npmUrl: 'https://www.npmjs.com/package/@powerhouse/vetra',
      },
    ],
  },
  {
    title: 'Development Tools',
    packages: [
      {
        title: 'Reactor - State Management',
        description: 'Advanced state management system for complex applications',
        githubUrl: 'https://github.com/powerhouse/reactor',
        npmUrl: 'https://www.npmjs.com/package/@powerhouse/reactor',
      },
      {
        title: 'Document Drive',
        description: 'File and document management system with version control',
        githubUrl: 'https://github.com/powerhouse/document-drive',
        npmUrl: 'https://www.npmjs.com/package/@powerhouse/document-drive',
      },
    ],
  },
]

export default function TeamPage() {
  return (
    <main className="container mx-auto py-8">
      <BuilderSpaces
        spaces={sampleSpaces}
        teamName="BAI Team"
        discordUrl="https://discord.com/invite/powerhouse"
      />
    </main>
  )
}
