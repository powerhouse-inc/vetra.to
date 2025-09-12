import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'

interface SectionTitleProps {
  title: string
  tooltip?: string
}

export default function SectionTitle({ title, tooltip }: SectionTitleProps) {
  return (
    <div className="flex items-center gap-2">
      <h2 className="m-0 text-lg font-bold text-gray-900 md:text-xl md:leading-6 xl:text-2xl">
        {title}
      </h2>
      {tooltip && (
        <Tooltip>
          <TooltipTrigger>
            <Info className="size-4" />
          </TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
