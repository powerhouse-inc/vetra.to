'use client'

import { CheckCircle, XCircle, AlertTriangle, ShieldCheck, ShieldOff, Globe } from 'lucide-react'

import { EventTimeline } from '@/modules/cloud/components/event-timeline'
import { ServiceCard } from '@/modules/cloud/components/service-card'
import { useEnvironmentEvents } from '@/modules/cloud/hooks/use-environment-events'
import { useEnvironmentStatus } from '@/modules/cloud/hooks/use-environment-status'
import type { CloudEnvironment } from '@/modules/cloud/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card'
import { Button } from '@/modules/shared/components/ui/button'

type OverviewTabProps = {
  subdomain: string | null
  tenantId: string | null
  environment: CloudEnvironment
  onTabChange?: (tab: string) => void
}

export function OverviewTab({ subdomain, tenantId, environment, onTabChange }: OverviewTabProps) {
  const { status, pods, isLoading: statusLoading } = useEnvironmentStatus(subdomain, tenantId)
  const { events, isLoading: eventsLoading } = useEnvironmentEvents(subdomain, tenantId, 5)

  const state = environment.state

  const connectPods = pods.filter((p) => p.service === 'CONNECT')
  const switchboardPods = pods.filter((p) => p.service === 'SWITCHBOARD')

  const isConnectEnabled = state.services.includes('CONNECT')
  const isSwitchboardEnabled = state.services.includes('SWITCHBOARD')

  return (
    <div className="space-y-6">
      {/* Status Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* ArgoCD Card */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              {status?.argoSyncStatus === 'SYNCED' ? (
                <CheckCircle className="h-4 w-4 text-[#04c161]" />
              ) : (
                <XCircle className="h-4 w-4 text-[#ea4335]" />
              )}
              <span className="text-sm font-medium">ArgoCD</span>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-muted-foreground text-xs">
                Sync:{' '}
                <span className="text-foreground font-medium">
                  {statusLoading ? '...' : (status?.argoSyncStatus ?? 'Unknown')}
                </span>
              </p>
              <p className="text-muted-foreground text-xs">
                Health:{' '}
                <span className="text-foreground font-medium">
                  {statusLoading ? '...' : (status?.argoHealthStatus ?? 'Unknown')}
                </span>
              </p>
              {status?.argoLastSyncedAt && (
                <p className="text-muted-foreground text-xs">
                  Last synced: {new Date(status.argoLastSyncedAt).toLocaleTimeString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Config Card */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              {status?.configDriftDetected ? (
                <AlertTriangle className="h-4 w-4 text-[#ffa132]" />
              ) : (
                <CheckCircle className="h-4 w-4 text-[#04c161]" />
              )}
              <span className="text-sm font-medium">Config</span>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-muted-foreground text-xs">
                Drift:{' '}
                <span className="text-foreground font-medium">
                  {statusLoading ? '...' : status?.configDriftDetected ? 'Detected' : 'None'}
                </span>
              </p>
              {status?.argoMessage && (
                <p className="text-muted-foreground line-clamp-2 text-xs">{status.argoMessage}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Domain Card */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Globe className="text-muted-foreground h-4 w-4" />
              <span className="text-sm font-medium">Domain</span>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-muted-foreground text-xs">
                Resolves:{' '}
                <span className="text-foreground font-medium">
                  {statusLoading
                    ? '...'
                    : status?.domainResolves === null
                      ? 'Unknown'
                      : status?.domainResolves
                        ? 'Yes'
                        : 'No'}
                </span>
              </p>
              <p className="text-muted-foreground flex items-center gap-1 text-xs">
                TLS:{' '}
                {status?.tlsCertValid ? (
                  <ShieldCheck className="h-3 w-3 text-[#04c161]" />
                ) : (
                  <ShieldOff className="h-3 w-3 text-[#ea4335]" />
                )}
                <span className="text-foreground font-medium">
                  {statusLoading
                    ? '...'
                    : status?.tlsCertValid === null
                      ? 'Unknown'
                      : status?.tlsCertValid
                        ? 'Valid'
                        : 'Invalid'}
                </span>
              </p>
              {status?.tlsCertExpiresAt && (
                <p className="text-muted-foreground text-xs">
                  Expires: {new Date(status.tlsCertExpiresAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services Section */}
      {(isConnectEnabled || isSwitchboardEnabled) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isConnectEnabled && (
              <ServiceCard
                serviceName="CONNECT"
                label="Powerhouse Connect"
                subdomain={subdomain}
                pods={connectPods}
                isEnabled={isConnectEnabled}
              />
            )}
            {isSwitchboardEnabled && (
              <ServiceCard
                serviceName="SWITCHBOARD"
                label="Powerhouse Switchboard"
                subdomain={subdomain}
                pods={switchboardPods}
                isEnabled={isSwitchboardEnabled}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground text-xs"
              onClick={() => onTabChange?.('deployments')}
            >
              View all
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <EventTimeline events={events} isLoading={eventsLoading} />
        </CardContent>
      </Card>
    </div>
  )
}
