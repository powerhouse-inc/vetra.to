# Profile Shell + Dashboards (Slice A) — Design

**Date:** 2026-05-13
**Author:** @froid1911
**Status:** Draft
**Slice of:** Builder teams + packages profile integration (full roadmap below)

## Roadmap Context

The broader effort is "full in-app builder-teams + packages workspace" inside vetra.to. That's seven sub-projects:

| #     | Sub-project                                                               | Depends on                                                          |
| ----- | ------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **A** | Profile-menu shell + "My Teams" / "My Packages" dashboards (this spec)    | —                                                                   |
| **B** | Team workspace: in-app edit of profile (name, logo, description, socials) | A                                                                   |
| **C** | Team member management (add/remove member by address)                     | B                                                                   |
| **D** | Team spaces & packages curation                                           | B                                                                   |
| **E** | Create-new-team wizard                                                    | A                                                                   |
| **F** | Join-team flow (invite link, accept)                                      | C                                                                   |
| **G** | "My Packages" manage (edit metadata, unpublish, transfer)                 | A + [#2576](https://github.com/powerhouse-inc/powerhouse/pull/2576) |

This spec covers only **A**. B–G get their own specs once A ships.

## Goal

Add a `/profile` page to vetra.to with tabs `Teams | Packages | Settings`, surfaced via two new entries in the existing Renown dropdown ("My profile", "My packages"). The Teams tab lists builder teams where the authenticated user's eth address is a member; the Packages tab is a placeholder until [#2576](https://github.com/powerhouse-inc/powerhouse/pull/2576) lands. This unblocks all six follow-up slices by giving them a shell to slot into.

## Non-Goals (slice A)

- Creating new builder teams (slice E).
- Editing team profile, members, spaces, or packages in vetra.to (slices B/C/D).
- Joining a team via link (slice F).
- Real "My Packages" data — depends on #2576 (slice G).
- Multi-wallet identity reconciliation. Renown gives us one address per session; we use that verbatim.

## Architecture

Two repos, one PR each. Both ship together via dev release + version pin bump.

```
vetra-builder-package (subgraph)         vetra.to (frontend)
─────────────────────────                ────────────────────
subgraphs/vetra-builders/                app/profile/
  schema.ts                                page.tsx
    + fetchBuilderTeamsByMember            components/
                                             profile-tabs.tsx
  resolvers.ts                               teams-tab.tsx
    + fetchBuilderTeamsByMember              packages-tab.tsx
                                             settings-tab.tsx
  __tests__/                                 team-profile-card.tsx
    fetchBuilderTeamsByMember.test.ts        login-prompt.tsx
                                             tab-error-state.tsx

                                         modules/profile/
                                           lib/
                                             use-my-teams.ts
                                           __tests__/
                                             use-my-teams.test.tsx

                                         modules/shared/components/
                                           navbar/components/
                                             navbar-right-side.tsx
                                               ← extend dropdown
```

### Data flow

1. User clicks profile avatar → dropdown opens with new entries.
2. Click "My profile" → router pushes `/profile?tab=teams`.
3. `/profile` page reads `auth.status` and `auth.address` from `useRenownAuth()`.
4. If unauthorized: render `<LoginPrompt>` card (no redirect).
5. If authorized: render `<ProfileTabs>` reading `?tab=` URL param, defaulting to `teams`.
6. Teams tab calls `useMyTeams(auth.address)` → React Query → GraphQL `fetchBuilderTeamsByMember(ethAddress)`.
7. Subgraph resolver joins `builder_team` × `builder_team_member` on lowercase eth address.
8. Returns array of `BuilderTeamType` rows. Component renders `<TeamProfileCard>` grid.

## Backend changes — vetra-builder-package

### Schema addition (`subgraphs/vetra-builders/schema.ts`)

```graphql
type Query {
  fetchAllBuilderTeams(driveId: String, search: String, sortOrder: String): [BuilderTeamType!]!
  fetchBuilderTeam(driveId: String, id: String, slug: String): BuilderTeamType
  fetchBuilderTeamsByMember(ethAddress: String!): [BuilderTeamType!]!
}
```

### Resolver (`subgraphs/vetra-builders/resolvers.ts`)

```ts
fetchBuilderTeamsByMember: async (_parent, args, ctx) => {
  const address = args.ethAddress.toLowerCase()
  const rows = await ctx.db
    .selectFrom('builder_team as bt')
    .innerJoin('builder_team_member as m', 'm.builder_team_id', 'bt.id')
    .where(sql<boolean>`LOWER(m.eth_address) = ${address}`)
    .selectAll('bt')
    .distinct()
    .execute()
  return Promise.all(rows.map((r) => hydrateBuilderTeam(r, ctx)))
}
```

Reuses the existing `hydrateBuilderTeam` helper that powers `fetchBuilderTeam` (loads spaces, packages, members). `DISTINCT` is belt-and-suspenders — a member should appear once per team, but the join could duplicate if there's ever per-role rows.

### Tests

- Seed three teams: A with member `0xA1B2…`, B with members `0xA1B2…` and `0xC3D4…`, C with only `0xC3D4…`.
- `fetchBuilderTeamsByMember('0xa1b2…')` (note lowercase input) returns A and B.
- `fetchBuilderTeamsByMember('0xA1B2…')` (uppercase input) returns A and B.
- `fetchBuilderTeamsByMember('0xdeadbeef…')` returns `[]`.
- No-args / empty-string returns GraphQL validation error.

### Release

- Bump `vetra-builder-package` version: current dev tag + 1.
- `ph build && ph publish --registry https://registry.dev.vetra.io`.
- Capture published version for the vetra.to dep bump.

## Frontend changes — vetra.to

### Navbar dropdown (`modules/shared/components/navbar/components/navbar-right-side.tsx`)

Replace the current authorized dropdown:

```tsx
// before: [Profile (external)] [Log out]
// after:
<DropdownMenuContent>
  <DropdownMenuLabel>
    <div>{auth.displayName ?? 'Account'}</div>
    <div className="text-muted-foreground text-xs">{shortenAddress(auth.displayAddress)}</div>
  </DropdownMenuLabel>
  <DropdownMenuSeparator />
  <DropdownMenuItem asChild>
    <Link href="/profile?tab=teams">
      <Home /> My profile
    </Link>
  </DropdownMenuItem>
  <DropdownMenuItem asChild>
    <Link href="/profile?tab=packages">
      <Package /> My packages
    </Link>
  </DropdownMenuItem>
  <DropdownMenuSeparator />
  <DropdownMenuItem onClick={auth.openProfile}>
    <IdCard /> Renown account <ExternalLink className="ml-auto h-3 w-3" />
  </DropdownMenuItem>
  <DropdownMenuSeparator />
  <DropdownMenuItem onClick={() => auth.logout()} className="text-destructive">
    <LogOut /> Log out
  </DropdownMenuItem>
</DropdownMenuContent>
```

Mobile branch (`md:hidden`) gets the same items plus the existing theme toggle.

### `/profile` route (`app/profile/page.tsx`)

```tsx
'use client'
import { useRenownAuth } from '@powerhousedao/reactor-browser'
import { useSearchParams } from 'next/navigation'
import { ProfileTabs } from './components/profile-tabs'
import { LoginPrompt } from './components/login-prompt'

export default function ProfilePage() {
  const auth = useRenownAuth()
  const params = useSearchParams()
  const tab = params.get('tab') ?? 'teams'

  if (auth.status === 'loading' || auth.status === 'checking') {
    return <ProfileSkeleton />
  }
  if (auth.status !== 'authorized') {
    return <LoginPrompt onLogin={auth.login} />
  }
  return <ProfileTabs activeTab={tab} address={auth.address} />
}
```

(metadata can be exported from a sibling server component if SEO matters; for slice A keep as `'use client'` since content is per-user.)

### `<ProfileTabs>` (`app/profile/components/profile-tabs.tsx`)

Radix-style tabs with `tab` URL param as source of truth. Three tab triggers, three panels. Tab change calls `router.replace('/profile?tab=...')` to keep URL in sync without page navigation.

### `<TeamsTab>` (`app/profile/components/teams-tab.tsx`)

```tsx
function TeamsTab({ address }: { address: string }) {
  const { data, isLoading, error, refetch } = useMyTeams(address)
  if (isLoading) return <TeamCardSkeleton count={3} />
  if (error) return <TabErrorState onRetry={refetch} message="Couldn't load your teams" />
  if (data.length === 0) return <NoTeamsEmptyState />
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {data.map((t) => (
        <TeamProfileCard key={t.id} team={t} />
      ))}
    </div>
  )
}
```

### `<TeamProfileCard>`

Logo • name • member count • package count • two buttons:

- **Open** → `/builders/[slug]` (public read view)
- **Manage ↗** → external link to Connect drive URL (placeholder until B–D)

Reuses styling from `modules/builders/components/list-card/list-card.tsx`.

### `<PackagesTab>`

Always renders the empty state (slice G ships content later):

> Your published packages will appear here once registry auth lands ([#2576](https://github.com/powerhouse-inc/powerhouse/pull/2576)).
>
> [Publish a package] ← opens existing `CreatePackageModal`

### `<SettingsTab>`

Read-only card showing what `useRenownAuth()` exposes: `displayName`, `displayAddress`, `ensName` (if set), `avatarUrl` (if set), `profileId`. One "Edit on Renown ↗" button calling `auth.openProfile()`.

### `useMyTeams` hook (`modules/profile/lib/use-my-teams.ts`)

React Query wrapper around the GraphQL `fetchBuilderTeamsByMember` query. Key: `['my-teams', address]`. Stale time 30s. Disabled when address is empty/null.

### Generated GraphQL types

Run `npm run codegen` after subgraph upgrade to regenerate `modules/__generated__/graphql/gql-generated.ts`.

## Testing

### vetra-builder-package

- `fetchBuilderTeamsByMember.test.ts` — five cases listed above.

### vetra.to

- `use-my-teams.test.tsx` — covers loading, success, empty, error states via mocked GraphQL.
- `teams-tab.test.tsx` — component renders each state correctly.
- `navbar-right-side.test.tsx` — snapshot of authorized dropdown matches new structure.
- Manual: dev-server walk-through with real Renown login. Tab switching, URL state, login/logout flow, mobile menu.

## Error handling

| Failure mode                                  | Behavior                              |
| --------------------------------------------- | ------------------------------------- |
| Auth `loading`/`checking`                     | Skeleton                              |
| Auth `unauthorized`                           | `<LoginPrompt>` card                  |
| GraphQL error on `fetchBuilderTeamsByMember`  | `<TabErrorState>` with retry          |
| Address is empty string (e.g. mid-login race) | Hook disabled, skeleton stays         |
| Team has malformed data (missing slug)        | Card filtered out client-side; logged |

No redirects, no toast spam.

## Rollout

1. **PR 1** (vetra-builder-package): schema + resolver + tests. Merge → publish dev tag → capture version.
2. **PR 2** (vetra.to): bump `vetra-builder-package` to new version, run codegen, add route + components + navbar update + tests.
3. Dev verify on staging (or local against staging GraphQL).
4. Merge PR 2. Vercel auto-deploys.

## Open questions (deferred)

- Should "Manage ↗" deep-link target Connect or a future `/profile/teams/[slug]` route? Decide when slice B is brainstormed; placeholder for now is Connect.
- When G ships, will "My Packages" filter by exact registry username or by all wallets the user has linked on Renown? Defer to G's own spec.
- Settings tab future content (notification prefs, API keys?) — defer until a real requirement appears.
