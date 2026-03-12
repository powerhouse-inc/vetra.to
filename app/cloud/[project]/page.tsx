'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Activity, Package, Server, Settings, Plus } from 'lucide-react'
import { useState, use } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { NewEnvironmentForm } from '@/app/cloud/new-project-form'
import {
  StripedCard,
  StripedCardContent,
  StripedCardHeader,
  StripedCardTitle,
} from '@/modules/shared/components/striped-card'
import { Badge } from '@/modules/shared/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/modules/shared/components/ui/breadcrumb'
import { Button } from '@/modules/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/modules/shared/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/modules/shared/components/ui/form'
import { Input } from '@/modules/shared/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/shared/components/ui/table'

import { addPackage } from '../lib/api'
import { useEnvironment, useRefreshEnvironments } from '../use-cloud-data'

const addPackageSchema = z.object({
  packageName: z.string().min(1, 'Package name is required'),
  version: z.string().optional(),
})

type AddPackageFormValues = z.infer<typeof addPackageSchema>

function AddPackageModal({ environmentId }: { environmentId: string }) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const refreshEnvironments = useRefreshEnvironments()

  const form = useForm<AddPackageFormValues>({
    resolver: zodResolver(addPackageSchema),
    defaultValues: { packageName: '', version: '' },
  })

  const handleSubmit = async (values: AddPackageFormValues) => {
    try {
      setIsSubmitting(true)
      await addPackage({
        docId: environmentId,
        packageName: values.packageName,
        version: values.version || undefined,
      })
      toast.success('Package added successfully')
      refreshEnvironments()
      form.reset()
      setOpen(false)
    } catch (error) {
      console.error('Failed to add package:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add package')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <Plus className="h-3 w-3" />
          Add
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Package</DialogTitle>
        </DialogHeader>
        <Form {...form}>
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
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

type PageProps = {
  params: Promise<{
    project: string
  }>
}

export default function EnvironmentDetailPage({ params }: PageProps) {
  const { project } = use(params)
  const environment = useEnvironment(project)

  const displayName = environment?.state.name || environment?.name || 'Loading...'
  const isRunning = environment?.state.status === 'STARTED'

  return (
    <main className="container mx-auto mt-[80px] max-w-[var(--container-width)] space-y-8 p-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{displayName}</h1>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/cloud">Cloud</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{displayName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {environment && (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Status Overview */}
            <StripedCard>
              <StripedCardHeader>
                <StripedCardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Status
                </StripedCardTitle>
              </StripedCardHeader>
              <StripedCardContent className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={isRunning ? 'default' : 'secondary'}>
                    {environment.state.status}
                  </Badge>
                  {environment.state.services.length > 0 ? (
                    environment.state.services.map((service) => (
                      <Badge key={service} variant="outline">
                        {service}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm">No services enabled</span>
                  )}
                </div>
              </StripedCardContent>
            </StripedCard>

            {/* Packages */}
            <StripedCard>
              <StripedCardHeader className="flex-row items-center justify-between">
                <StripedCardTitle className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Packages
                </StripedCardTitle>
                <AddPackageModal environmentId={environment.id} />
              </StripedCardHeader>
              <StripedCardContent className="p-0">
                {environment.state.packages && environment.state.packages.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Version</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {environment.state.packages.map((pkg) => (
                        <TableRow key={pkg.name}>
                          <TableCell className="font-medium">{pkg.name}</TableCell>
                          <TableCell className="text-muted-foreground font-mono text-sm">
                            {pkg.version || '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 py-8">
                    <Package className="text-muted-foreground h-8 w-8" />
                    <p className="text-muted-foreground text-sm">No packages installed</p>
                    <AddPackageModal environmentId={environment.id} />
                  </div>
                )}
              </StripedCardContent>
            </StripedCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Settings */}
            <StripedCard>
              <StripedCardHeader>
                <StripedCardTitle className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </StripedCardTitle>
              </StripedCardHeader>
              <StripedCardContent className="p-4">
                <NewEnvironmentForm
                  environmentId={environment.id}
                  initialName={environment.state.name || ''}
                />
              </StripedCardContent>
            </StripedCard>

            {/* Metadata */}
            <StripedCard>
              <StripedCardHeader>
                <StripedCardTitle className="flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  Info
                </StripedCardTitle>
              </StripedCardHeader>
              <StripedCardContent className="space-y-3 p-4">
                <div>
                  <dt className="text-muted-foreground text-xs font-medium">Document ID</dt>
                  <dd className="mt-0.5 font-mono text-xs break-all">{environment.id}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs font-medium">Type</dt>
                  <dd className="mt-0.5 text-sm">{environment.documentType}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs font-medium">Revision</dt>
                  <dd className="mt-0.5 text-sm">{environment.revision}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs font-medium">Created</dt>
                  <dd className="mt-0.5 text-sm">
                    {new Date(environment.createdAtUtcIso).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs font-medium">Last Modified</dt>
                  <dd className="mt-0.5 text-sm">
                    {new Date(environment.lastModifiedAtUtcIso).toLocaleDateString()}
                  </dd>
                </div>
              </StripedCardContent>
            </StripedCard>
          </div>
        </div>
      )}
    </main>
  )
}
