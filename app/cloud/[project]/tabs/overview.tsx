'use client'

import { loadEnvironmentController } from '@/modules/cloud/controller'
import { useCanSign } from '@/modules/cloud/hooks/use-can-sign'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  ShieldOff,
  Bot,
  Globe,
  Package,
  Server,
  Zap,
  Trash2,
  Pencil,
  Check,
  X,
  Loader2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'

import { AddPackageModal } from '@/modules/cloud/components/add-package-modal'
import { AgentsSection } from '@/modules/cloud/components/agents-section'
import { AddAgentModal } from '@/modules/cloud/components/add-agent-modal'
import { AutoUpdateCard } from '@/modules/cloud/components/auto-update-card'
import { AvailableUpdatesCard } from '@/modules/cloud/components/available-updates-card'
import { EventTimeline } from '@/modules/cloud/components/event-timeline'
import { PackageRow } from '@/modules/cloud/components/package-row'
import { ServiceSizePopover } from '@/modules/cloud/components/service-size-popover'
import { useClintPackages } from '@/modules/cloud/hooks/use-clint-packages'
import { useClintRuntimeEndpoints } from '@/modules/cloud/hooks/use-clint-runtime-endpoints'
import { partitionPackagesByManifestType } from '@/modules/cloud/lib/module-package-filter'
import { useEnvironmentEvents } from '@/modules/cloud/hooks/use-environment-events'
import { useOptimistic } from '@/modules/cloud/hooks/use-optimistic'
import { usePackageUpdates } from '@/modules/cloud/hooks/use-package-updates'
import { useServiceUpdates } from '@/modules/cloud/hooks/use-service-updates'
import type {
  CloudEnvironment,
  CloudEnvironmentServiceType,
  EnvironmentStatus,
} from '@/modules/cloud/types'
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
// ServiceRow (toggle version with Switch)
// ---------------------------------------------------------------------------

const SERVICE_LABELS: Record<CloudEnvironmentServiceType, string> = {
  CONNECT: 'Powerhouse Connect',
  SWITCHBOARD: 'Powerhouse Switchboard',
  FUSION: 'Powerhouse Fusion',
  CLINT: 'Agent',
}

const SERVICE_ICONS: Record<
  CloudEnvironmentServiceType,
  React.ComponentType<{ className?: string }>
> = {
  CONNECT: Globe,
  SWITCHBOARD: Server,
  FUSION: Zap,
  CLINT: Bot,
}

const SERVICE_IMAGES: Record<string, string> = {
  CONNECT: 'cr.vetra.io/powerhouse-inc-powerhouse/connect',
  SWITCHBOARD: 'cr.vetra.io/powerhouse-inc-powerhouse/switchboard',
  // FUSION services are arbitrary front-ends. The default points at the
  // DeFi United landing app published from defi-united-web. Operators can
  // swap this once a per-service image override lands on the doc model.
  FUSION: 'cr.vetra.io/defi-united/web',
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
  isApexService,
  isEnabled: serverIsEnabled,
  serviceStatus,
  environmentStatus,
  currentVersion,
  selectedRessource,
  canResize,
  onToggle,
  onSetVersion,
  onResize,
}: {
  serviceType: CloudEnvironmentServiceType
  prefix: string
  subdomain: string | null
  customDomain?: string | null
  customDomainValid?: boolean
  /** Whether this service is pinned to the apex of the custom domain. */
  isApexService?: boolean
  isEnabled: boolean
  serviceStatus: string
  environmentStatus: string
  currentVersion: string | null
  selectedRessource: import('@/modules/cloud/types').CloudResourceSize | null
  canResize: boolean
  onToggle: (enabled: boolean) => Promise<void>
  onSetVersion?: (version: string) => Promise<void>
  onResize?: (size: import('@/modules/cloud/types').CloudResourceSize) => Promise<void>
}) {
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
  const customServiceUrl =
    customDomain && customDomainValid !== false
      ? isApexService
        ? customDomain
        : `${prefix}.${customDomain}`
      : null
  const serviceUrl = customServiceUrl ?? defaultUrl

  const { value: isEnabled, set: toggleEnabled } = useOptimistic(serverIsEnabled, onToggle)

  const commitVersion = useCallback(
    async (next: string | null) => {
      if (next === null || !onSetVersion) return
      await onSetVersion(next)
    },
    [onSetVersion],
  )
  const { value: displayedVersion, set: setVersionOptimistic } = useOptimistic(
    currentVersion,
    commitVersion,
  )

  const handleToggle = async (checked: boolean) => {
    try {
      await toggleEnabled(checked)
      toast.success(`${label} ${checked ? 'enabled' : 'disabled'}`)
    } catch (error) {
      console.error(`Failed to toggle ${label}:`, error)
      toast.error(error instanceof Error ? error.message : `Failed to toggle ${label}`)
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
    setShowVersionPicker(false) // close immediately; the version flips via useOptimistic
    try {
      await setVersionOptimistic(versionWithPrefix)
      toast.success(`${label} version set to ${versionWithPrefix}`)
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
        <div className="flex items-center gap-2">
          {isEnabled && onResize && (
            <ServiceSizePopover
              serviceType={serviceType}
              prefix={prefix}
              currentSize={selectedRessource}
              canEdit={canResize}
              onSave={onResize}
            />
          )}
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggle}
            aria-label={`Toggle ${label}`}
            className={cn(
              isEnabled
                ? 'data-[state=checked]:bg-emerald-500'
                : 'data-[state=unchecked]:bg-zinc-400 dark:data-[state=unchecked]:bg-zinc-600',
            )}
          />
        </div>
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
              <span className="font-mono">{displayedVersion ?? 'not set'}</span>
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
                            'hover:border-primary hover:bg-primary/5 flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] transition-colors',
                            version === displayedVersion && 'border-primary bg-primary/5',
                          )}
                        >
                          <span className="font-semibold">{tag}</span>
                          <span className="text-muted-foreground font-mono">{version}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Full version list */}
                  <div className="bg-card max-h-48 overflow-y-auto rounded-md border">
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
                              'hover:bg-accent flex w-full items-center justify-between px-3 py-1.5 text-left text-xs transition-colors',
                              tag === displayedVersion && 'bg-primary/5',
                            )}
                          >
                            <span className="font-mono">{tag}</span>
                            <div className="flex items-center gap-1">
                              {tagLabel && (
                                <Badge variant="secondary" className="text-[9px]">
                                  {tagLabel}
                                </Badge>
                              )}
                              {tag === displayedVersion && (
                                <Badge variant="default" className="text-[9px]">
                                  current
                                </Badge>
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

/** Domains the cluster's external-dns provider controls directly. DNS A
 * records for hosts under these zones are published automatically from
 * Ingress annotations — no manual setup required on the user's side. */
const OWNED_DNS_ZONES = ['.vetra.io']

function isOwnedDomain(domain: string | null | undefined): boolean {
  if (!domain) return false
  const lower = domain.trim().toLowerCase()
  return OWNED_DNS_ZONES.some((zone) => lower === zone.slice(1) || lower.endsWith(zone))
}

function CustomDomainSection({
  customDomain,
  apexService,
  enabledServices,
  onSetCustomDomain,
}: {
  customDomain: CloudEnvironment['state']['customDomain']
  apexService: CloudEnvironmentServiceType | null
  enabledServices: CloudEnvironmentServiceType[]
  onSetCustomDomain: (
    enabled: boolean,
    domain?: string | null,
    apexService?: CloudEnvironmentServiceType | null,
  ) => Promise<void>
}) {
  const [domainInput, setDomainInput] = useState(customDomain?.domain ?? '')
  const [apexInput, setApexInput] = useState<CloudEnvironmentServiceType | ''>(apexService ?? '')
  const [dnsResults, setDnsResults] = useState<Record<string, boolean | null>>({})
  const [isVerifying, setIsVerifying] = useState(false)
  const records = customDomain?.dnsRecords ?? []
  const domainIsOwned = isOwnedDomain(domainInput || customDomain?.domain)

  const { value: enabled, set: setEnabledOptimistic } = useOptimistic(
    customDomain?.enabled ?? false,
    (next) =>
      onSetCustomDomain(
        next,
        next ? domainInput || undefined : undefined,
        next ? apexInput || null : null,
      ),
  )

  const handleToggle = async (checked: boolean) => {
    try {
      await setEnabledOptimistic(checked)
      if (!checked) {
        setDomainInput('')
        setApexInput('')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update custom domain')
    }
  }

  const handleSaveDomain = async () => {
    if (!domainInput.trim()) return
    try {
      await onSetCustomDomain(true, domainInput.trim(), apexInput || null)
      toast.success('Custom domain saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save custom domain')
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
              disabled={!domainInput.trim() || domainInput === customDomain?.domain}
            >
              Save
            </Button>
          </div>
        )}
      </div>

      {/* Apex routing — only meaningful while a custom domain is set. */}
      {enabled && (
        <div className="space-y-1 pt-2">
          <label htmlFor="apex-service" className="text-muted-foreground text-sm font-medium">
            Serve at apex
          </label>
          <p className="text-muted-foreground text-xs">
            Pin one enabled service to the apex of the custom domain — the service is served at the
            domain itself instead of{' '}
            <span className="font-mono">&lt;prefix&gt;.&lt;domain&gt;</span>.
          </p>
          <select
            id="apex-service"
            className="border-input bg-background h-9 w-full rounded-md border px-3 font-mono text-sm"
            value={apexInput}
            onChange={(e) => setApexInput(e.target.value as CloudEnvironmentServiceType | '')}
          >
            <option value="">None</option>
            {enabledServices.map((s) => (
              <option key={s} value={s}>
                {SERVICE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      )}

      {enabled && domainIsOwned && (
        <div className="space-y-1 pt-2">
          <h4 className="text-muted-foreground text-sm font-medium">DNS</h4>
          <p className="text-muted-foreground text-xs">
            DNS is managed automatically for <span className="font-mono">.vetra.io</span> domains —
            nothing to configure on your side.
          </p>
        </div>
      )}

      {enabled && !domainIsOwned && records.length > 0 && (
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
  const { value: displayValue, set: commitValue } = useOptimistic(value, onSave)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = async () => {
    const trimmed = editValue.trim()
    if (!trimmed || trimmed === displayValue) {
      setEditValue(displayValue)
      setIsEditing(false)
      return
    }
    setIsEditing(false) // close immediately; the title flips via useOptimistic
    try {
      await commitValue(trimmed)
      toast.success('Name updated')
    } catch (error) {
      console.error('Failed to update name:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update name')
    }
  }

  const handleCancel = () => {
    setEditValue(displayValue)
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
          className="h-9 text-2xl font-bold"
        />
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleSave}>
          <Check className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <h2 className="text-2xl font-bold">{displayValue}</h2>
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
        onClick={() => {
          setEditValue(displayValue)
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
  /**
   * Observability status for the environment. Passed in from the parent so
   * the Overview tab and the page-level StatusBadge share a single polling
   * subscription instead of firing the same query twice every 15s.
   */
  status: EnvironmentStatus | null
  /** Pods in the env namespace, shared from the same observability subscription as `status`. */
  pods?: readonly import('@/modules/cloud/types').Pod[]
  statusLoading: boolean
  onTabChange?: (tab: string) => void
  enableService: (
    type: CloudEnvironmentServiceType,
    prefix: string,
    clintConfig?: import('@/modules/cloud/types').CloudServiceClintConfig,
  ) => Promise<void>
  disableService: (type: CloudEnvironmentServiceType, prefix?: string) => Promise<void>
  setServiceConfig?: (
    prefix: string,
    config: import('@/modules/cloud/types').CloudServiceClintConfig,
  ) => Promise<void>
  setServiceSize?: (
    prefix: string,
    size: import('@/modules/cloud/types').CloudResourceSize,
  ) => Promise<void>
  addPackage: (name: string, version?: string) => Promise<void>
  removePackage: (name: string) => Promise<void>
  setCustomDomain: (enabled: boolean, domain?: string | null) => Promise<void>
  onTerminate?: () => Promise<void>
  onDelete?: () => void
  setServiceVersion?: (type: CloudEnvironmentServiceType, version: string) => Promise<void>
  setPackageVersion?: (packageName: string, version: string) => Promise<void>
  setAutoUpdateChannel?: (
    channel: import('@/modules/cloud/types').AutoUpdateChannel | null,
  ) => Promise<void>
  updateToLatest?: () => Promise<string[]>
  rollbackRelease?: () => Promise<string[]>
  initialAddPackage?: string | null
  initialAddVersion?: string | null
}

export function OverviewTab({
  subdomain,
  tenantId,
  environment,
  status,
  pods,
  statusLoading,
  onTabChange,
  enableService,
  disableService,
  setServiceConfig,
  setServiceSize,
  addPackage,
  removePackage,
  setCustomDomain,
  onTerminate,
  onDelete,
  setServiceVersion,
  setPackageVersion,
  setAutoUpdateChannel,
  updateToLatest,
  rollbackRelease,
  initialAddPackage,
  initialAddVersion,
}: OverviewTabProps) {
  const { signer, canSign } = useCanSign()
  const router = useRouter()
  const { events, isLoading: eventsLoading } = useEnvironmentEvents(
    subdomain,
    tenantId,
    5,
    environment.id,
  )
  const [isDeleting, setIsDeleting] = useState(false)
  const [addAgentOpen, setAddAgentOpen] = useState(false)

  const state = environment.state
  const { updates: serviceUpdates } = useServiceUpdates(state.services)
  const { clintPackages } = useClintPackages({
    registry: state.defaultPackageRegistry ?? null,
    packages: state.packages,
  })
  const clintManifestsByName = useMemo(
    () => Object.fromEntries(clintPackages.map((p) => [p.package.name, p.manifest])),
    [clintPackages],
  )
  const { modules: modulePackages } = useMemo(
    () => partitionPackagesByManifestType(state.packages, clintManifestsByName),
    [state.packages, clintManifestsByName],
  )
  const { updates: packageUpdates } = usePackageUpdates(
    modulePackages,
    state.defaultPackageRegistry ?? null,
  )
  const { byPrefix: clintRuntimeEndpointsByPrefix } = useClintRuntimeEndpoints(
    subdomain,
    environment.id,
  )
  const baseDomain = state.genericBaseDomain ?? 'vetra.io'
  const genericDomain = subdomain ? `${subdomain}.${baseDomain}` : `<subdomain>.${baseDomain}`

  const defaultPrefixes: Record<CloudEnvironmentServiceType, string> = {
    CONNECT: 'connect',
    SWITCHBOARD: 'switchboard',
    FUSION: 'fusion',
    CLINT: 'agent',
  }

  const getServiceEnabled = (type: CloudEnvironmentServiceType) =>
    state.services.find((s) => s.type === type)

  const handleDelete = async () => {
    if (!signer) {
      toast.error('You must be logged in with Renown to delete an environment')
      return
    }
    try {
      setIsDeleting(true)
      const ctrl = await loadEnvironmentController({ documentId: environment.id, signer })
      await ctrl.delete()
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

  const hasCustomDomain = state.customDomain?.enabled ?? false

  return (
    <div className="space-y-6">
      {/* a. Status Row */}
      <div className={cn('grid gap-4', hasCustomDomain ? 'grid-cols-3' : 'grid-cols-2')}>
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

        {/* Domain Card — only shown when a custom domain is configured.
            Without one, domainResolves/tlsCertValid come back null from
            the observability subgraph (nothing to probe) and the card
            would just render "Unknown" everywhere. */}
        {hasCustomDomain && (
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
                        ? 'Checking...'
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
                        ? 'Checking...'
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
        )}
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

      {/* b.2 Auto-Update — owner-facing channel subscription, update-now,
          rollback, and release history. Only rendered when the detail
          hook provided its wrappers (signed-in owner path). */}
      {setAutoUpdateChannel && updateToLatest && rollbackRelease && (
        <AutoUpdateCard
          environment={environment}
          onChangeChannel={setAutoUpdateChannel}
          onUpdateNow={updateToLatest}
          onRollback={rollbackRelease}
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
                  isApexService={(state.apexService ?? null) === type}
                  isEnabled={service?.enabled ?? false}
                  serviceStatus={service?.status ?? 'PROVISIONING'}
                  environmentStatus={state.status}
                  currentVersion={service?.version ?? null}
                  selectedRessource={service?.selectedRessource ?? null}
                  canResize={canSign}
                  onToggle={(enabled) =>
                    enabled
                      ? enableService(type, service?.prefix ?? defaultPrefixes[type])
                      : disableService(type)
                  }
                  onSetVersion={
                    setServiceVersion ? (version) => setServiceVersion(type, version) : undefined
                  }
                  onResize={
                    setServiceSize && service
                      ? (size) => setServiceSize(service.prefix, size)
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
                tenantId={tenantId}
                installedPackages={state.packages}
                onAdd={addPackage}
                initialPackage={initialAddPackage}
                initialVersion={initialAddVersion}
                initialOpen={!!initialAddPackage}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {modulePackages.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Package</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead className="w-12 text-right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modulePackages.map((pkg) => (
                    <PackageRow
                      key={pkg.name}
                      pkg={pkg}
                      tenantId={tenantId}
                      registryUrl={state.defaultPackageRegistry ?? 'https://registry.dev.vetra.io'}
                      installedPackages={state.packages}
                      onRemove={removePackage}
                      onSetVersion={setPackageVersion}
                    />
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-8">
                <Package className="text-muted-foreground h-8 w-8" />
                <p className="text-muted-foreground text-sm">No reactor modules installed</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* c.5 Agents (CLINT services) */}
      <Card>
        <CardContent className="pt-6">
          <AgentsSection
            services={state.services}
            env={environment ?? null}
            canEdit={canSign}
            onAddAgent={() => setAddAgentOpen(true)}
            manifests={clintManifestsByName}
            runtimeEndpointsByPrefix={clintRuntimeEndpointsByPrefix}
            pods={pods}
            onSaveConfig={
              setServiceConfig
                ? async (prefix, config) => {
                    await setServiceConfig(prefix, config)
                    toast.success('Agent updated')
                  }
                : undefined
            }
            onDisable={async (prefix) => {
              const svc = state.services.find((s) => s.prefix === prefix)
              if (!svc) return
              await disableService(svc.type, prefix)
              toast.success('Agent removed')
            }}
          />
        </CardContent>
      </Card>
      {canSign && (
        <AddAgentModal
          open={addAgentOpen}
          onOpenChange={setAddAgentOpen}
          env={environment}
          registryUrl={state.defaultPackageRegistry ?? 'https://registry.dev.vetra.io'}
          tenantId={tenantId}
          installedPackages={state.packages}
          onSubmit={async ({ packageName, version, prefix, clintConfig }) => {
            await addPackage(packageName, version)
            await enableService('CLINT', prefix, clintConfig)
            toast.success('Agent installed')
          }}
        />
      )}

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
            apexService={state.apexService ?? null}
            enabledServices={state.services.filter((s) => s.enabled).map((s) => s.type)}
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
