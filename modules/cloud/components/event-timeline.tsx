import { Badge } from '@/modules/shared/components/ui/badge'
import type { KubeEvent } from '@/modules/cloud/types'

function timeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

type EventTimelineProps = {
  events: KubeEvent[]
  isLoading?: boolean
}

export function EventTimeline({ events, isLoading }: EventTimelineProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex animate-pulse items-start gap-3">
            <div className="bg-muted h-4 w-12 rounded" />
            <div className="bg-muted h-4 w-16 rounded" />
            <div className="bg-muted h-4 w-24 rounded" />
            <div className="bg-muted h-4 flex-1 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return <p className="text-muted-foreground py-6 text-center text-sm">No recent events</p>
  }

  return (
    <div className="space-y-2">
      {events.map((event, i) => (
        <div key={i} className="flex items-start gap-3 py-1 text-sm">
          <span className="text-muted-foreground w-14 shrink-0 pt-0.5 text-xs">
            {timeAgo(event.timestamp)}
          </span>

          <span className="shrink-0">
            {event.type === 'WARNING' ? (
              <Badge
                variant="secondary"
                className="border-transparent bg-[#ffa132]/20 text-xs text-[#ffa132]"
              >
                WARNING
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="bg-muted text-muted-foreground border-transparent text-xs"
              >
                NORMAL
              </Badge>
            )}
          </span>

          <span className="shrink-0 font-semibold">{event.reason}</span>

          <span className="text-foreground line-clamp-1 min-w-0 flex-1">{event.message}</span>

          <span className="text-muted-foreground hidden shrink-0 text-xs sm:block">
            {event.involvedObject}
          </span>
        </div>
      ))}
    </div>
  )
}
