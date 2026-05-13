import { useCallback } from 'react'
import { addDocument, dispatchActions } from '@powerhousedao/reactor-browser'
import { fetchBuilderTeamBySlug } from './create-team-queries'

// Action constructors mirror vetra-builder-package's builder-team/v1 creators.
// Inlined here because vetra.to doesn't depend on the package as a node module
// (it only queries the deployed switchboard's GraphQL schema). Each action
// matches the wire shape the reactor's reducers accept.
function action<TInput>(type: string, input: TInput) {
  return { type, input, scope: 'global' as const }
}
const setTeamName = (input: { name: string }) => action('SET_TEAM_NAME', input)
const setSlug = (input: { slug: string }) => action('SET_SLUG', input)
const setDescription = (input: { description: string }) => action('SET_DESCRIPTION', input)
const setLogo = (input: { logo: string }) => action('SET_LOGO', input)
const setSocials = (input: { xProfile?: string; github?: string; website?: string }) =>
  action('SET_SOCIALS', input)
const addMember = (input: { id: string }) => action('ADD_MEMBER', input)
const updateMemberInfo = (input: { id: string; ethAddress: string }) =>
  action('UPDATE_MEMBER_INFO', input)

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

function generateId(): string {
  return crypto.randomUUID()
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
      const documentId = (minted as { documentId: string }).documentId

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
