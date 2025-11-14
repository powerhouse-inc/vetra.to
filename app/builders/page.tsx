import { BuilderList } from '@/modules/builders/components/builder-list'
import { BuilderSearch } from '@/modules/builders/components/builder-search'
import { BuildersPageClient } from '@/modules/builders/components/builders-page-client'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/modules/shared/components/ui/breadcrumb'

// Force dynamic rendering to prevent build-time API requests
export const dynamic = 'force-dynamic'

export const metadata: unknown = {
  title: 'Vetra Builders',
  description:
    'Discover Vetra builders - officially affiliated teams of Powerhouse with expertise in the Powerhouse tech stack and proven ability to deliver solutions across any domain.',
  openGraph: {
    title: 'Vetra Builders',
    description:
      'Discover Vetra builders - officially affiliated teams of Powerhouse with expertise in the Powerhouse tech stack and proven ability to deliver solutions across any domain.',
    url: 'https://vetra.to/builders',
    siteName: 'Vetra',
    type: 'website',
    images: [
      {
        url: 'https://vetra.to/vetra-logo.png',
        width: 1200,
        height: 630,
        alt: 'Vetra Builders',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vetra Builders',
    description:
      'Discover Vetra builders - officially affiliated teams of Powerhouse with expertise in the Powerhouse tech stack and proven ability to deliver solutions across any domain.',
    images: ['https://vetra.to/vetra-logo.png'],
    site: '@vetra',
  },
  alternates: {
    canonical: 'https://vetra.to/builders',
  },
}

export default function BuildersPage() {
  return (
    <BuildersPageClient>
      <main className="container mx-auto mt-[80px] max-w-[var(--container-width)] space-y-8 p-8">
        {/* Header Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold">Builders</h1>
              {/* Breadcrumbs */}
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/builders">Builders</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Overview</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Search Bar */}
            <BuilderSearch />
          </div>
        </div>

        {/* Builder Teams List */}
        <div className="space-y-4">
          <BuilderList />
        </div>
      </main>
    </BuildersPageClient>
  )
}
