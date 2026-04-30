'use client'

import { Bot, Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { useRenown } from '@powerhousedao/reactor-browser'
import { isAgentPackageName, validateAgentManifest } from '@/modules/cloud/lib/agent-discovery'
import { buildSystemEnvPreview, isReservedEnvName } from '@/modules/cloud/lib/system-env-vars'
import {
  useRegistryManifest,
  useRegistryManifests,
  useRegistryPackages,
  useRegistryVersions,
} from '@/modules/cloud/hooks/use-registry-search'
import { applyConfigChanges, computeConfigChanges } from '@/modules/cloud/config/apply'
import { buildCollisionMap } from '@/modules/cloud/config/collisions'
import {
  initialConfigFormState,
  PackageConfigForm,
  validateConfigForm,
  type ConfigFormState,
} from '@/modules/cloud/components/package-config-form'
import { useTenantConfig } from '@/modules/cloud/hooks/use-tenant-config'
import type {
  CloudEnvironment,
  CloudPackage,
  CloudResourceSize,
  CloudServiceClintConfig,
  CloudServiceEnv,
} from '@/modules/cloud/types'
import { Button } from '@/modules/shared/components/ui/button'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/modules/shared/components/ui/dialog'
import { Input } from '@/modules/shared/components/ui/input'
import { Label } from '@/modules/shared/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shared/components/ui/popover'
import { Textarea } from '@/modules/shared/components/ui/textarea'
import { ResourceSizePicker } from './resource-size-picker'
import { EnvVarsEditor } from './env-vars-editor'

const PREFIX_RE = /^[a-z0-9-]+$/

const SIZE_TO_TS: Record<string, CloudResourceSize> = {
  'vetra-agent-s': 'VETRA_AGENT_S',
  'vetra-agent-m': 'VETRA_AGENT_M',
  'vetra-agent-l': 'VETRA_AGENT_L',
  'vetra-agent-xl': 'VETRA_AGENT_XL',
  'vetra-agent-xxl': 'VETRA_AGENT_XXL',
}

function sanitize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export type AddAgentSubmitPayload = {
  packageName: string
  version: string | undefined
  prefix: string
  clintConfig: CloudServiceClintConfig
}

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  env: CloudEnvironment
  registryUrl: string | null
  tenantId: string | null
  installedPackages: CloudPackage[]
  onSubmit: (payload: AddAgentSubmitPayload) => Promise<void>
  /** Optional initial selection — used in tests / deep-links. */
  defaultSelectedPackage?: string
}

export function AddAgentModal({
  open,
  onOpenChange,
  registryUrl,
  env,
  tenantId,
  installedPackages,
  onSubmit,
  defaultSelectedPackage,
}: Props) {
  const [search, setSearch] = useState('')
  const [selectedPackage, setSelectedPackage] = useState<string | null>(
    defaultSelectedPackage ?? null,
  )
  const [selectedVersion, setSelectedVersion] = useState<string>('')
  const [versionPopoverOpen, setVersionPopoverOpen] = useState(false)
  const [prefix, setPrefix] = useState('')
  const [serviceCommand, setServiceCommand] = useState('')
  const [selectedRessource, setSelectedRessource] = useState<CloudResourceSize | null>(null)

  const { packages, isLoading: packagesLoading } = useRegistryPackages(registryUrl, search)
  const agentPackages = useMemo(
    () => packages.filter((p) => isAgentPackageName(p.name)),
    [packages],
  )

  const { info: versionInfo, isLoading: versionsLoading } = useRegistryVersions(
    registryUrl,
    selectedPackage,
  )

  const { manifest, isLoading: manifestLoading } = useRegistryManifest(
    registryUrl,
    selectedPackage,
    null, // version selected later in B.5
  )
  const validation = useMemo(
    () => (selectedPackage ? validateAgentManifest(manifest) : null),
    [selectedPackage, manifest],
  )
  const agentInfo =
    validation?.ok && validation.manifest.features?.agent
      ? validation.manifest.features.agent
      : null

  useEffect(() => {
    if (!validation?.ok) return
    const m = validation.manifest
    const agent = m.features?.agent || null
    const agentId = agent && typeof agent === 'object' ? agent.id : null
    const defaultPrefix = agentId ? sanitize(agentId) : sanitize(m.name)
    setPrefix(defaultPrefix)
    setServiceCommand(m.serviceCommand ?? '')
    const supported = (m.supportedResources ?? []).map((s) => SIZE_TO_TS[s]).filter(Boolean)
    setSelectedRessource(supported[0] ?? null)
    setSelectedVersion('')
  }, [validation])

  const existingByPrefix = useMemo(
    () => new Map(env.state.services.map((s) => [s.prefix, s])),
    [env.state.services],
  )
  const prefixError = useMemo<{ kind: 'format' | 'collision'; message: string } | null>(() => {
    if (!prefix) return null
    if (!PREFIX_RE.test(prefix))
      return { kind: 'format', message: 'lowercase letters, digits, and hyphens only' }
    const collide = existingByPrefix.get(prefix)
    if (collide) {
      return {
        kind: 'collision',
        message: `Prefix '${prefix}' is used by an existing ${collide.type.toLowerCase()} service`,
      }
    }
    return null
  }, [prefix, existingByPrefix])

  const supportedSizes = useMemo<CloudResourceSize[]>(
    () =>
      validation?.ok
        ? (validation.manifest.supportedResources ?? []).map((s) => SIZE_TO_TS[s]).filter(Boolean)
        : [],
    [validation],
  )

  const [customEnvVars, setCustomEnvVars] = useState<CloudServiceEnv[]>([])
  const [submitError, setSubmitError] = useState<string | null>(null)

  const renown = useRenown()
  const [configState, setConfigState] = useState<ConfigFormState>({})
  const { envVars, secrets } = useTenantConfig(open ? tenantId : null)
  const existingVarValues = useMemo(
    () => Object.fromEntries(envVars.map((v) => [v.key, v.value])),
    [envVars],
  )
  const existingSecretKeys = useMemo(() => new Set(secrets.map((s) => s.key)), [secrets])

  const manifestConfigNames = useMemo(
    () => new Set(validation?.ok ? (validation.manifest.config ?? []).map((c) => c.name) : []),
    [validation],
  )

  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!validation?.ok || !selectedPackage || !prefix || prefixError || !selectedRessource) return
    setSubmitError(null)

    // Reservation check
    const shadowed = customEnvVars.find(
      (v) => v.name && (isReservedEnvName(v.name) || manifestConfigNames.has(v.name)),
    )
    if (shadowed) {
      setSubmitError(
        `"${shadowed.name}" is reserved (set by the platform or declared by the agent). Pick another name.`,
      )
      return
    }

    // Required manifest-config check
    if ((validation.manifest.config?.length ?? 0) > 0 && tenantId) {
      const missing = validateConfigForm(validation.manifest.config ?? [], configState, {
        existingVarValues,
        existingSecretKeys,
        collisions,
        ownerPackageName: selectedPackage,
      })
      if (missing.length > 0) {
        setSubmitError(`Missing required config: ${missing.join(', ')}`)
        return
      }
    }

    setSubmitting(true)
    try {
      if ((validation.manifest.config?.length ?? 0) > 0 && tenantId) {
        const changes = computeConfigChanges(
          validation.manifest.config ?? [],
          configState,
          existingVarValues,
        )
        if (changes.length > 0) {
          await applyConfigChanges(tenantId, changes, renown)
        }
      }
      await onSubmit({
        packageName: selectedPackage,
        version: selectedVersion || undefined,
        prefix,
        clintConfig: {
          package: {
            registry: registryUrl ?? '',
            name: selectedPackage,
            version: selectedVersion || null,
          },
          env: customEnvVars.filter((v) => v.name.trim()),
          serviceCommand: serviceCommand.trim() || null,
          selectedRessource,
        },
      })
      onOpenChange(false)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to install agent')
    } finally {
      setSubmitting(false)
    }
  }

  const installedForFetch = useMemo(
    () => (open ? installedPackages.map((p) => ({ name: p.name, version: p.version })) : []),
    [open, installedPackages],
  )
  const { manifests: installedManifests } = useRegistryManifests(registryUrl, installedForFetch)

  const collisions = useMemo(() => {
    const fromInstalled = installedManifests.map((m) => ({
      packageName: m.packageName,
      manifest: m.manifest,
    }))
    const candidate =
      selectedPackage && validation?.ok
        ? [{ packageName: selectedPackage, manifest: validation.manifest }]
        : []
    return buildCollisionMap([...fromInstalled, ...candidate])
  }, [installedManifests, validation, selectedPackage])

  useEffect(() => {
    if (!validation?.ok || !selectedPackage) {
      setConfigState({})
      return
    }
    const entries = validation.manifest.config ?? []
    if (entries.length === 0) {
      setConfigState({})
      return
    }
    setConfigState(
      initialConfigFormState(entries, {
        existingVarValues,
        existingSecretKeys,
        collisions,
        ownerPackageName: selectedPackage,
      }),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validation, selectedPackage])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Agent</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Pick an agent</label>
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search agents (packages ending in -cli)…"
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                {packagesLoading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                  </div>
                )}
                {!packagesLoading && agentPackages.length === 0 && (
                  <CommandEmpty>
                    {registryUrl ? 'No agents found.' : 'No registry configured.'}
                  </CommandEmpty>
                )}
                <CommandGroup>
                  {agentPackages.map((pkg) => (
                    <CommandItem
                      key={pkg.name}
                      value={pkg.name}
                      onSelect={() => setSelectedPackage(pkg.name)}
                    >
                      <Bot className="text-muted-foreground mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">{pkg.name}</span>
                        <span className="text-muted-foreground text-xs">latest: {pkg.version}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
          {selectedPackage && manifestLoading && (
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading manifest…
            </div>
          )}
          {validation && !validation.ok && validation.reason === 'not-clint' && (
            <p className="text-destructive text-xs">
              {"This package isn't a Powerhouse agent. Pick another or contact the package author."}
            </p>
          )}
          {agentInfo && (
            <div className="bg-muted/40 flex items-start gap-3 rounded-md border p-3">
              <div className="bg-muted flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md">
                {agentInfo.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={agentInfo.image}
                    alt={agentInfo.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Bot className="text-muted-foreground h-6 w-6" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{agentInfo.name}</div>
                {agentInfo.description && (
                  <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                    {agentInfo.description}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Version */}
          {selectedPackage && (
            <div className="space-y-2">
              <Label>Version</Label>
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

          {/* Prefix */}
          {validation?.ok && (
            <div className="space-y-2">
              <Label htmlFor="prefix">Prefix</Label>
              <Input
                id="prefix"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                aria-invalid={!!prefixError}
                placeholder="agent"
              />
              {prefixError && <p className="text-destructive text-xs">{prefixError.message}</p>}
            </div>
          )}

          {/* Resource size */}
          {validation?.ok && supportedSizes.length > 0 && (
            <div className="space-y-2">
              <Label>Resource size</Label>
              <ResourceSizePicker
                supported={supportedSizes}
                value={selectedRessource}
                onChange={setSelectedRessource}
              />
            </div>
          )}

          {/* Service command */}
          {validation?.ok && (
            <div className="space-y-2">
              <Label htmlFor="cmd">Service command</Label>
              <Textarea
                id="cmd"
                value={serviceCommand}
                onChange={(e) => setServiceCommand(e.target.value)}
                className="font-mono text-sm"
                rows={2}
              />
              {validation.manifest.serviceCommand &&
                serviceCommand !== validation.manifest.serviceCommand && (
                  <button
                    type="button"
                    className="text-primary mt-1 text-xs underline-offset-2 hover:underline"
                    onClick={() => setServiceCommand(validation.manifest.serviceCommand ?? '')}
                  >
                    Reset to default
                  </button>
                )}
            </div>
          )}

          {/* System env vars */}
          {validation?.ok && (
            <div className="space-y-2">
              <Label>System (set by the platform)</Label>
              <dl className="bg-muted/30 divide-border divide-y rounded-md border text-xs">
                {buildSystemEnvPreview({ environmentId: env.id, prefix }).map((row) => (
                  <div key={row.name} className="grid grid-cols-[max-content_1fr] gap-3 px-3 py-2">
                    <dt className="text-muted-foreground font-mono">{row.name}</dt>
                    <dd className="font-mono break-all">{row.preview}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-muted-foreground text-xs">
                These are set automatically when the agent runs. Listed here so you can see what the
                agent will receive.
              </p>
            </div>
          )}

          {/* Manifest config */}
          {validation?.ok && (validation.manifest.config?.length ?? 0) > 0 && tenantId !== null && (
            <div className="space-y-2">
              <Label>Required by the agent</Label>
              <PackageConfigForm
                manifest={validation.manifest}
                state={configState}
                onChange={setConfigState}
                ctx={{
                  existingVarValues,
                  existingSecretKeys,
                  collisions,
                  ownerPackageName: selectedPackage!,
                }}
              />
            </div>
          )}

          {/* Custom env vars */}
          {validation?.ok && (
            <div className="space-y-2">
              <Label>Custom environment variables</Label>
              <EnvVarsEditor value={customEnvVars} onChange={setCustomEnvVars} />
            </div>
          )}
          {submitError && <p className="text-destructive text-sm">{submitError}</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !validation?.ok || !!prefixError || !prefix || !selectedRessource || submitting
            }
          >
            {submitting ? 'Installing…' : 'Install agent'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
