import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useEnvironmentController } from '../hooks/use-environment-controller'

vi.mock('../hooks/use-can-sign', () => ({ useCanSign: vi.fn() }))
vi.mock('../controller', () => ({ loadEnvironmentController: vi.fn() }))

import { useCanSign } from '../hooks/use-can-sign'
import { loadEnvironmentController } from '../controller'

const fakeSigner = { sign: vi.fn() }

function makeController(state: Record<string, unknown>) {
  const listeners = new Set<() => void>()
  return {
    state: { global: state },
    onChange: (cb: () => void) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    pull: vi.fn().mockResolvedValue({ id: 'doc1' }),
    _emit: () => listeners.forEach((cb) => cb()),
  }
}

describe('useEnvironmentController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does nothing when no signer is available', async () => {
    vi.mocked(useCanSign).mockReturnValue({ canSign: false, signer: null, loading: false })
    const { result } = renderHook(() => useEnvironmentController('doc1'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(loadEnvironmentController).not.toHaveBeenCalled()
    expect(result.current.controller).toBeNull()
  })

  it('does nothing when documentId is null', async () => {
    vi.mocked(useCanSign).mockReturnValue({
      canSign: true,
      signer: fakeSigner as never,
      loading: false,
    })
    const { result } = renderHook(() => useEnvironmentController(null))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(loadEnvironmentController).not.toHaveBeenCalled()
  })

  it('loads controller and exposes state', async () => {
    const ctrl = makeController({ label: 'env-1' })
    vi.mocked(useCanSign).mockReturnValue({
      canSign: true,
      signer: fakeSigner as never,
      loading: false,
    })
    vi.mocked(loadEnvironmentController).mockResolvedValue(ctrl as never)

    const { result } = renderHook(() => useEnvironmentController('doc1'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.state).toEqual({ label: 'env-1' })
  })

  it('updates state when controller emits onChange', async () => {
    const ctrl = makeController({ label: 'old' })
    vi.mocked(useCanSign).mockReturnValue({
      canSign: true,
      signer: fakeSigner as never,
      loading: false,
    })
    vi.mocked(loadEnvironmentController).mockResolvedValue(ctrl as never)

    const { result } = renderHook(() => useEnvironmentController('doc1'))
    await waitFor(() => expect(result.current.state).toEqual({ label: 'old' }))

    // eslint-disable-next-line @typescript-eslint/await-thenable
    await act(() => {
      ctrl.state.global = { label: 'new' }
      ctrl._emit()
    })

    await waitFor(() => expect(result.current.state).toEqual({ label: 'new' }))
  })

  it('exposes error on load failure', async () => {
    vi.mocked(useCanSign).mockReturnValue({
      canSign: true,
      signer: fakeSigner as never,
      loading: false,
    })
    vi.mocked(loadEnvironmentController).mockRejectedValue(new Error('boom'))

    const { result } = renderHook(() => useEnvironmentController('doc1'))
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error))
    expect(result.current.isLoading).toBe(false)
  })
})
