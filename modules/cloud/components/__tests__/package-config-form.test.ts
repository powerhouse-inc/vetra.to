import { describe, expect, it } from 'vitest'
import type { ConfigEntry } from '@/modules/cloud/config/types'
import { initialConfigFormState, validateConfigForm } from '../package-config-form'

function v(name: string, required = false, def?: string): ConfigEntry {
  return { name, type: 'var', required, default: def }
}
function s(name: string, required = false): ConfigEntry {
  return { name, type: 'secret', required }
}

const noContext = {
  existingVarValues: {},
  existingSecretKeys: new Set<string>(),
  collisions: {},
  ownerPackageName: 'pkg',
}

describe('initialConfigFormState', () => {
  it('prefills vars from existing tenant values when present', () => {
    const state = initialConfigFormState([v('A'), v('B', false, 'default_b')], {
      ...noContext,
      existingVarValues: { A: 'tenant-val' },
    })
    expect(state.A).toEqual({ value: 'tenant-val', touched: false })
    expect(state.B).toEqual({ value: 'default_b', touched: false })
  })

  it('leaves secrets empty even when existing in tenant', () => {
    const state = initialConfigFormState([s('K')], {
      ...noContext,
      existingSecretKeys: new Set(['K']),
    })
    expect(state.K).toEqual({ value: '', touched: false })
  })
})

describe('validateConfigForm', () => {
  it('flags required vars with no value', () => {
    const missing = validateConfigForm(
      [v('A', true), v('B', true)],
      {
        A: { value: '', touched: false },
        B: { value: 'ok', touched: true },
      },
      noContext,
    )
    expect(missing).toEqual(['A'])
  })

  it('treats an existing tenant value as satisfying a required var', () => {
    const missing = validateConfigForm(
      [v('A', true)],
      { A: { value: '', touched: false } },
      { ...noContext, existingVarValues: { A: 'already-set' } },
    )
    expect(missing).toEqual([])
  })

  it('treats an existing secret key as satisfying a required secret', () => {
    const missing = validateConfigForm(
      [s('K', true)],
      { K: { value: '', touched: false } },
      { ...noContext, existingSecretKeys: new Set(['K']) },
    )
    expect(missing).toEqual([])
  })

  it('ignores optional entries', () => {
    const missing = validateConfigForm(
      [v('OPT', false), s('OPT2', false)],
      {
        OPT: { value: '', touched: false },
        OPT2: { value: '', touched: false },
      },
      noContext,
    )
    expect(missing).toEqual([])
  })
})
