'use client'

import { Activity, BarChart2, FileText, Globe, RefreshCw, Server, Zap } from 'lucide-react'
import { useMemo, useState } from 'react'

import { useEnvironmentEvents } from '@/modules/cloud/hooks/use-environment-events'
import { useEnvironmentLogs } from '@/modules/cloud/hooks/use-environment-logs'
import { useEnvironmentMetrics } from '@/modules/cloud/hooks/use-environment-metrics'
import type {
  CloudEnvironmentService,
  KubeEvent,
  MetricRange,
  MetricSeries,
  Pod,
  TenantService,
} from '@/modules/cloud/types'
import { Button } from '@/modules/shared/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/modules/shared/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shared/components/ui/tabs'

import { EventTimeline } from './event-timeline'
import { LogViewer } from './log-viewer'
import { MetricCard } from './metric-card'
import { TimeRangePicker } from './time-range-picker'

type ServiceKind = 'connect' | 'switchboard' | 'fusion'

const SERVICE_LABEL: Record<ServiceKind, string> = {
  connect: 'Connect',
  switchboard: 'Switchboard',
  fusion: 'Fusion',
}

const SERVICE_ICON: Record<ServiceKind, React.ComponentType<{ className?: string }>> = {
  connect: Globe,
  switchboard: Server,
  fusion: Zap,
}

function toTenantService(kind: ServiceKind): TenantService | null {
  if (kind === 'connect') return 'CONNECT'
  if (kind === 'switchboard') return 'SWITCHBOARD'
  return null
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function filterSeriesByPods(series: MetricSeries[], podNames: Set<string>): MetricSeries[] {
  if (podNames.size === 0) return series
  return series.filter((s) => podNames.has(s.label))
}

function filterEventsByPods(events: KubeEvent[], podNames: Set<string>): KubeEvent[] {
  if (podNames.size === 0) return events
  return events.filter((e) => {
    for (const pod of podNames) {
      if (e.involvedObject.includes(pod)) return true
    }
    return false
  })
}

type Props = {
  open: boolean
  onClose: () => void
  kind: ServiceKind
  service: CloudEnvironmentService | undefined
  subdomain: string | null
  tenantId: string | null
  documentId: string
  isStopped: boolean
  pods?: readonly Pod[]
  activeTab: string
  onTabChange: (tab: string) => void
}

export function ServiceDetailDrawer({
  open,
  onClose,
  kind,
  service,
  subdomain,
  tenantId,
  documentId,
  isStopped,
  pods,
  activeTab,
  onTabChange,
}: Props) {
  const Icon = SERVICE_ICON[kind]
  const label = SERVICE_LABEL[kind]
  const tenantService = toTenantService(kind)
  const [range, setRange] = useState<MetricRange>('ONE_HOUR')

  const servicePods = useMemo(() => {
    if (!pods) return []
    if (kind === 'fusion') return [] // FUSION pod labelling TBD
    return pods.filter((p) => p.service === tenantService)
  }, [pods, kind, tenantService])
  const podNameSet = useMemo(() => new Set(servicePods.map((p) => p.name)), [servicePods])

  const {
    logs,
    isLoading: logsLoading,
    refresh: refreshLogs,
  } = useEnvironmentLogs(subdomain, tenantId, tenantService, range, false)

  const { metrics, isLoading: metricsLoading } = useEnvironmentMetrics(
    subdomain,
    tenantId,
    range,
    documentId,
  )
  const filteredMetrics = useMemo(() => {
    if (!metrics) return null
    return {
      cpu: filterSeriesByPods(metrics.cpu, podNameSet),
      memory: filterSeriesByPods(metrics.memory, podNameSet),
      requestRate: filterSeriesByPods(metrics.requestRate, podNameSet),
      latency: filterSeriesByPods(metrics.latency, podNameSet),
    }
  }, [metrics, podNameSet])

  const {
    events,
    isLoading: eventsLoading,
    refresh: refreshEvents,
  } = useEnvironmentEvents(subdomain, tenantId, 100, documentId)
  const filteredEvents = useMemo(() => filterEventsByPods(events, podNameSet), [events, podNameSet])

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl lg:max-w-3xl"
      >
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {label}
          </SheetTitle>
          <SheetDescription>
            {service?.version ? (
              <span className="font-mono">{service.version}</span>
            ) : (
              <span className="italic">version not set</span>
            )}
          </SheetDescription>
        </SheetHeader>

        <Tabs
          value={activeTab}
          onValueChange={onTabChange}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <TabsList className="mx-6 mt-4 self-start">
            <TabsTrigger value="logs" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Logs
            </TabsTrigger>
            <TabsTrigger value="metrics" className="gap-1.5">
              <BarChart2 className="h-3.5 w-3.5" /> Metrics
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5">
              <Activity className="h-3.5 w-3.5" /> Activity
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <TabsContent value="logs" className="mt-0 space-y-3">
              {isStopped ? (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  Start the environment to see logs
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <TimeRangePicker value={range} onChange={setRange} />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refreshLogs()}
                      className="ml-auto gap-1.5"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Refresh
                    </Button>
                  </div>
                  <LogViewer logs={logs} isLoading={logsLoading} />
                </>
              )}
            </TabsContent>

            <TabsContent value="metrics" className="mt-0 space-y-4">
              {isStopped ? (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  Start the environment to see metrics
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-end">
                    <TimeRangePicker value={range} onChange={setRange} />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <MetricCard
                      title="CPU Usage"
                      description="CPU cores consumed by this service"
                      series={filteredMetrics?.cpu ?? []}
                      formatValue={(v) => `${(v * 100).toFixed(1)}%`}
                      isLoading={metricsLoading}
                    />
                    <MetricCard
                      title="Memory"
                      description="Working set memory by this service"
                      series={filteredMetrics?.memory ?? []}
                      formatValue={formatBytes}
                      isLoading={metricsLoading}
                    />
                    <MetricCard
                      title="Request Rate"
                      description="HTTP requests/sec on this service"
                      series={filteredMetrics?.requestRate ?? []}
                      formatValue={(v) => `${v.toFixed(1)} req/s`}
                      isLoading={metricsLoading}
                    />
                    <MetricCard
                      title="Latency (p99)"
                      description="99th percentile HTTP response time"
                      series={filteredMetrics?.latency ?? []}
                      formatValue={(v) => `${(v * 1000).toFixed(0)}ms`}
                      isLoading={metricsLoading}
                    />
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="activity" className="mt-0 space-y-3">
              <div className="flex items-center justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refreshEvents()}
                  className="gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh
                </Button>
              </div>
              <EventTimeline events={filteredEvents} isLoading={eventsLoading} />
              {!eventsLoading && filteredEvents.length === 0 && (
                <p className="text-muted-foreground py-6 text-center text-sm">
                  No recent kube events for this service.
                </p>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
