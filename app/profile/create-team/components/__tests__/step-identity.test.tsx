import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@/modules/profile/lib/use-slug-availability', () => ({
  useSlugAvailability: vi.fn(),
}))
import { useSlugAvailability } from '@/modules/profile/lib/use-slug-availability'
import { StepIdentity } from '../step-identity'

const useSlugMock = useSlugAvailability as unknown as ReturnType<typeof vi.fn>

describe('StepIdentity', () => {
  it('auto-suggests slug from name', () => {
    useSlugMock.mockReturnValue('idle')
    const set = vi.fn()
    render(<StepIdentity name="" slug="" onChange={set} />)
    const nameInput = screen.getByLabelText(/team name/i)
    fireEvent.change(nameInput, { target: { value: 'Acme Corp' } })
    expect(set).toHaveBeenCalledWith({ name: 'Acme Corp', slug: 'acme-corp' })
  })

  it('shows checking status', () => {
    useSlugMock.mockReturnValue('checking')
    render(<StepIdentity name="Acme" slug="acme" onChange={vi.fn()} />)
    expect(screen.getByText(/checking/i)).toBeTruthy()
  })

  it('shows available status', () => {
    useSlugMock.mockReturnValue('available')
    render(<StepIdentity name="Acme" slug="acme" onChange={vi.fn()} />)
    expect(screen.getByText(/available/i)).toBeTruthy()
  })

  it('shows taken status', () => {
    useSlugMock.mockReturnValue('taken')
    render(<StepIdentity name="Acme" slug="acme" onChange={vi.fn()} />)
    expect(screen.getByText(/taken/i)).toBeTruthy()
  })
})
