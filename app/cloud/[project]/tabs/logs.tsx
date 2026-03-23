'use client'

import { RefreshCw, FileText } from 'lucide-react'
import { useState } from 'react'

import { LogViewer } from '@/modules/cloud/components/log-viewer'
import { TimeRangePicker } from '@/modules/cloud/components/time-range-picker'
import { useEnvironmentLogs } from '@/modules/cloud/hooks/use-environment-logs'
import type { MetricRange, TenantService } from '@/modules/cloud/types'
import { Button } from '@/modules/shared/components/ui/button'
import { Checkbox } from '@/modules/shared/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/modules/shared/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'

type LogsTabProps = {
  subdomain: string | null
  tenantId: string | null
  isStopped: boolean
}

const SERVICE_LABELS: Record<string, string> = {
  All: 'All',
  CONNECT: 'Connect',
  SWITCHBOARD: 'Switchboard',
}

export function LogsTab({ subdomain, tenantId, isStopped }: LogsTabProps) {
  const [service, setService] = useState<TenantService | null>(null)
  const [range, setRange] = useState<MetricRange>('FIVE_MIN')
  const [errorsOnly, setErrorsOnly] = useState(false)

  const { logs, isLoading, refresh } = useEnvironmentLogs(
    subdomain,
    tenantId,
    service,
    range,
    errorsOnly,
  )

  if (isStopped) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <FileText className="text-muted-foreground h-8 w-8" />
        <p className="text-muted-foreground text-sm">Start the environment to see logs</p>
      </div>
    )
  }

  const serviceLabel = service === null ? 'All' : (SERVICE_LABELS[service] ?? service)

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex items-center gap-3">
        {/* Service Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-1.5">
              {serviceLabel}
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              onClick={() => setService(null)}
              className={service === null ? 'bg-accent' : undefined}
            >
              All
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setService('CONNECT')}
              className={service === 'CONNECT' ? 'bg-accent' : undefined}
            >
              Connect
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setService('SWITCHBOARD')}
              className={service === 'SWITCHBOARD' ? 'bg-accent' : undefined}
            >
              Switchboard
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Time Range */}
        <TimeRangePicker value={range} onChange={setRange} />

        {/* Errors Only */}
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox
            checked={errorsOnly}
            onCheckedChange={(checked) => setErrorsOnly(checked === true)}
          />
          Errors only
        </label>

        {/* Refresh */}
        <Button
          variant="outline"
          size="sm"
          className="ml-auto flex items-center gap-1.5"
          onClick={() => refresh()}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Log Viewer */}
      <LogViewer logs={logs} isLoading={isLoading} />
    </div>
  )
}
