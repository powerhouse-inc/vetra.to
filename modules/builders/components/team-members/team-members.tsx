'use client'

import { Copy, User } from 'lucide-react'
import React from 'react'

import RenownSvg from '@/modules/shared/components/svgs/renown.svg'
import { Avatar, AvatarFallback, AvatarImage } from '@/modules/shared/components/ui/avatar'
import { Card, CardContent } from '@/modules/shared/components/ui/card'
import { cn } from '@/modules/shared/lib/utils'

interface TeamMember {
  id: string
  phid?: string
  ethAddress: string
  name?: string
  email?: string
  role?: string
  avatar?: string
  isRenown?: boolean
}

interface TeamMembersProps {
  members: TeamMember[]
  className?: string
}

const TeamMembers: React.FC<TeamMembersProps> = ({ members, className }) => {
  // Generate initials from eth address or name
  const getInitials = (member: TeamMember) => {
    if (member.name) {
      return member.name
        .split(' ')
        .map((word) => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    // Fallback to first 2 characters of eth address
    return (member.ethAddress?.slice(2, 4) || member.id.slice(0, 2)).toUpperCase()
  }

  // Generate a name from eth address if not provided
  const getDisplayName = (member: TeamMember) => {
    if (member.name) return member.name
    return member.ethAddress?.slice(2, 8) || member.id.slice(0, 6)
  }

  // Format eth address to 0xABCD..XYZZ format
  const getDisplayEthAddress = (member: TeamMember) => {
    const address = member.ethAddress
    if (!address || address.length < 10) return address
    return `${address.slice(0, 6)}..${address.slice(-4)}`
  }

  // Copy to clipboard function
  const copyToClipboard = (text: string, event: React.MouseEvent) => {
    event.preventDefault()
    navigator.clipboard.writeText(text)
  }

  return (
    <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3', className)}>
      {members.map((member) => (
        <Card key={member.id} className="transition-shadow hover:shadow-md">
          <CardContent className="flex items-center gap-4 p-5">
            {/* Avatar */}
            <Avatar className="size-12 flex-shrink-0">
              {member.avatar && <AvatarImage src={member.avatar} alt={getDisplayName(member)} />}
              <AvatarFallback>
                <User className="text-foreground-70 size-6" />
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <h4 className="truncate font-semibold">{getDisplayName(member)}</h4>
              <p className="text-foreground-70 text-sm">{member.role || 'Developer'}</p>

              {/* ETH Address */}
              <div className="mt-1 flex items-center gap-1.5">
                <span className="text-foreground-70 font-mono text-xs">
                  {getDisplayEthAddress(member)}
                </span>
                <Copy
                  className="text-foreground-70 hover:text-foreground size-3 cursor-pointer transition-colors"
                  onClick={(e) => copyToClipboard(member.ethAddress, e)}
                />
              </div>
            </div>

            {/* Renown Link */}
            {member.isRenown && member.phid && (
              <a
                href={`${process.env.NEXT_PUBLIC_RENOWN_URL}/profile/${member.phid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 transition-opacity hover:opacity-80"
              >
                <RenownSvg />
              </a>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default TeamMembers
