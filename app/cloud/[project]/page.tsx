'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Activity, Package, Server, Settings, Plus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useState, use } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { NewEnvironmentForm } from '@/app/cloud/new-project-form'
import type { EnvironmentController } from '@/modules/cloud/controller'
import { useEnvironmentController } from '@/modules/cloud/hooks/use-environment-controller'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shared/components/ui/tabs'

const addPackageSchema = z.object({
  packageName: z.string().min(1, 'Package name is required'),
  version: z.string().optional(),
})

type AddPackageFormValues = z.infer<typeof addPackageSchema>

function StatusDot({ status }: { status: string }) {
  const colorClass =
    status === 'STARTED'
      ? 'bg-success'
      : status === 'DEPLOYING'
        ? 'bg-warning'
        : 'bg-muted-foreground'

  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block h-2 w-2 rounded-full ${colorClass}`} />
    </span>
  )
}

function AddPackageModal({
  controller,
  onPush,
}: {
  controller: EnvironmentController
  onPush: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<AddPackageFormValues>({
    resolver: zodResolver(addPackageSchema),
    defaultValues: { packageName: '', version: '' },
  })

  const handleSubmit = async (values: AddPackageFormValues) => {
    try {
      setIsSubmitting(true)
      controller.addPackage({
        packageName: values.packageName,
        version: values.version || null,
      })
      await onPush()
      toast.success('Package added successfully')
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
  const { controller, state, isLoading, push } = useEnvironmentController(project)

  const header = controller?.header
  const displayName = state?.name || header?.name || 'Loading...'
  const isRunning = state?.status === 'STARTED'
  const packageCount = state?.packages?.length ?? 0

  if (isLoading) {
    return (
      <main className="mx-auto mt-20 max-w-[var(--container-width)] px-6 py-8">
        <p className="text-muted-foreground">Loading environment...</p>
      </main>
    )
  }

  return (
    <main className="mx-auto mt-20 max-w-[var(--container-width)] space-y-8 px-6 py-8">
      {/* Header */}
      <div className="space-y-3">
        <Link
          href="/cloud"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cloud
        </Link>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">{displayName}</h2>
          {state && (
            <Badge
              variant={isRunning ? 'default' : 'secondary'}
              className="flex items-center gap-1.5"
            >
              <StatusDot status={state.status} />
              {state.status}
            </Badge>
          )}
        </div>
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

      {controller && state && (
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="packages">Packages</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="px-4 py-3">
                  <p className="text-muted-foreground text-xs font-medium">Packages</p>
                  <p className="text-2xl font-bold">{packageCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="px-4 py-3">
                  <p className="text-muted-foreground text-xs font-medium">Services</p>
                  <p className="text-2xl font-bold">{state.services.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="px-4 py-3">
                  <p className="text-muted-foreground text-xs font-medium">Revision</p>
                  <p className="text-2xl font-bold">{header?.revision.global ?? 0}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-4 w-4" />
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={isRunning ? 'default' : 'secondary'} className="gap-1.5">
                    <StatusDot status={state.status} />
                    {state.status}
                  </Badge>
                  {state.services.length > 0 ? (
                    state.services.map((service) => (
                      <Badge key={service} variant="outline">
                        {service}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm">No services enabled</span>
                  )}
                </div>
                {header && (
                  <div className="pt-2">
                    <dt className="text-muted-foreground text-xs font-medium">Document ID</dt>
                    <dd className="mt-0.5 max-w-md truncate font-mono text-xs">{header.id}</dd>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Packages Tab */}
          <TabsContent value="packages" className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Package className="h-5 w-5" />
                Packages
              </h3>
              <AddPackageModal controller={controller} onPush={push} />
            </div>
            {state.packages && state.packages.length > 0 ? (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Version</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {state.packages.map((pkg) => (
                        <TableRow key={pkg.name}>
                          <TableCell className="font-medium">{pkg.name}</TableCell>
                          <TableCell className="text-muted-foreground font-mono text-sm">
                            {pkg.version || '\u2014'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-12">
                <Package className="text-muted-foreground h-8 w-8" />
                <p className="text-muted-foreground text-sm">No packages installed</p>
                <AddPackageModal controller={controller} onPush={push} />
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings className="h-4 w-4" />
                  Rename Environment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <NewEnvironmentForm
                  controller={controller}
                  onPush={push}
                  initialName={state.name || ''}
                />
              </CardContent>
            </Card>

            {header && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Server className="h-4 w-4" />
                    Metadata
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <dt className="text-muted-foreground text-xs font-medium">Document ID</dt>
                    <dd className="mt-0.5 font-mono text-xs break-all">{header.id}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs font-medium">Type</dt>
                    <dd className="mt-0.5 text-sm">{header.documentType}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs font-medium">Revision</dt>
                    <dd className="mt-0.5 text-sm">{header.revision.global ?? 0}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs font-medium">Created</dt>
                    <dd className="mt-0.5 text-sm">
                      {new Date(header.createdAtUtcIso).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs font-medium">Last Modified</dt>
                    <dd className="mt-0.5 text-sm">
                      {new Date(header.lastModifiedAtUtcIso).toLocaleDateString()}
                    </dd>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </main>
  )
}
