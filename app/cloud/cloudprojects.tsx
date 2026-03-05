import { Button } from '@/modules/shared/components/ui/button'

import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
} from '@/modules/shared/components/ui/card'

type CloudProject = {
  id: string
  title: string
  description: string
}

const CLOUD_PROJECTS: CloudProject[] = [
  {
    id: 'default',
    title: 'Frontend',
    description: 'Our server instances for frontends',
  },
  {
    id: 'eth-1',
    title: 'Ethereum nodes',
    description: 'Our running mainnet nodes for Ethereum.',
  },
  {
    id: 'sol-1',
    title: 'Solana nodes',
    description: 'Our running mainnet nodes for Solana.',
  },
  {
    id: 'indexer-1',
    title: 'Ethereum indexer',
    description: 'Web crawler indexing ethereum',
  },
]

type CloudProjectCardProps = {
  title: string
  description: string
  onCreate?: () => void
}

function CloudProjectCard({ title, description, onCreate }: CloudProjectCardProps) {
  return (
    <div className="p-2">
      <Card style={{ width: 320 }}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button>Open Project</Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export function CloudProjects() {
  return (
    <div className="flex flex-wrap">
      {CLOUD_PROJECTS.map((project) => (
        <CloudProjectCard
          key={project.id}
          title={project.title}
          description={project.description}
          onCreate={() => {
            console.log('Create server for', project.id)
          }}
        />
      ))}
    </div>
  )
}
