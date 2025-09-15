import { ExternalLink, Github, X } from 'lucide-react'
import React from 'react'

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

const BuilderTeamCard: React.FC<BuilderTeamCardProps> = ({
  teamName,
  description,
  xUrl,
  githubUrl,
  websiteUrl,
  actions = [],
  className,
}) => {
  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-6">
        <div className="flex items-start gap-6">
          {/* Left Column - Icon */}
          <div className="flex-shrink-0">
            <Avatar className="size-16">
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                {teamName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Middle Column - Information */}
          <div className="min-w-0 flex-1">
            <h3 className="text-foreground mb-2 text-lg font-semibold">{teamName}</h3>
            <p className="text-muted-foreground mb-4 text-sm leading-relaxed">{description}</p>
            <div className="flex items-center gap-4">
              {xUrl && (
                <a
                  href={xUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors"
                >
                  <X className="size-4" />
                  <span>x.com</span>
                  <ExternalLink className="size-3" />
                </a>
              )}
              {githubUrl && (
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors"
                >
                  <Github className="size-4" />
                  <span>github.com</span>
                  <ExternalLink className="size-3" />
                </a>
              )}
              {websiteUrl && (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors"
                >
                  <ExternalLink className="size-4" />
                  <span>website</span>
                </a>
              )}
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="flex-shrink-0">
            <div className="flex flex-col gap-2">
              {actions.map((action, index) => (
                <Button key={index} variant="outline" size="sm" asChild>
                  <a href={action.link}>{action.title}</a>
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
