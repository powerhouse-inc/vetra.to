import { Badge } from '@/modules/shared/components/ui/badge'
import { cn } from '@/shared/lib/utils'
import type {
  ArgoHealthStatus,
  ArgoSyncStatus,
  CloudEnvironmentStatus,
} from '@/modules/cloud/types'

type StatusBadgeProps = {
  argoHealthStatus?: ArgoHealthStatus
  argoSyncStatus?: ArgoSyncStatus
  environmentStatus: CloudEnvironmentStatus
  isLoading?: boolean
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

  if (
    environmentStatus === 'DRAFT' ||
    environmentStatus === 'DESTROYED' ||
    environmentStatus === 'ARCHIVED'
  ) {
    return (
      <Badge
        variant="secondary"
        className="bg-muted text-muted-foreground rounded-full border-transparent"
      >
        {environmentStatus === 'DRAFT'
          ? 'Draft'
          : environmentStatus === 'DESTROYED'
            ? 'Destroyed'
            : 'Archived'}
      </Badge>
    )
  }

  if (environmentStatus === 'DEPLOYING' || environmentStatus === 'CHANGES_PUSHED') {
    return (
      <Badge
        variant="secondary"
        className="animate-pulse rounded-full border-transparent bg-[#ffa132]/20 text-[#ffa132]"
      >
        Deploying
      </Badge>
    )
  }

  if (environmentStatus === 'DEPLOYMENt_FAILED') {
    return (
      <Badge
        variant="secondary"
        className="rounded-full border-transparent bg-[#ea4335]/20 text-[#ea4335]"
      >
        Failed
      </Badge>
    )
  }

  if (environmentStatus === 'TERMINATING') {
    return (
      <Badge
        variant="secondary"
        className="animate-pulse rounded-full border-transparent bg-[#ea4335]/20 text-[#ea4335]"
      >
        Terminating
      </Badge>
    )
  }

  if (environmentStatus === 'CHANGES_PENDING' || environmentStatus === 'CHANGES_APPROVED') {
    return (
      <Badge
        variant="secondary"
        className="rounded-full border-transparent bg-blue-500/20 text-blue-500"
      >
        {environmentStatus === 'CHANGES_PENDING' ? 'Pending' : 'Approved'}
      </Badge>
    )
  }

  // READY state — use ArgoCD status for more detail
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

  return (
    <Badge
      variant="secondary"
      className={cn('bg-muted text-muted-foreground rounded-full border-transparent')}
    >
      Unknown
    </Badge>
  )
}
