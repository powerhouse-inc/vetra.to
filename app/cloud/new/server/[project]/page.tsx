'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Package } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/modules/shared/components/ui/breadcrumb'
import {
  StripedCard,
  StripedCardContent,
  StripedCardHeader,
  StripedCardTitle,
} from '@/modules/shared/components/striped-card'

import { useEnvironment } from '../../../use-cloud-data'
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
import { useForm } from 'react-hook-form'
import { addPackage } from '../../../lib/api'

type PageProps = {
  params: Promise<{
    project: string
  }>
}

const schema = z.object({
  packageName: z.string().min(1, 'Package name is required'),
  version: z.string().optional(),
})

export type AddPackageFormValues = z.infer<typeof schema>

export default function AddPackagePage({ params }: PageProps) {
  const { project } = use(params)
  const environment = useEnvironment(project)
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<AddPackageFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      packageName: '',
      version: '',
    },
  })

  const handleSubmit = async (values: AddPackageFormValues) => {
    if (!environment) {
      toast.error('Environment not found')
      return
    }

    try {
      setIsSubmitting(true)

      await addPackage({
        docId: environment.id,
        packageName: values.packageName,
        version: values.version || undefined,
      })

      toast.success('Package added successfully')
      router.push(`/cloud/${project}`)
    } catch (error) {
      console.error('Failed to add package:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add package')
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayName = environment?.state.name || environment?.name || 'Loading...'

  return (
    <main className="container mx-auto mt-[80px] max-w-[var(--container-width)] space-y-8 p-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Add Package</h1>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/cloud">Cloud</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/cloud/${project}`}>{displayName}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Add Package</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="mx-auto max-w-xl">
        <StripedCard>
          <StripedCardHeader>
            <StripedCardTitle className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              New Package
            </StripedCardTitle>
          </StripedCardHeader>
          <StripedCardContent className="p-4">
            <Form {...form}>
              {/* keeping it as it comes from shadcn */}
              {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
              <form onSubmit={form.handleSubmit(handleSubmit)}>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="packageName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Package Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. @powerhouse/my-package" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="version"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Version (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 1.0.0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="mt-6 flex gap-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Adding...' : 'Add Package'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/cloud/${project}`)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </StripedCardContent>
        </StripedCard>
      </div>
    </main>
  )
}
