'use client'

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
    // Use first part of eth address as display name
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
    <StripedCard className={cn('w-full', className)}>
      <StripedCardHeader>
        <StripedCardTitle className="text-center">Team Members</StripedCardTitle>
      </StripedCardHeader>
      <StripedCardContent>
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
                  {member.avatar && (
                    <AvatarImage src={member.avatar} alt={getDisplayName(member)} />
                  )}
                  <AvatarFallback>
                    <ProfileSvg className="size-16" />
                  </AvatarFallback>
                </Avatar>

                {/* ETH Address with Copy Icon */}
                <div className="flex items-center gap-2">
                  <p className="text-muted-foreground text-sm">{getDisplayEthAddress(member)}</p>
                  <Copy
                    className="size-4 cursor-pointer hover:text-gray-700"
                    onClick={(e) => copyToClipboard(member.ethAddress, e)}
                  />
                </div>

                {/* Role with Icon */}
                <div className="flex items-center gap-2">
                  <User className="text-muted-foreground size-4" />
                  <p className="text-sm">{member.role || 'Developer'}</p>
                </div>

                {/* Renown Button */}
                {member.isRenown && member.phid && (
                  <div className="mt-2">
                    <a
                      href={`https://renown-staging.vetra.io/profile/${member.phid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded px-4 py-2 transition-opacity hover:opacity-80"
                    >
                      <RenownSvg className="" />
                    </a>
                  </div>
                )}
              </StripedCardContent>
            </StripedCard>
          ))}

          {/* Spare Card - Add New Member */}
          <StripedCard className="flex cursor-pointer flex-col items-center justify-center space-y-4 border-2 border-dashed border-gray-300 text-center transition-all hover:border-gray-400">
            <StripedCardHeader className="w-full">
              <StripedCardTitle className="text-center">Add Member</StripedCardTitle>
            </StripedCardHeader>
            <StripedCardContent className="flex h-50 flex-col items-center space-y-3 pt-10">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
                <Plus className="h-8 w-8 text-gray-500" />
              </div>
              <p className="text-sm text-gray-500">Invite a new team member</p>
            </StripedCardContent>
          </StripedCard>
        </div>
      </StripedCardContent>
    </StripedCard>
  )
}

export default TeamMembers
