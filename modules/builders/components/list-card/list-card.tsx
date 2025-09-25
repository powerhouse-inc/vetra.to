import { ExternalLink, Github, User } from 'lucide-react'
import React from 'react'

import XLogo from '@/modules/shared/components/icons/x-logo'
import { Avatar, AvatarFallback } from '@/modules/shared/components/ui/avatar'
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
  xUrl?: string
  githubUrl?: string
  websiteUrl?: string
  actions?: Action[]
  className?: string
}

// Helper function to extract username from URLs
const extractUsername = (url: string, platform: 'x' | 'github' | 'website'): string => {
  if (!url) return ''

  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname

    switch (platform) {
      case 'x':
        return (
          pathname.replace('/', '') ||
          urlObj.hostname.replace('x.com', '').replace('twitter.com', '')
        )
      case 'github':
        return pathname.replace('/', '') || urlObj.hostname.replace('github.com', '')
      case 'website':
        return urlObj.hostname
      default:
        return ''
    }
  } catch {
    return url
  }
}

const BuilderTeamCard: React.FC<BuilderTeamCardProps> = ({
  teamName,
  description,
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
    const colors = [
      'bg-green-600', // BAI Team
      'bg-blue-600', // Core-Dev Team
      'bg-purple-600', // SKY Fintech
      'bg-yellow-600', // Jetstream
    ]
    const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  return (
    <Card className={cn('w-full border border-gray-200 bg-white shadow-sm', className)}>
      <CardContent>
        <div className="flex items-start gap-6">
          {/* Left Column - Avatar */}
          <div className="flex-shrink-0">
            <Avatar className="size-16">
              <AvatarFallback
                className={`${getAvatarBgColor(teamName)} text-lg font-bold text-white`}
              >
                {getAvatarInitials(teamName)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Middle Column - Information */}
          <div className="min-w-0 flex-1">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">{teamName}</h3>
            <p className="mb-4 text-sm leading-relaxed text-gray-600">{description}</p>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              {xUrl && (
                <a
                  href={xUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700"
                >
                  <XLogo size={16} />
                  <span>@{extractUsername(xUrl, 'x')}</span>
                </a>
              )}
              {githubUrl && (
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700"
                >
                  <Github className="size-4" />
                  <span>{extractUsername(githubUrl, 'github')}</span>
                </a>
              )}
              {websiteUrl && (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700"
                >
                  <ExternalLink className="size-4" />
                  <span>{extractUsername(websiteUrl, 'website')}</span>
                </a>
              )}
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="flex-shrink-0">
            <div className="flex flex-col gap-2">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  asChild
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <a href={action.link} className="flex items-center gap-2">
                    <User className="size-4" />
                    {action.title}
                  </a>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default BuilderTeamCard
