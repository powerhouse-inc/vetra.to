import { describe, expect, it } from 'vitest'
import {
  slugify,
  isValidSlug,
  isValidEthAddress,
  isValidUrl,
} from '@/modules/profile/lib/validations'

describe('slugify', () => {
  it('lowercases and dash-joins', () => {
    expect(slugify('Acme Corp')).toBe('acme-corp')
  })
  it('strips non-alphanumeric', () => {
    expect(slugify('Hello, World!')).toBe('hello-world')
  })
  it('collapses repeats and trims dashes', () => {
    expect(slugify('  --Foo   Bar--  ')).toBe('foo-bar')
  })
  it('normalises unicode to ASCII', () => {
    expect(slugify('Café Münch')).toBe('cafe-munch')
  })
  it('returns empty for unsupportable input', () => {
    expect(slugify('!!!')).toBe('')
  })
})

describe('isValidSlug', () => {
  it('accepts good slugs', () => {
    expect(isValidSlug('acme-corp')).toBe(true)
    expect(isValidSlug('foo123')).toBe(true)
  })
  it('rejects too short / long', () => {
    expect(isValidSlug('ab')).toBe(false)
    expect(isValidSlug('a'.repeat(41))).toBe(false)
  })
  it('rejects leading/trailing dashes', () => {
    expect(isValidSlug('-foo')).toBe(false)
    expect(isValidSlug('foo-')).toBe(false)
  })
  it('rejects double dashes', () => {
    expect(isValidSlug('foo--bar')).toBe(false)
  })
  it('rejects uppercase / non-alnum', () => {
    expect(isValidSlug('Foo')).toBe(false)
    expect(isValidSlug('foo_bar')).toBe(false)
  })
})

describe('isValidEthAddress', () => {
  it('accepts well-formed 0x40-hex', () => {
    expect(isValidEthAddress('0x' + 'a'.repeat(40))).toBe(true)
    expect(isValidEthAddress('0x' + 'F'.repeat(40))).toBe(true)
  })
  it('rejects wrong length / charset / prefix', () => {
    expect(isValidEthAddress('0x' + 'a'.repeat(39))).toBe(false)
    expect(isValidEthAddress('0x' + 'a'.repeat(41))).toBe(false)
    expect(isValidEthAddress('aa' + 'a'.repeat(40))).toBe(false)
    expect(isValidEthAddress('0x' + 'z'.repeat(40))).toBe(false)
  })
})

describe('isValidUrl', () => {
  it('accepts http(s) URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true)
    expect(isValidUrl('http://example.com/path?q=1')).toBe(true)
  })
  it('rejects gibberish', () => {
    expect(isValidUrl('not a url')).toBe(false)
    expect(isValidUrl('javascript:alert(1)')).toBe(false)
  })
  it('treats empty as valid (caller decides if required)', () => {
    expect(isValidUrl('')).toBe(true)
  })
})
