import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import type { ProfileTeam } from '@/modules/profile/lib/queries'

const fetcher = vi.fn()
vi.mock('@/modules/profile/lib/fetcher', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  fetchBuilderTeamsByMember: (...args: unknown[]) => fetcher(...args),
}))

import { useMyTeams } from '@/modules/profile/lib/use-my-teams'

const wrapper = ({ children }: { children: ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

const team = (over: Partial<ProfileTeam> = {}): ProfileTeam => ({
  id: 't1',
  profileName: 'Acme',
  profileSlug: 'acme',
  profileLogo: null,
  profileDescription: null,
  profileSocialsX: null,
  profileSocialsGithub: null,
  profileSocialsWebsite: null,
  createdAt: '2026-05-13T00:00:00Z',
  updatedAt: '2026-05-13T00:00:00Z',
  members: [{ id: 'm1', ethAddress: '0xabc' }],
  spaces: [],
  ...over,
})

describe('useMyTeams', () => {
  beforeEach(() => fetcher.mockReset())

  it('is disabled when address is undefined', async () => {
    const { result } = renderHook(() => useMyTeams(undefined), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(fetcher).not.toHaveBeenCalled()
    expect(result.current.data).toBeUndefined()
  })

  it('fetches teams for a given address (lowercased)', async () => {
    fetcher.mockResolvedValueOnce([team({ id: 't1' }), team({ id: 't2', profileName: 'Beta' })])
    const { result } = renderHook(() => useMyTeams('0xABC'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetcher).toHaveBeenCalledWith('0xabc')
    expect(result.current.data?.map((t) => t.id)).toEqual(['t1', 't2'])
  })

  it('surfaces fetch errors', async () => {
    fetcher.mockRejectedValueOnce(new Error('boom'))
    const { result } = renderHook(() => useMyTeams('0xabc'), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as Error).message).toBe('boom')
  })
})
