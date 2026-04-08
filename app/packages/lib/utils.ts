import { type Manifest } from '@powerhousedao/shared'
import { type PackageFilters } from './types'
import { type FuseResultMatch } from 'fuse.js'
import { filter, isTruthy } from 'remeda'

export function filterManifests(
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

export function getSearchWords(matches: readonly FuseResultMatch[] | undefined) {
  if (!matches?.length) return []
  return filter(
    matches.map((match) => match.value),
    isTruthy,
  )
}
