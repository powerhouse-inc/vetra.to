import { ExternalLink, Github, Package } from 'lucide-react'
import React from 'react'

import { RepositoryActionButton } from '@/modules/shared/components/repository-action-button'
import ConnectSvg from '@/modules/shared/components/svgs/connect.svg'
import { Button } from '@/modules/shared/components/ui/button'
import { Card, CardContent } from '@/modules/shared/components/ui/card'
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
  // Flatten all packages if there's only one space
  const allPackages = spaces.length === 1 ? spaces[0].packages : null

  return (
    <div className={cn('space-y-6', className)}>
      {allPackages ? (
        // Single space: render flat grid of packages
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allPackages.map((pkg, index) => (
            <PackageCard key={index} pkg={pkg} />
          ))}
        </div>
      ) : (
        // Multiple spaces: render with space headers
        spaces.map((space, spaceIndex) => (
          <div key={spaceIndex} className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{space.title}</h3>
              {space.description && (
                <p className="text-foreground-70 mt-1 text-sm">{space.description}</p>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {space.packages.map((pkg, packageIndex) => (
                <PackageCard key={packageIndex} pkg={pkg} />
              ))}
            </div>
          </div>
        ))
      )}

      {spaces.length === 0 && (
        <p className="text-foreground-70 py-8 text-center">No packages published yet.</p>
      )}
    </div>
  )
}

function PackageCard({ pkg }: { pkg: Package }) {
  return (
    <Card className="flex flex-col transition-shadow hover:shadow-md">
      <CardContent className="flex flex-1 flex-col gap-3 p-5">
        {/* Package Icon and Name */}
        <div className="flex items-center gap-3">
          <div className="bg-accent flex size-9 items-center justify-center rounded-lg">
            <Package className="size-4" />
          </div>
          <h4 className="text-sm font-semibold">{pkg.title}</h4>
        </div>

        {/* Description */}
        <p className="text-foreground-70 line-clamp-2 flex-1 text-xs leading-relaxed">
          {pkg.description}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild className="flex-1">
            <a
              className="flex items-center justify-center gap-1.5"
              href={`${process.env.NEXT_PUBLIC_CONNECT_URL || 'https://connect.staging.vetra.io'}?driveUrl=${pkg.vetraDriveUrl || 'https://switchboard.staging.vetra.io/d/61fff014-ff45-4270-aa16-5ca75429cc55'}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ConnectSvg />
              <span className="text-xs font-medium">Open in Connect</span>
            </a>
          </Button>
          <RepositoryActionButton
            githubUrl={pkg.githubUrl}
            driveId={pkg.vetraDriveUrl?.split('/d/')[1] || null}
            packageName={pkg.title}
          />
        </div>

        {/* Secondary Links */}
        <div className="flex items-center gap-2">
          {pkg.githubUrl && (
            <Button variant="ghost" size="sm" asChild>
              <a
                href={pkg.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground-70 flex items-center gap-1"
              >
                <Github className="size-3" />
                <span className="text-xs">Github</span>
              </a>
            </Button>
          )}
          {pkg.npmUrl && (
            <Button variant="ghost" size="sm" asChild>
              <a
                href={pkg.npmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground-70 flex items-center gap-1"
              >
                <Package className="size-3" />
                <span className="text-xs">NPM</span>
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default BuilderSpaces
