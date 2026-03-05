import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/modules/shared/components/ui/breadcrumb'

import { getProject } from '../../../data'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/modules/shared/components/ui/accordion'

// Force dynamic rendering to prevent build-time API requests
export const dynamic = 'force-dynamic'

export const metadata: unknown = {
  title: 'Vetra Cloud',
  description: 'The Cloud for Powerhouse!',
}

type PageProps = {
  params: {
    project: string
  }
}

export default function NewServerPage({ params }: PageProps) {
  const { project } = params
  const projectData = getProject(project)
  return (
    <main className="container mx-auto mt-[80px] max-w-[var(--container-width)] space-y-8 p-8">
      {/* Header Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">New server</h1>
            {/* Breadcrumbs */}
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/cloud">Cloud</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>New</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Server</BreadcrumbPage>
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
      <Accordion type="multiple">
        <AccordionItem value="item-1">
          <AccordionTrigger>Resources</AccordionTrigger>
          <AccordionContent></AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Packages</AccordionTrigger>
          <AccordionContent>Content 2</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Authorization</AccordionTrigger>
          <AccordionContent>Content 2</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Backup</AccordionTrigger>
          <AccordionContent>Content 2</AccordionContent>
        </AccordionItem>
      </Accordion>
    </main>
  )
}
