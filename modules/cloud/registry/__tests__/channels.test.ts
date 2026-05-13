import { describe, expect, it } from 'vitest'

import { computeDistTags } from '@/modules/cloud/registry/channels'

describe('computeDistTags', () => {
  it('returns empty object for empty input', () => {
    expect(computeDistTags([])).toEqual({})
  })

  it('picks the highest .N for a single dev channel', () => {
    const tags = ['v6.0.0-dev.225', 'v6.0.0-dev.240', 'v6.0.0-dev.236']
    expect(computeDistTags(tags)).toEqual({ dev: 'v6.0.0-dev.240' })
  })

  it('handles dev + stable together', () => {
    const tags = ['v6.0.0-dev.240', 'v5.4.2', 'v5.3.6', 'v5.4.0-dev.10']
    expect(computeDistTags(tags)).toEqual({
      dev: 'v6.0.0-dev.240',
      latest: 'v5.4.2',
    })
  })

  it('auto-discovers new channels (beta)', () => {
    const tags = ['v6.0.0-beta.3', 'v6.0.0-beta.1', 'v6.0.0-dev.5']
    expect(computeDistTags(tags)).toEqual({
      beta: 'v6.0.0-beta.3',
      dev: 'v6.0.0-dev.5',
    })
  })

  it('compares across major.minor.patch (newer base wins)', () => {
    const tags = ['v5.99.0-dev.999', 'v6.0.0-dev.1']
    expect(computeDistTags(tags)).toEqual({ dev: 'v6.0.0-dev.1' })
  })

  it('stable beats same-base prerelease for latest', () => {
    const tags = ['v6.0.0', 'v6.0.0-dev.99']
    expect(computeDistTags(tags)).toEqual({
      latest: 'v6.0.0',
      dev: 'v6.0.0-dev.99',
    })
  })

  it('ignores unrecognized tags', () => {
    const tags = ['latest', 'staging', 'sha256-abc', 'v6.0.0-dev.240']
    expect(computeDistTags(tags)).toEqual({ dev: 'v6.0.0-dev.240' })
  })

  it('handles tags without the v prefix', () => {
    expect(computeDistTags(['6.0.0-dev.5', '6.0.0-dev.10'])).toEqual({
      dev: '6.0.0-dev.10',
    })
  })

  it('channel detection is case-insensitive (BETA == beta)', () => {
    expect(computeDistTags(['v6.0.0-BETA.1', 'v6.0.0-beta.2'])).toEqual({
      beta: 'v6.0.0-beta.2',
    })
  })
})
