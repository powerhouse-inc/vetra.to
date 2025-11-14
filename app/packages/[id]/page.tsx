import { ExternalLink, Github, Package as PackageIcon } from 'lucide-react'
import { notFound } from 'next/navigation'

import { RepositoryActionButton } from '@/modules/packages/components/repository-action-button'
import { getVetraPackages } from '@/modules/packages/lib/server-data'
import {
  StripedCard,
  StripedCardContent,
  StripedCardHeader,
  StripedCardTitle,
} from '@/modules/shared/components/striped-card'
import ConnectSvg from '@/modules/shared/components/svgs/connect.svg'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/modules/shared/components/ui/breadcrumb'
import { Button } from '@/modules/shared/components/ui/button'

export const dynamic = 'force-dynamic'

interface PackageDetailPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: PackageDetailPageProps): Promise<unknown> {
  try {
    const packageId = (await params).id
    const packages = await getVetraPackages()
    const packageData = packages.find((pkg) => pkg.documentId === packageId)

    if (!packageData) {
      return {
        title: 'Package Not Found',
        description: 'The requested package could not be found.',
      }
    }

    const title = `${packageData.name} | Vetra Package`
    const description = packageData.description || `Explore ${packageData.name} package on Vetra.`
    const url = `https://vetra.to/packages/${packageId}`
    const ogImage = 'https://vetra.to/vetra-logo.png'

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        siteName: 'Vetra',
        type: 'website',
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: packageData.name,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage],
        site: '@vetra',
      },
      alternates: {
        canonical: url,
      },
    }
  } catch {
    // Fallback metadata if fetch fails
    return {
      title: 'Vetra Package',
      description: 'Explore packages on Vetra.',
    }
  }
}

export default async function PackageDetailPage({ params }: PackageDetailPageProps) {
  const packageId = (await params).id

  // Fetch all packages and find the specific one
  const packages = await getVetraPackages()
  const packageData = packages.find((pkg) => pkg.documentId === packageId)

  // If no package found, show 404
  if (!packageData) {
    notFound()
  }

  return (
    <main className="container mx-auto mt-[80px] max-w-[var(--container-width)] space-y-8 p-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{packageData.name}</h1>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/packages">Packages</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{packageData.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Package Information */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          <StripedCard>
            <StripedCardHeader>
              <StripedCardTitle>About</StripedCardTitle>
            </StripedCardHeader>
            <StripedCardContent>
              <p>{packageData.description || 'No description available for this package.'}</p>
            </StripedCardContent>
          </StripedCard>

          {/* Links */}
          <StripedCard>
            <StripedCardHeader>
              <StripedCardTitle>Resources</StripedCardTitle>
            </StripedCardHeader>
            <StripedCardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {packageData.githubUrl && (
                  <a
                    href={packageData.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group border-border bg-card hover:border-primary flex flex-col items-center gap-3 rounded-lg border p-6 transition-all hover:shadow-md"
                  >
                    <div className="bg-muted group-hover:bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
                      <Github className="text-foreground group-hover:text-primary h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">GitHub</p>
                      <p className="text-muted-foreground text-xs">View Source</p>
                    </div>
                  </a>
                )}
                {packageData.npmUrl && (
                  <a
                    href={packageData.npmUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group border-border bg-card hover:border-primary flex flex-col items-center gap-3 rounded-lg border p-6 transition-all hover:shadow-md"
                  >
                    <div className="bg-muted group-hover:bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
                      <PackageIcon className="text-foreground group-hover:text-primary h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">NPM</p>
                      <p className="text-muted-foreground text-xs">Package Registry</p>
                    </div>
                  </a>
                )}
                {packageData.authorWebsite && (
                  <a
                    href={packageData.authorWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group border-border bg-card hover:border-primary flex flex-col items-center gap-3 rounded-lg border p-6 transition-all hover:shadow-md"
                  >
                    <div className="bg-muted group-hover:bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
                      <ExternalLink className="text-foreground group-hover:text-primary h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">Website</p>
                      <p className="text-muted-foreground text-xs">Author Info</p>
                    </div>
                  </a>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex flex-wrap gap-2">
                {/* Repository Action Button */}
                <RepositoryActionButton
                  githubUrl={packageData.githubUrl}
                  driveId={packageData.driveId}
                  packageName={packageData.name}
                />

                {/* Open in Connect */}
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <a
                    className="flex p-5"
                    href={`${process.env.NEXT_PUBLIC_CONNECT_URL || 'https://connect.staging.vetra.io'}?driveUrl=${packageData.driveId ? `https://switchboard.staging.vetra.io/d/${packageData.driveId}` : 'https://switchboard.staging.vetra.io/d/61fff014-ff45-4270-aa16-5ca75429cc55'}`}
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
            </StripedCardContent>
          </StripedCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <StripedCard>
            <StripedCardHeader>
              <StripedCardTitle>Package Information</StripedCardTitle>
            </StripedCardHeader>
            <StripedCardContent className="space-y-4">
              {packageData.category && (
                <div>
                  <dt className="text-muted-foreground text-sm font-medium">Category</dt>
                  <dd className="mt-1 text-sm">{packageData.category}</dd>
                </div>
              )}
              {packageData.authorName && (
                <div>
                  <dt className="text-muted-foreground text-sm font-medium">Author</dt>
                  <dd className="mt-1 text-sm">{packageData.authorName}</dd>
                </div>
              )}
              {packageData.driveId && (
                <div>
                  <dt className="text-muted-foreground text-sm font-medium">Drive ID</dt>
                  <dd className="mt-1 font-mono text-xs break-all">{packageData.driveId}</dd>
                </div>
              )}
              <div>
                <dt className="text-muted-foreground text-sm font-medium">Document ID</dt>
                <dd className="mt-1 font-mono text-xs break-all">{packageData.documentId}</dd>
              </div>
            </StripedCardContent>
          </StripedCard>
        </div>
      </div>
    </main>
  )
}
