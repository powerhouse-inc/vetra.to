import { z } from 'zod'

export type ConfigEntryType = 'var' | 'secret'

export type ConfigEntry = {
  name: string
  type: ConfigEntryType
  description?: string
  required?: boolean
  default?: string
}

/**
 * Endpoint shape used for runtime-announced endpoints (reported by the agent
 * via `serviceAnnounceUrl` after start). Kept available for future runtime
 * display — clint manifests do NOT declare endpoints (they are runtime-only).
 */
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

const ClintFeatureAgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  image: z.string().optional(),
  models: z
    .array(
      z.object({
        id: z.string(),
        default: z.boolean().optional(),
      }),
    )
    .optional(),
})

const ClintFeaturePowerhouseSchema = z.object({
  support: z.enum(['Reactor', 'Switchboard', 'Connect']),
  package: z.string(),
})

const ClintFeaturesSchema = z.object({
  agent: z.union([ClintFeatureAgentSchema, z.literal(false)]).optional(),
  powerhouse: z.union([ClintFeaturePowerhouseSchema, z.literal(false)]).optional(),
})

export const PackageManifestSchema = z
  .object({
    name: z.string(),
    description: z.string().optional(),
    config: z.array(z.unknown()).optional(),
    type: z.string().optional(),
    features: ClintFeaturesSchema.optional(),
    serviceCommand: z.string().optional(),
    serviceAnnouncement: z.boolean().optional(),
    supportedResources: z.array(ClintResourceSizeSchema).optional(),
  })
  .passthrough()

export type ClintFeatureAgent = z.infer<typeof ClintFeatureAgentSchema>
export type ClintFeaturePowerhouse = z.infer<typeof ClintFeaturePowerhouseSchema>

export type PackageManifest = {
  name: string
  description?: string
  config?: ConfigEntry[]
  type?: string
  features?: {
    agent?: ClintFeatureAgent | false
    powerhouse?: ClintFeaturePowerhouse | false
  }
  serviceCommand?: string
  serviceAnnouncement?: boolean
  supportedResources?: z.infer<typeof ClintResourceSizeSchema>[]
}

export type InstalledManifest = {
  packageName: string
  manifest: PackageManifest | null
}
