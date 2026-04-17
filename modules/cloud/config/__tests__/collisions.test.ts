import { describe, expect, it } from 'vitest'
import {
  buildCollisionMap,
  exclusiveKeys,
  isValidConfigKeyName,
  missingRequiredEntries,
} from '../collisions'
import type { ConfigEntry, InstalledManifest } from '../types'

function entry(name: string, type: 'var' | 'secret' = 'var', required = false): ConfigEntry {
  return { name, type, required }
}

function manifest(packageName: string, config: ConfigEntry[]): InstalledManifest {
  return {
    packageName,
    manifest: { name: packageName, config },
  }
}

describe('buildCollisionMap', () => {
  it('returns empty for no manifests', () => {
    expect(buildCollisionMap([])).toEqual({})
  })

  it('handles null manifests', () => {
    const map = buildCollisionMap([{ packageName: 'a', manifest: null }])
    expect(map).toEqual({})
  })

  it('maps single-package keys to that package', () => {
    const map = buildCollisionMap([manifest('a', [entry('KEY_ONE'), entry('KEY_TWO')])])
    expect(map).toEqual({ KEY_ONE: ['a'], KEY_TWO: ['a'] })
  })

  it('collects multiple declarers for the same key', () => {
    const map = buildCollisionMap([
      manifest('a', [entry('SHARED')]),
      manifest('b', [entry('SHARED'), entry('B_ONLY')]),
    ])
    expect(map.SHARED?.sort()).toEqual(['a', 'b'])
    expect(map.B_ONLY).toEqual(['b'])
  })

  it('deduplicates when a package declares the same key twice (defensive)', () => {
    const map = buildCollisionMap([manifest('a', [entry('KEY'), entry('KEY')])])
    expect(map.KEY).toEqual(['a'])
  })
})

describe('exclusiveKeys', () => {
  it('returns declared keys that no other package declares', () => {
    const manifests = [
      manifest('a', [entry('A_ONLY'), entry('SHARED')]),
      manifest('b', [entry('SHARED'), entry('B_ONLY')]),
    ]
    expect(exclusiveKeys('a', manifests)).toEqual(['A_ONLY'])
    expect(exclusiveKeys('b', manifests)).toEqual(['B_ONLY'])
  })

  it('returns empty when package not found', () => {
    expect(exclusiveKeys('missing', [manifest('a', [entry('X')])])).toEqual([])
  })

  it('returns empty when manifest has no config', () => {
    expect(exclusiveKeys('a', [manifest('a', [])])).toEqual([])
  })
})

describe('missingRequiredEntries', () => {
  it('returns required entries that lack a value', () => {
    const declared = [
      entry('HAS_VAR', 'var', true),
      entry('MISSING_VAR', 'var', true),
      entry('HAS_SECRET', 'secret', true),
      entry('MISSING_SECRET', 'secret', true),
      entry('OPTIONAL', 'var', false),
      entry('MISSING_OPTIONAL', 'var', false),
    ]
    const missing = missingRequiredEntries(declared, { HAS_VAR: 'value' }, new Set(['HAS_SECRET']))
    expect(missing.map((e) => e.name).sort()).toEqual(['MISSING_SECRET', 'MISSING_VAR'])
  })

  it('returns empty when everything is set', () => {
    const declared = [entry('A', 'var', true), entry('B', 'secret', true)]
    const missing = missingRequiredEntries(declared, { A: '1' }, new Set(['B']))
    expect(missing).toEqual([])
  })

  it('ignores optional entries', () => {
    const declared = [entry('OPT', 'var', false)]
    expect(missingRequiredEntries(declared, {}, new Set())).toEqual([])
  })
})

describe('isValidConfigKeyName', () => {
  it('accepts standard env names', () => {
    expect(isValidConfigKeyName('FOO')).toBe(true)
    expect(isValidConfigKeyName('FOO_BAR')).toBe(true)
    expect(isValidConfigKeyName('F123')).toBe(true)
  })

  it('rejects lowercase, leading digits, dashes', () => {
    expect(isValidConfigKeyName('foo')).toBe(false)
    expect(isValidConfigKeyName('1FOO')).toBe(false)
    expect(isValidConfigKeyName('FOO-BAR')).toBe(false)
    expect(isValidConfigKeyName('')).toBe(false)
  })
})
