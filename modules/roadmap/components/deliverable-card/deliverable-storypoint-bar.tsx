import { cn } from '@/modules/shared/lib/utils'

interface DeliverableStoryPointsBarProps {
  total: number
  completed: number
}

export default function DeliverableStorypointBar({
  total,
  completed,
}: DeliverableStoryPointsBarProps) {
  return (
    <div className="flex h-4 w-full items-center gap-4">
      <div className={cn('flex h-full w-full items-center', total > 10 ? 'gap-0.5' : 'gap-1')}>
        {Array.from({ length: total }).map((_, index) => (
          <div
            className={cn('h-full w-full rounded', completed ? 'bg-blue-700' : 'bg-slate-50')}
            key={index}
          />
        ))}
      </div>
      <div className="w-fit min-w-fit text-right text-sm font-medium">
        <span className="text-xs font-bold">{completed}</span> of {total}
      </div>
    </div>
  )
}
