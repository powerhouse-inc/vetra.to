'use client'

import { Bot, ChevronDown, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { PackageManifest } from '@/modules/cloud/config/types'
import type {
  CloudEnvironment,
  CloudEnvironmentService,
  CloudResourceSize,
  CloudServiceClintConfig,
  CloudServiceEnv,
  ServiceStatus,
} from '@/modules/cloud/types'
import { Badge } from '@/modules/shared/components/ui/badge'
import { Button } from '@/modules/shared/components/ui/button'
import { Label } from '@/modules/shared/components/ui/label'
import { Textarea } from '@/modules/shared/components/ui/textarea'
import { EnvVarsEditor } from './env-vars-editor'
import { ResourceSizePicker } from './resource-size-picker'

const SIZE_LABELS: Record<CloudResourceSize, string> = {
  VETRA_AGENT_S: 'Small',
  VETRA_AGENT_M: 'Medium',
  VETRA_AGENT_L: 'Large',
  VETRA_AGENT_XL: 'X-Large',
  VETRA_AGENT_XXL: '2X-Large',
}

const SIZE_TO_TS: Record<string, CloudResourceSize> = {
  'vetra-agent-s': 'VETRA_AGENT_S',
  'vetra-agent-m': 'VETRA_AGENT_M',
  'vetra-agent-l': 'VETRA_AGENT_L',
  'vetra-agent-xl': 'VETRA_AGENT_XL',
  'vetra-agent-xxl': 'VETRA_AGENT_XXL',
}

const STATUS_CLASSES: Record<ServiceStatus, string> = {
  ACTIVE: 'bg-[#04c161]/20 text-[#04c161]',
  PROVISIONING: 'bg-[#ffa132]/20 text-[#ffa132] animate-pulse',
  SUSPENDED: 'bg-muted text-muted-foreground',
  BILLING_ISSUE: 'bg-[#ea4335]/20 text-[#ea4335]',
}

type Props = {
  service: CloudEnvironmentService
  env: CloudEnvironment | null
  canEdit: boolean
  manifest?: PackageManifest | null
  onSave?: (config: CloudServiceClintConfig) => Promise<void>
  onDisable?: () => Promise<void>
}

export function AgentCard({ service, canEdit, manifest, onSave, onDisable }: Props) {
  const [expanded, setExpanded] = useState(false)
  const cfg = service.config

  const agentFeature = manifest?.features?.agent
  const agentInfo = agentFeature || null
  const cardLabel =
    agentInfo?.name ??
    (cfg ? `${cfg.package.name}@${cfg.package.version ?? 'latest'}` : 'unconfigured')
  const sizeLabel = cfg?.selectedRessource ? SIZE_LABELS[cfg.selectedRessource] : null

  // Local form state (only meaningful when expanded + has cfg + manifest).
  const [serviceCommand, setServiceCommand] = useState<string>(cfg?.serviceCommand ?? '')
  const [selectedRessource, setSelectedRessource] = useState<CloudResourceSize | null>(
    cfg?.selectedRessource ?? null,
  )
  const [envVars, setEnvVars] = useState<CloudServiceEnv[]>(cfg?.env ?? [])
  const [saving, setSaving] = useState(false)
  const [disabling, setDisabling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // When the service's persisted config changes (e.g. after a save), resync
  // the form so a re-expand reflects current truth.
  useEffect(() => {
    setServiceCommand(cfg?.serviceCommand ?? '')
    setSelectedRessource(cfg?.selectedRessource ?? null)
    setEnvVars(cfg?.env ?? [])
  }, [cfg])

  const supportedSizes = useMemo<CloudResourceSize[]>(
    () => (manifest?.supportedResources ?? []).map((s) => SIZE_TO_TS[s]).filter(Boolean),
    [manifest],
  )

  const dirty = useMemo(() => {
    if (!cfg) return false
    if ((serviceCommand || null) !== (cfg.serviceCommand || null)) return true
    if (selectedRessource !== cfg.selectedRessource) return true
    if (envVars.length !== cfg.env.length) return true
    for (let i = 0; i < envVars.length; i++) {
      if (envVars[i].name !== cfg.env[i]?.name) return true
      if (envVars[i].value !== cfg.env[i]?.value) return true
    }
    return false
  }, [cfg, serviceCommand, selectedRessource, envVars])

  const handleSave = async () => {
    if (!cfg || !onSave || !dirty) return
    setError(null)
    setSaving(true)
    try {
      await onSave({
        package: cfg.package,
        env: envVars.filter((v) => v.name.trim()),
        serviceCommand: serviceCommand.trim() || null,
        selectedRessource,
        // Endpoints are runtime-announced; preserve whatever was last persisted.
        enabledEndpoints: cfg.enabledEndpoints,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDisable = async () => {
    if (!onDisable) return
    setDisabling(true)
    try {
      await onDisable()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable')
      setDisabling(false)
    }
  }

  const handleCancel = () => {
    setServiceCommand(cfg?.serviceCommand ?? '')
    setSelectedRessource(cfg?.selectedRessource ?? null)
    setEnvVars(cfg?.env ?? [])
    setError(null)
    setExpanded(false)
  }

  return (
    <div className="rounded-lg border">
      <div className="flex items-center justify-between gap-4 p-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="bg-muted flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md">
            {agentInfo?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={agentInfo.image}
                alt={agentInfo.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <Bot className="text-muted-foreground h-5 w-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{cardLabel}</span>
              <Badge
                variant="secondary"
                className={`rounded-full border-transparent ${STATUS_CLASSES[service.status]}`}
              >
                {service.status.toLowerCase().replace('_', ' ')}
              </Badge>
              <Badge variant="secondary" className="font-mono text-xs">
                {service.prefix}
              </Badge>
              {sizeLabel && (
                <Badge variant="outline" className="text-xs">
                  {sizeLabel}
                </Badge>
              )}
            </div>
            {agentInfo?.description && !expanded && (
              <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
                {agentInfo.description}
              </p>
            )}
          </div>
        </div>
        {canEdit && (
          <Button variant="outline" size="sm" onClick={() => setExpanded((e) => !e)}>
            <ChevronDown
              className={`mr-1.5 h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
            Configure
          </Button>
        )}
      </div>

      {expanded && canEdit && cfg && manifest && (
        <div className="space-y-4 border-t p-4">
          {agentInfo?.description && (
            <p className="text-muted-foreground text-xs leading-relaxed">{agentInfo.description}</p>
          )}

          {supportedSizes.length > 0 && (
            <div>
              <Label>Resource size</Label>
              <div className="mt-2">
                <ResourceSizePicker
                  supported={supportedSizes}
                  value={selectedRessource}
                  onChange={setSelectedRessource}
                  disabled={saving || disabling}
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor={`cmd-${service.prefix}`}>Service command</Label>
            <Textarea
              id={`cmd-${service.prefix}`}
              value={serviceCommand}
              onChange={(e) => setServiceCommand(e.target.value)}
              className="font-mono text-sm"
              rows={2}
              disabled={saving || disabling}
            />
            {manifest.serviceCommand && serviceCommand !== manifest.serviceCommand && (
              <button
                type="button"
                className="text-primary mt-1 text-xs underline-offset-2 hover:underline"
                onClick={() => setServiceCommand(manifest.serviceCommand ?? '')}
              >
                Reset to default
              </button>
            )}
          </div>

          <div>
            <Label>Environment variables</Label>
            <div className="mt-2">
              <EnvVarsEditor value={envVars} onChange={setEnvVars} disabled={saving || disabling} />
            </div>
          </div>

          <p className="text-muted-foreground text-xs">
            Endpoints are reported by the agent at runtime via its announcement callback. Once
            present, they will appear here.
          </p>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <div className="flex items-center justify-between gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisable}
              disabled={!onDisable || saving || disabling}
              className="text-destructive hover:text-destructive gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {disabling ? 'Disabling…' : 'Disable agent'}
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={saving || disabling}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!dirty || !onSave || saving || disabling}
              >
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {expanded && canEdit && (!cfg || !manifest) && (
        <div className="text-muted-foreground border-t p-4 text-sm">
          {!cfg ? 'This service has no config to edit.' : 'Loading package manifest…'}
        </div>
      )}
    </div>
  )
}
