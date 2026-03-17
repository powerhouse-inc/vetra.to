import { ExternalLink, Github, Globe } from 'lucide-react'
import React from 'react'

import XLogo from '@/modules/shared/components/icons/x-logo'
import { Avatar, AvatarFallback, AvatarImage } from '@/modules/shared/components/ui/avatar'
import { Badge } from '@/modules/shared/components/ui/badge'
import { Button } from '@/modules/shared/components/ui/button'
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
    <div className={cn('w-full', className)}>
      <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
        {/* Large Avatar */}
        <Avatar className="size-20 flex-shrink-0">
          <AvatarImage src={profileLogo} alt={profileName} />
          <AvatarFallback className="bg-gray-800 text-xl font-semibold text-white">
            {getInitials(profileName)}
          </AvatarFallback>
        </Avatar>

        {/* Profile Info */}
        <div className="flex-1 space-y-3">
          <h2 className="text-3xl font-bold">{profileName}</h2>

          {profileDescription && (
            <p className="text-foreground-70 max-w-3xl leading-relaxed">{profileDescription}</p>
          )}

          {/* Social Links */}
          {(profileSocialsX || profileSocialsGithub || profileSocialsWebsite) && (
            <div className="flex items-center gap-2">
              {profileSocialsX && (
                <Button variant="ghost" size="sm" asChild>
                  <a
                    href={`https://x.com/${profileSocialsX.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground-70 hover:text-foreground"
                  >
                    <XLogo className="size-4" />
                  </a>
                </Button>
              )}
              {profileSocialsGithub && (
                <Button variant="ghost" size="sm" asChild>
                  <a
                    href={`https://github.com/${profileSocialsGithub}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground-70 hover:text-foreground"
                  >
                    <Github className="size-4" />
                  </a>
                </Button>
              )}
              {profileSocialsWebsite && (
                <Button variant="ghost" size="sm" asChild>
                  <a
                    href={profileSocialsWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground-70 hover:text-foreground"
                  >
                    <Globe className="size-4" />
                  </a>
                </Button>
              )}
            </div>
          )}

          {/* Expertise Badges */}
          {industryExpertise.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {industryExpertise.map((expertise, index) => (
                <Badge key={index} className="bg-primary-30 text-primary">
                  {expertise}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BuilderProfile
