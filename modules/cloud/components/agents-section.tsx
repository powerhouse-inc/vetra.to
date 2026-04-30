'use client'

import { Bot, Plus } from 'lucide-react'
import { useMemo } from 'react'
import type { PackageManifest } from '@/modules/cloud/config/types'
import type {
  ClintRuntimeEndpointsForPrefix,
  CloudEnvironment,
  CloudEnvironmentService,
  CloudServiceClintConfig,
} from '@/modules/cloud/types'
import { Button } from '@/modules/shared/components/ui/button'
import { AgentCard } from './agent-card'

type Props = {
  services: CloudEnvironmentService[]
  env: CloudEnvironment | null
  canEdit: boolean
  onAddAgent?: () => void
  manifests?: Record<string, PackageManifest>
  /** prefix → runtime-announced endpoints (from observability subgraph). */
  runtimeEndpointsByPrefix?: Record<string, ClintRuntimeEndpointsForPrefix>
  onSaveConfig?: (prefix: string, config: CloudServiceClintConfig) => Promise<void>
  onDisable?: (prefix: string) => Promise<void>
}

export function AgentsSection({
  services,
  env,
  canEdit,
  onAddAgent,
  manifests,
  runtimeEndpointsByPrefix,
  onSaveConfig,
  onDisable,
}: Props) {
  const clintServices = useMemo(
    () =>
      services.filter((s) => s.type === 'CLINT').sort((a, b) => a.prefix.localeCompare(b.prefix)),
    [services],
  )

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Agents</h2>
        {canEdit && (
          <Button size="sm" onClick={onAddAgent} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add Agent
          </Button>
        )}
      </div>
      {clintServices.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
          <Bot className="h-8 w-8" />
          <p className="text-sm">
            Install your first agent — they're packages whose name ends in -cli.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {clintServices.map((s) => (
            <AgentCard
              key={s.prefix}
              service={s}
              env={env}
              canEdit={canEdit}
              manifest={s.config ? (manifests?.[s.config.package.name] ?? null) : null}
              runtimeEndpoints={runtimeEndpointsByPrefix?.[s.prefix] ?? null}
              onSave={onSaveConfig ? (cfg) => onSaveConfig(s.prefix, cfg) : undefined}
              onDisable={onDisable ? () => onDisable(s.prefix) : undefined}
            />
          ))}
        </div>
      )}
    </section>
  )
}
