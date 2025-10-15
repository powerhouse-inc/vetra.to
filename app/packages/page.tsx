import React from 'react'

import { PackagesList } from '@/modules/packages/components/packages-list'
import { getVetraPackages } from '@/modules/packages/lib/server-data'

export const dynamic = 'force-dynamic'

export const metadata: unknown = {
  title: 'Vetra Packages',
  description:
    'Explore Vetra packages - a collection of document models, editors, and module resources providing solutions for specific domains and industries.',
  openGraph: {
    title: 'Vetra Packages',
    description:
      'Explore Vetra packages - a collection of document models, editors, and module resources providing solutions for specific domains and industries.',
    url: 'https://staging.vetra.to/packages',
    siteName: 'Vetra',
    type: 'website',
    images: [
      {
        url: 'https://staging.vetra.to/vetra-logo.png',
        width: 1200,
        height: 630,
        alt: 'Vetra Packages',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vetra Packages',
    description:
      'Explore Vetra packages - a collection of document models, editors, and module resources providing solutions for specific domains and industries.',
    images: ['https://staging.vetra.to/vetra-logo.png'],
    site: '@vetra',
  },
  alternates: {
    canonical: 'https://staging.vetra.to/packages',
  },
}

export default async function PackagesPage() {
  const packages = await getVetraPackages()

  return (
    <div className="container mx-auto mt-[80px] max-w-[var(--container-width)] space-y-8 p-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Packages</h1>
        <p>
          Packages are a collection of document models, document model editors, and other module
          resources that are published as a package and can be used in any of the host applications.
          Packages provide solutions to within specific domains and industries.
        </p>
      </div>

      {/* Breadcrumb */}
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <span>Packages</span>
        <span>&gt;</span>
        <span className="font-medium">Overview</span>
      </div>

      {/* Packages List with Filters */}
      <PackagesList packages={packages} />
    </div>
  )
}
