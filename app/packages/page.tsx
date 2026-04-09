import { type PackageInfo } from '@powerhousedao/shared'
import { type SearchParams } from 'nuqs/server'
import { Search as SearchIcon } from 'lucide-react'
import { JoinedUsersBadge } from '@/modules/shared/components/joined-users-badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/modules/shared/components/ui/breadcrumb'
import { loadSearchParams } from './lib/search-params'
import { Filters } from './components/filters'
import { MobileFilters } from './components/mobile-filters'
import { fuse, packageModuleTypes, REGISTRY_URL } from './lib/constants'
import { map, unique, filter, isTruthy } from 'remeda'
import { filterManifests, getSearchWords } from './lib/utils'
import { PackageList } from './components/package-list'
import { CreatePackageModal } from './components/create-package-modal'

export const metadata: unknown = {
  title: 'Vetra Packages',
  description:
    'Explore Vetra packages - a collection of document models, editors, and module resources providing solutions for specific domains and industries.',
  openGraph: {
    title: 'Vetra Packages',
    description:
      'Explore Vetra packages - a collection of document models, editors, and module resources providing solutions for specific domains and industries.',
    url: 'https://vetra.to/packages',
    siteName: 'Vetra',
    type: 'website',
    images: [
      {
        url: 'https://vetra.to/vetra-logo.png',
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
    images: ['https://vetra.to/vetra-logo.png'],
    site: '@vetra',
  },
  alternates: {
    canonical: 'https://vetra.to/packages',
  },
}

type PageProps = {
  searchParams: Promise<SearchParams>
}

export default async function PackagesPage({ searchParams }: PageProps) {
  const { search, ...filters } = await loadSearchParams(searchParams)
  const packagesRes = await fetch(`${REGISTRY_URL}/packages`, {
    next: { revalidate: 30 },
  })
  const packages = (await packagesRes.json()) as PackageInfo[]
  const manifests = filter(
    map(packages, (m) => m.manifest),
    isTruthy,
  )
  const categoryOptions = unique(
    filter(
      map(manifests, (m) => m.category),
      isTruthy,
    ),
  )
  const publisherNameOptions = unique(
    filter(
      map(manifests, (m) => m.publisher?.name),
      isTruthy,
    ),
  )
  const filteredManifests = filterManifests(manifests, filters)
  fuse.setCollection(filteredManifests)

  const searchResult = fuse.search(search ?? '')

  return (
    <div className="container mx-auto mt-20 max-w-screen-xl space-y-8 px-6 py-8">
      {/* Page Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-4xl font-bold">Packages</h1>
          <CreatePackageModal />
        </div>
        <p className="text-foreground-70 max-w-2xl">
          Packages are a collection of document models, editors, and other module resources
          providing solutions for specific domains and industries.
        </p>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/packages">Packages</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Overview</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Mobile Filters Button */}
      <div className="lg:hidden">
        <MobileFilters
          moduleTypeOptions={packageModuleTypes}
          categoryOptions={categoryOptions}
          publisherNameOptions={publisherNameOptions}
        />
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block">
          <div className="bg-card sticky top-24 rounded-xl p-4 shadow-sm">
            <Filters
              moduleTypeOptions={packageModuleTypes}
              categoryOptions={categoryOptions}
              publisherNameOptions={publisherNameOptions}
            />
          </div>
        </aside>

        {/* Package Grid */}
        <div className="lg:col-span-3">
          {searchResult.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center gap-3 py-20">
              <SearchIcon className="size-10 opacity-50" />
              <p className="text-sm">No packages match the current filters</p>
            </div>
          ) : (
            <PackageList
              results={searchResult.map(({ item: manifest, matches }) => ({
                manifest,
                searchWords: getSearchWords(matches),
              }))}
            />
          )}
        </div>
      </div>

      {/* Waitlist Section */}
      <div className="flex min-h-[500px] flex-col items-center justify-center space-y-8 py-12">
        <div className="max-w-3xl space-y-6 text-center">
          <h2 className="text-5xl font-bold tracking-tight">Join the Waitlist</h2>
          <p className="text-muted-foreground text-lg">
            Sign up to stay in the loop & be amongst the first builders on Vetra!
          </p>
          <div className="flex justify-center pt-4">
            <iframe
              src="https://paragraph.com/@powerhouse/embed?minimal=true"
              width="480"
              height="45"
              style={{ border: '1px solid #EEE', background: 'white' }}
              frameBorder="0"
              scrolling="no"
              title="Newsletter Signup"
            />
          </div>
          <div className="flex items-center justify-center gap-3 pt-4">
            <JoinedUsersBadge />
          </div>
        </div>
      </div>
    </div>
  )
}
