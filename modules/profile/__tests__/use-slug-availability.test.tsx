import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

const fetcher = vi.fn()
vi.mock('@/modules/profile/lib/create-team-queries', () => ({
  fetchBuilderTeamBySlug: (...args: unknown[]) => fetcher(...args),
}))

import { useSlugAvailability } from '@/modules/profile/lib/use-slug-availability'

describe('useSlugAvailability', () => {
  beforeEach(() => {
    fetcher.mockReset()
  })

  it('returns idle when slug is invalid', () => {
    const { result } = renderHook(() => useSlugAvailability('ab', true))
    expect(result.current).toBe('idle')
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('returns available when fetcher returns null after debounce', async () => {
    fetcher.mockResolvedValueOnce(null)
    const { result } = renderHook(() => useSlugAvailability('acme-corp', true))
    expect(result.current).toBe('checking')
    await waitFor(() => expect(result.current).toBe('available'), { timeout: 1500 })
    expect(fetcher).toHaveBeenCalledWith('acme-corp')
  })

  it('returns taken when fetcher returns a team', async () => {
    fetcher.mockResolvedValueOnce({ id: 't1' })
    const { result } = renderHook(() => useSlugAvailability('acme', true))
    await waitFor(() => expect(result.current).toBe('taken'), { timeout: 1500 })
  })

  it('returns idle when enabled is false', () => {
    const { result } = renderHook(() => useSlugAvailability('acme-corp', false))
    expect(result.current).toBe('idle')
    expect(fetcher).not.toHaveBeenCalled()
  })
})
