import {
  type Publisher,
  type Manifest,
  type PackageInfo,
  type PowerhouseModule,
} from '@powerhousedao/shared'
import { capitalCase } from 'change-case'
import Link from 'next/link'
import { type SearchParams } from 'nuqs/server'
import { JoinedUsersBadge } from '@/modules/shared/components/joined-users-badge'
import { loadSearchParams } from './lib/search-params'
import { type PackageFilters, type PackageModulesRecord } from './types'
import { Filters } from './filters'
import { packageModuleTypes } from './constants'
import { map, unique, filter, isTruthy } from 'remeda'
import { Search } from './search'
import Fuse, { type FuseResultMatch } from 'fuse.js'
import Highlighter from 'react-highlight-words'

const keys = [
  'name',
  'description',
  'category',
  'publisher.name',
  'publisher.url',
  ...packageModuleTypes.map((pmt) => `${pmt}.name`),
  ...packageModuleTypes.map((pmt) => `${pmt}.id`),
]
const fuse = new Fuse<Manifest>([], {
  keys,
  includeMatches: true,
})
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

function filterManifests(
  manifests: Manifest[],
  { moduleTypes, categories, publisherNames }: PackageFilters,
) {
  if (!moduleTypes?.length && !categories?.length && !publisherNames?.length) return manifests

  return manifests.filter((manifest) => {
    for (const moduleType of moduleTypes ?? []) {
      if (manifest[moduleType]?.length) return true
    }

    for (const category of categories ?? []) {
      if (manifest.category === category) return true
    }

    for (const publisherName of publisherNames ?? []) {
      if (manifest.publisher?.name === publisherName) return true
    }
    return false
  })
}
type PageProps = {
  searchParams: Promise<SearchParams>
}
export default async function PackagesPage({ searchParams }: PageProps) {
  const { search, ...filters } = await loadSearchParams(searchParams)
  const packagesRes = await fetch('https://registry.dev.vetra.io/packages', {
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

  console.log({ searchResult })

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
      <Filters
        moduleTypeOptions={packageModuleTypes}
        categoryOptions={categoryOptions}
        publisherNameOptions={publisherNameOptions}
      />
      <Search />
      {searchResult.map(({ item: manifest, matches }) => (
        <PackageManifest
          key={manifest.name}
          manifest={manifest}
          searchWords={getSearchWords(matches)}
        />
      ))}
      {/* Waitlist Section */}
      <div className="flex min-h-[500px] flex-col items-center justify-center space-y-8 py-12">
        <div className="max-w-3xl space-y-6 text-center">
          <h2 className="text-5xl font-bold tracking-tight">Join the Waitlist</h2>

          <p className="text-muted-foreground text-lg">
            Sign up to stay in the loop & be amongst the first builders on Vetra!
          </p>

          {/* Newsletter Iframe */}
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

          {/* Optional: Add avatar stack or counter similar to the reference image */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <JoinedUsersBadge />
          </div>
        </div>
      </div>
    </div>
  )
}

function getSearchWords(matches: readonly FuseResultMatch[] | undefined) {
  if (!matches?.length) return []
  return filter(
    matches.map((match) => match.value),
    isTruthy,
  )
}

function PackageManifest(props: { manifest: Manifest; searchWords: string[] }) {
  const {
    manifest: {
      name,
      publisher,
      description,
      category,
      documentModels,
      editors,
      apps,
      processors,
      subgraphs,
    },
    searchWords,
  } = props
  const modules = { documentModels, editors, apps, processors, subgraphs }
  return (
    <div className="flex flex-col gap-3">
      <PackageName name={name} searchWords={searchWords} />
      <PackagePublisher publisher={publisher} searchWords={searchWords} />
      <PackageDescription description={description} searchWords={searchWords} />
      <PackageCategory category={category} searchWords={searchWords} />
      <PackageModules modules={modules} searchWords={searchWords} />
    </div>
  )
}

function PackageName(props: { name: string; searchWords: string[] }) {
  const { name, searchWords } = props
  return (
    <h2 className="text-lg font-medium">
      <Highlighter textToHighlight={name} searchWords={searchWords} />
    </h2>
  )
}

function PackagePublisher(props: { publisher: Publisher | undefined; searchWords: string[] }) {
  const { publisher, searchWords } = props
  return (
    <div>
      <h3 className="font-semibold">Publisher</h3>
      {!!publisher?.name && (
        <p>
          <Highlighter textToHighlight={publisher.name} searchWords={searchWords} />
        </p>
      )}
      {!!publisher?.url && (
        <Link href={publisher.url}>
          <Highlighter textToHighlight={publisher.url} searchWords={searchWords} />
        </Link>
      )}
    </div>
  )
}

function PackageDescription(props: { description: string | undefined; searchWords: string[] }) {
  const { description, searchWords } = props
  if (!description) return null
  return (
    <div>
      <h3 className="font-semibold">Description</h3>
      <p>
        <Highlighter textToHighlight={description} searchWords={searchWords} />
      </p>
    </div>
  )
}

function PackageCategory(props: { category: string | undefined; searchWords: string[] }) {
  const { category, searchWords } = props
  if (!category) return null
  return (
    <div>
      <h3 className="font-semibold">Category</h3>
      <p>
        <Highlighter textToHighlight={category} searchWords={searchWords} />
      </p>
    </div>
  )
}

function PackageModules(props: { modules: PackageModulesRecord; searchWords: string[] }) {
  const { modules, searchWords } = props
  if (
    !modules.documentModels?.length &&
    !modules.apps?.length &&
    !modules.editors?.length &&
    !modules.processors?.length &&
    !modules.subgraphs?.length
  )
    return <p>No modules</p>
  return (
    <div className="flex flex-col gap-1">
      {Object.entries(modules).map(([type, modules]) => (
        <PackageModuleList key={type} type={type} modules={modules} searchWords={searchWords} />
      ))}
    </div>
  )
}

function PackageModuleList(props: {
  type: string
  modules: PowerhouseModule[] | undefined
  searchWords: string[]
}) {
  const { type, modules, searchWords } = props
  if (!modules?.length) return null

  return (
    <div>
      <h3 className="font-semibold">{capitalCase(type)}</h3>
      <ul className="flex list-inside list-disc flex-col gap-2">
        {modules.map((module) => (
          <PackageModule key={module.id} module={module} searchWords={searchWords} />
        ))}
      </ul>
    </div>
  )
}

function PackageModule(props: { module: PowerhouseModule; searchWords: string[] }) {
  const { module, searchWords } = props

  return (
    <li className="list-item">
      <span>
        <Highlighter textToHighlight={capitalCase(module.name)} searchWords={searchWords} />
      </span>
      <span> ({module.id})</span>
      {!!module.documentTypes?.length && (
        <div>
          <h4 className="text-sm font-semibold">Document Types</h4>
          {module.documentTypes?.map((documentType) => (
            <p key={documentType}>
              <Highlighter textToHighlight={documentType} searchWords={searchWords} />
            </p>
          ))}
        </div>
      )}
    </li>
  )
}
