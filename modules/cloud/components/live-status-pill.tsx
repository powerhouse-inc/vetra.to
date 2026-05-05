import type { ClintAgentStatusTone } from '@/modules/cloud/lib/clint-agent-status'
import { Badge } from '@/modules/shared/components/ui/badge'
import { cn } from '@/shared/lib/utils'

const DOT: Record<ClintAgentStatusTone, string> = {
  healthy: 'bg-emerald-500',
  starting: 'bg-amber-500 animate-pulse',
  restarting: 'bg-amber-500 animate-pulse',
  failed: 'bg-rose-500',
  stopped: 'bg-gray-400',
}

const PILL: Record<ClintAgentStatusTone, string> = {
  healthy: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  starting: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  restarting: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  failed: 'bg-rose-500/15 text-rose-700 dark:text-rose-400',
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
 * Small status pill with a colored leading dot. Used by AgentCard and
 * ServiceCard so live-status visualisation reads the same across the
 * Overview tab regardless of whether the row is a clint agent, a
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
