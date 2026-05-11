import type { ClintAgentStatusTone } from '@/modules/cloud/lib/clint-agent-status'
import { Badge } from '@/modules/shared/components/ui/badge'
import { cn } from '@/shared/lib/utils'

const DOT: Record<ClintAgentStatusTone, string> = {
  healthy: 'bg-success',
  starting: 'bg-warning animate-pulse',
  restarting: 'bg-warning animate-pulse',
  failed: 'bg-destructive',
  stopped: 'bg-muted-foreground',
}

const PILL: Record<ClintAgentStatusTone, string> = {
  healthy: 'bg-success/15 text-success',
  starting: 'bg-warning/15 text-warning',
  restarting: 'bg-warning/15 text-warning',
  failed: 'bg-destructive/15 text-destructive',
  stopped: 'bg-muted text-muted-foreground',
}

type Props = {
  tone: ClintAgentStatusTone
  label: string
  /** Tooltip text — usually the human-readable reason for the tone. */
  reason?: string
  className?: string
}

/**
 * Small status pill with a colored leading dot. Used by AgentCard and the
 * agent detail drawer so live-status visualisation reads the same across
 * the Overview tab regardless of whether the row is a clint agent, a
 * Connect/Switchboard service, or anything else with a derived tone.
 */
export function LiveStatusPill({ tone, label, reason, className }: Props) {
  return (
    <Badge
      variant="secondary"
      className={cn('rounded-full border-transparent', PILL[tone], className)}
      title={reason}
    >
      <span className={cn('mr-1.5 h-1.5 w-1.5 rounded-full', DOT[tone])} />
      {label}
    </Badge>
  )
}
