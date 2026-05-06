'use client'

import { ArrowLeft, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, use, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { AgentDetailDrawer } from '@/modules/cloud/components/agent-detail-drawer'
import { ServiceDetailDrawer } from '@/modules/cloud/components/service-detail-drawer'
import { StatusBadge } from '@/modules/cloud/components/status-badge'
import { useCanSign } from '@/modules/cloud/hooks/use-can-sign'
import { useClintPackages } from '@/modules/cloud/hooks/use-clint-packages'
import { useClintRuntimeEndpoints } from '@/modules/cloud/hooks/use-clint-runtime-endpoints'
import { useDetailDrawer } from '@/modules/cloud/hooks/use-detail-drawer'
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
import { HeroCard } from '@/modules/shared/components/ui/card'

import { ConfigurationTab } from './tabs/configuration'
import { InlineEditableTitle, OverviewTab } from './tabs/overview'

// ---------------------------------------------------------------------------
// EnvironmentDetail — single-column env page; no env-level tabs. Per-service
// and per-agent observability surfaces live in side drawers (see
// `useDetailDrawer` for URL state). This was previously a tab orchestrator.
// ---------------------------------------------------------------------------

function EnvironmentDetail({ documentId }: { documentId: string }) {
  const searchParams = useSearchParams()

  const detail = useEnvironmentDetail(documentId)
  const { environment, isLoading } = detail

  const state = environment?.state
  const subdomain = state?.genericSubdomain ?? null
  const tenantId = subdomain && environment ? getTenantId(subdomain, environment.id) : null
  const TRULY_INACTIVE = new Set(['DRAFT', 'DESTROYED', 'ARCHIVED', 'STOPPED'])
  const isInactive = TRULY_INACTIVE.has(state?.status ?? 'DRAFT')

  const {
    status: envStatus,
    pods: envPods,
    isLoading: statusLoading,
  } = useEnvironmentStatus(subdomain, tenantId, documentId)

  // Drawer state (per-service / per-agent detail) is keyed in the URL via
  // `?drawer=service:<id>` or `?drawer=agent:<prefix>`. Hook owns parsing and
  // navigation; the page just reads `scope`/`tab` and provides handlers.
  const drawer = useDetailDrawer()

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

  const { canSign } = useCanSign()
  const { clintPackages } = useClintPackages({
    registry: state?.defaultPackageRegistry ?? null,
    packages: state?.packages ?? [],
  })
  const clintManifestsByName = useMemo(
    () => Object.fromEntries(clintPackages.map((p) => [p.package.name, p.manifest])),
    [clintPackages],
  )
  const { byPrefix: clintRuntimeEndpointsByPrefix } = useClintRuntimeEndpoints(
    subdomain,
    documentId,
  )

  // Resolve the active drawer scope into the concrete service/agent the
  // drawer needs. We do this here (not inside the drawers) so the drawers
  // can stay dumb renderers and the URL drives mount/unmount.
  const drawerService = useMemo(() => {
    if (!state || drawer.scope?.kind !== 'service') return null
    const enumKind = drawer.scope.id.toUpperCase() as 'CONNECT' | 'SWITCHBOARD' | 'FUSION'
    return state.services.find((s) => s.type === enumKind) ?? null
  }, [state, drawer.scope])

  const drawerAgent = useMemo(() => {
    if (!state || drawer.scope?.kind !== 'agent') return null
    return state.services.find((s) => s.type === 'CLINT' && s.prefix === drawer.scope!.id) ?? null
  }, [state, drawer.scope])

  if (isLoading) {
    return <p className="text-muted-foreground">Loading environment...</p>
  }

  const displayName = state?.label || environment?.name || 'Environment'
  const baseDomain = state?.genericBaseDomain ?? 'vetra.io'

  // Build visit URLs from enabled services
  const enabledServices = state?.services.filter((s) => s.enabled) ?? []

  return (
    <>
      {/* Header — HeroCard with glass surface so it lifts off the
          ambient background and reads as the page's anchor. The "Back
          to Cloud" link sits outside the card as a breadcrumb. */}
      <div className="space-y-4">
        <Link
          href="/cloud"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cloud
        </Link>
        <HeroCard glass>
          <div className="flex flex-wrap items-center gap-3 p-6">
            <div className="min-w-0 flex-1 space-y-1">
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
              </div>
              {subdomain && (
                <p className="text-muted-foreground truncate font-mono text-xs">
                  {subdomain}.{baseDomain}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Deploy/Approve button — hidden instantly on click via
                  justApproved until the server confirms a
                  post-CHANGES_PENDING state, to mask the
                  subscription-vs-push race. */}
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
        </HeroCard>
      </div>

      {/* Sections — single column, top to bottom. The previous env-level
          tabs (Logs / Metrics / Deployments / Configuration) folded into
          the per-service / per-agent drawers and the inline Configuration
          section below. */}
      {state && environment && (
        <div className="space-y-8">
          <OverviewTab
            subdomain={subdomain}
            tenantId={tenantId}
            environment={environment}
            status={envStatus}
            pods={envPods}
            statusLoading={statusLoading}
            enableService={detail.enableService}
            disableService={detail.disableService}
            setServiceConfig={detail.setServiceConfig}
            setServiceSize={detail.setServiceSize}
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
            onOpenServiceDetail={(kind) => drawer.open({ kind: 'service', id: kind }, 'logs')}
            onOpenAgentDetail={(prefix) => drawer.open({ kind: 'agent', id: prefix }, 'logs')}
          />

          {/* Configuration — env-wide package config (env vars + secrets
              declared by manifests). This used to be a tab; now it sits
              inline so the page is a single readable surface. Per-agent
              config lives inside the agent drawer's Config tab. */}
          <ConfigurationTab tenantId={tenantId} environment={environment} />
        </div>
      )}

      {/* Drawers — mounted at page level so URL state controls visibility.
          We pass the resolved service/agent down so the drawer doesn't
          need to know about the doc model. */}
      {state && environment && drawer.scope?.kind === 'service' && (
        <ServiceDetailDrawer
          open
          onClose={drawer.close}
          kind={drawer.scope.id}
          service={drawerService ?? undefined}
          subdomain={subdomain}
          tenantId={tenantId}
          documentId={documentId}
          isStopped={isInactive}
          pods={envPods}
          activeTab={drawer.tab ?? 'logs'}
          onTabChange={drawer.setTab}
        />
      )}
      {state && environment && drawer.scope?.kind === 'agent' && drawerAgent && (
        <AgentDetailDrawer
          open
          onClose={drawer.close}
          service={drawerAgent}
          env={environment}
          subdomain={subdomain}
          tenantId={tenantId}
          isStopped={isInactive}
          canEdit={canSign}
          manifest={
            drawerAgent.config
              ? (clintManifestsByName[drawerAgent.config.package.name] ?? null)
              : null
          }
          runtimeEndpoints={clintRuntimeEndpointsByPrefix[drawerAgent.prefix] ?? null}
          pods={envPods}
          activeTab={drawer.tab ?? 'logs'}
          onTabChange={drawer.setTab}
          onSaveConfig={
            detail.setServiceConfig
              ? async (config) => {
                  await detail.setServiceConfig(drawerAgent.prefix, config)
                  toast.success('Agent updated')
                }
              : undefined
          }
          onDisable={async () => {
            await detail.disableService('CLINT', drawerAgent.prefix)
            toast.success('Agent removed')
            drawer.close()
          }}
        />
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
