import { type PackageModuleType } from './types'

export const packageModuleTypes: PackageModuleType[] = [
  'documentModels',
  'editors',
  'apps',
  'subgraphs',
  'processors',
]

export const REGISTRY_URL = process.env.NEXT_PUBLIC_REGISTRY_URL || 'https://registry.dev.vetra.io'
export const USE_PACKAGE_COVER = process.env.NEXT_PUBLIC_USE_PACKAGE_COVER === 'true'
