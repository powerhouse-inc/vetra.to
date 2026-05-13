import { useCallback, useState } from 'react'
import { dispatchActions } from '@powerhousedao/reactor-browser'
import { useQueryClient } from '@tanstack/react-query'
import {
  type Action,
  setDescription,
  setLogo,
  setSlug,
  setSocials,
  setTeamName,
} from './builder-team-actions'
import type { FullTeam } from './create-team-queries'

export type TeamProfileForm = {
  name: string
  slug: string
  description: string
  logo: string
  socialsX: string
  socialsGithub: string
  socialsWebsite: string
}

export function formFromTeam(team: FullTeam): TeamProfileForm {
  return {
    name: team.profileName,
    slug: team.profileSlug,
    description: team.profileDescription ?? '',
    logo: team.profileLogo ?? '',
    socialsX: team.profileSocialsX ?? '',
    socialsGithub: team.profileSocialsGithub ?? '',
    socialsWebsite: team.profileSocialsWebsite ?? '',
  }
}

export function computeProfileDiff(form: TeamProfileForm, team: FullTeam): Action[] {
  const actions: Action[] = []
  if (form.name !== team.profileName) actions.push(setTeamName({ name: form.name }))
  if (form.slug !== team.profileSlug) actions.push(setSlug({ slug: form.slug }))
  if (form.description !== (team.profileDescription ?? '')) {
    actions.push(setDescription({ description: form.description }))
  }
  if (form.logo !== (team.profileLogo ?? '')) {
    actions.push(setLogo({ logo: form.logo }))
  }
  const xChanged = form.socialsX !== (team.profileSocialsX ?? '')
  const ghChanged = form.socialsGithub !== (team.profileSocialsGithub ?? '')
  const webChanged = form.socialsWebsite !== (team.profileSocialsWebsite ?? '')
  if (xChanged || ghChanged || webChanged) {
    actions.push(
      setSocials({
        xProfile: form.socialsX || undefined,
        github: form.socialsGithub || undefined,
        website: form.socialsWebsite || undefined,
      }),
    )
  }
  return actions
}

export function useUpdateTeamProfile(team: FullTeam | null | undefined) {
  const qc = useQueryClient()
  const [isSaving, setIsSaving] = useState(false)

  const saveProfile = useCallback(
    async (form: TeamProfileForm): Promise<{ changed: number }> => {
      if (!team) throw new Error('No team loaded')
      const actions = computeProfileDiff(form, team)
      if (actions.length === 0) return { changed: 0 }
      setIsSaving(true)
      try {
        await dispatchActions(actions as never, team.id)
        await qc.invalidateQueries({ queryKey: ['team-by-slug'] })
        return { changed: actions.length }
      } finally {
        setIsSaving(false)
      }
    },
    [team, qc],
  )

  return { saveProfile, isSaving }
}
