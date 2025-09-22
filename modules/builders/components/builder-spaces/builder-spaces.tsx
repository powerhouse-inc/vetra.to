import { MessageCircle } from 'lucide-react'
import React from 'react'

import { Button } from '@/modules/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card'
import { cn } from '@/modules/shared/lib/utils'
import { PackageCard } from '../package-card'

interface Package {
  title: string
  description: string
  githubUrl?: string
  npmUrl?: string
}

interface BuilderSpace {
  title: string
  packages: Package[]
}

interface BuilderSpacesProps {
  spaces: BuilderSpace[]
  teamName: string
  discordUrl?: string
  className?: string
}

const BuilderSpaces: React.FC<BuilderSpacesProps> = ({
  spaces,
  teamName,
  discordUrl,
  className,
}) => {
  return (
    <div className={cn('container space-y-8', className)}>
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold md:text-4xl">Builder Spaces</h1>
            <p className="mt-2">
              Builder spaces collect all the packages under a specific category, industry or
              use-case
            </p>
          </div>
          {discordUrl && (
            <Button asChild>
              <a
                href={discordUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <MessageCircle className="size-4" />
                Contact Team
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Builder Spaces */}
      <div className="space-y-6">
        {spaces.map((space, spaceIndex) => (
          <Card key={spaceIndex} className="w-full">
            <CardHeader>
              <CardTitle className="text-xl">{space.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                {space.packages.map((pkg, packageIndex) => (
                  <PackageCard
                    key={packageIndex}
                    title={pkg.title}
                    description={pkg.description}
                    githubUrl={pkg.githubUrl}
                    npmUrl={pkg.npmUrl}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default BuilderSpaces
