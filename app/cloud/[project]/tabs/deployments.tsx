'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useState } from 'react'

import { EventTimeline } from '@/modules/cloud/components/event-timeline'
import { useEnvironmentEvents } from '@/modules/cloud/hooks/use-environment-events'
import { useEnvironmentStatus } from '@/modules/cloud/hooks/use-environment-status'
import { Button } from '@/modules/shared/components/ui/button'
import { Card, CardContent } from '@/modules/shared/components/ui/card'

type DeploymentsTabProps = {
  subdomain: string | null
  tenantId: string | null
}

export function DeploymentsTab({ subdomain, tenantId }: DeploymentsTabProps) {
  const { status } = useEnvironmentStatus(subdomain, tenantId)
  const {
    events,
    isLoading,
    refresh: eventsRefresh,
  } = useEnvironmentEvents(subdomain, tenantId, 50)
  const [warningsOnly, setWarningsOnly] = useState(false)

  const showDriftBanner =
    status?.argoSyncStatus === 'OUT_OF_SYNC' || status?.configDriftDetected === true

  const filteredEvents = warningsOnly ? events.filter((e) => e.type === 'WARNING') : events

  return (
    <div className="space-y-4">
      {/* Sync Banner */}
      {showDriftBanner && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="flex items-center gap-3 pt-4">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              {status?.configDriftDetected
                ? 'Configuration drift detected — the live state does not match the desired state.'
                : 'ArgoCD is out of sync — a deployment may be in progress or pending.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-md border p-1">
          <Button
            variant={warningsOnly ? 'ghost' : 'secondary'}
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => setWarningsOnly(false)}
          >
            All
          </Button>
          <Button
            variant={warningsOnly ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => setWarningsOnly(true)}
          >
            Warnings only
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5"
          onClick={() => eventsRefresh()}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Event Timeline */}
      <EventTimeline events={filteredEvents} isLoading={isLoading} />
    </div>
  )
}
