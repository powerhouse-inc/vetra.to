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
import { packageModuleTypes, REGISTRY_URL } from './constants'
import { map, unique, filter, isTruthy } from 'remeda'
import Fuse, { type FuseResultMatch } from 'fuse.js'
import Highlighter from 'react-highlight-words'
import Image from 'next/image'

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
      <div className="flex gap-3">
        <div className="flex-none">
          <Filters
            moduleTypeOptions={packageModuleTypes}
            categoryOptions={categoryOptions}
            publisherNameOptions={publisherNameOptions}
          />
        </div>
        <div>
          {searchResult.length === 0 ? (
            <div>
              <p>The current set of filters do not return any results</p>
            </div>
          ) : (
            searchResult.map(({ item: manifest, matches }) => (
              <PackageManifest
                key={manifest.name}
                manifest={manifest}
                searchWords={getSearchWords(matches)}
              />
            ))
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
    <div className='mb-4'>
      <PackageTitle name={name} />
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="flex-none">
          <PackageCover />
        </div>
        <div className='bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs leading-[18px] flex-1 text-gray-500'>
          <h2 className='font-semibold text-sm text-gray-900 mb-1'>Package</h2>
          <PackageName name={name} publisher={publisher} searchWords={searchWords} />
          <PackageDescription description={description} searchWords={searchWords} />
          <PackageCategory category={category} searchWords={searchWords} />
          <PackageModules modules={modules} searchWords={searchWords} />
        </div>
      </div>
    </div>
  )
}

function PackageTitle(props: { name: string }) {
  const { name } = props
  return (
    <div className='bg-slate-50 rounded-t-lg h-10 grid place-content-center mb-2'>
      <h3 className='w-fit h-fit font-semibold text-gray-900 text-md'>{name}</h3>
    </div>
  )
}

function PackageCover() {
  return (
    <Image
      width={300}
      height={235}
      src="/package-placeholder-image.png"
      alt="package-placeholder-image"
    />
  )
}

function PackageName(props: {
  name: string
  publisher: Publisher | undefined
  searchWords: string[]
}) {
  const { name, publisher, searchWords } = props
  return (
    <p className="text-xs font-medium">
      <svg
        className='inline'
        width="12"
        height="13"
        viewBox="0 0 12 13"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5.06944 11.585C5.23835 11.6825 5.42996 11.7338 5.625 11.7338C5.82004 11.7338 6.01165 11.6825 6.18056 11.585L10.0694 9.36275C10.2382 9.26533 10.3783 9.12524 10.4759 8.95655C10.5734 8.78786 10.6248 8.59649 10.625 8.40164V3.95719C10.6248 3.76235 10.5734 3.57098 10.4759 3.40228C10.3783 3.23359 10.2382 3.09351 10.0694 2.99608L6.18056 0.773861C6.01165 0.67634 5.82004 0.625 5.625 0.625C5.42996 0.625 5.23835 0.67634 5.06944 0.773861L1.18056 2.99608C1.01181 3.09351 0.871656 3.23359 0.774145 3.40228C0.676635 3.57098 0.6252 3.76235 0.625 3.95719V8.40164C0.6252 8.59649 0.676635 8.78786 0.774145 8.95655C0.871656 9.12524 1.01181 9.26533 1.18056 9.36275L5.06944 11.585Z"
          stroke="#343839"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.625 11.7372V6.18164"
          stroke="#343839"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M0.786133 3.4017L5.62502 6.17948L10.4639 3.4017"
          stroke="#343839"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3.125 1.88477L8.125 4.74588"
          stroke="#343839"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>{' '}
      <Link className='text-[#504DFF]' href={`${REGISTRY_URL}/-/web/detail/${name}`}><Highlighter textToHighlight={name} searchWords={searchWords} /></Link>
      {!!publisher?.name && (
        <span>
          {' '}
          by <PackagePublisher publisher={publisher} searchWords={searchWords} />
        </span>
      )}
    </p>
  )
}

function PackagePublisher(props: { publisher: Publisher | undefined; searchWords: string[] }) {
  const { publisher, searchWords } = props

  if (!publisher) return null

  const { name, url } = publisher

  if (!name) return null

  if (url)
    return (
      <Link className='text-[#504DFF]' href={url}>
        <Highlighter textToHighlight={name} searchWords={searchWords} />
      </Link>
    )

  return (
    <span>
      <Highlighter textToHighlight={name} searchWords={searchWords} />
    </span>
  )
}

function PackageDescription(props: { description: string | undefined; searchWords: string[] }) {
  const { description, searchWords } = props
  if (!description) return null
  return (
    <p className='my-3'>
      <Highlighter textToHighlight={description} searchWords={searchWords} />
    </p>
  )
}

function PackageCategory(props: { category: string | undefined; searchWords: string[] }) {
  const { category, searchWords } = props
  if (!category) return null
  return (
    <p className='mb-2'>
      <span className="font-semibold">Category: </span>
      <Highlighter textToHighlight={capitalCase(category)} searchWords={searchWords} />
    </p>
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
    return null
  return Object.entries(modules).map(([type, modules]) => (
    <PackageModuleList key={type} type={type} modules={modules} searchWords={searchWords} />
  ))
}

function PackageModuleList(props: {
  type: string
  modules: PowerhouseModule[] | undefined
  searchWords: string[]
}) {
  const { type, modules, searchWords } = props
  const hasModules = !!modules?.length;
  const hasMultipleModules = hasModules && modules.length > 1

  return (
    <p>
      <span className="font-semibold">{capitalCase(type)}: </span>
      {hasModules ? modules.map((module) => (
        <PackageModule
          key={module.id}
          module={module}
          hasMultipleModules={hasMultipleModules}
          searchWords={searchWords}
        />
      )) : <span>No {type} used in this package</span>}
    </p>
  )
}

function PackageModule(props: {
  module: PowerhouseModule
  hasMultipleModules: boolean
  searchWords: string[]
}) {
  const { module, searchWords, hasMultipleModules } = props

  return (
    <span>
      <Highlighter textToHighlight={capitalCase(module.name)} searchWords={searchWords} /> (
      {module.id}){hasMultipleModules && ', '}
    </span>
  )
}
