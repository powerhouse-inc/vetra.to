'use client'
import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCanSign } from '@/modules/cloud/hooks/use-can-sign'
import { loadBuilderTeamController } from './builder-team-controller'
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

/**
 * Returns a list of action descriptions for the diff between `form` and
 * `team`. Strings only (action type names); used in tests + UI status.
 * The actual dispatch happens via the controller in `useUpdateTeamProfile`.
 */
export function computeProfileDiff(
  form: TeamProfileForm,
  team: FullTeam,
): { type: string; input: Record<string, unknown> }[] {
  const out: { type: string; input: Record<string, unknown> }[] = []
  if (form.name !== team.profileName)
    out.push({ type: 'SET_TEAM_NAME', input: { name: form.name } })
  if (form.slug !== team.profileSlug) out.push({ type: 'SET_SLUG', input: { slug: form.slug } })
  if (form.description !== (team.profileDescription ?? '')) {
    out.push({ type: 'SET_DESCRIPTION', input: { description: form.description } })
  }
  if (form.logo !== (team.profileLogo ?? '')) {
    out.push({ type: 'SET_LOGO', input: { logo: form.logo } })
  }
  const xChanged = form.socialsX !== (team.profileSocialsX ?? '')
  const ghChanged = form.socialsGithub !== (team.profileSocialsGithub ?? '')
  const webChanged = form.socialsWebsite !== (team.profileSocialsWebsite ?? '')
  if (xChanged || ghChanged || webChanged) {
    out.push({
      type: 'SET_SOCIALS',
      input: {
        xProfile: form.socialsX || undefined,
        github: form.socialsGithub || undefined,
        website: form.socialsWebsite || undefined,
      },
    })
  }
  return out
}

export function useUpdateTeamProfile(team: FullTeam | null | undefined) {
  const qc = useQueryClient()
  const { signer } = useCanSign()
  const [isSaving, setIsSaving] = useState(false)

  const saveProfile = useCallback(
    async (form: TeamProfileForm): Promise<{ changed: number }> => {
      if (!team) throw new Error('No team loaded')
      if (!signer) throw new Error('You must be logged in with Renown')
      const diff = computeProfileDiff(form, team)
      if (diff.length === 0) return { changed: 0 }

      setIsSaving(true)
      try {
        const controller = await loadBuilderTeamController({
          documentId: team.id,
          parentIdentifier: team.sourceDriveId,
          signer,
        })
        if (form.name !== team.profileName) controller.setTeamName({ name: form.name })
        if (form.slug !== team.profileSlug) controller.setSlug({ slug: form.slug })
        if (form.description !== (team.profileDescription ?? '')) {
          controller.setDescription({ description: form.description })
        }
        if (form.logo !== (team.profileLogo ?? '')) {
          controller.setLogo({ logo: form.logo })
        }
        const xChanged = form.socialsX !== (team.profileSocialsX ?? '')
        const ghChanged = form.socialsGithub !== (team.profileSocialsGithub ?? '')
        const webChanged = form.socialsWebsite !== (team.profileSocialsWebsite ?? '')
        if (xChanged || ghChanged || webChanged) {
          controller.setSocials({
            xProfile: form.socialsX || undefined,
            github: form.socialsGithub || undefined,
            website: form.socialsWebsite || undefined,
          })
        }
        await controller.push()
        await qc.invalidateQueries({ queryKey: ['team-by-slug'] })
        return { changed: diff.length }
      } finally {
        setIsSaving(false)
      }
    },
    [team, signer, qc],
  )

  return { saveProfile, isSaving }
}
