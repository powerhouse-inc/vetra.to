'use client'

import { Button } from '@/modules/shared/components/ui/button'
import { FolderOpen, Plus } from 'lucide-react'
import Link from 'next/link'

import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
} from '@/modules/shared/components/ui/card'

import { useProjects } from './use-cloud-data'

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
        <CardFooter className="flex flex-col gap-2">
          <Button variant="default" asChild className="w-full">
            <Link href={`/cloud/${id}`} className="flex items-center justify-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Open project
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link
              href={`/cloud/new/server/${id}`}
              className="flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Environment
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export function CloudProjects() {
  const projects = useProjects()

  return (
    <div className="flex flex-wrap">
      {projects.map((project) => (
        <CloudProjectCard
          key={project.id}
          id={project.id}
          title={project.title}
          description={project.description}
        />
      ))}
    </div>
  )
}
