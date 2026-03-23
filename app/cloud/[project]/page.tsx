'use client'

import { ArrowLeft, ExternalLink, Play, Square } from 'lucide-react'
import Link from 'next/link'
import { Suspense, use, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

import { useEnvironmentDetail } from '@/modules/cloud/hooks/use-environment-detail'
import { useEnvironmentStatus } from '@/modules/cloud/hooks/use-environment-status'
import { generateSubdomain } from '@/modules/cloud/subdomain'
import { getTenantId } from '@/modules/cloud/tenant-id'
import { StatusBadge } from '@/modules/cloud/components/status-badge'
import { Button } from '@/modules/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/modules/shared/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shared/components/ui/tabs'

import { DeploymentsTab } from './tabs/deployments'
import { LogsTab } from './tabs/logs'
import { MetricsTab } from './tabs/metrics'
import { OverviewTab } from './tabs/overview'
import { SettingsTab } from './tabs/settings'

// ---------------------------------------------------------------------------
// StartStopButton
// ---------------------------------------------------------------------------

function StartStopButton({
  isRunning,
  onStart,
  onStop,
}: {
  isRunning: boolean
  onStart: () => Promise<void>
  onStop: () => Promise<void>
}) {
  const [isToggling, setIsToggling] = useState(false)

  const handleToggle = async () => {
    try {
      setIsToggling(true)
      if (isRunning) {
        await onStop()
      } else {
        await onStart()
      }
      toast.success(`Environment ${isRunning ? 'stopped' : 'started'}`)
    } catch (error) {
      console.error('Failed to toggle environment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to toggle environment')
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <Button
      variant={isRunning ? 'outline' : 'default'}
      size="sm"
      onClick={handleToggle}
      disabled={isToggling}
      className="flex items-center gap-1.5"
    >
      {isRunning ? (
        <>
          <Square className="h-3.5 w-3.5" />
          {isToggling ? 'Stopping...' : 'Stop'}
        </>
      ) : (
        <>
          <Play className="h-3.5 w-3.5" />
          {isToggling ? 'Starting...' : 'Start'}
        </>
      )}
    </Button>
  )
}

// ---------------------------------------------------------------------------
// EnvironmentDetail — inner component that uses useSearchParams
// (must be wrapped in <Suspense> per Next.js 15 requirements)
// ---------------------------------------------------------------------------

function EnvironmentDetail({ documentId }: { documentId: string }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = searchParams.get('tab') ?? 'overview'

  const detail = useEnvironmentDetail(documentId)
  const { environment, isLoading } = detail

  const state = environment?.state
  const subdomain = state?.subdomain ?? null
  const tenantId = subdomain && environment ? getTenantId(subdomain, environment.id) : null
  const isRunning = state?.status === 'STARTED'
  const isStopped = state?.status !== 'STARTED'

  const { status: envStatus, isLoading: statusLoading } = useEnvironmentStatus(subdomain, tenantId)

  // Auto-heal: set subdomain if missing
  const subdomainHealedRef = useRef(false)
  useEffect(() => {
    if (!environment || subdomainHealedRef.current) return
    if (environment.state.subdomain === null) {
      subdomainHealedRef.current = true
      detail.setSubdomain(generateSubdomain(environment.id))
    }
  }, [environment, detail.setSubdomain])

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  if (isLoading) {
    return <p className="text-muted-foreground">Loading environment...</p>
  }

  const displayName = state?.name || environment?.name || 'Environment'
  const connectUrl = subdomain ? `https://connect.${subdomain}.vetra.io` : null
  const switchboardUrl = subdomain ? `https://switchboard.${subdomain}.vetra.io` : null

  return (
    <>
      {/* Header */}
      <div className="space-y-3">
        <Link
          href="/cloud"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cloud
        </Link>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">{displayName}</h2>
          {state && (
            <StatusBadge
              environmentStatus={state.status}
              argoHealthStatus={envStatus?.argoHealthStatus}
              argoSyncStatus={envStatus?.argoSyncStatus}
              isLoading={statusLoading && !envStatus}
            />
          )}
          {state && (
            <StartStopButton isRunning={isRunning} onStart={detail.start} onStop={detail.stop} />
          )}

          {/* Visit dropdown */}
          {subdomain && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Visit
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {connectUrl && (
                  <DropdownMenuItem asChild>
                    <a href={connectUrl} target="_blank" rel="noopener noreferrer">
                      Connect
                    </a>
                  </DropdownMenuItem>
                )}
                {switchboardUrl && (
                  <DropdownMenuItem asChild>
                    <a href={switchboardUrl} target="_blank" rel="noopener noreferrer">
                      Switchboard
                    </a>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Tabs */}
      {state && environment && (
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="deployments">Deployments</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="pt-4">
            <OverviewTab
              subdomain={subdomain}
              tenantId={tenantId}
              environment={environment}
              onTabChange={handleTabChange}
            />
          </TabsContent>
          <TabsContent value="deployments" className="pt-4">
            <DeploymentsTab subdomain={subdomain} tenantId={tenantId} />
          </TabsContent>
          <TabsContent value="logs" className="pt-4">
            <LogsTab subdomain={subdomain} tenantId={tenantId} isStopped={isStopped} />
          </TabsContent>
          <TabsContent value="metrics" className="pt-4">
            <MetricsTab subdomain={subdomain} tenantId={tenantId} isStopped={isStopped} />
          </TabsContent>
          <TabsContent value="settings" className="pt-4">
            <SettingsTab
              environment={environment}
              enableService={detail.enableService}
              disableService={detail.disableService}
              addPackage={detail.addPackage}
              removePackage={detail.removePackage}
            />
          </TabsContent>
        </Tabs>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Page — wraps EnvironmentDetail in Suspense for useSearchParams
// ---------------------------------------------------------------------------

type PageProps = {
  params: Promise<{ project: string }>
}

export default function EnvironmentDetailPage({ params }: PageProps) {
  const { project } = use(params)
  return (
    <main className="mx-auto mt-20 max-w-[var(--container-width)] space-y-8 px-6 py-8">
      <Suspense fallback={<p className="text-muted-foreground">Loading...</p>}>
        <EnvironmentDetail documentId={project} />
      </Suspense>
    </main>
  )
}
