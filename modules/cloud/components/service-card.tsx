import { ExternalLink, Globe, Server, Zap } from 'lucide-react'

import { Badge } from '@/modules/shared/components/ui/badge'
import { Button } from '@/modules/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'
import type { CloudEnvironmentServiceType, Pod } from '@/modules/cloud/types'

type ServiceCardProps = {
  serviceName: CloudEnvironmentServiceType
  label: string
  subdomain: string | null
  prefix: string
  pods: Pod[]
  isEnabled: boolean
}

const SERVICE_ICONS: Record<
  CloudEnvironmentServiceType,
  React.ComponentType<{ className?: string }>
> = {
  CONNECT: Globe,
  SWITCHBOARD: Server,
  FUSION: Zap,
}

export function ServiceCard({
  serviceName,
  label,
  subdomain,
  prefix,
  pods,
  isEnabled,
}: ServiceCardProps) {
  const Icon = SERVICE_ICONS[serviceName] ?? Server
  const serviceUrl = subdomain
    ? `https://${prefix}.${subdomain}.vetra.io`
    : `https://${prefix}.<subdomain>.vetra.io`

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-md">
          <Icon className="text-muted-foreground h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{label}</span>

            {pods.length > 0 ? (
              <>
                <Badge variant="secondary" className="font-mono text-xs">
                  {pods[0].phase}
                </Badge>
                <span
                  className={cn(
                    'inline-block h-2 w-2 shrink-0 rounded-full',
                    pods[0].ready ? 'bg-[#04c161]' : 'bg-[#ea4335]',
                  )}
                  title={pods[0].ready ? 'Ready' : 'Not ready'}
                />
                {pods[0].restartCount > 0 && (
                  <span className="text-xs font-medium text-[#ffa132]">
                    {pods[0].restartCount} restart{pods[0].restartCount !== 1 ? 's' : ''}
                  </span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground text-xs">No pods</span>
            )}
          </div>

          <p className="text-muted-foreground mt-0.5 truncate font-mono text-xs">{serviceUrl}</p>
        </div>
      </div>

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
  )
}
