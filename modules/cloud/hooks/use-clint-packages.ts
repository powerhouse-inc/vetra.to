'use client'

import { useMemo } from 'react'
import type { PackageManifest } from '@/modules/cloud/config/types'
import type { CloudPackage } from '@/modules/cloud/types'
import { useRegistryManifests } from './use-registry-search'

export type ClintPackageEntry = {
  package: CloudPackage
  manifest: PackageManifest
}

type Args = {
  registry: string | null
  packages: CloudPackage[]
}

/**
 * Filters env packages to those whose manifest declares `type: 'clint-project'`,
 * fetching all manifests in parallel via the existing registry proxy.
 *
 * Manifest fetch failures (404, network, malformed) silently exclude the
 * package from the result rather than failing the whole list.
 */
export function useClintPackages({ registry, packages }: Args): {
  clintPackages: ClintPackageEntry[]
  isLoading: boolean
} {
  const fetchInputs = useMemo(
    () => packages.map((p) => ({ name: p.name, version: p.version ?? undefined })),
    [packages],
  )
  const { manifests, isLoading } = useRegistryManifests(registry, fetchInputs)

  const clintPackages = useMemo<ClintPackageEntry[]>(() => {
    return manifests
      .map(({ packageName, manifest }) => {
        if (!manifest || manifest.type !== 'clint-project') return null
        const pkg = packages.find((p) => p.name === packageName)
        if (!pkg) return null
        return { package: pkg, manifest }
      })
      .filter((x): x is ClintPackageEntry => x !== null)
  }, [manifests, packages])

  return { clintPackages, isLoading }
}
