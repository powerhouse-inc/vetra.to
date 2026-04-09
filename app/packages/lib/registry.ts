import { type PackageInfo } from '@powerhousedao/shared'
import { REGISTRY_URL } from './constants'

export interface RegistryVersionDist {
  tarball: string
  fileCount?: number
  unpackedSize?: number
  integrity?: string
}

export interface RegistryVersion {
  name: string
  version: string
  license?: string
  description?: string
  repository?: { type?: string; url?: string }
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  maintainers?: { name: string; email?: string }[]
  dist?: RegistryVersionDist
  exports?: Record<string, unknown>
}

export interface RegistryPackageData {
  name: string
  'dist-tags': Record<string, string>
  versions: Record<string, RegistryVersion>
  time?: Record<string, string>
  readme?: string
}

export async function getPackageManifest(name: string) {
  const res = await fetch(`${REGISTRY_URL}/packages`, { next: { revalidate: 30 } })
  const packages = (await res.json()) as PackageInfo[]
  return packages.find((pkg) => pkg.name === name || pkg.manifest?.name === name)
}

export async function getPackageRegistryData(name: string): Promise<RegistryPackageData | null> {
  try {
    const res = await fetch(`${REGISTRY_URL}/${name}`, { next: { revalidate: 30 } })
    if (!res.ok) return null
    return (await res.json()) as RegistryPackageData
  } catch {
    return null
  }
}
