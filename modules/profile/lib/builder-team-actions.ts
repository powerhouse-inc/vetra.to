// Action constructors mirror vetra-builder-package's builder-team/v1 creators.
// Inlined here because vetra.to doesn't depend on the package as a node module
// (it only queries the deployed switchboard's GraphQL schema). Each action
// matches the wire shape the reactor's reducers accept.

export type Action<TInput = Record<string, unknown>> = {
  type: string
  input: TInput
  scope: 'global'
}

function action<TInput>(type: string, input: TInput): Action<TInput> {
  return { type, input, scope: 'global' }
}

// Profile
export const setTeamName = (input: { name: string }) => action('SET_TEAM_NAME', input)
export const setSlug = (input: { slug: string }) => action('SET_SLUG', input)
export const setDescription = (input: { description: string }) => action('SET_DESCRIPTION', input)
export const setLogo = (input: { logo: string }) => action('SET_LOGO', input)

export type SocialsInput = {
  xProfile?: string
  github?: string
  website?: string
}
export const setSocials = (input: SocialsInput) => action('SET_SOCIALS', input)

// Members
export const addMember = (input: { id: string }) => action('ADD_MEMBER', input)
export type UpdateMemberInfoInput = {
  id: string
  ethAddress?: string
  name?: string
  phid?: string
  profileImage?: string
}
export const updateMemberInfo = (input: UpdateMemberInfoInput) =>
  action('UPDATE_MEMBER_INFO', input)
export const removeMember = (input: { id: string }) => action('REMOVE_MEMBER', input)

// Spaces
export const addSpace = (input: { id: string }) => action('ADD_SPACE', input)
export type UpdateSpaceInfoInput = {
  id: string
  title?: string
  description?: string
}
export const updateSpaceInfo = (input: UpdateSpaceInfoInput) => action('UPDATE_SPACE_INFO', input)
export const removeSpace = (input: { id: string }) => action('REMOVE_SPACE', input)

// Packages
export const addPackage = (input: { id: string; spaceId: string }) => action('ADD_PACKAGE', input)
export type UpdatePackageInfoInput = {
  id: string
  spaceId?: string
  title?: string
  description?: string
  github?: string
  npm?: string
  vetraDriveUrl?: string
  phid?: string
}
export const updatePackageInfo = (input: UpdatePackageInfoInput) =>
  action('UPDATE_PACKAGE_INFO', input)
export const removePackage = (input: { id: string }) => action('REMOVE_PACKAGE', input)

export function generateId(): string {
  return crypto.randomUUID()
}
