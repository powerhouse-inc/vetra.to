'use client'

import { AlertTriangle, Loader2 } from 'lucide-react'

import { Button } from '@/modules/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'

type Props = {
  /** Current env status from the doc model (e.g. DRAFT, CHANGES_PENDING, READY). */
  status: string | undefined
  /**
   * Local race-mask from the page: when the user clicks Approve we flip this
   * synchronously to hide the bar before the doc subscription confirms the
   * state has moved on. The bar honours it without owning it.
   */
  justApproved: boolean
  /** Whether the cluster's config has drifted from the doc. */
  driftDetected: boolean
  onApprove: () => void
}

const DEPLOYING_STATUSES = new Set([
  'CHANGES_APPROVED',
  'CHANGES_PUSHED',
  'DEPLOYING',
  // historical typo in the doc model — kept here defensively so the bar
  // still recognises it as a deploying state.
  'DEPLOYMENt_FAILED',
])

const HIDDEN_STATUSES = new Set(['STOPPED', 'TERMINATING', 'DESTROYED', 'ARCHIVED'])

/**
 * Floating action bar pinned to the bottom of the viewport. Appears only when
 * there's an action to take or a non-steady state worth surfacing; stays out
 * of the user's way when the env is just running.
 */
export function EnvActionBar({ status, justApproved, driftDetected, onApprove }: Props) {
  if (!status || justApproved) return null
  if (HIDDEN_STATUSES.has(status)) return null

  let body: React.ReactNode = null

  if (status === 'DRAFT') {
    body = (
      <>
        <span className="text-foreground text-sm">Ready to deploy</span>
        <Button
          size="sm"
          onClick={onApprove}
          className="rounded-full bg-emerald-600 px-5 hover:bg-emerald-700"
          aria-label="Deploy environment"
        >
          Deploy
        </Button>
      </>
    )
  } else if (status === 'CHANGES_PENDING') {
    body = (
      <>
        <span className="text-foreground text-sm">Pending change</span>
        <Button
          size="sm"
          onClick={onApprove}
          className="rounded-full bg-blue-600 px-5 hover:bg-blue-700"
          aria-label="Approve pending changes"
        >
          Approve
        </Button>
      </>
    )
  } else if (DEPLOYING_STATUSES.has(status)) {
    body = (
      <>
        <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />
        <span className="text-foreground text-sm">Deploying…</span>
      </>
    )
  } else if (status === 'READY' && driftDetected) {
    body = (
      <>
        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
        <span className="text-foreground text-sm">Config drift detected</span>
      </>
    )
  }

  if (!body) return null

  return (
    <div
      role="status"
      className={cn(
        'fixed inset-x-0 bottom-6 z-40 flex justify-center px-4',
        'pointer-events-none', // outer doesn't catch clicks; inner pill does
      )}
    >
      <div
        className={cn(
          'pointer-events-auto inline-flex items-center gap-3 rounded-full px-4 py-1.5',
          'border-border bg-background/95 supports-[backdrop-filter]:bg-background/80',
          'border shadow-lg backdrop-blur',
        )}
      >
        {body}
      </div>
    </div>
  )
}
