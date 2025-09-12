import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/modules/shared/lib/utils'

interface MilestoneLinkProps {
  roadmapSlug: string
  code: string
}

export default function MilestoneLink({ roadmapSlug, code }: MilestoneLinkProps) {
  return (
    <Link
      className="flex w-full justify-between overflow-hidden rounded-sm bg-white shadow-sm"
      href="#"
    >
      <div className="flex items-center gap-2 px-1 py-2">
        <div
          className={cn(
            'relative pr-2 text-xs leading-[18px] font-medium text-slate-500 uppercase dark:text-slate-400',
            'after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-slate-300 dark:after:bg-slate-400',
          )}
        >
          Milestone
        </div>
        <div className="text-sm font-semibold">{code}</div>
      </div>
      <div className="flex h-8 w-8 items-center justify-center overflow-hidden bg-slate-50">
        <ArrowRight className="size-4" />
      </div>
    </Link>
  )
}
