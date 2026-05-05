import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RequireSigner } from '../components/require-signer'

vi.mock('../hooks/use-can-sign', () => ({ useCanSign: vi.fn() }))
vi.mock('@powerhousedao/reactor-browser', () => ({
  useRenownAuth: vi.fn(),
}))

import { useCanSign } from '../hooks/use-can-sign'
import { useRenownAuth } from '@powerhousedao/reactor-browser'

describe('RequireSigner', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders nothing while loading', () => {
    vi.mocked(useCanSign).mockReturnValue({ canSign: false, signer: null, loading: true })
    vi.mocked(useRenownAuth).mockReturnValue({ status: 'loading', login: vi.fn() } as never)
    const { container } = render(
      <RequireSigner>
        <div data-testid="child">child</div>
      </RequireSigner>,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders children when canSign', () => {
    vi.mocked(useCanSign).mockReturnValue({
      canSign: true,
      signer: { sign: vi.fn() } as never,
      loading: false,
    })
    vi.mocked(useRenownAuth).mockReturnValue({ status: 'authorized', login: vi.fn() } as never)
    render(
      <RequireSigner>
        <div data-testid="child">child</div>
      </RequireSigner>,
    )
    expect(screen.getByTestId('child')).toBeTruthy()
  })

  it('renders login CTA when not signed in', () => {
    vi.mocked(useCanSign).mockReturnValue({ canSign: false, signer: null, loading: false })
    vi.mocked(useRenownAuth).mockReturnValue({ status: 'unauthorized', login: vi.fn() } as never)
    render(
      <RequireSigner>
        <div data-testid="child">child</div>
      </RequireSigner>,
    )
    expect(screen.queryByTestId('child')).toBeNull()
    // CTA button is rendered
    expect(screen.getByRole('button', { name: /log in with renown/i })).toBeTruthy()
  })

  it('renders fallback when provided and not signed in', () => {
    vi.mocked(useCanSign).mockReturnValue({ canSign: false, signer: null, loading: false })
    vi.mocked(useRenownAuth).mockReturnValue({ status: 'unauthorized', login: vi.fn() } as never)
    render(
      <RequireSigner fallback={<div data-testid="fallback">custom</div>}>
        <div data-testid="child">child</div>
      </RequireSigner>,
    )
    expect(screen.getByTestId('fallback')).toBeTruthy()
    expect(screen.queryByTestId('child')).toBeNull()
  })
})
