# Team Management Surface (Slices B+C+D) — Design

**Date:** 2026-05-13
**Author:** @froid1911
**Status:** Draft
**Slice of:** Builder teams + packages profile integration

## Roadmap context

Bundles **Slices B, C, and D** from the broader roadmap. They share the same underlying document (`BuilderTeam`) and the same dispatch pattern, so a single management surface is cheaper than three separate ones.

| Slice | Scope                                                             |
| ----- | ----------------------------------------------------------------- |
| B     | Edit team profile in-app (name, slug, description, logo, socials) |
| C     | Member add/remove                                                 |
| D     | Spaces & packages curation (CRUD without reorder)                 |

Depends on Slices A (`/profile` shell) and E (create-team wizard, which contributed reusable action constructors).

## Goal

Add `/profile/teams/[slug]`, a team-management surface for authenticated members. Three tabs (Profile, Members, Spaces & Packages) operate on a single fetched `BuilderTeam` document. Each tab dispatches Renown-signed action batches to mutate the document.

## Non-Goals

- Public read view (already at `/builders/[slug]`).
- Drag-and-drop reorder for spaces/packages (actions exist; defer the UX).
- File uploads for logos (URL-only, same as create-team).
- Role-based member permissions (all members can edit; admin role is informational only).
- Audit log / undo.
- Multi-drive support.

## Auth model

- Page requires `auth.status === 'authorized'`.
- After the team loads, page checks `team.members.some(m => m.ethAddress.toLowerCase() === auth.address.toLowerCase())`. If false → toast `"Only members can manage this team"` + `router.replace('/builders/[slug]')`.
- Loading + slow membership check show a skeleton, not the redirect.

## Architecture

vetra.to-only. Reuses the existing `fetchBuilderTeamBySlug` GraphQL + the create-team action constructors (extracted to a shared module).

```
app/profile/teams/[slug]/
  page.tsx                       — auth gate, team fetch, membership gate, tab routing
  components/
    team-tabs.tsx                — 3-tab shell
    profile-section.tsx          — slice B form
    members-section.tsx          — slice C list + invite
    spaces-section.tsx           — slice D top-level (Add space + list)
    space-card.tsx               — single space (title/description edit, packages list)
    package-row.tsx              — single package (inline editable row)
    member-row.tsx               — single member (avatar, ENS, address, remove)
    confirm-dialog.tsx           — generic confirm wrapper (uses AlertDialog primitive)

modules/profile/lib/
  builder-team-actions.ts        — shared action constructors (extracted from use-create-team)
  use-team-by-slug.ts            — fetch hook (React Query around fetchBuilderTeamBySlug)
  use-update-team-profile.ts     — dispatch profile diff
  use-team-members.ts            — dispatch member adds/removes
  use-team-spaces.ts             — dispatch space + package CRUD
```

## Data flow

1. `/profile/teams/[slug]` loads. `useTeamBySlug(slug)` fetches via existing GraphQL.
2. Membership check against `auth.address`. Non-member → redirect.
3. Tab from URL param `?tab=profile|members|spaces`, default `profile`.
4. Each section mutates by calling a section-specific dispatch hook → action batch → `dispatchActions(documentId, actions)`.
5. After each successful dispatch, the section invalidates the React-Query cache for `useTeamBySlug` → refetch → re-render.
6. Optimistic UI for inline edits where it doesn't risk inconsistency (e.g., field rename); pessimistic for destructive (remove member, delete space).

## Slice B — Profile section

Single form rendered as field rows. Initial state: load from team. Local state tracks edits. **Diff-and-dispatch** strategy:

```ts
// Compose actions for only the fields that changed
const actions: Action[] = []
if (form.name !== team.profileName) actions.push(setTeamName({ name: form.name }))
if (form.slug !== team.profileSlug) actions.push(setSlug({ slug: form.slug }))
if (form.description !== (team.profileDescription ?? '')) {
  actions.push(setDescription({ description: form.description }))
}
if (form.logo !== (team.profileLogo ?? '')) {
  actions.push(setLogo({ logo: form.logo }))
}
const socialsDiff = computeSocialsDiff(form, team)
if (socialsDiff) actions.push(setSocials(socialsDiff))
// One Renown signing event for the whole diff.
await dispatchActions(team.id, actions)
```

If `actions.length === 0`, show "No changes to save" inline (don't dispatch).

Slug edits run the same `useSlugAvailability` hook, but: skip the check when the slug is unchanged (the existing value would resolve to the team itself). Pass `excludeId={team.id}` (extend the hook to support this).

UI sections within the page:

- Avatar + name row at top (large)
- "URL slug" with the `vetra.to/builders/` prefix chip
- Description (textarea, 280 chars, counter)
- Logo URL (with live preview)
- Socials (three URL fields)
- "Save changes" button right-aligned at bottom; disabled when no diff.

## Slice C — Members section

Renders `team.members` as a list of `<MemberRow>` cards. Each row shows:

- Avatar (initials from name/address)
- Display name (from `member.name` if set; ENS otherwise; falls back to truncated address)
- Address (mono, truncated `0x1234…5678`)
- `Remove` button (icon + label)

The current user's row is annotated `"You"`. Self-removal allowed but a confirm dialog warns "If you remove yourself you'll lose access to this management page." For the last remaining member, removal is disabled with helper text "Can't remove the last member."

Below the list, an `<InviteRow>` with:

- Eth-address input
- Live ENS reverse lookup (same hook as create-team)
- "Invite" button (disabled when address invalid or duplicate)

Add flow: `addMember({id}) + updateMemberInfo({id, ethAddress})` — two actions, one signing.
Remove flow: `removeMember({id})` — one action, one signing.

## Slice D — Spaces & Packages section

Top of section: page-style explainer ("Group your packages into spaces that appear on your public team page.") + "Add space" button.

Below: vertically-stacked `<SpaceCard>` components, one per space in `team.spaces`.

**`<SpaceCard>`** renders:

- Header: editable title (single-line input, save on blur) + delete button.
- Editable description (textarea, save on blur).
- List of `<PackageRow>` for each `space.packages`.
- "Add package" button at the bottom of the card.

**`<PackageRow>`** renders inline-editable fields:

- Title (required)
- Description (optional)
- GitHub URL (optional)
- npm URL (optional)
- Delete button

All edits save on blur via `updatePackageInfo({id, ...changedFields})`. Visual state: brief "Saved" chip after a successful save.

Add flows:

- New space: `addSpace({id})` + immediately open the title input focused.
- New package: `addPackage({id, spaceId})` + open title input focused.

Delete flows: confirm dialog, then `removeSpace({id})` or `removePackage({id})`.

No reordering UX in this slice (the actions exist; can be added when needed).

## Hooks

### `useTeamBySlug(slug)`

React Query around `fetchBuilderTeamBySlug` (extend to return full document data including spaces & packages). Returns `{ data, isLoading, isError, refetch }`. Stale time 10s. Refetched on each successful mutation.

### `useUpdateTeamProfile(team)`

Returns `{ saveProfile, isSaving }`. `saveProfile(form)` computes the diff vs `team` and dispatches the batched actions. Throws on signing cancel.

### `useTeamMembers(team)`

Returns `{ inviteMember, removeMember, isPending }`. Each dispatches its own signing event.

### `useTeamSpaces(team)`

Returns `{ addSpace, updateSpace, removeSpace, addPackage, updatePackage, removePackage, isPending }`. Each is its own signing event.

## Shared action module — `modules/profile/lib/builder-team-actions.ts`

Extracted from `use-create-team`'s inline constructors. Single source of truth for action shapes:

```ts
export const setTeamName = (input: { name: string }) => action('SET_TEAM_NAME', input)
export const setSlug = (input: { slug: string }) => action('SET_SLUG', input)
export const setDescription = (input: { description: string }) => action('SET_DESCRIPTION', input)
export const setLogo = (input: { logo: string }) => action('SET_LOGO', input)
export const setSocials = (input: SocialsInput) => action('SET_SOCIALS', input)
export const addMember = (input: { id: string }) => action('ADD_MEMBER', input)
export const updateMemberInfo = (input: UpdateMemberInfoInput) =>
  action('UPDATE_MEMBER_INFO', input)
export const removeMember = (input: { id: string }) => action('REMOVE_MEMBER', input)
export const addSpace = (input: { id: string }) => action('ADD_SPACE', input)
export const updateSpaceInfo = (input: UpdateSpaceInfoInput) => action('UPDATE_SPACE_INFO', input)
export const removeSpace = (input: { id: string }) => action('REMOVE_SPACE', input)
export const addPackage = (input: { id: string; spaceId: string }) => action('ADD_PACKAGE', input)
export const updatePackageInfo = (input: UpdatePackageInfoInput) =>
  action('UPDATE_PACKAGE_INFO', input)
export const removePackage = (input: { id: string }) => action('REMOVE_PACKAGE', input)
```

`use-create-team.ts` is updated to import from here. Internal types match the published `vetra-builder-package` document model.

## Wiring into existing surfaces

- `TeamProfileCard` on `/profile?tab=teams`: change `Manage` button's `href` from the external Connect URL to `/profile/teams/[slug]`.
- New management page top-right gets an "Open public page" link → `/builders/[slug]`.

## Error handling

| Failure                            | Behavior                                                             |
| ---------------------------------- | -------------------------------------------------------------------- |
| Team not found                     | Page renders `<NotFoundCard>` with link back to `/profile?tab=teams` |
| User isn't a member                | Toast + redirect to `/builders/[slug]`                               |
| Renown signing cancelled           | Toast "Cancelled — no changes were saved"; form state retained       |
| Dispatch network error             | Toast "Couldn't save — try again"; form retains edits                |
| Optimistic update + dispatch fails | Roll back the local state, show toast                                |

## Testing

### vitest (`modules/profile/__tests__/`)

- `use-update-team-profile.test.tsx` — happy path; computes correct diff; no-op when nothing changed.
- `use-team-members.test.tsx` — invite + remove dispatch shape.
- `use-team-spaces.test.tsx` — space + package CRUD dispatch shape.
- `builder-team-actions.test.ts` — actions produce the right `{type, input, scope}` envelopes.

### Manual walkthrough on staging post-deploy

- As a team member: load `/profile/teams/[slug]`, switch tabs, edit profile, invite + remove member, add space, add package within space, delete a package.
- As a non-member of a team: visit `/profile/teams/[other-slug]` → verify redirect to `/builders/[other-slug]`.

## Out of scope / future

- Reorder spaces & packages (drag-drop with `reorderSpaces`/`reorderPackages` actions).
- Per-member role/admin distinction.
- Package import from npm (vs manual entry).
- Image upload for logo (shared component for many surfaces).
- Activity / audit log.
