'use client'

import { Clock, Database, Download, Loader2, RefreshCw } from 'lucide-react'
import type { DatabaseDump, DatabaseDumpStatus } from '@/modules/cloud/types'
import { Button } from '@/modules/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'

function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const d = Date.now() - new Date(iso).getTime()
  const s = Math.max(1, Math.round(d / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 48) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

function timeUntil(iso: string): string {
  const d = new Date(iso).getTime() - Date.now()
  if (d < 0) return 'expired'
  const m = Math.round(d / 60000)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const remM = m % 60
  if (h < 48) return remM > 0 ? `${h}h ${remM}m` : `${h}h`
  return `${Math.round(h / 24)}d`
}

function fmtBytes(n: number | null): string {
  if (n === null || n === 0) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let v = n
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`
}

const PILL_BY_STATUS: Record<DatabaseDumpStatus, { label: string; cls: string }> = {
  PENDING: { label: 'PENDING', cls: 'bg-muted text-muted-foreground' },
  RUNNING: { label: 'RUNNING', cls: 'bg-blue-500/15 text-blue-400' },
  READY: { label: 'READY', cls: 'bg-emerald-500/15 text-emerald-400' },
  FAILED: { label: 'FAILED', cls: 'bg-red-500/15 text-red-400' },
}
const EXPIRED_PILL = { label: 'EXPIRED', cls: 'bg-muted text-muted-foreground' }

type Props = {
  dump: DatabaseDump
  onRetry?: () => void
}

export function DumpRow({ dump, onRetry }: Props) {
  const isExpired = new Date(dump.expiresAt).getTime() < Date.now()
  const isExpiredReady = isExpired && dump.status === 'READY'
  const pill = isExpiredReady ? EXPIRED_PILL : PILL_BY_STATUS[dump.status]
  const filename = `dump-${dump.id}.dump`
  const sizeStr = fmtBytes(dump.sizeBytes)

  return (
    <div className="bg-background/40 hover:bg-background/60 flex items-center gap-3 rounded-lg p-4 transition-colors">
      <div className="bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-md">
        {dump.status === 'RUNNING' ? (
          <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
        ) : isExpiredReady ? (
          <Clock className="text-muted-foreground h-4 w-4" />
        ) : (
          <Database className="text-muted-foreground h-4 w-4" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{filename}</span>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide',
              pill.cls,
            )}
          >
            {pill.label}
          </span>
        </div>
        <div className="text-muted-foreground mt-0.5 truncate text-xs">
          {dump.status === 'READY' && !isExpired && (
            <>
              {sizeStr && <>{sizeStr} · </>}
              {timeAgo(dump.completedAt ?? dump.requestedAt)} · expires in{' '}
              {timeUntil(dump.expiresAt)}
            </>
          )}
          {isExpiredReady && <>expired {timeAgo(dump.expiresAt)}</>}
          {dump.status === 'RUNNING' && (
            <>started {timeAgo(dump.startedAt ?? dump.requestedAt)} · pg_dump → S3</>
          )}
          {dump.status === 'PENDING' && <>requested {timeAgo(dump.requestedAt)}</>}
          {dump.status === 'FAILED' && (
            <>
              {timeAgo(dump.completedAt ?? dump.requestedAt)} ·{' '}
              {dump.errorMessage ?? 'unknown error'}
            </>
          )}
        </div>
        {dump.status === 'RUNNING' && (
          <div className="bg-muted mt-2 h-0.5 overflow-hidden rounded-full">
            <div className="h-full w-1/3 animate-pulse bg-blue-500" />
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {dump.status === 'READY' && !isExpired && dump.downloadUrl && (
          <Button asChild size="sm">
            <a href={dump.downloadUrl} download={filename}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Download
            </a>
          </Button>
        )}
        {dump.status === 'FAILED' && onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Retry
          </Button>
        )}
      </div>
    </div>
  )
}
