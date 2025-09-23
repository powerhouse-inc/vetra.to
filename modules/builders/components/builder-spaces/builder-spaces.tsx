import { ExternalLink, Github, MessageCircle, Package } from 'lucide-react'
import React from 'react'

import { Button } from '@/modules/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card'
import { cn } from '@/modules/shared/lib/utils'

interface Package {
  title: string
  description: string
  githubUrl?: string
  npmUrl?: string
  vetraDriveUrl?: string
}

interface BuilderSpace {
  title: string
  description?: string
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
              {space.description && (
                <p className="mt-1 text-sm text-gray-600">{space.description}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {space.packages.map((pkg, packageIndex) => (
                  <div
                    key={packageIndex}
                    className="flex items-start gap-4 rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-sm"
                  >
                    {/* Package Icon */}
                    <div className="flex-shrink-0">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-purple-100">
                        <Package className="size-5 text-purple-600" />
                      </div>
                    </div>

                    {/* Package Info */}
                    <div className="min-w-0 flex-1">
                      <h4 className="mb-1 text-sm font-semibold text-gray-900">{pkg.title}</h4>
                      <p className="mb-3 text-xs leading-relaxed text-gray-600">
                        {pkg.description}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-shrink-0 items-center gap-2">
                      {pkg.githubUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={pkg.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5"
                          >
                            <Github className="size-3" />
                            <span>Github</span>
                            <ExternalLink className="size-3" />
                          </a>
                        </Button>
                      )}
                      {pkg.npmUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={pkg.npmUrl}
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
                      {pkg.vetraDriveUrl && (
                        <div className="flex flex-col items-center gap-1">
                          <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                            OPEN & CONNECT
                          </Button>
                          <span className="text-xs text-gray-500">Vetra Stacks Drive</span>
                        </div>
                      )}
                    </div>
                  </div>
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
