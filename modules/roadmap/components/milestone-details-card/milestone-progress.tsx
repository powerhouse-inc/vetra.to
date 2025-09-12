import type { DeliverableSet } from './type'

interface MilestoneProgressProps {
  data: Omit<DeliverableSet, 'deliverables'>
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(Math.max(value, min), max)
}

function getProgressPercent(progress: DeliverableSet['progress']): number {
  if (!progress) return 0
  if (progress.__typename === 'Percentage') {
    return clamp((progress.value ?? 0) * 100)
  }
  if (progress.__typename === 'StoryPoints') {
    if (!progress.completed || !progress.total) return 0
    return (progress.completed / progress.total) * 100
  }
  return 0
}

function PlaceholderProgressBar({ value }: { value: number }) {
  const widthStyle = { width: `${clamp(value)}%` } as const
  return (
    <div className="w-full">
      <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-neutral-800">
        <div
          className="h-full rounded-full bg-blue-600 transition-[width] duration-300 ease-out dark:bg-blue-500"
          style={widthStyle}
        />
      </div>
    </div>
  )
}

export default function MilestoneProgress({ data }: MilestoneProgressProps) {
  const progress = getProgressPercent(data?.progress)

  return (
    <div className="flex flex-col items-center justify-center gap-4 self-stretch rounded-md pt-2">
      {/* Placeholder for PercentageProgressBar */}
      <PlaceholderProgressBar value={progress} />

      <div className="text-sm leading-6 font-semibold text-gray-900 dark:text-gray-50">
        <span className="text-blue-700 dark:text-blue-900">{data?.deliverablesCompleted ?? 0}</span>
        <span className="px-1 font-bold text-slate-500 dark:text-slate-400">/</span>
        <span className="font-bold text-slate-500 dark:text-slate-400">
          {data?.totalDeliverables ?? 0}
        </span>
        Deliverables Completed
      </div>
    </div>
  )
}
