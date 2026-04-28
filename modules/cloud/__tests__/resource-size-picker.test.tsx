import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ResourceSizePicker } from '@/modules/cloud/components/resource-size-picker'

describe('ResourceSizePicker', () => {
  const supported = ['VETRA_AGENT_S', 'VETRA_AGENT_M', 'VETRA_AGENT_L'] as const

  it('renders only supported sizes', () => {
    render(<ResourceSizePicker supported={[...supported]} value={null} onChange={() => {}} />)
    expect(screen.queryByText('Small')).not.toBeNull()
    expect(screen.queryByText('Medium')).not.toBeNull()
    expect(screen.queryByText('Large')).not.toBeNull()
    expect(screen.queryByText('X-Large')).toBeNull()
    expect(screen.queryByText('2X-Large')).toBeNull()
  })

  it('preserves canonical order regardless of input order', () => {
    render(
      <ResourceSizePicker
        supported={['VETRA_AGENT_L', 'VETRA_AGENT_S', 'VETRA_AGENT_M']}
        value={null}
        onChange={() => {}}
      />,
    )
    const labels = screen.getAllByText(/^(Small|Medium|Large)$/).map((el) => el.textContent ?? '')
    expect(labels).toEqual(['Small', 'Medium', 'Large'])
  })

  it('calls onChange with selected size', () => {
    const onChange = vi.fn()
    render(<ResourceSizePicker supported={[...supported]} value={null} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText('Medium'))
    expect(onChange).toHaveBeenCalledWith('VETRA_AGENT_M')
  })
})
