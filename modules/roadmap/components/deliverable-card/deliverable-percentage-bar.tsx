import { usLocalizedNumber } from '@/modules/shared/lib/humanization'
import { cn } from '../../../shared/lib/utils'

interface DeliverablePercentageBarProps {
  percentage: number
}

export default function DeliverablePercentageBar({ percentage }: DeliverablePercentageBarProps) {
  const width = percentage === 0 ? '0%' : `max(${percentage * 100}%, 0.5px)`

  return (
    <div className="relative w-full rounded bg-slate-50">
      <div
        className={cn(
          'h-4 bg-blue-500',
          percentage === 1 ? 'rounded' : 'rounded-l',
          percentage === 1 ? 'bg-green-500' : 'bg-blue-500',
        )}
        style={{ width }}
      />
      <span
        className={cn(
          'absolute top-0 right-2 text-xs font-bold',
          percentage === 1 ? 'text-slate-50' : 'text-slate-100',
        )}
      >
        {usLocalizedNumber(percentage * 100, 0)}%
      </span>
    </div>
  )
}
