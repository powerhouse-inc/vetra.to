import { describe, expect, it } from 'vitest'
import { PackageManifestSchema } from '@/modules/cloud/config/types'

describe('PackageManifestSchema with clint extension', () => {
  it('accepts a clint-project manifest with all fields', () => {
    const manifest = {
      name: 'ph-rupert',
      type: 'clint-project',
      serviceCommand: 'ph-rupert --stand-alone',
      supportedResources: ['vetra-agent-s', 'vetra-agent-m'],
      endpoints: [{ id: 'agent-graphql', type: 'api-graphql', port: '12345', status: 'disabled' }],
    }
    const result = PackageManifestSchema.safeParse(manifest)
    expect(result.success).toBe(true)
  })

  it('accepts a non-clint manifest (clint fields omitted)', () => {
    const manifest = { name: 'foo' }
    const result = PackageManifestSchema.safeParse(manifest)
    expect(result.success).toBe(true)
  })

  it('rejects an endpoint with unknown type', () => {
    const manifest = {
      name: 'ph-rupert',
      type: 'clint-project',
      endpoints: [{ id: 'x', type: 'unknown-type', port: '1' }],
    }
    const result = PackageManifestSchema.safeParse(manifest)
    expect(result.success).toBe(false)
  })

  it('round-trips clint fields without dropping them', () => {
    const input = {
      name: 'x',
      type: 'clint-project',
      serviceCommand: 'cmd',
      supportedResources: ['vetra-agent-s'],
      endpoints: [{ id: 'e', type: 'website' as const, port: '1', status: 'disabled' as const }],
    }
    const parsed = PackageManifestSchema.parse(input)
    expect(parsed.type).toBe('clint-project')
    expect(parsed.serviceCommand).toBe('cmd')
    expect(parsed.supportedResources).toEqual(['vetra-agent-s'])
    expect(parsed.endpoints).toHaveLength(1)
  })
})
