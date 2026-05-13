import { useCallback, useState } from 'react'
import { dispatchActions } from '@powerhousedao/reactor-browser'
import { useQueryClient } from '@tanstack/react-query'
import {
  addPackage,
  addSpace,
  generateId,
  removePackage,
  removeSpace,
  updatePackageInfo,
  updateSpaceInfo,
  type UpdatePackageInfoInput,
  type UpdateSpaceInfoInput,
} from './builder-team-actions'
import type { FullTeam } from './create-team-queries'

export function useTeamSpaces(team: FullTeam | null | undefined) {
  const qc = useQueryClient()
  const [isPending, setIsPending] = useState(false)

  const run = useCallback(
    async (actions: unknown[]) => {
      if (!team) throw new Error('No team loaded')
      setIsPending(true)
      try {
        await dispatchActions(actions as never, team.id)
        await qc.invalidateQueries({ queryKey: ['team-by-slug'] })
      } finally {
        setIsPending(false)
      }
    },
    [team, qc],
  )

  return {
    isPending,
    createSpace: useCallback(async () => {
      const id = generateId()
      await run([addSpace({ id }), updateSpaceInfo({ id, title: 'Untitled space' })])
      return id
    }, [run]),
    updateSpace: useCallback(
      async (patch: UpdateSpaceInfoInput) => {
        await run([updateSpaceInfo(patch)])
      },
      [run],
    ),
    deleteSpace: useCallback(
      async (id: string) => {
        await run([removeSpace({ id })])
      },
      [run],
    ),
    createPackage: useCallback(
      async (spaceId: string) => {
        const id = generateId()
        await run([
          addPackage({ id, spaceId }),
          updatePackageInfo({ id, title: 'Untitled package' }),
        ])
        return id
      },
      [run],
    ),
    updatePackage: useCallback(
      async (patch: UpdatePackageInfoInput) => {
        await run([updatePackageInfo(patch)])
      },
      [run],
    ),
    deletePackage: useCallback(
      async (id: string) => {
        await run([removePackage({ id })])
      },
      [run],
    ),
  }
}
