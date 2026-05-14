'use client'
import { useCallback } from 'react'
import { useCanSign } from '@/modules/cloud/hooks/use-can-sign'
import { generateId } from './builder-team-actions'
import { createNewBuilderTeamController } from './builder-team-controller'
import { fetchBuilderTeamBySlug } from './create-team-queries'

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

export function useCreateTeam() {
  const { signer } = useCanSign()

  const createTeam = useCallback(
    async (form: CreateTeamForm): Promise<{ documentId: string }> => {
      if (!signer) {
        throw new Error('You must be logged in with Renown to create a team')
      }
      const creatorAddress = signer.user?.address
      if (!creatorAddress) {
        throw new Error('Signer has no user address')
      }

      const controller = createNewBuilderTeamController({ signer })
      // Profile fields
      controller.setTeamName({ name: form.name })
      controller.setSlug({ slug: form.slug })
      if (form.description) controller.setDescription({ description: form.description })
      if (form.profileLogo) controller.setLogo({ logo: form.profileLogo })
      if (form.profileSocialsX || form.profileSocialsGithub || form.profileSocialsWebsite) {
        controller.setSocials({
          xProfile: form.profileSocialsX || undefined,
          github: form.profileSocialsGithub || undefined,
          website: form.profileSocialsWebsite || undefined,
        })
      }
      // Creator first, then invited members.
      const allAddresses = [creatorAddress, ...form.members.map((m) => m.address)]
      for (const ethAddress of allAddresses) {
        const id = generateId()
        controller.addMember({ id })
        controller.updateMemberInfo({ id, ethAddress })
      }

      const result = await controller.push()
      const documentId = result.remoteDocument.id
      await waitForSlug(form.slug, 5000)
      return { documentId }
    },
    [signer],
  )

  return { createTeam }
}
