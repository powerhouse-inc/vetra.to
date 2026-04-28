'use client'

import { Bot, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type {
  CloudEnvironment,
  CloudEnvironmentService,
  CloudResourceSize,
  ServiceStatus,
} from '@/modules/cloud/types'
import { Badge } from '@/modules/shared/components/ui/badge'
import { Button } from '@/modules/shared/components/ui/button'

const SIZE_LABELS: Record<CloudResourceSize, string> = {
  VETRA_AGENT_S: 'Small',
  VETRA_AGENT_M: 'Medium',
  VETRA_AGENT_L: 'Large',
  VETRA_AGENT_XL: 'X-Large',
  VETRA_AGENT_XXL: '2X-Large',
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
}

export function AgentCard({ service, canEdit }: Props) {
  const [expanded, setExpanded] = useState(false)
  const cfg = service.config
  const pkgLabel = cfg ? `${cfg.package.name}@${cfg.package.version ?? 'latest'}` : 'unconfigured'
  const sizeLabel = cfg?.selectedRessource ? SIZE_LABELS[cfg.selectedRessource] : null
  const endpointCount = cfg?.enabledEndpoints.length ?? 0

  return (
    <div className="rounded-lg border">
      <div className="flex items-center justify-between gap-4 p-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-md">
            <Bot className="text-muted-foreground h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{pkgLabel}</span>
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
              <span className="text-muted-foreground text-xs">
                {endpointCount} endpoint{endpointCount === 1 ? '' : 's'}
              </span>
            </div>
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
    </div>
  )
}
