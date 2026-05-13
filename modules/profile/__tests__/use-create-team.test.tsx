import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const addDocumentMock = vi.fn()
const dispatchActionsMock = vi.fn()
vi.mock('@powerhousedao/reactor-browser', () => ({
  addDocument: (...args: unknown[]) => addDocumentMock(...args),
  dispatchActions: (...args: unknown[]) => dispatchActionsMock(...args),
}))
const fetchSlugMock = vi.fn()
vi.mock('@/modules/profile/lib/create-team-queries', () => ({
  fetchBuilderTeamBySlug: (...a: unknown[]) => fetchSlugMock(...a),
}))

import { useCreateTeam } from '@/modules/profile/lib/use-create-team'

const baseForm = {
  name: 'Acme',
  slug: 'acme',
  description: '',
  profileLogo: '',
  profileSocialsX: '',
  profileSocialsGithub: '',
  profileSocialsWebsite: '',
  members: [],
}

type DispatchedAction = { type: string; input: Record<string, unknown> }

function getDispatchedActions(): DispatchedAction[] {
  const lastCall = dispatchActionsMock.mock.calls.at(-1)
  return (lastCall?.[0] ?? []) as DispatchedAction[]
}

describe('useCreateTeam', () => {
  beforeEach(() => {
    addDocumentMock.mockReset()
    dispatchActionsMock.mockReset()
    fetchSlugMock.mockReset()
  })

  it('mints doc, dispatches required actions, resolves on success', async () => {
    addDocumentMock.mockResolvedValueOnce({ documentId: 'doc-1' })
    dispatchActionsMock.mockResolvedValueOnce(undefined)
    fetchSlugMock.mockResolvedValueOnce({ id: 'doc-1' })

    const { result } = renderHook(() =>
      useCreateTeam({ driveId: 'vetra-builder-package', creatorAddress: '0xCREATOR' }),
    )

    let outcome: { documentId: string } | undefined
    await act(async () => {
      outcome = await result.current.createTeam(baseForm)
    })

    expect(addDocumentMock).toHaveBeenCalledWith(
      'vetra-builder-package',
      'Acme',
      'powerhouse/builder-team',
    )
    expect(dispatchActionsMock).toHaveBeenCalledTimes(1)
    expect(outcome?.documentId).toBe('doc-1')

    const types = getDispatchedActions().map((a) => a.type)
    expect(types).toContain('SET_TEAM_NAME')
    expect(types).toContain('SET_SLUG')
    expect(types).toContain('ADD_MEMBER')
    expect(types).toContain('UPDATE_MEMBER_INFO')

    const updateMemberCall = getDispatchedActions().find((a) => a.type === 'UPDATE_MEMBER_INFO')
    expect(updateMemberCall?.input).toMatchObject({ ethAddress: '0xCREATOR' })
  })

  it('includes optional fields only when non-empty', async () => {
    addDocumentMock.mockResolvedValueOnce({ documentId: 'doc-1' })
    dispatchActionsMock.mockResolvedValueOnce(undefined)
    fetchSlugMock.mockResolvedValueOnce({ id: 'doc-1' })
    const { result } = renderHook(() =>
      useCreateTeam({ driveId: 'vetra-builder-package', creatorAddress: '0xC' }),
    )
    await act(async () => {
      await result.current.createTeam({
        ...baseForm,
        description: 'hi',
        profileSocialsX: 'https://x.com/acme',
      })
    })
    const types = getDispatchedActions().map((a) => a.type)
    expect(types).toContain('SET_DESCRIPTION')
    expect(types).toContain('SET_SOCIALS')
    expect(types).not.toContain('SET_LOGO')
    const socials = getDispatchedActions().find((a) => a.type === 'SET_SOCIALS')
    expect(socials?.input).toMatchObject({
      xProfile: 'https://x.com/acme',
      github: undefined,
      website: undefined,
    })
  })

  it('adds invited members as addMember+updateMemberInfo pairs', async () => {
    addDocumentMock.mockResolvedValueOnce({ documentId: 'doc-1' })
    dispatchActionsMock.mockResolvedValueOnce(undefined)
    fetchSlugMock.mockResolvedValueOnce({ id: 'doc-1' })
    const { result } = renderHook(() =>
      useCreateTeam({ driveId: 'vetra-builder-package', creatorAddress: '0xC' }),
    )
    await act(async () => {
      await result.current.createTeam({
        ...baseForm,
        members: [{ address: '0xINVITED1' }, { address: '0xINVITED2' }],
      })
    })
    const dispatched = getDispatchedActions()
    expect(dispatched.filter((a) => a.type === 'ADD_MEMBER')).toHaveLength(3)
    expect(dispatched.filter((a) => a.type === 'UPDATE_MEMBER_INFO')).toHaveLength(3)
  })

  it('rejects when addDocument throws', async () => {
    addDocumentMock.mockRejectedValueOnce(new Error('auth required'))
    const { result } = renderHook(() =>
      useCreateTeam({ driveId: 'vetra-builder-package', creatorAddress: '0xC' }),
    )
    await expect(result.current.createTeam(baseForm)).rejects.toThrow('auth required')
    expect(dispatchActionsMock).not.toHaveBeenCalled()
  })

  it('rejects when dispatchActions throws', async () => {
    addDocumentMock.mockResolvedValueOnce({ documentId: 'doc-1' })
    dispatchActionsMock.mockRejectedValueOnce(new Error('signing cancelled'))
    const { result } = renderHook(() =>
      useCreateTeam({ driveId: 'vetra-builder-package', creatorAddress: '0xC' }),
    )
    await expect(result.current.createTeam(baseForm)).rejects.toThrow('signing cancelled')
  })
})
