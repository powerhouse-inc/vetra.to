'use client'

import { Bot } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type {
  CloudEnvironment,
  CloudResourceSize,
  CloudServiceClintConfig,
  CloudServiceEnv,
} from '@/modules/cloud/types'
import { useClintPackages } from '@/modules/cloud/hooks/use-clint-packages'
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
  const [envVars, setEnvVars] = useState<CloudServiceEnv[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form whenever the selected package changes (or modal opens fresh).
  useEffect(() => {
    if (!selected || !open) return
    const agent = selected.manifest.features?.agent || null
    const sanitize = (s: string) =>
      s
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '')
    const defaultPrefix = agent ? sanitize(agent.id) : sanitize(selected.package.name)
    setPrefix(defaultPrefix)
    setServiceCommand(selected.manifest.serviceCommand ?? '')
    const supported = (selected.manifest.supportedResources ?? [])
      .map((s) => SIZE_TO_TS[s])
      .filter(Boolean)
    setSelectedRessource(supported[0] ?? null)
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
        },
      })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable agent')
    } finally {
      setSubmitting(false)
    }
  }

  const agentFeature = selected?.manifest.features?.agent
  const agentInfo = agentFeature || null

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
                  {agentInfo.models && agentInfo.models.length > 0 && (
                    <div className="text-muted-foreground mt-1 font-mono text-[10px]">
                      models:{' '}
                      {agentInfo.models
                        .map((m) => `${m.id}${m.default ? ' (default)' : ''}`)
                        .join(', ')}
                    </div>
                  )}
                </div>
              </div>
            )}

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

                <div>
                  <Label>Environment variables</Label>
                  <div className="mt-2">
                    <EnvVarsEditor value={envVars} onChange={setEnvVars} />
                  </div>
                </div>

                <p className="text-muted-foreground text-xs">
                  Endpoints are reported by the agent at runtime once it starts. They will appear on
                  the agent card after the first announcement.
                </p>
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
