import { useMemo } from 'react'
import { DeliverableStatus } from '@/modules/roadmap/components/milestone-details-card/type'

interface DeliverableStatusChipProps {
  status: DeliverableStatus
}

export default function DeliverableStatusChip({ status }: DeliverableStatusChipProps) {
  const { label, bgColor, textColor } = useMemo(() => {
    switch (status) {
      case DeliverableStatus.IN_PROGRESS:
        return {
          label: 'In Progress',
          bgColor: 'bg-blue-100 dark:bg-blue-500/40',
          textColor: 'text-blue-800 dark:text-blue-50',
        }
      case DeliverableStatus.DELIVERED:
        return {
          label: 'Delivered',
          bgColor: 'bg-green-100 dark:bg-green-500/40',
          textColor: 'text-green-800 dark:text-green-50',
        }
      case DeliverableStatus.BLOCKED:
        return {
          label: 'Blocked',
          bgColor: 'bg-slate-50 dark:bg-slate-500/40',
          textColor: 'text-gray-500 dark:text-gray-50',
        }
      case DeliverableStatus.DRAFT:
      case DeliverableStatus.TODO:
        return {
          label: status === DeliverableStatus.DRAFT ? 'Draft' : 'To do',
          bgColor: 'bg-orange-100 dark:bg-orange-500/40',
          textColor: 'text-orange-800 dark:text-orange-100',
        }
      case DeliverableStatus.WONT_DO:
        return {
          label: "Won't do",
          bgColor: 'bg-gray-100 dark:bg-gray-500/40',
          textColor: 'text-gray-600 dark:text-gray-300',
        }
      default:
        return {
          label: 'To do',
          bgColor: 'bg-orange-100 dark:bg-orange-500/40',
          textColor: 'text-orange-800 dark:text-orange-100',
        }
    }
  }, [status])

  return (
    <div
      className={`inline-flex items-center justify-center rounded-md px-4 py-1 text-sm leading-[22px] font-semibold text-nowrap ${bgColor} ${textColor}`}
    >
      {label}
    </div>
  )
}
