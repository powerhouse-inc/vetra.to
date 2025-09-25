import { ExternalLink, Github, Globe, Twitter } from 'lucide-react'
import React from 'react'

import XLogo from '@/modules/shared/components/icons/x-logo'
import {
  StripedCard,
  StripedCardContent,
  StripedCardHeader,
} from '@/modules/shared/components/striped-card'
import { Avatar, AvatarFallback, AvatarImage } from '@/modules/shared/components/ui/avatar'
import { Badge } from '@/modules/shared/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card'
import { cn } from '@/modules/shared/lib/utils'

interface BuilderProfileProps {
  profileName: string
  profileLogo?: string
  profileDescription?: string
  profileSocialsX?: string
  profileSocialsGithub?: string
  profileSocialsWebsite?: string
  industryExpertise?: string[]
  className?: string
}

const BuilderProfile: React.FC<BuilderProfileProps> = ({
  profileName,
  profileLogo,
  profileDescription,
  profileSocialsX,
  profileSocialsGithub,
  profileSocialsWebsite,
  industryExpertise = [],
  className,
}) => {
  // Generate initials from profile name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 3)
  }

  return (
    <StripedCard className={cn('w-full', className)}>
      <StripedCardHeader className={cn('text-center font-bold')}>Builder Profile</StripedCardHeader>
      <StripedCardContent className="p-6">
        {/* Profile Info */}
        <div className="mb-6 flex items-start gap-6">
          {/* Left Column - Avatar */}
          <div className="flex-shrink-0">
            <Avatar className="size-20">
              <AvatarImage src={profileLogo} alt={profileName} />
              <AvatarFallback className="bg-gray-800 text-lg font-semibold text-white">
                {getInitials(profileName)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Right Column - Content */}
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900">{profileName}</h3>
              {profileDescription && (
                <p className="text-sm leading-relaxed text-gray-600">{profileDescription}</p>
              )}
            </div>

            {/* External Links */}
            {(profileSocialsX || profileSocialsGithub || profileSocialsWebsite) && (
              <div>
                <h4 className="mb-3 text-sm font-medium text-gray-700">External Links</h4>
                <div className="space-y-2">
                  {profileSocialsX && (
                    <a
                      href={`https://x.com/${profileSocialsX.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-gray-700 transition-colors hover:text-gray-900"
                    >
                      <XLogo className="size-4" />
                      <span>{profileSocialsX}</span>
                      <ExternalLink className="ml-auto size-3" />
                    </a>
                  )}
                  {profileSocialsGithub && (
                    <a
                      href={`https://github.com/${profileSocialsGithub}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-gray-700 transition-colors hover:text-gray-900"
                    >
                      <Github className="size-4" />
                      <span>{profileSocialsGithub}</span>
                      <ExternalLink className="ml-auto size-3" />
                    </a>
                  )}
                  {profileSocialsWebsite && (
                    <a
                      href={profileSocialsWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-gray-700 transition-colors hover:text-gray-900"
                    >
                      <Globe className="size-4" />
                      <span>{profileSocialsWebsite}</span>
                      <ExternalLink className="ml-auto size-3" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Industry Expertise */}
            {industryExpertise.length > 0 && (
              <div>
                <h4 className="mb-3 text-sm font-medium text-gray-700">Industry Expertise</h4>
                <div className="flex flex-wrap gap-2">
                  {industryExpertise.map((expertise, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="border-blue-200 bg-white text-blue-800 hover:bg-blue-50"
                    >
                      {expertise}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </StripedCardContent>
    </StripedCard>
  )
}

export default BuilderProfile
