'use client'

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/modules/shared/components/ui/breadcrumb'

import { useCloudEnvironmentFormValues, useProject } from '../use-cloud-data'
import { NewProjectForm } from '@/app/cloud/new-project-form'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/shared/components/ui/table'
import { Edit, Trash } from 'lucide-react'
import { Button } from '@/modules/shared/components/ui/button'

type PageProps = {
  params: {
    project: string
  }
}

export default function CloudPage({ params }: PageProps) {
  const { project } = params
  const projectData = useProject(project)
  const cloudOptions = useCloudEnvironmentFormValues()

  // Helper functions to get display labels from form values
  const getPackageLabel = (value: string) => {
    return cloudOptions.packages.find((option) => option[0] === value)?.[1] ?? value
  }

  const getResourceLabel = (value: string) => {
    return cloudOptions.resources.find((option) => option[0] === value)?.[1] ?? value
  }

  const getLabelLabel = (value: string) => {
    return cloudOptions.label.find((option) => option[0] === value)?.[1] ?? value
  }

  const getAdminLabel = (value: string) => {
    return cloudOptions.admin.find((option) => option[0] === value)?.[1] ?? value
  }

  return (
    <main className="container mx-auto mt-[80px] max-w-[var(--container-width)] space-y-8 p-8">
      {/* Header Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            {/* Breadcrumbs */}
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/cloud">Cloud</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Project</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{projectData?.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
      </div>
      <h1 className="text-4xl font-bold">Project details</h1>
      {projectData && (
        <section>
          <NewProjectForm projectId={projectData.id} />
        </section>
      )}
      <h1 className="text-4xl font-bold">Environments</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Address</TableHead>
            <TableHead>Packages</TableHead>
            <TableHead>Resources</TableHead>
            <TableHead>Label</TableHead>
            <TableHead>Admin</TableHead>
            <TableHead>Backup</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projectData?.environments.map((environment) => (
            <TableRow key={environment.id}>
              <TableCell>{environment.address}</TableCell>
              <TableCell>{getPackageLabel(environment.packages)}</TableCell>
              <TableCell>{getResourceLabel(environment.resources)}</TableCell>
              <TableCell>{getLabelLabel(environment.label)}</TableCell>
              <TableCell>{getAdminLabel(environment.admin)}</TableCell>
              <TableCell>{environment.backup ? 'Yes' : 'No'}</TableCell>
              <TableCell>
                <Button variant="outline">
                  <Trash className="h-4 w-4" />
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </main>
  )
}
