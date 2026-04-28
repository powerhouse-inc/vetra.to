'use client'

import { useEffect, useMemo, useState } from 'react'
import type {
  CloudEnvironment,
  CloudResourceSize,
  CloudServiceClintConfig,
  CloudServiceEnv,
} from '@/modules/cloud/types'
import { useClintPackages } from '@/modules/cloud/hooks/use-clint-packages'
import { composeClintEndpointUrl } from '@/modules/cloud/lib/clint-endpoint-url'
import { Button } from '@/modules/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/modules/shared/components/ui/dialog'
import { Input } from '@/modules/shared/components/ui/input'
import { Label } from '@/modules/shared/components/ui/label'
import { Textarea } from '@/modules/shared/components/ui/textarea'
import { EndpointRow } from './endpoint-row'
import { EnvVarsEditor } from './env-vars-editor'
import { ResourceSizePicker } from './resource-size-picker'

const PREFIX_RE = /^[a-z0-9-]+$/

const SIZE_TO_TS: Record<string, CloudResourceSize> = {
  'vetra-agent-s': 'VETRA_AGENT_S',
  'vetra-agent-m': 'VETRA_AGENT_M',
  'vetra-agent-l': 'VETRA_AGENT_L',
  'vetra-agent-xl': 'VETRA_AGENT_XL',
  'vetra-agent-xxl': 'VETRA_AGENT_XXL',
}

export type EnableClintSubmitPayload = {
  prefix: string
  clintConfig: CloudServiceClintConfig
}

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  env: CloudEnvironment
  onSubmit: (payload: EnableClintSubmitPayload) => Promise<void>
}

export function EnableClintModal({ open, onOpenChange, env, onSubmit }: Props) {
  const { clintPackages, isLoading } = useClintPackages({
    registry: env.state.defaultPackageRegistry ?? null,
    packages: env.state.packages,
  })
  const [selectedIdx, setSelectedIdx] = useState(0)
  const selected = clintPackages[selectedIdx]

  const [prefix, setPrefix] = useState('')
  const [serviceCommand, setServiceCommand] = useState('')
  const [selectedRessource, setSelectedRessource] = useState<CloudResourceSize | null>(null)
  const [enabledEndpoints, setEnabledEndpoints] = useState<Set<string>>(new Set())
  const [envVars, setEnvVars] = useState<CloudServiceEnv[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form whenever the selected package changes (or modal opens fresh).
  useEffect(() => {
    if (!selected || !open) return
    setPrefix(
      selected.package.name
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, ''),
    )
    setServiceCommand(selected.manifest.serviceCommand ?? '')
    const supported = (selected.manifest.supportedResources ?? [])
      .map((s) => SIZE_TO_TS[s])
      .filter(Boolean)
    setSelectedRessource(supported[0] ?? null)
    setEnabledEndpoints(
      new Set(
        (selected.manifest.endpoints ?? []).filter((e) => e.status === 'enabled').map((e) => e.id),
      ),
    )
    setEnvVars([])
    setError(null)
  }, [selected, open])

  const existingPrefixes = useMemo(
    () => new Set(env.state.services.map((s) => s.prefix)),
    [env.state.services],
  )
  const prefixError = useMemo(() => {
    if (!prefix) return null
    if (!PREFIX_RE.test(prefix)) return 'lowercase letters, digits, and hyphens only'
    if (existingPrefixes.has(prefix)) return 'prefix already in use'
    return null
  }, [prefix, existingPrefixes])

  const supportedSizes = useMemo<CloudResourceSize[]>(
    () => (selected?.manifest.supportedResources ?? []).map((s) => SIZE_TO_TS[s]).filter(Boolean),
    [selected],
  )

  const canSubmit = !!selected && !!prefix && !prefixError && !!selectedRessource && !submitting

  const handleSubmit = async () => {
    if (!selected || !canSubmit) return
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit({
        prefix,
        clintConfig: {
          package: selected.package,
          env: envVars.filter((v) => v.name.trim()),
          serviceCommand: serviceCommand.trim() || null,
          selectedRessource,
          enabledEndpoints: Array.from(enabledEndpoints),
        },
      })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable agent')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Agent</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="text-muted-foreground p-4 text-sm">Loading clint packages…</div>
        ) : clintPackages.length === 0 ? (
          <div className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
            No clint packages installed in this environment. Install one first via Packages → Add
            Package.
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="clint-pkg">Clint package</Label>
              <select
                id="clint-pkg"
                className="border-input mt-1 w-full rounded-md border bg-transparent p-2 text-sm"
                value={selectedIdx}
                onChange={(e) => setSelectedIdx(Number(e.target.value))}
              >
                {clintPackages.map((p, i) => (
                  <option key={p.package.name} value={i}>
                    {p.package.name}@{p.package.version ?? 'latest'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="prefix">Prefix</Label>
              <Input
                id="prefix"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                aria-invalid={!!prefixError}
                placeholder="agent"
              />
              {prefixError && <p className="text-destructive mt-1 text-xs">{prefixError}</p>}
            </div>

            {selected && (
              <>
                {supportedSizes.length > 0 && (
                  <div>
                    <Label>Resource size</Label>
                    <div className="mt-2">
                      <ResourceSizePicker
                        supported={supportedSizes}
                        value={selectedRessource}
                        onChange={setSelectedRessource}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="cmd">Service command</Label>
                  <Textarea
                    id="cmd"
                    value={serviceCommand}
                    onChange={(e) => setServiceCommand(e.target.value)}
                    className="font-mono text-sm"
                    rows={2}
                  />
                  {selected.manifest.serviceCommand &&
                    serviceCommand !== selected.manifest.serviceCommand && (
                      <button
                        type="button"
                        className="text-primary mt-1 text-xs underline-offset-2 hover:underline"
                        onClick={() => setServiceCommand(selected.manifest.serviceCommand ?? '')}
                      >
                        Reset to default
                      </button>
                    )}
                </div>

                {(selected.manifest.endpoints ?? []).length > 0 && (
                  <div>
                    <Label>Endpoints</Label>
                    <div className="mt-2 space-y-2">
                      {(selected.manifest.endpoints ?? []).map((ep) => (
                        <EndpointRow
                          key={ep.id}
                          endpoint={ep}
                          url={composeClintEndpointUrl({
                            serviceUrl: null,
                            prefix: prefix || '<prefix>',
                            genericSubdomain: env.state.genericSubdomain,
                            genericBaseDomain: env.state.genericBaseDomain,
                            endpoint: ep,
                          })}
                          checked={enabledEndpoints.has(ep.id)}
                          onCheckedChange={(checked) => {
                            setEnabledEndpoints((prev) => {
                              const next = new Set(prev)
                              if (checked) next.add(ep.id)
                              else next.delete(ep.id)
                              return next
                            })
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label>Environment variables</Label>
                  <div className="mt-2">
                    <EnvVarsEditor value={envVars} onChange={setEnvVars} />
                  </div>
                </div>
              </>
            )}
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {submitting ? 'Enabling…' : 'Enable agent'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
