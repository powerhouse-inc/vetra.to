export type ConfigEntryType = 'var' | 'secret'

export type ConfigEntry = {
  name: string
  type: ConfigEntryType
  description?: string
  required?: boolean
  default?: string
}

export type PackageManifest = {
  name: string
  description?: string
  config?: ConfigEntry[]
}

export type InstalledManifest = {
  packageName: string
  manifest: PackageManifest | null
}
