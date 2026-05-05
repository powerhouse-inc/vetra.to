import { Bot, ExternalLink, Globe, RefreshCw, Server, Zap } from 'lucide-react'

import { ServiceSizePopover } from '@/modules/cloud/components/service-size-popover'
import { deriveClintAgentStatus } from '@/modules/cloud/lib/clint-agent-status'
import type { CloudEnvironmentServiceType, CloudResourceSize, Pod } from '@/modules/cloud/types'
import { Button } from '@/modules/shared/components/ui/button'
import { LiveStatusPill } from './live-status-pill'

type ServiceCardProps = {
  serviceName: CloudEnvironmentServiceType
  label: string
  subdomain: string | null
  prefix: string
  pods: Pod[]
  isEnabled: boolean
  selectedRessource: CloudResourceSize | null
  canEdit: boolean
  onResize: (size: CloudResourceSize) => Promise<void>
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

export function ServiceCard({
  serviceName,
  label,
  subdomain,
  prefix,
  pods,
  isEnabled,
  selectedRessource,
  canEdit,
  onResize,
}: ServiceCardProps) {
  const Icon = SERVICE_ICONS[serviceName] ?? Server
  const serviceUrl = subdomain
    ? `https://${prefix}.${subdomain}.vetra.io`
    : `https://${prefix}.<subdomain>.vetra.io`

  // Reuse the agent-status derivation; "endpoints" parameter is unused for
  // non-clint services so we pass null.
  const liveStatus = deriveClintAgentStatus(pods, null)
  const restartCount = pods[0]?.restartCount ?? 0

  return (
    <div className="bg-background/40 hover:bg-background/60 flex items-center justify-between gap-4 rounded-lg p-4 transition-colors">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-md">
          <Icon className="text-muted-foreground h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{label}</span>
            <LiveStatusPill
              tone={liveStatus.tone}
              label={liveStatus.label}
              reason={liveStatus.reason}
            />
            {restartCount > 0 && liveStatus.tone !== 'restarting' && (
              <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                <RefreshCw className="h-3 w-3" /> {restartCount} restart
                {restartCount === 1 ? '' : 's'}
              </span>
            )}
          </div>

          <p className="text-muted-foreground mt-0.5 truncate font-mono text-xs">{serviceUrl}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ServiceSizePopover
          serviceType={serviceName}
          prefix={prefix}
          currentSize={selectedRessource}
          canEdit={canEdit && isEnabled}
          onSave={onResize}
        />
        <Button variant="outline" size="sm" asChild>
          <a
            href={serviceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Visit
          </a>
        </Button>
      </div>
    </div>
  )
}
