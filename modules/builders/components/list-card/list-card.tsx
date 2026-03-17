import { ArrowRight, ExternalLink, Github } from 'lucide-react'
import React from 'react'

import XLogo from '@/modules/shared/components/icons/x-logo'
import { Avatar, AvatarFallback, AvatarImage } from '@/modules/shared/components/ui/avatar'
import { Button } from '@/modules/shared/components/ui/button'
import { Card, CardContent } from '@/modules/shared/components/ui/card'
import { cn } from '@/modules/shared/lib/utils'

interface Action {
  link: string
  title: string
}

interface BuilderTeamCardProps {
  teamName: string
  description: string
  profileLogo?: string
  xUrl?: string
  githubUrl?: string
  websiteUrl?: string
  actions?: Action[]
  className?: string
}

const BuilderTeamCard: React.FC<BuilderTeamCardProps> = ({
  teamName,
  description,
  profileLogo,
  xUrl,
  githubUrl,
  websiteUrl,
  actions = [],
  className,
}) => {
  // Generate avatar initials from team name
  const getAvatarInitials = (name: string): string => {
    const words = name.split(' ')
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  // Generate avatar background color based on team name
  const getAvatarBgColor = (name: string): string => {
    const colors = ['bg-green-600', 'bg-blue-600', 'bg-purple-600', 'bg-yellow-600']
    const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  return (
    <Card className={cn('flex h-full flex-col transition-shadow hover:shadow-md', className)}>
      <CardContent className="flex flex-1 flex-col gap-4 p-6">
        {/* Avatar */}
        <div className="flex items-center gap-3">
          <Avatar className="size-12">
            {profileLogo && <AvatarImage src={profileLogo} alt={teamName} />}
            <AvatarFallback
              className={`${getAvatarBgColor(teamName)} text-sm font-bold text-white`}
            >
              {getAvatarInitials(teamName)}
            </AvatarFallback>
          </Avatar>
          <h3 className="text-lg font-semibold">{teamName}</h3>
        </div>

        {/* Description */}
        <p className="text-foreground-70 line-clamp-3 flex-1 text-sm leading-relaxed">
          {description}
        </p>

        {/* Social Links */}
        <div className="flex items-center gap-3">
          {xUrl && (
            <a
              href={xUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground-70 hover:text-foreground transition-colors"
            >
              <XLogo size={16} />
            </a>
          )}
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground-70 hover:text-foreground transition-colors"
            >
              <Github className="size-4" />
            </a>
          )}
          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground-70 hover:text-foreground transition-colors"
            >
              <ExternalLink className="size-4" />
            </a>
          )}
        </div>

        {/* Actions */}
        {actions.map((action, index) => (
          <Button key={index} variant="outline" size="sm" asChild className="w-full">
            <a href={action.link} className="flex items-center justify-center gap-2">
              <span className="font-semibold">{action.title}</span>
              <ArrowRight className="size-4" />
            </a>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}

export default BuilderTeamCard
