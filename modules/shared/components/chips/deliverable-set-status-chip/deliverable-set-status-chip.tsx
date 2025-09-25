import { useMemo } from 'react'
import { ScopeOfWork_DeliverableSetStatus } from '@/modules/__generated__/graphql/switchboard-generated'
import { cn } from '@/modules/shared/lib/utils'

interface DeliverableSetStatusChipProps {
  status: ScopeOfWork_DeliverableSetStatus
}

export default function DeliverableSetStatusChip({ status }: DeliverableSetStatusChipProps) {
  const { label, bgColor, textColor } = useMemo(() => {
    switch (status) {
      case ScopeOfWork_DeliverableSetStatus.InProgress:
        return {
          label: 'In Progress',
          bgColor: 'bg-status-progress/30',
          textColor: 'text-status-progress',
        }
      case ScopeOfWork_DeliverableSetStatus.Finished:
        return {
          label: 'Finished',
          bgColor: 'bg-status-success/30',
          textColor: 'text-status-success',
        }
      case ScopeOfWork_DeliverableSetStatus.Canceled:
        return {
          label: 'Canceled',
          bgColor: 'bg-slate-50', // TODO: replace colors
          textColor: 'text-gray-500',
        }
      case ScopeOfWork_DeliverableSetStatus.Draft:
      case ScopeOfWork_DeliverableSetStatus.Todo:
        return {
          label: status === ScopeOfWork_DeliverableSetStatus.Draft ? 'Draft' : 'To do',
          bgColor: 'bg-status-warning/30',
          textColor: 'text-status-warning',
        }
      default:
        return {
          label: 'Unknown',
          bgColor: 'bg-status-slate/30',
          textColor: 'text-status-slate',
        }
    }
  }, [status])

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-md px-3 py-px text-xs/5.5 font-semibold text-nowrap uppercase',
        bgColor,
        textColor,
      )}
    >
      {label}
    </div>
  )
}
