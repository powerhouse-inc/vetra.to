import { Copy, Plus, User } from 'lucide-react'
import React from 'react'

import {
  StripedCard,
  StripedCardContent,
  StripedCardHeader,
  StripedCardTitle,
} from '@/modules/shared/components/striped-card/striped-card'
import ProfileSvg from '@/modules/shared/components/svgs/profile.svg'
import RenownSvg from '@/modules/shared/components/svgs/renown.svg'
import { Avatar, AvatarFallback, AvatarImage } from '@/modules/shared/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card'
import { cn } from '@/modules/shared/lib/utils'

interface TeamMember {
  id: string
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
    return member.ethAddress.slice(2, 4).toUpperCase()
  }

  // Generate a name from eth address if not provided
  const getDisplayName = (member: TeamMember) => {
    if (member.name) return member.name
    // Use first part of eth address as display name
    return member.ethAddress.slice(2, 8)
  }

  // Generate email from eth address if not provided
  const getDisplayEmail = (member: TeamMember) => {
    if (member.email) return member.email
    return `${member.ethAddress.slice(2, 8)}-ph.eth`
  }

  // Copy to clipboard function
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="text-xl">Team Members</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {members.map((member) => (
            <StripedCard
              key={member.id}
              className="flex flex-col items-center space-y-4 text-center transition-shadow hover:shadow-md"
            >
              <StripedCardHeader className="w-full">
                <StripedCardTitle className="text-center">
                  {getDisplayName(member)}
                </StripedCardTitle>
              </StripedCardHeader>
              <StripedCardContent className="flex flex-col items-center space-y-4">
                {/* Avatar */}
                <Avatar className="size-16">
                  <ProfileSvg className="size-16" />
                </Avatar>

                {/* ETH Address with Copy Icon */}
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">{getDisplayEmail(member)}</p>
                  <Copy className="size-4" />
                </div>

                {/* Role with Icon */}
                <div className="flex items-center gap-2">
                  <User className="size-4 text-gray-500" />
                  <p className="text-sm text-gray-600">{member.role || 'Developer'}</p>
                </div>

                {/* Renown Button */}
                {member.isRenown && (
                  <div className="mt-2">
                    <div className="flex items-center justify-center gap-2 rounded px-4 py-2">
                      <RenownSvg className="" />
                    </div>
                  </div>
                )}
              </StripedCardContent>
            </StripedCard>
          ))}

          {/* Spared Card - Add New Member */}
          <StripedCard className="flex cursor-pointer flex-col items-center justify-center space-y-4 border-2 border-dashed border-gray-300 bg-gray-50 text-center transition-all hover:border-gray-400 hover:bg-gray-100">
            <StripedCardHeader className="w-full">
              <StripedCardTitle className="text-center text-gray-600">Add Member</StripedCardTitle>
            </StripedCardHeader>
            <StripedCardContent className="flex flex-col items-center space-y-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
                <Plus className="h-8 w-8 text-gray-500" />
              </div>
              <p className="text-sm text-gray-500">Invite a new team member</p>
            </StripedCardContent>
          </StripedCard>
        </div>
      </CardContent>
    </Card>
  )
}

export default TeamMembers
