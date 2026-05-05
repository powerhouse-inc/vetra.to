import { describe, expect, it } from 'vitest'
import { isAgentPackageName, validateAgentManifest } from '@/modules/cloud/lib/agent-discovery'
import type { PackageManifest } from '@/modules/cloud/config/types'

describe('isAgentPackageName', () => {
  it('accepts names ending in -cli', () => {
    expect(isAgentPackageName('@powerhousedao/ph-pirate-cli')).toBe(true)
    expect(isAgentPackageName('foo-cli')).toBe(true)
  })
  it('rejects names not ending in -cli', () => {
    expect(isAgentPackageName('@powerhousedao/ph-pirate')).toBe(false)
    expect(isAgentPackageName('foo-cli-tools')).toBe(false)
    expect(isAgentPackageName('')).toBe(false)
  })
})

describe('validateAgentManifest', () => {
  const okManifest: PackageManifest = {
    name: '@powerhousedao/ph-pirate-cli',
    type: 'clint-project',
    features: { agent: { id: 'ph-pirate', name: 'Pirate' } },
  }
  it('returns ok=true on a clint-project manifest', () => {
    expect(validateAgentManifest(okManifest)).toEqual({ ok: true, manifest: okManifest })
  })
  it('returns ok=false when manifest is null', () => {
    const result = validateAgentManifest(null)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('manifest-missing')
  })
  it('returns ok=false when type is not clint-project', () => {
    const result = validateAgentManifest({ ...okManifest, type: 'doc-model' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('not-clint')
  })
})
