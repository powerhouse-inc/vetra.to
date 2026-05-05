import { describe, expect, it } from 'vitest'
import { PackageManifestSchema } from '@/modules/cloud/config/types'

describe('PackageManifestSchema with clint extension', () => {
  it('accepts a full clint-project manifest with features + serviceAnnouncement', () => {
    const manifest = {
      name: 'ph-rupert',
      type: 'clint-project',
      features: {
        agent: {
          id: 'ph-rupert',
          name: 'Agent Rupert',
          description: 'Agent that designs and ships local-first apps',
          image: 'https://example.com/rupert.png',
          models: [{ id: 'anthropic/claude-sonnet-4-5', default: true }],
        },
        powerhouse: {
          support: 'Reactor',
          package: '@powerhousedao/ph-rupert-app',
        },
      },
      serviceCommand: 'ph-rupert',
      serviceAnnouncement: true,
      supportedResources: ['vetra-agent-s', 'vetra-agent-m'],
    }
    const result = PackageManifestSchema.safeParse(manifest)
    expect(result.success).toBe(true)
  })

  it('accepts features with disabled flags (agent or powerhouse = false)', () => {
    const manifest = {
      name: 'ph-rupert',
      type: 'clint-project',
      features: { agent: false as const, powerhouse: false as const },
      serviceCommand: 'ph-rupert',
    }
    const result = PackageManifestSchema.safeParse(manifest)
    expect(result.success).toBe(true)
  })

  it('accepts a non-clint manifest (clint fields omitted)', () => {
    const manifest = { name: 'foo' }
    const result = PackageManifestSchema.safeParse(manifest)
    expect(result.success).toBe(true)
  })

  it('rejects an unknown resource size', () => {
    const manifest = {
      name: 'x',
      type: 'clint-project',
      supportedResources: ['vetra-agent-galactic'],
    }
    const result = PackageManifestSchema.safeParse(manifest)
    expect(result.success).toBe(false)
  })

  it('round-trips clint fields without dropping them', () => {
    const input = {
      name: 'x',
      type: 'clint-project',
      serviceCommand: 'cmd',
      serviceAnnouncement: true,
      supportedResources: ['vetra-agent-s'],
      features: {
        agent: { id: 'a', name: 'A' },
      },
    }
    const parsed = PackageManifestSchema.parse(input)
    expect(parsed.type).toBe('clint-project')
    expect(parsed.serviceCommand).toBe('cmd')
    expect(parsed.serviceAnnouncement).toBe(true)
    expect(parsed.supportedResources).toEqual(['vetra-agent-s'])
    const agent = parsed.features?.agent || null
    expect(agent?.name).toBe('A')
  })
})
