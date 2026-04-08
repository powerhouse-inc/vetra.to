import { type PackageModuleType } from './types'

export const packageModuleTypes: PackageModuleType[] = [
  'documentModels',
  'editors',
  'apps',
  'subgraphs',
  'processors',
]

export const REGISTRY_URL = process.env.NEXT_PUBLIC_REGISTRY_URL || "https://registry.dev.vetra.io"