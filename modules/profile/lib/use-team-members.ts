import { useCallback, useState } from 'react'
import { dispatchActions } from '@powerhousedao/reactor-browser'
import { useQueryClient } from '@tanstack/react-query'
import { addMember, generateId, removeMember, updateMemberInfo } from './builder-team-actions'
import type { FullTeam } from './create-team-queries'

export function useTeamMembers(team: FullTeam | null | undefined) {
  const qc = useQueryClient()
  const [isPending, setIsPending] = useState(false)

  const inviteMember = useCallback(
    async (ethAddress: string) => {
      if (!team) throw new Error('No team loaded')
      const id = generateId()
      setIsPending(true)
      try {
        await dispatchActions(
          [addMember({ id }), updateMemberInfo({ id, ethAddress })] as never,
          team.id,
        )
        await qc.invalidateQueries({ queryKey: ['team-by-slug'] })
      } finally {
        setIsPending(false)
      }
    },
    [team, qc],
  )

  const removeMemberById = useCallback(
    async (memberId: string) => {
      if (!team) throw new Error('No team loaded')
      setIsPending(true)
      try {
        await dispatchActions([removeMember({ id: memberId })] as never, team.id)
        await qc.invalidateQueries({ queryKey: ['team-by-slug'] })
      } finally {
        setIsPending(false)
      }
    },
    [team, qc],
  )

  return { inviteMember, removeMember: removeMemberById, isPending }
}
