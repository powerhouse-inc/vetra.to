import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ProfileTeam } from '@/modules/profile/lib/queries'

vi.mock('@/modules/profile/lib/use-my-teams', () => ({
  useMyTeams: vi.fn(),
}))

import { useMyTeams } from '@/modules/profile/lib/use-my-teams'
import { TeamsTab } from '../teams-tab'

const mockUseMyTeams = useMyTeams as unknown as ReturnType<typeof vi.fn>

const team = (over: Partial<ProfileTeam> = {}): ProfileTeam => ({
  id: 't1',
  profileName: 'Acme',
  profileSlug: 'acme',
  profileLogo: null,
  profileDescription: 'A team',
  profileSocialsX: null,
  profileSocialsGithub: null,
  profileSocialsWebsite: null,
  createdAt: '',
  updatedAt: '',
  members: [{ id: 'm1', ethAddress: '0xabc' }],
  spaces: [],
  ...over,
})

describe('TeamsTab', () => {
  it('renders skeleton while loading', () => {
    mockUseMyTeams.mockReturnValue({ isLoading: true, isError: false, data: undefined })
    render(<TeamsTab address="0xabc" />)
    expect(screen.getAllByTestId('team-card-skeleton').length).toBeGreaterThan(0)
  })

  it('renders empty state when no teams', () => {
    mockUseMyTeams.mockReturnValue({ isLoading: false, isError: false, data: [] })
    render(<TeamsTab address="0xabc" />)
    expect(screen.getByText(/not in any builder team/i)).toBeTruthy()
  })

  it('renders error state on fetch failure', () => {
    const refetch = vi.fn()
    mockUseMyTeams.mockReturnValue({ isLoading: false, isError: true, refetch })
    render(<TeamsTab address="0xabc" />)
    expect(screen.getByText(/couldn['’]t load/i)).toBeTruthy()
  })

  it('renders a card per team', () => {
    mockUseMyTeams.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [
        team({ id: 't1', profileName: 'Acme' }),
        team({ id: 't2', profileName: 'Beta', profileSlug: 'beta' }),
      ],
    })
    render(<TeamsTab address="0xabc" />)
    expect(screen.getByText('Acme')).toBeTruthy()
    expect(screen.getByText('Beta')).toBeTruthy()
  })
})
