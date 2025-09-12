import { UserRound } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/modules/shared/components/ui/avatar'
import type { OwnerRef } from './type'

interface ContributorsProps {
  contributors: OwnerRef[]
}

export default function Contributors({ contributors }: ContributorsProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 px-4 py-2 lg:px-4 lg:py-4 dark:border-neutral-700">
      <div className="text-xs font-medium text-gray-700 dark:text-gray-600">Coordinator(s)</div>

      <div className="flex flex-wrap gap-4">
        {contributors.map((contributor) => (
          <div key={contributor.id} className="flex items-center gap-2 self-stretch">
            <Avatar className="size-6">
              <AvatarImage src={contributor.imageUrl} />
              <AvatarFallback>
                <UserRound className="size-4" />
              </AvatarFallback>
            </Avatar>
            <div className="text-charcoal-600 text-sm leading-[22px] font-semibold lg:text-base lg:leading-6 dark:text-slate-100">
              {contributor.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
