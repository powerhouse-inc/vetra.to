import { useCallback } from 'react'
import { addDocument, dispatchActions } from '@powerhousedao/reactor-browser'
import {
  addMember,
  addPackage as _unused,
  generateId,
  setDescription,
  setLogo,
  setSlug,
  setSocials,
  setTeamName,
  updateMemberInfo,
} from './builder-team-actions'
import { fetchBuilderTeamBySlug } from './create-team-queries'

// Silence the unused-import warning for re-exports we want to keep grouped.
void _unused

export type CreateTeamForm = {
  name: string
  slug: string
  description: string
  profileLogo: string
  profileSocialsX: string
  profileSocialsGithub: string
  profileSocialsWebsite: string
  members: { address: string }[]
}

export type UseCreateTeamArgs = {
  driveId: string
  creatorAddress: string
}

async function waitForSlug(slug: string, timeoutMs: number): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const team = await fetchBuilderTeamBySlug(slug)
      if (team) return
    } catch {
      // ignore transient errors and keep polling
    }
    await new Promise((r) => setTimeout(r, 500))
  }
}

export function useCreateTeam({ driveId, creatorAddress }: UseCreateTeamArgs) {
  const createTeam = useCallback(
    async (form: CreateTeamForm): Promise<{ documentId: string }> => {
      const minted = await addDocument(driveId, form.name, 'powerhouse/builder-team')
      const documentId = (minted as { id: string }).id

      const actions: unknown[] = []
      actions.push(setTeamName({ name: form.name }))
      actions.push(setSlug({ slug: form.slug }))
      if (form.description) actions.push(setDescription({ description: form.description }))
      if (form.profileLogo) actions.push(setLogo({ logo: form.profileLogo }))
      if (form.profileSocialsX || form.profileSocialsGithub || form.profileSocialsWebsite) {
        actions.push(
          setSocials({
            xProfile: form.profileSocialsX || undefined,
            github: form.profileSocialsGithub || undefined,
            website: form.profileSocialsWebsite || undefined,
          }),
        )
      }

      const allAddresses = [creatorAddress, ...form.members.map((m) => m.address)]
      for (const ethAddress of allAddresses) {
        const id = generateId()
        actions.push(addMember({ id }))
        actions.push(updateMemberInfo({ id, ethAddress }))
      }

      await dispatchActions(actions as never, documentId)
      await waitForSlug(form.slug, 5000)
      return { documentId }
    },
    [driveId, creatorAddress],
  )

  return { createTeam }
}
