import { type Manifest, type Publisher, type PowerhouseModule } from '@powerhousedao/shared'
import { capitalCase } from 'change-case'
import { PackageIcon } from 'lucide-react'
import { type ComponentProps } from 'react'
import { USE_PACKAGE_COVER, REGISTRY_URL } from '../lib/constants'
import { type PackageModulesRecord } from '../lib/types'
import Image from 'next/image'
import Highlighter from 'react-highlight-words'
import Link from 'next/link'

export function PackageManifest(props: { manifest: Manifest; searchWords: string[] }) {
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
    <div
      className="mb-4 rounded-md p-3"
      style={{
        boxShadow: '1px 4px 15px 0px #4A587340',
      }}
    >
      <PackageTitle name={name} />
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="flex-none rounded-lg border border-gray-200">
          <PackageCover name={name} />
        </div>
        <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs leading-[18px] text-gray-500">
          <h2 className="mb-1 text-sm font-semibold text-gray-900">Package</h2>
          <PackageName name={name} publisher={publisher} searchWords={searchWords} />
          <PackageDescription description={description} searchWords={searchWords} />
          <PackageCategory category={category} searchWords={searchWords} />
          <PackageModules modules={modules} searchWords={searchWords} />
        </div>
      </div>
    </div>
  )
}

function PurpleHighlighter(props: ComponentProps<typeof Highlighter>) {
  return <Highlighter {...props} highlightClassName="bg-purple-30" />
}

function PackageTitle(props: { name: string }) {
  const { name } = props
  return (
    <div className="mb-2 grid h-10 place-content-center rounded-t-lg bg-slate-50">
      <h3 className="text-md h-fit w-fit font-semibold text-gray-900">{name}</h3>
    </div>
  )
}

function PackageCover(props: { name: string }) {
  const { name } = props
  const PACKAGE_COVER_URL = USE_PACKAGE_COVER
    ? `${REGISTRY_URL}/${name}/browser/cover.png`
    : '/package-placeholder-image.png'
  return <Image width={300} height={235} src={PACKAGE_COVER_URL} alt="package-placeholder-image" />
}

function PackageName(props: {
  name: string
  publisher: Publisher | undefined
  searchWords: string[]
}) {
  const { name, publisher, searchWords } = props
  return (
    <p className="mb-3 text-xs font-medium">
      <PackageIcon size={12} className="inline text-gray-900" />{' '}
      <Link className="text-purple-700" href={`${REGISTRY_URL}/-/web/detail/${name}`}>
        <PurpleHighlighter textToHighlight={name} searchWords={searchWords} />
      </Link>
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
      <Link className="text-purple-700" href={url}>
        <PurpleHighlighter textToHighlight={name} searchWords={searchWords} />
      </Link>
    )

  return (
    <span>
      <PurpleHighlighter textToHighlight={name} searchWords={searchWords} />
    </span>
  )
}

function PackageDescription(props: { description: string | undefined; searchWords: string[] }) {
  const { description, searchWords } = props
  if (!description) return null
  return (
    <p className="mb-3">
      <PurpleHighlighter textToHighlight={description} searchWords={searchWords} />
    </p>
  )
}

function PackageCategory(props: { category: string | undefined; searchWords: string[] }) {
  const { category, searchWords } = props
  if (!category) return null
  return (
    <p className="mb-2">
      <span className="font-semibold">Category: </span>
      <PurpleHighlighter textToHighlight={capitalCase(category)} searchWords={searchWords} />
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
  const hasModules = !!modules?.length
  const hasMultipleModules = hasModules && modules.length > 1

  return (
    <p>
      <span className="font-semibold">{capitalCase(type)}: </span>
      {hasModules ? (
        modules.map((module) => (
          <PackageModule
            key={module.id}
            module={module}
            hasMultipleModules={hasMultipleModules}
            searchWords={searchWords}
          />
        ))
      ) : (
        <span>No {type} used in this package</span>
      )}
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
      <PurpleHighlighter textToHighlight={capitalCase(module.name)} searchWords={searchWords} /> (
      {module.id}){hasMultipleModules && ', '}
    </span>
  )
}
