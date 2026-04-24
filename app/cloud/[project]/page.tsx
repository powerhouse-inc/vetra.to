'use client'

import { ArrowLeft, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, use, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { StatusBadge } from '@/modules/cloud/components/status-badge'
import { useEnvironmentDetail } from '@/modules/cloud/hooks/use-environment-detail'
import { useEnvironmentStatus } from '@/modules/cloud/hooks/use-environment-status'
import { generateSubdomain } from '@/modules/cloud/subdomain'
import { getTenantId } from '@/modules/cloud/tenant-id'
import { Button } from '@/modules/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/modules/shared/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shared/components/ui/tabs'

import { ConfigurationTab } from './tabs/configuration'
import { DeploymentsTab } from './tabs/deployments'
import { LogsTab } from './tabs/logs'
import { MetricsTab } from './tabs/metrics'
import { InlineEditableTitle, OverviewTab } from './tabs/overview'

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
  const subdomain = state?.genericSubdomain ?? null
  const tenantId = subdomain && environment ? getTenantId(subdomain, environment.id) : null
  const TRULY_INACTIVE = new Set(['DRAFT', 'DESTROYED', 'ARCHIVED', 'STOPPED'])
  const isInactive = TRULY_INACTIVE.has(state?.status ?? 'DRAFT')

  const { status: envStatus, isLoading: statusLoading } = useEnvironmentStatus(
    subdomain,
    tenantId,
    documentId,
  )

  // Auto-heal: set genericSubdomain if missing
  const subdomainHealedRef = useRef(false)
  useEffect(() => {
    if (!environment || subdomainHealedRef.current) return
    if (environment.state.genericSubdomain === null) {
      subdomainHealedRef.current = true
      detail.setGenericSubdomain(generateSubdomain(environment.id))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [environment, detail.setGenericSubdomain])

  // Auto-heal: set defaultPackageRegistry if missing
  const registryHealedRef = useRef(false)
  useEffect(() => {
    if (!environment || registryHealedRef.current) return
    if (environment.state.defaultPackageRegistry === null) {
      registryHealedRef.current = true
      detail.setDefaultPackageRegistry('https://registry.dev.vetra.io')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [environment, detail.setDefaultPackageRegistry])

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  // Approve/Deploy: local "just clicked" flag shields the button from the
  // subscription-vs-push race. The controller updates local state
  // optimistically (flipping status away from CHANGES_PENDING / DRAFT), but
  // an incoming subscription notification can fetch the pre-push remote
  // state and momentarily revert it — which reads as the button flickering
  // back for 1-2s. Holding the flag until the server confirms any post-
  // CHANGES_PENDING status keeps the button hidden through the race.
  const [justApproved, setJustApproved] = useState(false)
  const statusStr = state?.status ?? 'DRAFT'
  useEffect(() => {
    if (justApproved && statusStr !== 'CHANGES_PENDING' && statusStr !== 'DRAFT') {
      setJustApproved(false)
    }
  }, [statusStr, justApproved])
  const handleApprove = async () => {
    setJustApproved(true)
    try {
      await detail.approveChanges()
    } catch (err) {
      setJustApproved(false)
      toast.error(err instanceof Error ? err.message : 'Failed to approve changes')
    }
  }

  if (isLoading) {
    return <p className="text-muted-foreground">Loading environment...</p>
  }

  const displayName = state?.label || environment?.name || 'Environment'
  const baseDomain = state?.genericBaseDomain ?? 'vetra.io'

  // Build visit URLs from enabled services
  const enabledServices = state?.services.filter((s) => s.enabled) ?? []

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
          <InlineEditableTitle value={displayName} onSave={detail.setLabel} />
          {state && (
            <StatusBadge
              environmentStatus={state.status}
              argoHealthStatus={envStatus?.argoHealthStatus}
              argoSyncStatus={envStatus?.argoSyncStatus}
              isLoading={statusLoading && !envStatus}
            />
          )}

          {/* Deploy/Approve button — hidden instantly on click via
              justApproved until the server confirms a post-CHANGES_PENDING
              state, to mask the subscription-vs-push race. */}
          {state?.status === 'DRAFT' && !justApproved && (
            <Button
              size="sm"
              onClick={handleApprove}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Deploy
            </Button>
          )}
          {state?.status === 'CHANGES_PENDING' && !justApproved && (
            <Button size="sm" onClick={handleApprove} className="bg-blue-600 hover:bg-blue-700">
              Approve Changes
            </Button>
          )}

          {/* Visit dropdown */}
          {subdomain && enabledServices.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Visit
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {enabledServices.map((svc) => (
                  <DropdownMenuItem key={svc.type} asChild>
                    <a
                      href={`https://${svc.prefix}.${subdomain}.${baseDomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {svc.type === 'CONNECT'
                        ? 'Connect'
                        : svc.type === 'SWITCHBOARD'
                          ? 'Switchboard'
                          : 'Fusion'}
                    </a>
                  </DropdownMenuItem>
                ))}
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
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="deployments">Deployments</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="pt-4">
            <OverviewTab
              subdomain={subdomain}
              tenantId={tenantId}
              environment={environment}
              status={envStatus}
              statusLoading={statusLoading}
              onTabChange={handleTabChange}
              enableService={detail.enableService}
              disableService={detail.disableService}
              addPackage={detail.addPackage}
              removePackage={detail.removePackage}
              setCustomDomain={detail.setCustomDomain}
              onTerminate={detail.terminate}
              setServiceVersion={detail.setServiceVersion}
              setPackageVersion={detail.setPackageVersion}
              setAutoUpdateChannel={detail.setAutoUpdateChannel}
              updateToLatest={detail.updateToLatest}
              rollbackRelease={detail.rollbackRelease}
              initialAddPackage={searchParams.get('addPackage')}
              initialAddVersion={searchParams.get('version')}
            />
          </TabsContent>
          <TabsContent value="configuration" className="pt-4">
            <ConfigurationTab tenantId={tenantId} environment={environment} />
          </TabsContent>
          <TabsContent value="deployments" className="pt-4">
            <DeploymentsTab subdomain={subdomain} tenantId={tenantId} documentId={documentId} />
          </TabsContent>
          <TabsContent value="logs" className="pt-4">
            <LogsTab subdomain={subdomain} tenantId={tenantId} isStopped={isInactive} />
          </TabsContent>
          <TabsContent value="metrics" className="pt-4">
            <MetricsTab
              subdomain={subdomain}
              tenantId={tenantId}
              isStopped={isInactive}
              documentId={documentId}
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
    <main className="mx-auto mt-20 max-w-screen-xl space-y-8 px-6 py-8">
      <Suspense fallback={<p className="text-muted-foreground">Loading...</p>}>
        <EnvironmentDetail documentId={project} />
      </Suspense>
    </main>
  )
}
