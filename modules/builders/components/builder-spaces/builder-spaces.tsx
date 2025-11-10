import { ExternalLink, Github, MessageCircle, Package } from 'lucide-react'
import React from 'react'

import { RepositoryActionButton } from '@/modules/packages/components/repository-action-button'
import {
  StripedCard,
  StripedCardContent,
  StripedCardHeader,
  StripedCardTitle,
} from '@/modules/shared/components/striped-card'
import ConnectSvg from '@/modules/shared/components/svgs/connect.svg'
import { Button } from '@/modules/shared/components/ui/button'
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
        </div>
      </div>

      {/* Builder Spaces */}
      <div className="space-y-6">
        {spaces.map((space, spaceIndex) => (
          <StripedCard key={spaceIndex} className="w-full">
            <StripedCardHeader>
              <StripedCardTitle>
                <span className="font-bold">{space.title}</span>
                <span className="font-normal">{space.description && `: ${space.description}`}</span>
              </StripedCardTitle>
            </StripedCardHeader>
            <StripedCardContent>
              <div className="space-y-4">
                {space.packages.map((pkg, packageIndex) => (
                  <div
                    key={packageIndex}
                    className="flex flex-col items-center gap-4 rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-sm md:flex-row"
                  >
                    {/* Package Icon and Info - Always horizontal */}
                    <div className="flex w-full flex-1 flex-row items-center gap-4 md:w-auto">
                      {/* Package Icon */}
                      <div className="flex flex-shrink-0">
                        <div className="flex size-10 items-center justify-center rounded-lg">
                          <Package className="size-5" />
                        </div>
                      </div>

                      {/* Package Info */}
                      <div className="flex min-w-0 flex-1 flex-col md:flex-1">
                        <h4 className="mb-1 text-sm font-semibold">{pkg.title}</h4>
                        <p className="mb-3 text-xs leading-relaxed">{pkg.description}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:flex-shrink-0">
                      {pkg.githubUrl && (
                        <Button variant="ghost" size="sm" asChild>
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
                        <Button variant="ghost" size="sm" asChild>
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
                      <RepositoryActionButton
                        githubUrl={pkg.githubUrl}
                        driveId={pkg.vetraDriveUrl?.split('/d/')[1] || null}
                      />
                      <Button variant="outline" size="sm" asChild className="flex">
                        <a
                          className="flex p-5"
                          href={`${process.env.NEXT_PUBLIC_CONNECT_URL || 'https://connect.staging.vetra.io'}?driveUrl=${pkg.vetraDriveUrl || 'https://switchboard.staging.vetra.io/d/61fff014-ff45-4270-aa16-5ca75429cc55'}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <div className="flex items-center justify-center">
                            <ConnectSvg />
                          </div>
                          <div className="flex flex-col items-start">
                            <span className="text-xs font-medium tracking-wide uppercase">
                              Open in Connect
                            </span>
                            <span className="text-sm font-bold">Vetra Studio Drive</span>
                          </div>
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </StripedCardContent>
          </StripedCard>
        ))}
      </div>
    </div>
  )
}

export default BuilderSpaces
