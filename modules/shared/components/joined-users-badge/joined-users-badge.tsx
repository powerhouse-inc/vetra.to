import { JOINED_USERS } from '@/modules/shared/lib/users'
import { Avatar, AvatarImage } from '@/shared/components/ui/avatar'

interface JoinedUsersBadgeProps {
  count?: number
}

export function JoinedUsersBadge({ count = 100 }: JoinedUsersBadgeProps) {
  return (
    <div className="mt-10 flex flex-col items-center gap-2">
      <span className="inline-flex items-center -space-x-3.5 sm:-space-x-2.5">
        {JOINED_USERS.map((user) => (
          <Avatar key={user.name} className="size-8">
            <AvatarImage src={user.avatar} alt={user.name} />
          </Avatar>
        ))}
      </span>
      <p className="text-muted-foreground/80 tracking-tight">+{count} people already joined</p>
    </div>
  )
}
