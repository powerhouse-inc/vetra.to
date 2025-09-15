import { ExternalLink, Github, Package } from 'lucide-react'
import React from 'react'

import { Button } from '@/modules/shared/components/ui/button'
import { Card, CardContent } from '@/modules/shared/components/ui/card'
import { cn } from '@/modules/shared/lib/utils'

interface PackageCardProps {
  title: string
  description: string
  githubUrl?: string
  npmUrl?: string
  className?: string
}

const PackageCard: React.FC<PackageCardProps> = ({
  title,
  description,
  githubUrl,
  npmUrl,
  className,
}) => {
  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Left Column - Package Icon */}
          <div className="flex-shrink-0">
            <div className="flex size-10 items-center justify-center rounded-lg">
              <Package className="text-primary size-5" />
            </div>
          </div>

          {/* Middle Column - Package Information */}
          <div className="min-w-0 flex-1">
            <h4 className="text-foreground mb-2 text-sm font-semibold">{title}</h4>
            <p className="text-muted-foreground mb-3 text-xs leading-relaxed">{description}</p>

            {/* Links */}
            <div className="flex items-center gap-3">
              {githubUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5"
                  >
                    <Github className="size-3" />
                    <span>GitHub</span>
                    <ExternalLink className="size-3" />
                  </a>
                </Button>
              )}
              {npmUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={npmUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5"
                  >
                    <Package className="size-3" />
                    <span>NPM</span>
                    <ExternalLink className="size-3" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default PackageCard
