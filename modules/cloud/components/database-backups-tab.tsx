'use client'

import { Database, Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useEnvironmentDumps } from '@/modules/cloud/hooks/use-environment-dumps'
import { DumpRow } from '@/modules/cloud/components/dump-row'
import { Button } from '@/modules/shared/components/ui/button'

type Props = {
  tenantId: string | null
  canEdit: boolean
}

export function DatabaseBackupsTab({ tenantId, canEdit }: Props) {
  const {
    dumps,
    isLoading,
    error,
    isRequesting,
    cancellingId,
    restoringId,
    request,
    cancel,
    restore,
  } = useEnvironmentDumps(tenantId)

  const isRestoring = restoringId !== null
  const inFlight =
    dumps.some((d) => d.status === 'PENDING' || d.status === 'RUNNING') || isRestoring

  const handleCreate = async () => {
    try {
      await request()
      toast.success('Dump started — check back in a moment.')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start dump'
      // Surface the underlying contract errors with friendlier copy.
      if (msg.includes('DUMP_IN_PROGRESS')) {
        toast.error('A dump is already in progress for this environment.')
      } else if (msg.includes('FORBIDDEN')) {
        toast.error('Only the environment owner can request a dump.')
      } else {
        toast.error(msg)
      }
    }
  }

  const handleCancel = async (dumpId: string) => {
    try {
      await cancel(dumpId)
      toast.success('Dump cancelled.')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel dump'
      toast.error(msg)
    }
  }

  const handleRestore = async (dumpId: string) => {
    try {
      await restore(dumpId)
      toast.success('Restore started — the database will be replaced shortly.')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start restore'
      if (msg.includes('RESTORE_IN_PROGRESS')) {
        toast.error('A restore is already in progress for this environment.')
      } else if (msg.includes('DUMP_NOT_READY') || msg.includes('DUMP_EXPIRED')) {
        toast.error('This dump is no longer available for restore.')
      } else if (msg.includes('FORBIDDEN')) {
        toast.error('Only the environment owner can restore a dump.')
      } else {
        toast.error(msg)
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-background/40 flex items-center justify-between rounded-lg p-3">
        <div className="text-muted-foreground text-xs">
          <span className="text-foreground font-medium">{dumps.length}</span> dump
          {dumps.length === 1 ? '' : 's'} · 24h retention
        </div>
        {canEdit && (
          <Button size="sm" onClick={handleCreate} disabled={inFlight || isRequesting}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {isRequesting ? 'Starting…' : inFlight ? 'In progress…' : 'Create dump'}
          </Button>
        )}
      </div>

      {isRestoring && restoringId && (
        <div className="bg-warning/10 text-warning flex items-center gap-2 rounded-md px-3 py-2 text-sm">
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
          <span>
            Restoring from <span className="font-mono">dump-{restoringId}.dump</span>&hellip;
          </span>
        </div>
      )}

      {error && (
        <div className="text-destructive bg-destructive/10 rounded-md p-3 text-sm">{error}</div>
      )}

      {isLoading && dumps.length === 0 ? (
        <div className="text-muted-foreground py-8 text-center text-sm">Loading…</div>
      ) : dumps.length === 0 ? (
        <div className="text-muted-foreground bg-muted/30 flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
          <div className="bg-background flex h-12 w-12 items-center justify-center rounded-full border">
            <Database className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-foreground text-sm font-medium">No dumps yet</p>
            <p className="text-xs">
              Create a dump to download a portable copy of this environment&rsquo;s database.
            </p>
          </div>
          {canEdit && (
            <Button size="sm" variant="outline" onClick={handleCreate} disabled={isRequesting}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              {isRequesting ? 'Starting…' : 'Create dump'}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {dumps.map((d) => (
            <DumpRow
              key={d.id}
              dump={d}
              onRetry={d.status === 'FAILED' && canEdit ? handleCreate : undefined}
              onCancel={
                canEdit && (d.status === 'PENDING' || d.status === 'RUNNING')
                  ? () => handleCancel(d.id)
                  : undefined
              }
              isCancelling={cancellingId === d.id}
              onRestore={
                d.status === 'READY' && canEdit && !isRestoring
                  ? () => handleRestore(d.id)
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
