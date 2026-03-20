'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  Package,
  Server,
  Settings,
  Plus,
  ArrowLeft,
  Globe,
  MoreHorizontal,
  Search,
  Play,
  Square,
} from 'lucide-react'
import Link from 'next/link'
import { useState, use, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { NewEnvironmentForm } from '@/app/cloud/new-project-form'
import { useEnvironmentDetail } from '@/modules/cloud/hooks/use-environment-detail'
import { generateSubdomain } from '@/modules/cloud/subdomain'
import type { CloudEnvironmentService } from '@/modules/cloud/types'
import { Badge } from '@/modules/shared/components/ui/badge'
import { Button } from '@/modules/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card'
import { Checkbox } from '@/modules/shared/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/modules/shared/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/modules/shared/components/ui/dropdown-menu'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/modules/shared/components/ui/form'
import { Input } from '@/modules/shared/components/ui/input'
import { Switch } from '@/modules/shared/components/ui/switch'
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
      ? 'bg-emerald-500'
      : status === 'DEPLOYING'
        ? 'bg-yellow-500'
        : 'bg-muted-foreground'

  return <span className={`inline-block h-2 w-2 rounded-full ${colorClass}`} />
}

function AddPackageModal({
  onAdd,
}: {
  onAdd: (packageName: string, version?: string) => Promise<void>
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
      await onAdd(values.packageName, values.version || undefined)
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

function PackageRow({
  pkg,
  onRemove,
}: {
  pkg: { name: string; version: string | null | undefined }
  onRemove: (name: string) => Promise<void>
}) {
  const [isRemoving, setIsRemoving] = useState(false)

  const handleUninstall = async () => {
    try {
      setIsRemoving(true)
      await onRemove(pkg.name)
      toast.success(`Uninstalled ${pkg.name}`)
    } catch (error) {
      console.error('Failed to remove package:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to remove package')
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <Package className="text-muted-foreground h-4 w-4 shrink-0" />
          <span className="font-medium">{pkg.name}</span>
        </div>
      </TableCell>
      <TableCell>
        {pkg.version ? (
          <Badge variant="secondary" className="font-mono text-xs">
            {pkg.version}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">&mdash;</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={isRemoving}>
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled>Upgrade to version...</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={handleUninstall}>
              Uninstall
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

function ServiceRow({
  serviceName,
  label,
  icon: Icon,
  subdomain,
  isEnabled,
  onToggle,
}: {
  serviceName: CloudEnvironmentService
  label: string
  icon: React.ComponentType<{ className?: string }>
  subdomain: string | null
  isEnabled: boolean
  onToggle: (enabled: boolean) => Promise<void>
}) {
  const [isToggling, setIsToggling] = useState(false)
  const prefix = serviceName === 'CONNECT' ? 'connect' : 'switchboard'
  const serviceUrl = subdomain
    ? `${prefix}.${subdomain}.vetra.io`
    : `${prefix}.<subdomain>.vetra.io`

  const handleToggle = async (checked: boolean) => {
    try {
      setIsToggling(true)
      await onToggle(checked)
      toast.success(`${label} ${checked ? 'enabled' : 'disabled'}`)
    } catch (error) {
      console.error(`Failed to toggle ${label}:`, error)
      toast.error(error instanceof Error ? error.message : `Failed to toggle ${label}`)
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <div className="bg-muted flex h-9 w-9 items-center justify-center rounded-md">
          <Icon className="text-muted-foreground h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{label}</span>
            <StatusDot status={isEnabled ? 'STARTED' : 'STOPPED'} />
          </div>
          <a
            href={`https://${serviceUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 truncate font-mono text-xs underline underline-offset-2"
          >
            https://{serviceUrl}
          </a>
        </div>
      </div>
      <Switch
        checked={isEnabled}
        onCheckedChange={handleToggle}
        disabled={isToggling}
        aria-label={`Toggle ${label}`}
      />
    </div>
  )
}

function StartStopButton({
  isRunning,
  onStart,
  onStop,
}: {
  isRunning: boolean
  onStart: () => Promise<void>
  onStop: () => Promise<void>
}) {
  const [isToggling, setIsToggling] = useState(false)

  const handleToggle = async () => {
    try {
      setIsToggling(true)
      if (isRunning) {
        await onStop()
      } else {
        await onStart()
      }
      toast.success(`Environment ${isRunning ? 'stopped' : 'started'}`)
    } catch (error) {
      console.error('Failed to toggle environment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to toggle environment')
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <Button
      variant={isRunning ? 'outline' : 'default'}
      size="sm"
      onClick={handleToggle}
      disabled={isToggling}
      className="flex items-center gap-1.5"
    >
      {isRunning ? (
        <>
          <Square className="h-3.5 w-3.5" />
          {isToggling ? 'Stopping...' : 'Stop'}
        </>
      ) : (
        <>
          <Play className="h-3.5 w-3.5" />
          {isToggling ? 'Starting...' : 'Start'}
        </>
      )}
    </Button>
  )
}

type PageProps = {
  params: Promise<{
    project: string
  }>
}

export default function EnvironmentDetailPage({ params }: PageProps) {
  const { project } = use(params)
  const {
    environment,
    isLoading,
    setSubdomain,
    enableService,
    disableService,
    addPackage,
    removePackage,
    start,
    stop,
  } = useEnvironmentDetail(project)

  const state = environment?.state
  const displayName = state?.name || environment?.name || 'Loading...'
  const isRunning = state?.status === 'STARTED'
  const subdomain = state?.subdomain ?? null

  // Auto-heal: set subdomain if missing
  const subdomainHealedRef = useRef(false)
  useEffect(() => {
    if (!environment || subdomainHealedRef.current) return
    if (environment.state.subdomain === null) {
      subdomainHealedRef.current = true
      setSubdomain(generateSubdomain(environment.id))
    }
  }, [environment, setSubdomain])

  const genericDomain = subdomain ? `${subdomain}.vetra.io` : '<subdomain>.vetra.io'

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
          {state && <StartStopButton isRunning={isRunning} onStart={start} onStop={stop} />}
        </div>
      </div>

      {state && (
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 pt-4">
            {/* Domain Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe className="h-4 w-4" />
                  Domain Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <label className="text-muted-foreground text-sm font-medium">
                    Generic Domain:
                  </label>
                  <Input value={genericDomain} readOnly className="bg-muted font-mono text-sm" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Checkbox id="custom-domain" disabled />
                    <label
                      htmlFor="custom-domain"
                      className="text-muted-foreground text-sm font-medium"
                    >
                      Custom Domain
                    </label>
                    <Badge variant="outline" className="text-xs">
                      Coming soon
                    </Badge>
                  </div>
                  <Input
                    placeholder="e.g. my-app.example.com"
                    disabled
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <h4 className="text-muted-foreground text-sm font-medium">DNS Records</h4>
                  <div className="bg-muted/50 rounded-md border p-4">
                    <p className="text-muted-foreground text-sm">
                      Will be available when custom domain is set
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reactor Modules */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Package className="h-4 w-4" />
                    Reactor Modules
                  </CardTitle>
                  <AddPackageModal onAdd={addPackage} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
                  <Input
                    placeholder="Search registry coming soon"
                    disabled
                    className="pl-9 text-sm"
                  />
                </div>

                {state.packages && state.packages.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Package</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead className="w-12 text-right" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {state.packages.map((pkg) => (
                        <PackageRow key={pkg.name} pkg={pkg} onRemove={removePackage} />
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 py-8">
                    <Package className="text-muted-foreground h-8 w-8" />
                    <p className="text-muted-foreground text-sm">No packages installed</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Services */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Server className="h-4 w-4" />
                  Services
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ServiceRow
                  serviceName="CONNECT"
                  label="Powerhouse Connect"
                  icon={Globe}
                  subdomain={subdomain}
                  isEnabled={state.services.includes('CONNECT')}
                  onToggle={(enabled) =>
                    enabled ? enableService('CONNECT') : disableService('CONNECT')
                  }
                />
                <ServiceRow
                  serviceName="SWITCHBOARD"
                  label="Powerhouse Switchboard"
                  icon={Server}
                  subdomain={subdomain}
                  isEnabled={state.services.includes('SWITCHBOARD')}
                  onToggle={(enabled) =>
                    enabled ? enableService('SWITCHBOARD') : disableService('SWITCHBOARD')
                  }
                />
              </CardContent>
            </Card>
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
                <NewEnvironmentForm docId={environment!.id} initialName={state.name || ''} />
              </CardContent>
            </Card>

            {environment && (
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
                      {environment.createdAtUtcIso
                        ? new Date(environment.createdAtUtcIso).toLocaleDateString()
                        : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs font-medium">Last Modified</dt>
                    <dd className="mt-0.5 text-sm">
                      {environment.lastModifiedAtUtcIso
                        ? new Date(environment.lastModifiedAtUtcIso).toLocaleDateString()
                        : '—'}
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
