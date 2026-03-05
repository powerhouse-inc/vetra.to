'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/modules/shared/components/ui/breadcrumb'

import { useCloudEnvironmentFormValues, useProject } from '../../../use-cloud-data'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Button } from '@/modules/shared/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/modules/shared/components/ui//form'
import { Input } from '@/modules/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/shared/components/ui/select'
import { Switch } from '@/modules/shared/components/ui/switch'
import { useForm } from 'react-hook-form'
import { createEnvironmentDocument, addEnvironment } from '../../../lib/api'

type PageProps = {
  params: {
    project: string
  }
}

const schema = z.object({
  address: z.string().min(1, 'Address is required'),
  packages: z.string().min(1, 'Packages is required'),
  resources: z.string().min(1, 'Resources is required'),
  label: z.string().min(1, 'Label is required'),
  admin: z.string().min(1, 'Admin is required'),
  backup: z.boolean(),
})

export type ProjectFormValues = z.infer<typeof schema>

export default function NewEnvironmentPage({ params }: PageProps) {
  const { project } = params
  const projectData = useProject(project)
  const cloudOptions = useCloudEnvironmentFormValues()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      address: '',
      packages: '',
      resources: '',
      label: '',
      admin: '',
      backup: true,
    },
  })

  const handleSubmit = async (values: ProjectFormValues) => {
    if (!projectData) {
      toast.error('Project not found')
      return
    }

    try {
      setIsSubmitting(true)

      // Step 1: Create environment document
      const createResult = await createEnvironmentDocument({
        name: values.address,
      })
      const environmentPHID = createResult.data.id

      // Step 2: Set required fields (if needed)
      // Note: Additional fields like status, username, appDockerImage, backupsEnabled
      // might need to be set using separate mutations if required by the schema
      // For now, we'll proceed to step 3

      // Step 3: Link environment to project
      await addEnvironment({
        projectId: projectData.id,
        environmentPHID: environmentPHID,
        name: values.address,
      })

      toast.success('Environment created successfully')
      router.push(`/cloud/${project}`)
    } catch (error) {
      console.error('Failed to create environment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create environment')
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <main className="container mx-auto mt-[80px] max-w-[var(--container-width)] space-y-8 p-8">
      {/* Header Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">New environment</h1>
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
                  <BreadcrumbPage>Environment</BreadcrumbPage>
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
      <Form {...form}>
        {/* keeping it as it comes from shadcn */}
        {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
        <form onSubmit={form.handleSubmit(handleSubmit)} style={{ padding: '20px', top: '10px' }}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a label" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cloudOptions.label.map((option) => (
                        <SelectItem key={option[0]} value={option[0]}>
                          {option[1]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="packages"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Packages</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a package" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cloudOptions.packages.map((option) => (
                        <SelectItem key={option[0]} value={option[0]}>
                          {option[1]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="resources"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resources</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a resource" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cloudOptions.resources.map((option) => (
                        <SelectItem key={option[0]} value={option[0]}>
                          {option[1]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="admin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an admin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cloudOptions.admin.map((option) => (
                        <SelectItem key={option[0]} value={option[0]}>
                          {option[1]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="backup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Backup</FormLabel>
                  <Switch onCheckedChange={field.onChange} checked={field.value} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div style={{ marginTop: 12 }}>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Environment'}
            </Button>
          </div>
        </form>
      </Form>
    </main>
  )
}
