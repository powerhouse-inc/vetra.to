import { describe, expect, it } from 'vitest'
import { computeProfileDiff } from '@/modules/profile/lib/use-update-team-profile'
import type { FullTeam } from '@/modules/profile/lib/create-team-queries'

const team = (over: Partial<FullTeam> = {}): FullTeam => ({
  id: 't',
  sourceDriveId: 'powerhouse',
  profileName: 'Acme',
  profileSlug: 'acme',
  profileLogo: null,
  profileDescription: null,
  profileSocialsX: null,
  profileSocialsGithub: null,
  profileSocialsWebsite: null,
  createdAt: '',
  updatedAt: '',
  members: [],
  spaces: [],
  ...over,
})

const baseForm = {
  name: 'Acme',
  slug: 'acme',
  description: '',
  logo: '',
  socialsX: '',
  socialsGithub: '',
  socialsWebsite: '',
}

describe('computeProfileDiff', () => {
  it('returns empty array when nothing changed', () => {
    expect(computeProfileDiff(baseForm, team())).toEqual([])
  })

  it('dispatches SET_TEAM_NAME when name changes', () => {
    const actions = computeProfileDiff({ ...baseForm, name: 'Beta' }, team())
    expect(actions).toHaveLength(1)
    expect(actions[0].type).toBe('SET_TEAM_NAME')
  })

  it('dispatches SET_SLUG when slug changes', () => {
    const actions = computeProfileDiff({ ...baseForm, slug: 'beta' }, team())
    expect(actions[0].type).toBe('SET_SLUG')
  })

  it('dispatches SET_DESCRIPTION when description changes', () => {
    const actions = computeProfileDiff({ ...baseForm, description: 'hi' }, team())
    expect(actions[0].type).toBe('SET_DESCRIPTION')
  })

  it('dispatches one SET_SOCIALS for any social change', () => {
    const actions = computeProfileDiff({ ...baseForm, socialsX: 'https://x.com/acme' }, team())
    expect(actions[0].type).toBe('SET_SOCIALS')
    expect(actions[0].input).toMatchObject({ xProfile: 'https://x.com/acme' })
  })

  it('combines multiple changes in one batch', () => {
    const actions = computeProfileDiff(
      { ...baseForm, name: 'Beta', description: 'desc', logo: 'https://x/a.png' },
      team(),
    )
    expect(actions.map((a) => a.type)).toEqual(['SET_TEAM_NAME', 'SET_DESCRIPTION', 'SET_LOGO'])
  })

  it('treats null and empty string as equal for optionals', () => {
    expect(computeProfileDiff(baseForm, team({ profileDescription: null }))).toEqual([])
    expect(computeProfileDiff(baseForm, team({ profileDescription: '' }))).toEqual([])
  })
})
