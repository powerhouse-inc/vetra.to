import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCanSign } from '../hooks/use-can-sign'

vi.mock('@powerhousedao/reactor-browser', () => ({
  useRenown: vi.fn(),
  useRenownAuth: vi.fn(),
}))

import { useRenown, useRenownAuth } from '@powerhousedao/reactor-browser'

describe('useCanSign', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns canSign=false and loading=true when auth is loading', () => {
    vi.mocked(useRenown).mockReturnValue(null as never)
    vi.mocked(useRenownAuth).mockReturnValue({ status: 'loading' } as never)
    const { result } = renderHook(() => useCanSign())
    expect(result.current.canSign).toBe(false)
    expect(result.current.loading).toBe(true)
    expect(result.current.signer).toBeNull()
  })

  it('returns canSign=false when not authorized', () => {
    vi.mocked(useRenown).mockReturnValue({ signer: null } as never)
    vi.mocked(useRenownAuth).mockReturnValue({ status: 'unauthorized' } as never)
    const { result } = renderHook(() => useCanSign())
    expect(result.current.canSign).toBe(false)
    expect(result.current.signer).toBeNull()
  })

  it('returns canSign=true when signer is present and auth is ready', () => {
    const fakeSigner = { sign: vi.fn() }
    vi.mocked(useRenown).mockReturnValue({ signer: fakeSigner } as never)
    vi.mocked(useRenownAuth).mockReturnValue({ status: 'authorized' } as never)
    const { result } = renderHook(() => useCanSign())
    expect(result.current.canSign).toBe(true)
    expect(result.current.signer).toBe(fakeSigner)
    expect(result.current.loading).toBe(false)
  })
})
