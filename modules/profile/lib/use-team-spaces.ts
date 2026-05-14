'use client'
import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCanSign } from '@/modules/cloud/hooks/use-can-sign'
import {
  generateId,
  type UpdatePackageInfoInput,
  type UpdateSpaceInfoInput,
} from './builder-team-actions'
import {
  loadBuilderTeamController,
  type BuilderTeamControllerInstance,
} from './builder-team-controller'
import type { FullTeam } from './create-team-queries'

type RunFn = (apply: (c: BuilderTeamControllerInstance) => void) => Promise<void>

export function useTeamSpaces(team: FullTeam | null | undefined) {
  const qc = useQueryClient()
  const { signer } = useCanSign()
  const [isPending, setIsPending] = useState(false)

  const run: RunFn = useCallback(
    async (apply) => {
      if (!team) throw new Error('No team loaded')
      if (!signer) throw new Error('You must be logged in with Renown')
      setIsPending(true)
      try {
        const controller = await loadBuilderTeamController({ documentId: team.id, signer })
        apply(controller)
        await controller.push()
        await qc.invalidateQueries({ queryKey: ['team-by-slug'] })
      } finally {
        setIsPending(false)
      }
    },
    [team, signer, qc],
  )

  return {
    isPending,
    createSpace: useCallback(async () => {
      const id = generateId()
      await run((c) => {
        c.addSpace({ id })
        c.updateSpaceInfo({ id, title: 'Untitled space' })
      })
      return id
    }, [run]),
    updateSpace: useCallback(
      async (patch: UpdateSpaceInfoInput) => {
        await run((c) => c.updateSpaceInfo(patch))
      },
      [run],
    ),
    deleteSpace: useCallback(
      async (id: string) => {
        await run((c) => c.removeSpace({ id }))
      },
      [run],
    ),
    createPackage: useCallback(
      async (spaceId: string) => {
        const id = generateId()
        await run((c) => {
          c.addPackage({ id, spaceId })
          c.updatePackageInfo({ id, title: 'Untitled package' })
        })
        return id
      },
      [run],
    ),
    updatePackage: useCallback(
      async (patch: UpdatePackageInfoInput) => {
        await run((c) => c.updatePackageInfo(patch))
      },
      [run],
    ),
    deletePackage: useCallback(
      async (id: string) => {
        await run((c) => c.removePackage({ id }))
      },
      [run],
    ),
  }
}
