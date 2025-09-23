import { ExternalLink, Github, Globe, Twitter } from 'lucide-react'
import React from 'react'

import XLogo from '@/modules/shared/components/icons/x-logo'
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
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="text-xl">Builder Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Info */}
        <div className="flex items-start gap-4">
          <Avatar className="size-16">
            <AvatarImage src={profileLogo} alt={profileName} />
            <AvatarFallback className="bg-gray-800 text-lg font-semibold text-white">
              {getInitials(profileName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <h3 className="text-lg font-semibold">{profileName}</h3>
            {profileDescription && (
              <p className="text-sm leading-relaxed text-gray-600">{profileDescription}</p>
            )}
          </div>
        </div>

        {/* External Links */}
        {(profileSocialsX || profileSocialsGithub || profileSocialsWebsite) && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">External Links</h4>
            <div className="flex flex-wrap gap-3">
              {profileSocialsX && (
                <a
                  href={`https://x.com/${profileSocialsX.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-blue-600 transition-colors hover:text-blue-800"
                >
                  <XLogo className="size-4" />
                  <span>{profileSocialsX}</span>
                  <ExternalLink className="size-3" />
                </a>
              )}
              {profileSocialsGithub && (
                <a
                  href={`https://github.com/${profileSocialsGithub}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-gray-600 transition-colors hover:text-gray-800"
                >
                  <Github className="size-4" />
                  <span>{profileSocialsGithub}</span>
                  <ExternalLink className="size-3" />
                </a>
              )}
              {profileSocialsWebsite && (
                <a
                  href={profileSocialsWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-green-600 transition-colors hover:text-green-800"
                >
                  <Globe className="size-4" />
                  <span>{profileSocialsWebsite}</span>
                  <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Industry Expertise */}
        {industryExpertise.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Industry Expertise</h4>
            <div className="flex flex-wrap gap-2">
              {industryExpertise.map((expertise, index) => (
                <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                  {expertise}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default BuilderProfile
