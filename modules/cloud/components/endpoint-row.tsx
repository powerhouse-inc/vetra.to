'use client'

import { Copy, ExternalLink, Globe, Network, Terminal } from 'lucide-react'
import { useCallback } from 'react'
import type { ClintEndpoint, ClintEndpointType } from '@/modules/cloud/types'
import { Button } from '@/modules/shared/components/ui/button'
import { Checkbox } from '@/modules/shared/components/ui/checkbox'

const TYPE_ICONS: Record<ClintEndpointType, React.ComponentType<{ className?: string }>> = {
  'api-graphql': Network,
  'api-mcp': Terminal,
  website: Globe,
}

type Props = {
  endpoint: ClintEndpoint
  url: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}

export function EndpointRow({ endpoint, url, checked, onCheckedChange, disabled }: Props) {
  const Icon = TYPE_ICONS[endpoint.type]
  const onCopyMcp = useCallback(() => {
    const config = JSON.stringify({ mcpServers: { [endpoint.id]: { url } } }, null, 2)
    void navigator.clipboard?.writeText(config)
  }, [endpoint.id, url])

  return (
    <div className="bg-background/40 flex items-center justify-between gap-3 rounded-lg p-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Checkbox
          checked={checked}
          onCheckedChange={(v) => onCheckedChange(v === true)}
          disabled={disabled}
          aria-label={`enable ${endpoint.id}`}
        />
        <Icon className="text-muted-foreground h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">{endpoint.id}</div>
          <div className="text-muted-foreground truncate font-mono text-xs">
            {url} · :{endpoint.port}
          </div>
        </div>
      </div>
      {endpoint.type === 'api-graphql' && (
        <Button variant="outline" size="sm" asChild>
          {/* Path-style endpoint ids (e.g. "/switchboard/graphql") already
              point at the GraphQL route. Only suffix /graphql for legacy
              opaque ids that don't include the path themselves. */}
          <a
            href={endpoint.id.includes('/graphql') ? url : `${url}/graphql`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            Playground
          </a>
        </Button>
      )}
      {endpoint.type === 'api-mcp' && (
        <Button variant="outline" size="sm" onClick={onCopyMcp}>
          <Copy className="mr-1.5 h-3.5 w-3.5" />
          Copy MCP config
        </Button>
      )}
      {endpoint.type === 'website' && (
        <Button variant="outline" size="sm" asChild>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            Visit
          </a>
        </Button>
      )}
    </div>
  )
}
