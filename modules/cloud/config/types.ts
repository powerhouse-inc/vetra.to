import { z } from 'zod'

export type ConfigEntryType = 'var' | 'secret'

export type ConfigEntry = {
  name: string
  type: ConfigEntryType
  description?: string
  required?: boolean
  default?: string
}

export const ClintEndpointSchema = z.object({
  id: z.string(),
  type: z.enum(['api-graphql', 'api-mcp', 'website']),
  port: z.string(),
  status: z.enum(['enabled', 'disabled']).optional(),
})

export const ClintResourceSizeSchema = z.enum([
  'vetra-agent-s',
  'vetra-agent-m',
  'vetra-agent-l',
  'vetra-agent-xl',
  'vetra-agent-xxl',
])

export const PackageManifestSchema = z
  .object({
    name: z.string(),
    description: z.string().optional(),
    config: z.array(z.unknown()).optional(),
    type: z.string().optional(),
    serviceCommand: z.string().optional(),
    supportedResources: z.array(ClintResourceSizeSchema).optional(),
    endpoints: z.array(ClintEndpointSchema).optional(),
  })
  .passthrough()

export type PackageManifest = {
  name: string
  description?: string
  config?: ConfigEntry[]
  type?: string
  serviceCommand?: string
  supportedResources?: z.infer<typeof ClintResourceSizeSchema>[]
  endpoints?: z.infer<typeof ClintEndpointSchema>[]
}

export type InstalledManifest = {
  packageName: string
  manifest: PackageManifest | null
}
