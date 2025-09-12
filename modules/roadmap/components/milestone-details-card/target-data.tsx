import { InfoIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/modules/shared/components/ui/tooltip'
import { formatDateStringToQuarter } from '../../lib/date'

interface TargetDataProps {
  targetDate: string
}

export default function TargetData({ targetDate }: TargetDataProps) {
  return (
    <div className="flex flex-col items-start gap-4 self-stretch rounded-xl border border-slate-200 px-4 py-2 lg:px-[15px] lg:py-[15px] dark:border-neutral-700">
      <div className="flex items-center justify-between gap-4 self-stretch">
        <div className="flex items-center text-xs font-medium text-gray-700 dark:text-gray-600">
          Target Date
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="size-4" />
            </TooltipTrigger>
            <TooltipContent>
              <div className="max-w-[260px]">
                Target dates are meant as internal project management indicators. They are subject
                to change without notice and offer no guarantee for the delivery time of the
                milestone
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex flex-nowrap items-center gap-1 text-sm leading-[22px] font-semibold text-gray-900 lg:text-base lg:leading-normal lg:font-bold dark:text-gray-50">
          {formatDateStringToQuarter(targetDate, true)}
        </div>
      </div>
    </div>
  )
}
