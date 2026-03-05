import { Button } from '@/modules/shared/components/ui/button'

import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
} from '@/modules/shared/components/ui/card'

import { CloudProject } from './types'
import { getProjects } from './data'

const CLOUD_PROJECTS: CloudProject[] = getProjects()

type CloudProjectCardProps = {
  id: string
  title: string
  description: string
}

function CloudProjectCard({ id, title, description }: CloudProjectCardProps) {
  return (
    <div className="p-2">
      <Card style={{ width: 320 }}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardFooter>
          <div className="space-x-5">
            <Button>
              <a href={`/cloud/${id}`}>Open project</a>
            </Button>
            <Button>
              <a href={`/cloud/new/server/${id}`}>New Environment</a>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

export function CloudProjects() {
  return (
    <div className="flex flex-wrap">
      {CLOUD_PROJECTS.map((project) => (
        <CloudProjectCard id={project.id} title={project.title} description={project.description} />
      ))}
    </div>
  )
}
