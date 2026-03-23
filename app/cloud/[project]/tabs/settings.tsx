'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  Package,
  Server,
  Settings,
  Plus,
  Globe,
  MoreHorizontal,
  Search,
  Trash2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { NewEnvironmentForm } from '@/app/cloud/new-project-form'
import { getAuthToken, deleteEnvironment } from '@/modules/cloud/graphql'
import type { CloudEnvironment, CloudEnvironmentService } from '@/modules/cloud/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/modules/shared/components/ui/alert-dialog'
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
import { useRenown } from '@powerhousedao/reactor-browser'

// ---------------------------------------------------------------------------
// Local schema
// ---------------------------------------------------------------------------

const addPackageSchema = z.object({
  packageName: z.string().min(1, 'Package name is required'),
  version: z.string().optional(),
})

type AddPackageFormValues = z.infer<typeof addPackageSchema>

// ---------------------------------------------------------------------------
// Helper: StatusDot (needed by ServiceRow)
// ---------------------------------------------------------------------------

function StatusDot({ status }: { status: string }) {
  const colorClass =
    status === 'STARTED'
      ? 'bg-emerald-500'
      : status === 'DEPLOYING'
        ? 'bg-yellow-500'
        : 'bg-muted-foreground'

  return <span className={`inline-block h-2 w-2 rounded-full ${colorClass}`} />
}

// ---------------------------------------------------------------------------
// AddPackageModal (moved from page.tsx)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// PackageRow (moved from page.tsx)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// ServiceRow (the toggle version with Switch — moved from page.tsx)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// SettingsTab props + component
// ---------------------------------------------------------------------------

type SettingsTabProps = {
  environment: CloudEnvironment
  enableService: (service: CloudEnvironmentService) => Promise<void>
  disableService: (service: CloudEnvironmentService) => Promise<void>
  addPackage: (name: string, version?: string) => Promise<void>
  removePackage: (name: string) => Promise<void>
  onDelete?: () => void
}

export function SettingsTab({
  environment,
  enableService,
  disableService,
  addPackage,
  removePackage,
  onDelete,
}: SettingsTabProps) {
  const renown = useRenown()
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const state = environment.state
  const subdomain = state.subdomain ?? null
  const genericDomain = subdomain ? `${subdomain}.vetra.io` : '<subdomain>.vetra.io'

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      const token = await getAuthToken(renown)
      await deleteEnvironment(environment.id, token)
      toast.success('Environment deleted')
      onDelete?.()
      router.push('/cloud')
    } catch (error) {
      console.error('Failed to delete environment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete environment')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Packages */}
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
            <Input placeholder="Search registry coming soon" disabled className="pl-9 text-sm" />
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

      {/* 2. Services */}
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
            onToggle={(enabled) => (enabled ? enableService('CONNECT') : disableService('CONNECT'))}
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

      {/* 3. Domain */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" />
            Domain Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <label className="text-muted-foreground text-sm font-medium">Generic Domain:</label>
            <Input value={genericDomain} readOnly className="bg-muted font-mono text-sm" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Checkbox id="custom-domain" disabled />
              <label htmlFor="custom-domain" className="text-muted-foreground text-sm font-medium">
                Custom Domain
              </label>
              <Badge variant="outline" className="text-xs">
                Coming soon
              </Badge>
            </div>
            <Input placeholder="e.g. my-app.example.com" disabled className="font-mono text-sm" />
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

      {/* 4. General (rename + metadata) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4" />
            Rename Environment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <NewEnvironmentForm docId={environment.id} initialName={state.name || ''} />
        </CardContent>
      </Card>

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

      {/* 5. Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2 text-base">
            <Trash2 className="h-4 w-4" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Delete Environment</p>
              <p className="text-muted-foreground text-sm">
                Permanently delete this environment and all its data. This action cannot be undone.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isDeleting}>
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Environment</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete &ldquo;{state.name || environment.name}&rdquo;?
                    This action cannot be undone and all data will be permanently lost.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Environment
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
