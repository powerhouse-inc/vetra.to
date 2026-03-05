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
    </main>
  )
}
