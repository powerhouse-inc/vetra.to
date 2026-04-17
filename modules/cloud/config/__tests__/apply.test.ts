import { describe, expect, it } from 'vitest'
import { computeConfigChanges } from '../apply'
import type { ConfigEntry } from '../types'

function v(name: string, required = false, def?: string): ConfigEntry {
  return { name, type: 'var', required, default: def }
}
function s(name: string, required = false): ConfigEntry {
  return { name, type: 'secret', required }
}

describe('computeConfigChanges', () => {
  it('returns empty when no fields were touched and no defaults apply', () => {
    const entries = [v('A'), s('B')]
    const changes = computeConfigChanges(
      entries,
      { A: { value: '', touched: false }, B: { value: '', touched: false } },
      {},
    )
    expect(changes).toEqual([])
  })

  it('persists defaults for untouched vars that have no existing value', () => {
    const entries = [v('WITH_DEFAULT', false, 'info')]
    const changes = computeConfigChanges(
      entries,
      { WITH_DEFAULT: { value: 'info', touched: false } },
      {},
    )
    expect(changes).toEqual([{ kind: 'setVar', name: 'WITH_DEFAULT', value: 'info' }])
  })

  it('does not re-persist defaults when the var already has a value in the tenant', () => {
    const entries = [v('WITH_DEFAULT', false, 'info')]
    const changes = computeConfigChanges(
      entries,
      { WITH_DEFAULT: { value: 'debug', touched: false } },
      { WITH_DEFAULT: 'debug' },
    )
    expect(changes).toEqual([])
  })

  it('writes a var when the user changed the value', () => {
    const changes = computeConfigChanges(
      [v('LOG')],
      { LOG: { value: 'debug', touched: true } },
      { LOG: 'info' },
    )
    expect(changes).toEqual([{ kind: 'setVar', name: 'LOG', value: 'debug' }])
  })

  it('does not write a var when the user typed the same existing value', () => {
    const changes = computeConfigChanges(
      [v('LOG')],
      { LOG: { value: 'info', touched: true } },
      { LOG: 'info' },
    )
    expect(changes).toEqual([])
  })

  it('writes secrets only when the user typed a value', () => {
    const entries = [s('KEY'), s('UNTOUCHED'), s('EMPTY_TOUCHED')]
    const changes = computeConfigChanges(
      entries,
      {
        KEY: { value: 'secret123', touched: true },
        UNTOUCHED: { value: '', touched: false },
        EMPTY_TOUCHED: { value: '   ', touched: true },
      },
      {},
    )
    expect(changes).toEqual([{ kind: 'setSecret', name: 'KEY', value: 'secret123' }])
  })
})
