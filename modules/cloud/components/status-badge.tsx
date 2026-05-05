import type {
  ArgoHealthStatus,
  ArgoSyncStatus,
  CloudEnvironmentStatus,
} from '@/modules/cloud/types'
import { Badge } from '@/modules/shared/components/ui/badge'

type StatusBadgeProps = {
  argoHealthStatus?: ArgoHealthStatus
  argoSyncStatus?: ArgoSyncStatus
  environmentStatus: CloudEnvironmentStatus
  isLoading?: boolean
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  CHANGES_PENDING: { label: 'Pending', className: 'bg-blue-500/20 text-blue-500' },
  CHANGES_APPROVED: { label: 'Approved', className: 'bg-blue-500/20 text-blue-500' },
  CHANGES_PUSHED: { label: 'Deploying', className: 'bg-[#ffa132]/20 text-[#ffa132] animate-pulse' },
  DEPLOYING: { label: 'Deploying', className: 'bg-[#ffa132]/20 text-[#ffa132] animate-pulse' },
  DEPLOYMENt_FAILED: { label: 'Failed', className: 'bg-[#ea4335]/20 text-[#ea4335]' },
  READY: { label: 'Ready', className: 'bg-[#04c161]/20 text-[#04c161]' },
  TERMINATING: { label: 'Terminating', className: 'bg-[#ea4335]/20 text-[#ea4335] animate-pulse' },
  DESTROYED: { label: 'Destroyed', className: 'bg-muted text-muted-foreground' },
  ARCHIVED: { label: 'Archived', className: 'bg-muted text-muted-foreground' },
  STOPPED: { label: 'Stopped', className: 'bg-muted text-muted-foreground' },
}

export function StatusBadge({
  argoHealthStatus,
  argoSyncStatus,
  environmentStatus,
  isLoading,
}: StatusBadgeProps) {
  if (isLoading) {
    return <span className="bg-muted inline-flex h-5 w-16 animate-pulse rounded-full" />
  }

  // For READY status, refine with ArgoCD health if available
  if (environmentStatus === 'READY' && argoHealthStatus) {
    if (argoHealthStatus === 'DEGRADED') {
      return (
        <Badge
          variant="secondary"
          className="rounded-full border-transparent bg-[#ffa132]/20 text-[#ffa132]"
        >
          Degraded
        </Badge>
      )
    }
    if (argoHealthStatus === 'MISSING') {
      return (
        <Badge
          variant="secondary"
          className="rounded-full border-transparent bg-[#ea4335]/20 text-[#ea4335]"
        >
          Down
        </Badge>
      )
    }
    if (argoHealthStatus === 'PROGRESSING' || argoSyncStatus === 'OUT_OF_SYNC') {
      return (
        <Badge
          variant="secondary"
          className="animate-pulse rounded-full border-transparent bg-blue-500/20 text-blue-500"
        >
          Syncing
        </Badge>
      )
    }
    if (argoHealthStatus === 'HEALTHY' && argoSyncStatus === 'SYNCED') {
      return (
        <Badge
          variant="secondary"
          className="rounded-full border-transparent bg-[#04c161]/20 text-[#04c161]"
        >
          Healthy
        </Badge>
      )
    }
  }

  // Show document model status
  const config = STATUS_CONFIG[environmentStatus] ?? {
    label: environmentStatus,
    className: 'bg-muted text-muted-foreground',
  }

  return (
    <Badge variant="secondary" className={`rounded-full border-transparent ${config.className}`}>
      {config.label}
    </Badge>
  )
}
