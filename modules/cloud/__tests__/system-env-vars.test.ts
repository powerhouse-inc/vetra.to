import { describe, expect, it } from 'vitest'
import {
  RESERVED_ENV_NAMES,
  buildSystemEnvPreview,
  isReservedEnvName,
} from '@/modules/cloud/lib/system-env-vars'

describe('RESERVED_ENV_NAMES', () => {
  it('includes the four SERVICE_* vars and NODE_OPTIONS', () => {
    expect(RESERVED_ENV_NAMES).toEqual(
      expect.arrayContaining([
        'SERVICE_ANNOUNCE_URL',
        'SERVICE_ANNOUNCE_TOKEN',
        'SERVICE_DOCUMENT_ID',
        'SERVICE_PREFIX',
        'NODE_OPTIONS',
      ]),
    )
  })
})

describe('isReservedEnvName', () => {
  it('matches reserved names', () => {
    expect(isReservedEnvName('SERVICE_PREFIX')).toBe(true)
    expect(isReservedEnvName('NODE_OPTIONS')).toBe(true)
  })
  it('does not match user names', () => {
    expect(isReservedEnvName('MODEL')).toBe(false)
    expect(isReservedEnvName('SERVICE')).toBe(false)
  })
})

describe('buildSystemEnvPreview', () => {
  it('returns a row per reserved var with computed values', () => {
    const rows = buildSystemEnvPreview({
      environmentId: 'doc-123',
      prefix: 'pirate',
    })
    const byName = Object.fromEntries(rows.map((r) => [r.name, r]))
    expect(byName.SERVICE_ANNOUNCE_URL.preview).toMatch(/^https:\/\//)
    expect(byName.SERVICE_ANNOUNCE_TOKEN.preview).toBe('••••••')
    expect(byName.SERVICE_DOCUMENT_ID.preview).toBe('doc-123')
    expect(byName.SERVICE_PREFIX.preview).toBe('pirate')
  })
  it('shows <prefix-pending> when prefix is empty', () => {
    const rows = buildSystemEnvPreview({ environmentId: 'doc-123', prefix: '' })
    const prefixRow = rows.find((r) => r.name === 'SERVICE_PREFIX')!
    expect(prefixRow.preview).toBe('<prefix-pending>')
  })
})
