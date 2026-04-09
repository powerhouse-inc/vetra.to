'use client'

import { useRenown } from '@powerhousedao/reactor-browser'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  ShieldOff,
  Globe,
  Package,
  Server,
  Plus,
  Zap,
  MoreHorizontal,
  Search,
  Trash2,
  Pencil,
  Check,
  X,
  ChevronsUpDown,
  Loader2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'

import { AvailableUpdatesCard } from '@/modules/cloud/components/available-updates-card'
import { EventTimeline } from '@/modules/cloud/components/event-timeline'
import { getAuthToken, deleteEnvironment } from '@/modules/cloud/graphql'
import { useEnvironmentEvents } from '@/modules/cloud/hooks/use-environment-events'
import { useEnvironmentStatus } from '@/modules/cloud/hooks/use-environment-status'
import { usePackageUpdates } from '@/modules/cloud/hooks/use-package-updates'
import { useRegistryPackages, useRegistryVersions } from '@/modules/cloud/hooks/use-registry-search'
import { useServiceUpdates } from '@/modules/cloud/hooks/use-service-updates'
import type { CloudEnvironment, CloudEnvironmentServiceType } from '@/modules/cloud/types'
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/modules/shared/components/ui/command'
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
import { Input } from '@/modules/shared/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shared/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/shared/components/ui/select'
import { Switch } from '@/modules/shared/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/shared/components/ui/table'
import { cn } from '@/shared/lib/utils'

// ---------------------------------------------------------------------------
// Helper: StatusDot
// ---------------------------------------------------------------------------

function StatusDot({ status }: { status: string }) {
  const colorClass =
    status === 'READY' || status === 'ACTIVE'
      ? 'bg-emerald-500'
      : status === 'DEPLOYING'
        ? 'bg-yellow-500'
        : status === 'PROVISIONING'
          ? 'bg-blue-500'
          : status === 'SUSPENDED' || status === 'BILLING_ISSUE'
            ? 'bg-red-500'
            : 'bg-muted-foreground'

  return <span className={`inline-block h-2 w-2 rounded-full ${colorClass}`} />
}

// ---------------------------------------------------------------------------
// AddPackageModal
// ---------------------------------------------------------------------------

function AddPackageModal({
  registryUrl,
  onAdd,
  initialPackage,
  initialVersion,
  initialOpen,
}: {
  registryUrl: string | null
  onAdd: (packageName: string, version?: string) => Promise<void>
  initialPackage?: string | null
  initialVersion?: string | null
  initialOpen?: boolean
}) {
  const [open, setOpen] = useState(initialOpen ?? false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [packageSearch, setPackageSearch] = useState(initialPackage ?? '')
  const [selectedPackage, setSelectedPackage] = useState<string | null>(initialPackage ?? null)
  const [selectedVersion, setSelectedVersion] = useState<string>(initialVersion ?? '')
  const [packagePopoverOpen, setPackagePopoverOpen] = useState(false)
  const [versionPopoverOpen, setVersionPopoverOpen] = useState(false)

  const { packages, isLoading: packagesLoading } = useRegistryPackages(registryUrl, packageSearch)
  const { info: versionInfo, isLoading: versionsLoading } = useRegistryVersions(
    registryUrl,
    selectedPackage,
  )

  const resetForm = () => {
    setPackageSearch('')
    setSelectedPackage(null)
    setSelectedVersion('')
  }

  const handleSubmit = async () => {
    if (!selectedPackage) return
    try {
      setIsSubmitting(true)
      await onAdd(selectedPackage, selectedVersion || undefined)
      toast.success('Package added successfully')
      resetForm()
      setOpen(false)
    } catch (error) {
      console.error('Failed to add package:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add package')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) resetForm()
      }}
    >
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
        <div className="space-y-4">
          {/* Package name combobox */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Package Name</label>
            <Popover open={packagePopoverOpen} onOpenChange={setPackagePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={packagePopoverOpen}
                  className="w-full justify-between font-normal"
                >
                  {selectedPackage ?? 'Select package...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search packages..."
                    value={packageSearch}
                    onValueChange={setPackageSearch}
                  />
                  <CommandList>
                    {packagesLoading && (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                      </div>
                    )}
                    {!packagesLoading && packages.length === 0 && (
                      <CommandEmpty>
                        {registryUrl ? 'No packages found.' : 'No registry configured.'}
                      </CommandEmpty>
                    )}
                    <CommandGroup>
                      {packages.map((pkg) => (
                        <CommandItem
                          key={pkg.name}
                          value={pkg.name}
                          onSelect={() => {
                            setSelectedPackage(pkg.name)
                            setSelectedVersion('')
                            setPackagePopoverOpen(false)
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{pkg.name}</span>
                            <span className="text-muted-foreground text-xs">
                              latest: {pkg.version}
                            </span>
                          </div>
                          {selectedPackage === pkg.name && (
                            <Check className="ml-auto h-4 w-4 shrink-0" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Version combobox */}
          {selectedPackage && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Version</label>
              <Popover open={versionPopoverOpen} onOpenChange={setVersionPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={versionPopoverOpen}
                    className="w-full justify-between font-mono text-sm font-normal"
                    disabled={versionsLoading}
                  >
                    {versionsLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      selectedVersion || 'latest'
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search versions..." />
                    <CommandList>
                      <CommandEmpty>No versions found.</CommandEmpty>
                      <CommandGroup heading="Tags">
                        {Object.entries(versionInfo?.distTags ?? {}).map(([tag, ver]) => (
                          <CommandItem
                            key={tag}
                            value={`tag:${tag}`}
                            onSelect={() => {
                              setSelectedVersion(ver)
                              setVersionPopoverOpen(false)
                            }}
                          >
                            <span className="font-medium">{tag}</span>
                            <span className="text-muted-foreground ml-2 font-mono text-xs">
                              {ver}
                            </span>
                            {selectedVersion === ver && (
                              <Check className="ml-auto h-4 w-4 shrink-0" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <CommandGroup heading="Versions">
                        {(versionInfo?.versions ?? []).map((ver) => (
                          <CommandItem
                            key={ver}
                            value={ver}
                            onSelect={() => {
                              setSelectedVersion(ver)
                              setVersionPopoverOpen(false)
                            }}
                          >
                            <span className="font-mono text-sm">{ver}</span>
                            {selectedVersion === ver && (
                              <Check className="ml-auto h-4 w-4 shrink-0" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
        <div className="mt-2 flex gap-2">
          <Button onClick={handleSubmit} disabled={isSubmitting || !selectedPackage}>
            {isSubmitting ? 'Adding...' : 'Add Package'}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// PackageRow
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
// ServiceRow (toggle version with Switch)
// ---------------------------------------------------------------------------

const SERVICE_LABELS: Record<CloudEnvironmentServiceType, string> = {
  CONNECT: 'Powerhouse Connect',
  SWITCHBOARD: 'Powerhouse Switchboard',
  FUSION: 'Powerhouse Fusion',
}

const SERVICE_ICONS: Record<
  CloudEnvironmentServiceType,
  React.ComponentType<{ className?: string }>
> = {
  CONNECT: Globe,
  SWITCHBOARD: Server,
  FUSION: Zap,
}

const SERVICE_IMAGES: Record<string, string> = {
  CONNECT: 'cr.vetra.io/powerhouse-inc-powerhouse/connect',
  SWITCHBOARD: 'cr.vetra.io/powerhouse-inc-powerhouse/switchboard',
}

const SERVICE_NPM_PACKAGES: Record<string, string> = {
  CONNECT: '@powerhousedao/connect',
  SWITCHBOARD: '@powerhousedao/switchboard',
}

function ServiceRow({
  serviceType,
  prefix,
  subdomain,
  customDomain,
  customDomainValid,
  isEnabled,
  serviceStatus,
  environmentStatus,
  currentVersion,
  onToggle,
  onSetVersion,
}: {
  serviceType: CloudEnvironmentServiceType
  prefix: string
  subdomain: string | null
  customDomain?: string | null
  customDomainValid?: boolean
  isEnabled: boolean
  serviceStatus: string
  environmentStatus: string
  currentVersion: string | null
  onToggle: (enabled: boolean) => Promise<void>
  onSetVersion?: (version: string) => Promise<void>
}) {
  const [isToggling, setIsToggling] = useState(false)
  const [showVersionPicker, setShowVersionPicker] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [distTags, setDistTags] = useState<Record<string, string>>({})
  const [tagsLoading, setTagsLoading] = useState(false)
  const npmPackage = SERVICE_NPM_PACKAGES[serviceType]
  const label = SERVICE_LABELS[serviceType]
  const Icon = SERVICE_ICONS[serviceType]
  const image = SERVICE_IMAGES[serviceType]
  const defaultUrl = subdomain
    ? `${prefix}.${subdomain}.vetra.io`
    : `${prefix}.<subdomain>.vetra.io`
  const serviceUrl =
    customDomain && customDomainValid !== false ? `${prefix}.${customDomain}` : defaultUrl

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

  const loadTags = async () => {
    if (tags.length > 0) {
      setShowVersionPicker(!showVersionPicker)
      return
    }
    if (!npmPackage) return
    setShowVersionPicker(true)
    setTagsLoading(true)
    try {
      const res = await fetch(`https://registry.npmjs.org/${npmPackage}`)
      if (res.ok) {
        const data = (await res.json()) as {
          'dist-tags': Record<string, string>
          versions: Record<string, unknown>
        }
        setDistTags(data['dist-tags'] ?? {})
        setTags(Object.keys(data.versions ?? {}).reverse())
      }
    } finally {
      setTagsLoading(false)
    }
  }

  const handleSetVersion = async (version: string) => {
    if (!onSetVersion) return
    const versionWithPrefix = version.startsWith('v') ? version : `v${version}`
    try {
      await onSetVersion(versionWithPrefix)
      toast.success(`${label} version set to ${versionWithPrefix}`)
      setShowVersionPicker(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to set ${label} version`)
    }
  }

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-colors',
        isEnabled
          ? 'border-emerald-500/30 bg-emerald-500/5 dark:border-emerald-500/20 dark:bg-emerald-500/5'
          : 'border-border/50 bg-muted/30 opacity-70',
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-md',
              isEnabled ? 'bg-emerald-500/15 dark:bg-emerald-500/20' : 'bg-muted',
            )}
          >
            <Icon
              className={cn(
                'h-5 w-5',
                isEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
              )}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn('text-sm font-medium', !isEnabled && 'text-muted-foreground')}>
                {label}
              </span>
              {isEnabled && <StatusDot status={serviceStatus} />}
              {!isEnabled && (
                <Badge
                  variant="outline"
                  className="text-muted-foreground border-border/50 px-1.5 py-0 text-[10px]"
                >
                  OFF
                </Badge>
              )}
            </div>
            {isEnabled && environmentStatus === 'READY' ? (
              <a
                href={`https://${serviceUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 truncate font-mono text-xs underline underline-offset-2"
              >
                https://{serviceUrl}
              </a>
            ) : (
              <span className="text-muted-foreground/60 font-mono text-xs">{serviceUrl}</span>
            )}
          </div>
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={handleToggle}
          disabled={isToggling}
          aria-label={`Toggle ${label}`}
          className={cn(
            isEnabled
              ? 'data-[state=checked]:bg-emerald-500'
              : 'data-[state=unchecked]:bg-zinc-400 dark:data-[state=unchecked]:bg-zinc-600',
          )}
        />
      </div>

      {/* Version & image info */}
      {isEnabled && (
        <div className="mt-3 space-y-2 border-t border-emerald-500/10 pt-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            {image && (
              <span className="text-muted-foreground">
                <span className="font-medium">Image:</span>{' '}
                <span className="font-mono">{image}</span>
              </span>
            )}
            {npmPackage && (
              <span className="text-muted-foreground">
                <span className="font-medium">Package:</span>{' '}
                <span className="font-mono">{npmPackage}</span>
              </span>
            )}
            <span className="text-muted-foreground">
              <span className="font-medium">Version:</span>{' '}
              <span className="font-mono">{currentVersion ?? 'not set'}</span>
            </span>
          </div>
          {onSetVersion && (
            <div>
              <button
                onClick={loadTags}
                className="text-primary hover:text-primary/80 text-xs font-medium hover:underline"
              >
                {showVersionPicker ? 'Hide versions' : 'Change version'}
              </button>
              {showVersionPicker && (
                <div className="mt-2 space-y-2">
                  {/* Dist tags as quick picks */}
                  {Object.keys(distTags).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(distTags).map(([tag, version]) => (
                        <button
                          key={tag}
                          onClick={() => handleSetVersion(version)}
                          className={cn(
                            'flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] transition-colors hover:border-primary hover:bg-primary/5',
                            version === currentVersion && 'border-primary bg-primary/5',
                          )}
                        >
                          <span className="font-semibold">{tag}</span>
                          <span className="text-muted-foreground font-mono">{version}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Full version list */}
                  <div className="max-h-48 overflow-y-auto rounded-md border bg-card">
                    {tagsLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="text-muted-foreground size-4 animate-spin" />
                      </div>
                    ) : tags.length === 0 ? (
                      <p className="text-muted-foreground p-4 text-center text-xs">
                        No versions available.
                      </p>
                    ) : (
                      tags.map((tag) => {
                        const tagLabel = Object.entries(distTags).find(([, v]) => v === tag)?.[0]
                        return (
                          <button
                            key={tag}
                            onClick={() => handleSetVersion(tag)}
                            className={cn(
                              'flex w-full items-center justify-between px-3 py-1.5 text-left text-xs transition-colors hover:bg-accent',
                              tag === currentVersion && 'bg-primary/5',
                            )}
                          >
                            <span className="font-mono">{tag}</span>
                            <div className="flex items-center gap-1">
                              {tagLabel && (
                                <Badge variant="secondary" className="text-[9px]">{tagLabel}</Badge>
                              )}
                              {tag === currentVersion && (
                                <Badge variant="default" className="text-[9px]">current</Badge>
                              )}
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// CustomDomainSection
// ---------------------------------------------------------------------------

function CustomDomainSection({
  customDomain,
  onSetCustomDomain,
}: {
  customDomain: CloudEnvironment['state']['customDomain']
  onSetCustomDomain: (enabled: boolean, domain?: string | null) => Promise<void>
}) {
  const [domainInput, setDomainInput] = useState(customDomain?.domain ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [dnsResults, setDnsResults] = useState<Record<string, boolean | null>>({})
  const [isVerifying, setIsVerifying] = useState(false)
  const enabled = customDomain?.enabled ?? false
  const records = customDomain?.dnsRecords ?? []

  const handleToggle = async (checked: boolean) => {
    setIsSaving(true)
    try {
      await onSetCustomDomain(checked, checked ? domainInput || undefined : undefined)
      if (!checked) setDomainInput('')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveDomain = async () => {
    if (!domainInput.trim()) return
    setIsSaving(true)
    try {
      await onSetCustomDomain(true, domainInput.trim())
    } finally {
      setIsSaving(false)
    }
  }

  const handleVerifyDns = async () => {
    if (records.length === 0) return
    setIsVerifying(true)
    const results: Record<string, boolean | null> = {}
    for (const record of records) {
      try {
        const res = await fetch(
          `https://dns.google/resolve?name=${encodeURIComponent(record.host)}&type=A`,
        )
        const data = await res.json()
        const answers = (data.Answer ?? []) as Array<{ data: string }>
        results[record.host] = answers.some((a: { data: string }) => a.data === record.value)
      } catch {
        results[record.host] = null
      }
    }
    setDnsResults(results)
    setIsVerifying(false)
  }

  return (
    <>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Checkbox
            id="custom-domain"
            checked={enabled}
            onCheckedChange={(checked) => handleToggle(checked === true)}
            disabled={isSaving}
          />
          <label htmlFor="custom-domain" className="text-sm font-medium">
            Custom Domain
          </label>
        </div>
        {enabled && (
          <div className="flex gap-2 pt-1">
            <Input
              placeholder="e.g. my-app.example.com"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveDomain()
              }}
              className="font-mono text-sm"
            />
            <Button
              size="sm"
              onClick={handleSaveDomain}
              disabled={isSaving || !domainInput.trim() || domainInput === customDomain?.domain}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        )}
      </div>

      {records.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-muted-foreground text-sm font-medium">DNS Records</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={handleVerifyDns}
              disabled={isVerifying}
              className="text-xs"
            >
              {isVerifying ? 'Verifying...' : 'Verify DNS'}
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Host</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="w-16">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record, i) => {
                const status = dnsResults[record.host]
                return (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">{record.type}</TableCell>
                    <TableCell className="font-mono text-xs">{record.host}</TableCell>
                    <TableCell className="font-mono text-xs">{record.value}</TableCell>
                    <TableCell>
                      {status === true && <span className="text-xs text-emerald-500">Valid</span>}
                      {status === false && <span className="text-xs text-red-500">Missing</span>}
                      {status === null && <span className="text-xs text-amber-500">Error</span>}
                      {status === undefined && (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <p className="text-muted-foreground text-xs">
            Add these A records to your DNS provider. Verification uses Google DNS.
          </p>
        </div>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// InlineEditableTitle
// ---------------------------------------------------------------------------

export function InlineEditableTitle({
  value,
  onSave,
}: {
  value: string
  onSave: (name: string) => Promise<void>
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = async () => {
    const trimmed = editValue.trim()
    if (!trimmed || trimmed === value) {
      setEditValue(value)
      setIsEditing(false)
      return
    }
    try {
      setIsSaving(true)
      await onSave(trimmed)
      toast.success('Name updated')
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update name:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update name')
      setEditValue(value)
      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') handleCancel()
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          disabled={isSaving}
          className="h-9 text-2xl font-bold"
        />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleSave}
          disabled={isSaving}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <h2 className="text-2xl font-bold">{value}</h2>
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
        onClick={() => {
          setEditValue(value)
          setIsEditing(true)
        }}
      >
        <Pencil className="h-4 w-4" />
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// OverviewTab props + component
// ---------------------------------------------------------------------------

type OverviewTabProps = {
  subdomain: string | null
  tenantId: string | null
  environment: CloudEnvironment
  onTabChange?: (tab: string) => void
  enableService: (type: CloudEnvironmentServiceType, prefix: string) => Promise<void>
  disableService: (type: CloudEnvironmentServiceType) => Promise<void>
  addPackage: (name: string, version?: string) => Promise<void>
  removePackage: (name: string) => Promise<void>
  setCustomDomain: (enabled: boolean, domain?: string | null) => Promise<void>
  onTerminate?: () => Promise<void>
  onDelete?: () => void
  setServiceVersion?: (type: CloudEnvironmentServiceType, version: string) => Promise<void>
  setPackageVersion?: (packageName: string, version: string) => Promise<void>
  initialAddPackage?: string | null
  initialAddVersion?: string | null
}

export function OverviewTab({
  subdomain,
  tenantId,
  environment,
  onTabChange,
  enableService,
  disableService,
  addPackage,
  removePackage,
  setCustomDomain,
  onTerminate,
  onDelete,
  setServiceVersion,
  setPackageVersion,
  initialAddPackage,
  initialAddVersion,
}: OverviewTabProps) {
  const renown = useRenown()
  const router = useRouter()
  const {
    status,
    pods,
    isLoading: statusLoading,
  } = useEnvironmentStatus(subdomain, tenantId, environment.id)
  const { events, isLoading: eventsLoading } = useEnvironmentEvents(
    subdomain,
    tenantId,
    5,
    environment.id,
  )
  const [isDeleting, setIsDeleting] = useState(false)

  const state = environment.state
  const { updates: serviceUpdates } = useServiceUpdates(state.services)
  const { updates: packageUpdates } = usePackageUpdates(
    state.packages,
    state.defaultPackageRegistry ?? null,
  )
  const baseDomain = state.genericBaseDomain ?? 'vetra.io'
  const genericDomain = subdomain ? `${subdomain}.${baseDomain}` : `<subdomain>.${baseDomain}`

  const defaultPrefixes: Record<CloudEnvironmentServiceType, string> = {
    CONNECT: 'connect',
    SWITCHBOARD: 'switchboard',
    FUSION: 'fusion',
  }

  const getServiceEnabled = (type: CloudEnvironmentServiceType) =>
    state.services.find((s) => s.type === type)

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
      {/* a. Status Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* ArgoCD Card */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              {status?.argoSyncStatus === 'SYNCED' ? (
                <CheckCircle className="h-4 w-4 text-[#04c161]" />
              ) : (
                <XCircle className="h-4 w-4 text-[#ea4335]" />
              )}
              <span className="text-sm font-medium">ArgoCD</span>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-muted-foreground text-xs">
                Sync:{' '}
                <span className="text-foreground font-medium">
                  {statusLoading ? '...' : (status?.argoSyncStatus ?? 'Unknown')}
                </span>
              </p>
              <p className="text-muted-foreground text-xs">
                Health:{' '}
                <span className="text-foreground font-medium">
                  {statusLoading ? '...' : (status?.argoHealthStatus ?? 'Unknown')}
                </span>
              </p>
              {status?.argoLastSyncedAt && (
                <p className="text-muted-foreground text-xs">
                  Last synced: {new Date(status.argoLastSyncedAt).toLocaleTimeString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Config Card */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              {status?.configDriftDetected ? (
                <AlertTriangle className="h-4 w-4 text-[#ffa132]" />
              ) : (
                <CheckCircle className="h-4 w-4 text-[#04c161]" />
              )}
              <span className="text-sm font-medium">Config</span>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-muted-foreground text-xs">
                Drift:{' '}
                <span className="text-foreground font-medium">
                  {statusLoading ? '...' : status?.configDriftDetected ? 'Detected' : 'None'}
                </span>
              </p>
              {status?.argoMessage && (
                <p className="text-muted-foreground line-clamp-2 text-xs">{status.argoMessage}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Domain Card */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Globe className="text-muted-foreground h-4 w-4" />
              <span className="text-sm font-medium">Domain</span>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-muted-foreground text-xs">
                Resolves:{' '}
                <span className="text-foreground font-medium">
                  {statusLoading
                    ? '...'
                    : status?.domainResolves === null
                      ? 'Unknown'
                      : status?.domainResolves
                        ? 'Yes'
                        : 'No'}
                </span>
              </p>
              <p className="text-muted-foreground flex items-center gap-1 text-xs">
                TLS:{' '}
                {status?.tlsCertValid ? (
                  <ShieldCheck className="h-3 w-3 text-[#04c161]" />
                ) : (
                  <ShieldOff className="h-3 w-3 text-[#ea4335]" />
                )}
                <span className="text-foreground font-medium">
                  {statusLoading
                    ? '...'
                    : status?.tlsCertValid === null
                      ? 'Unknown'
                      : status?.tlsCertValid
                        ? 'Valid'
                        : 'Invalid'}
                </span>
              </p>
              {status?.tlsCertExpiresAt && (
                <p className="text-muted-foreground text-xs">
                  Expires: {new Date(status.tlsCertExpiresAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* b. Available Updates */}
      {setServiceVersion && setPackageVersion && (
        <AvailableUpdatesCard
          serviceUpdates={serviceUpdates}
          packageUpdates={packageUpdates}
          onUpdateService={(type, version) =>
            setServiceVersion(type as CloudEnvironmentServiceType, version)
          }
          onUpdatePackage={setPackageVersion}
        />
      )}

      {/* c. Services + Packages side-by-side on large screens */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Services Section (interactive toggles) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="h-4 w-4" />
              Services
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(['CONNECT', 'SWITCHBOARD', 'FUSION'] as const).map((type) => {
              const service = getServiceEnabled(type)
              return (
                <ServiceRow
                  key={type}
                  serviceType={type}
                  prefix={service?.prefix ?? defaultPrefixes[type]}
                  subdomain={subdomain}
                  customDomain={state.customDomain?.enabled ? state.customDomain.domain : null}
                  customDomainValid={
                    status?.domainResolves === true && status?.tlsCertValid === true
                  }
                  isEnabled={service?.enabled ?? false}
                  serviceStatus={service?.status ?? 'PROVISIONING'}
                  environmentStatus={state.status}
                  currentVersion={service?.version ?? null}
                  onToggle={(enabled) =>
                    enabled
                      ? enableService(type, service?.prefix ?? defaultPrefixes[type])
                      : disableService(type)
                  }
                  onSetVersion={
                    setServiceVersion
                      ? (version) => setServiceVersion(type, version)
                      : undefined
                  }
                />
              )
            })}
          </CardContent>
        </Card>

        {/* Packages Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4" />
                Reactor Modules
              </CardTitle>
              <AddPackageModal
                registryUrl={state.defaultPackageRegistry ?? 'https://registry.dev.vetra.io'}
                onAdd={addPackage}
                initialPackage={initialAddPackage}
                initialVersion={initialAddVersion}
                initialOpen={!!initialAddPackage}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {state.packages.length > 0 ? (
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
      </div>

      {/* d. Domain Configuration */}
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

          <CustomDomainSection
            customDomain={state.customDomain}
            onSetCustomDomain={setCustomDomain}
          />
        </CardContent>
      </Card>

      {/* e. Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground text-xs"
              onClick={() => onTabChange?.('deployments')}
            >
              View all
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <EventTimeline events={events} isLoading={eventsLoading} />
        </CardContent>
      </Card>

      {/* f. Metadata */}
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

      {/* g. Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2 text-base">
            <Trash2 className="h-4 w-4" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {onTerminate &&
            !['DRAFT', 'TERMINATING', 'DESTROYED', 'ARCHIVED'].includes(state.status) && (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Terminate Environment</p>
                  <p className="text-muted-foreground text-sm">
                    Stop all services and begin teardown. The environment can be archived after
                    termination.
                  </p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => onTerminate()}>
                  Terminate
                </Button>
              </div>
            )}
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
                    Are you sure you want to delete &ldquo;{state.label || environment.name}&rdquo;?
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
