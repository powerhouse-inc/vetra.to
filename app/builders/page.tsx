import { BuilderList } from '@/modules/builders/components/builder-list'
import { BuilderSearch } from '@/modules/builders/components/builder-search'
import { BuildersPageClient } from '@/modules/builders/components/builders-page-client'

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
      <main className="container mx-auto mt-20 max-w-[var(--container-width)] px-6 py-12">
        {/* Hero Section */}
        <div className="mb-10 space-y-3">
          <h1 className="text-[clamp(2rem,4vw,3rem)] leading-tight font-bold">
            Vetra Builder Directory
          </h1>
          <p className="text-foreground-70 max-w-2xl text-lg">
            Discover officially affiliated teams of Powerhouse with expertise in the Powerhouse tech
            stack and proven ability to deliver solutions across any domain.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="mb-8">
          <BuilderSearch />
        </div>

        {/* Builder Teams Grid */}
        <BuilderList />
      </main>
    </BuildersPageClient>
  )
}
