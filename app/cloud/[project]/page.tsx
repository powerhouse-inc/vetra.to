import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/modules/shared/components/ui/breadcrumb'

import { getProject } from '../data'
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

// Force dynamic rendering to prevent build-time API requests
export const dynamic = 'force-dynamic'

export const metadata: unknown = {
  title: 'Vetra Cloud',
  description: 'The Cloud for Powerhouse!',
}

export default function CloudPage({ params }: PageProps) {
  const { project } = params
  const projectData = getProject(project)

  const { project } = params
  const projectData = getProject(project)

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

      {projectData && (
        <section>
          <NewProjectForm projectId={projectData.id} />
        </section>
      )}

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
              <TableCell>{environment.packages}</TableCell>
              <TableCell>{environment.resources}</TableCell>
              <TableCell>{environment.label}</TableCell>
              <TableCell>{environment.admin}</TableCell>
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
