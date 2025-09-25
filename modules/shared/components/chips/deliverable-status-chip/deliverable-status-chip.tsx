import { useMemo } from 'react'
import { ScopeOfWork_DeliverableStatus } from '@/modules/__generated__/graphql/switchboard-generated'
import { cn } from '@/modules/shared/lib/utils'

interface DeliverableStatusChipProps {
  status: ScopeOfWork_DeliverableStatus
}

export default function DeliverableStatusChip({ status }: DeliverableStatusChipProps) {
  const { label, bgColor, textColor } = useMemo(() => {
    switch (status) {
      case ScopeOfWork_DeliverableStatus.InProgress:
        return {
          label: 'In Progress',
          bgColor: 'bg-status-progress/30',
          textColor: 'text-status-progress',
        }
      case ScopeOfWork_DeliverableStatus.Delivered:
        return {
          label: 'Delivered',
          bgColor: 'bg-status-success/30',
          textColor: 'text-status-success',
        }
      case ScopeOfWork_DeliverableStatus.Blocked:
        return {
          label: 'Blocked',
          bgColor: 'bg-slate-50', // TODO: replace colors
          textColor: 'text-gray-500',
        }
      case ScopeOfWork_DeliverableStatus.Canceled:
        return {
          label: 'Canceled',
          bgColor: 'bg-slate-50', // TODO: replace colors
          textColor: 'text-gray-500',
        }
      case ScopeOfWork_DeliverableStatus.Draft:
      case ScopeOfWork_DeliverableStatus.Todo:
        return {
          label: status === ScopeOfWork_DeliverableStatus.Draft ? 'Draft' : 'To do',
          bgColor: 'bg-status-warning/30',
          textColor: 'text-status-warning',
        }
      case ScopeOfWork_DeliverableStatus.WontDo:
        return {
          label: "Won't do",
          bgColor: 'bg-gray-100', // TODO: replace colors
          textColor: 'text-gray-600',
        }
      default:
        return {
          label: 'To do',
          bgColor: 'bg-status-warning/30',
          textColor: 'text-status-warning',
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
