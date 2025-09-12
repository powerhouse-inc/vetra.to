import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/modules/shared/lib/utils'

interface ProjectLinkProps {
  href?: string
  code: string
  name: string
}

const ProjectLink: React.FC<ProjectLinkProps> = ({ href, code, name }) => (
  <Link
    href={href ?? ''}
    className="flex w-full justify-between overflow-hidden rounded-sm bg-white shadow-sm"
  >
    <div className="flex w-full max-w-[calc(100%-40px)] items-center gap-2 px-1 py-1 pl-2">
      <div
        className={cn(
          'relative pr-2 text-xs leading-[18px] font-medium text-slate-100 uppercase dark:text-slate-200',
          "after:bg-charcoal-100 after:absolute after:top-0 after:right-0 after:h-full after:w-px after:content-[''] dark:after:bg-slate-200",
        )}
      >
        Project
      </div>
      <div
        className={`flex items-start gap-1 ${href ? 'w-[calc(100%-50px)]' : 'w-[calc(100%-40px)]'}`}
      >
        <span className="text-sm leading-[22px] font-semibold text-slate-100 dark:text-slate-200">
          {code}
        </span>
        <span
          className={`overflow-hidden text-sm leading-[22px] font-semibold text-ellipsis whitespace-nowrap text-gray-900 dark:text-slate-50 ${href ? 'max-w-[calc(100%-55px)]' : 'max-w-full'}`}
        >
          {name}
        </span>
      </div>
    </div>
    {href && (
      <div className="flex h-8 w-8 items-center justify-center overflow-hidden bg-slate-50 dark:bg-gray-700">
        <ArrowRight className="size-4" />
      </div>
    )}
  </Link>
)

export default ProjectLink
