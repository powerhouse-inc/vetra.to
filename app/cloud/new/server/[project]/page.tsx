'use client'

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/modules/shared/components/ui/breadcrumb'

import { getProject } from '../../../data'
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

// Force dynamic rendering to prevent build-time API requests
export const dynamic = 'force-dynamic'

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
  const projectData = getProject(project)

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
        <form
          onSubmit={form.handleSubmit((values) => {
            console.log(values)
          })}
          style={{ padding: '20px', top: '10px' }}
        >
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
                      <SelectItem value="label-1">Label 1</SelectItem>
                      <SelectItem value="label-2">Label 2</SelectItem>
                      <SelectItem value="label-3">Label 3</SelectItem>
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
                      <SelectItem value="package-1">Package 1</SelectItem>
                      <SelectItem value="package-2">Package 2</SelectItem>
                      <SelectItem value="package-3">Package 3</SelectItem>
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
                      <SelectItem value="resource-1">Resource 1</SelectItem>
                      <SelectItem value="resource-2">Resource 2</SelectItem>
                      <SelectItem value="resource-3">Resource 3</SelectItem>
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
                        <SelectValue placeholder="Select a admin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin-1">Admin 1</SelectItem>
                      <SelectItem value="admin-2">Admin 2</SelectItem>
                      <SelectItem value="admin-3">Admin 3</SelectItem>
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
            <Button type="submit">Create Environment</Button>
          </div>
        </form>
      </Form>
    </main>
  )
}
