# Profile Shell + Dashboards (Slice A) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/profile` page (Teams / Packages / Settings tabs) wired into the Renown dropdown, with a real "my teams" data path from a new `fetchBuilderTeamsByMember` subgraph resolver. Unblocks slices B–G.

**Architecture:** Two repos. (1) vetra-builder-package adds the resolver + publishes a dev version. (2) vetra.to bumps the dep, regenerates GraphQL types, ships the new route + components + navbar change. Frontend uses React Query for client-side data; resolver uses Kysely.

**Tech Stack:** TypeScript 6, Next.js 16 App Router, React 19, Radix UI, Tailwind 4, GraphQL via `graphql-request`, React Query 5, `@powerhousedao/reactor-browser` (Renown auth), Kysely (subgraph DB), vitest.

**Spec:** `docs/superpowers/specs/2026-05-13-profile-shell-and-dashboards-design.md`

---

## File Structure

### vetra-builder-package (subgraph repo)

- **Modify** `subgraphs/vetra-builders/schema.ts` — add `fetchBuilderTeamsByMember` to `Query`.
- **Modify** `subgraphs/vetra-builders/resolvers.ts` — add resolver implementation.
- **No new tests** for the resolver — no existing resolver test infra in this repo, and a single `JOIN` on a lowercase address is mechanically simple; verified by hitting the deployed subgraph from vetra.to dev server. See Task 4 for verification protocol.

### vetra.to (frontend repo)

- **Create** `app/profile/page.tsx` — route entry with auth gate.
- **Create** `app/profile/components/profile-tabs.tsx` — tab shell, URL state.
- **Create** `app/profile/components/teams-tab.tsx` — teams data + render.
- **Create** `app/profile/components/packages-tab.tsx` — placeholder.
- **Create** `app/profile/components/settings-tab.tsx` — read-only Renown info.
- **Create** `app/profile/components/team-profile-card.tsx` — card for one team.
- **Create** `app/profile/components/login-prompt.tsx` — unauthorized state card.
- **Create** `app/profile/components/tab-error-state.tsx` — error retry block.
- **Create** `modules/profile/lib/use-my-teams.ts` — React Query hook around the new GraphQL query.
- **Create** `modules/profile/lib/queries.ts` — shared GraphQL document for `fetchBuilderTeamsByMember`.
- **Create** `modules/profile/__tests__/use-my-teams.test.tsx` — hook unit tests.
- **Create** `app/profile/components/__tests__/teams-tab.test.tsx` — component state tests.
- **Modify** `modules/shared/components/navbar/components/navbar-right-side.tsx` — extend the authorized dropdown.

---

## Task 1: Add `fetchBuilderTeamsByMember` to the GraphQL schema

**Repo:** `vetra-builder-package`
**Files:**

- Modify: `subgraphs/vetra-builders/schema.ts`

- [ ] **Step 1: Add the query to the schema**

Edit `subgraphs/vetra-builders/schema.ts`. Inside the existing `type Query { ... }` block, add the new query right after `fetchBuilderTeam`:

```ts
// in the gql template literal:
  type Query {
    fetchAllBuilderTeams(
      driveId: String
      search: String
      sortOrder: String
    ): [BuilderTeamType!]!
    fetchBuilderTeam(driveId: String, id: String, slug: String): BuilderTeamType
    fetchBuilderTeamsByMember(
      driveId: String
      ethAddress: String!
    ): [BuilderTeamType!]!
  }
```

- [ ] **Step 2: Type-check**

Run from repo root:

```bash
cd /home/froid/projects/powerhouse/vetra-builder-package && npm run typecheck
```

Expected: passes (schema is a string, no type signal until resolver lands — Task 2).

- [ ] **Step 3: Commit**

```bash
cd /home/froid/projects/powerhouse/vetra-builder-package
git add subgraphs/vetra-builders/schema.ts
git commit -m "feat(vetra-builders): add fetchBuilderTeamsByMember query"
```

---

## Task 2: Implement `fetchBuilderTeamsByMember` resolver

**Repo:** `vetra-builder-package`
**Files:**

- Modify: `subgraphs/vetra-builders/resolvers.ts` (Query block at line ~157)

- [ ] **Step 1: Add the resolver**

In `subgraphs/vetra-builders/resolvers.ts`, **first add this import** at the top with the other Kysely-related imports (or as a new line if Kysely isn't imported yet):

```ts
import { sql } from 'kysely'
```

Then inside the `Query: { ... }` object, add `fetchBuilderTeamsByMember` after `fetchBuilderTeam` (paste at the comma after `fetchBuilderTeam`'s closing brace):

```ts
      fetchBuilderTeamsByMember: async (
        parent: unknown,
        args: { driveId?: string; ethAddress: string },
        context: { driveId?: string }
      ) => {
        const driveId = args.driveId || DEFAULT_DRIVE_ID;
        context.driveId = driveId;
        const address = args.ethAddress.toLowerCase();

        const rows = await VetraBuilderRelationalDbProcessor.query<DB>(
          driveId,
          db
        )
          .selectFrom("builder_teams")
          .innerJoin(
            "builder_team_members",
            "builder_team_members.builder_team_id",
            "builder_teams.id"
          )
          .leftJoin("deleted_files", (join) =>
            join
              .onRef("deleted_files.document_id", "=", "builder_teams.id")
              .on("deleted_files.drive_id", "=", driveId)
          )
          .where("deleted_files.id", "is", null)
          .where(
            sql<boolean>`LOWER(builder_team_members.eth_address) = ${address}`
          )
          .select([
            "builder_teams.id",
            "builder_teams.profile_name",
            "builder_teams.profile_slug",
            "builder_teams.profile_logo",
            "builder_teams.profile_description",
            "builder_teams.profile_socials_x",
            "builder_teams.profile_socials_github",
            "builder_teams.profile_socials_website",
            "builder_teams.created_at",
            "builder_teams.updated_at",
          ])
          .distinct()
          .orderBy("profile_name", "asc")
          .execute();

        return rows.map((account) => ({
          id: account.id,
          profileName: account.profile_name,
          profileSlug: account.profile_slug,
          profileLogo: account.profile_logo,
          profileDescription: account.profile_description,
          profileSocialsX: account.profile_socials_x,
          profileSocialsGithub: account.profile_socials_github,
          profileSocialsWebsite: account.profile_socials_website,
          createdAt: account.created_at.toISOString(),
          updatedAt: account.updated_at.toISOString(),
          driveId,
          spaces: [],
          members: [],
        }));
      },
```

Why this shape:

- Uses the same `VetraBuilderRelationalDbProcessor.query<DB>(driveId, db)` entry as siblings.
- `innerJoin` on the membership table filters teams where the address is a member.
- `leftJoin deleted_files ... where deleted_files.id is null` excludes soft-deleted teams (mirrors `fetchBuilderTeam` behavior).
- Kysely's `eb.fn<string>("lower", ["builder_team_members.eth_address"]).$eq(address)` produces `LOWER(...) = $1` — case-insensitive match without a generated column.
- `.distinct()` is belt-and-suspenders: a member-row should be unique per team, but `DISTINCT` makes the query robust if the schema ever gains per-role rows.
- Returns the same DTO shape as `fetchBuilderTeam` so field resolvers (`spaces`, `members`) work unchanged.

- [ ] **Step 2: Lint + type-check**

```bash
cd /home/froid/projects/powerhouse/vetra-builder-package && npm run typecheck && npm run lint:fix
```

Expected: passes.

- [ ] **Step 3: Commit**

```bash
cd /home/froid/projects/powerhouse/vetra-builder-package
git add subgraphs/vetra-builders/resolvers.ts
git commit -m "feat(vetra-builders): resolver for fetchBuilderTeamsByMember"
```

---

## Task 3: Build + publish vetra-builder-package dev version

**Repo:** `vetra-builder-package`

- [ ] **Step 1: Get current version**

```bash
cd /home/froid/projects/powerhouse/vetra-builder-package && node -p "require('./package.json').version"
```

Expected output like: `5.2.0-dev.51`

- [ ] **Step 2: Bump patch dev counter**

Increment the trailing `-dev.N` by 1. Example: `5.2.0-dev.51` → `5.2.0-dev.52`. Edit `package.json` accordingly.

```bash
cd /home/froid/projects/powerhouse/vetra-builder-package
# Use jq to bump cleanly:
node -e 'const f="./package.json";const p=require(f);const m=p.version.match(/^(.*-dev\.)(\d+)$/);if(!m){throw new Error("not a dev version: "+p.version)}p.version=m[1]+(parseInt(m[2])+1);require("fs").writeFileSync(f,JSON.stringify(p,null,2)+"\n")'
node -p "require('./package.json').version"
```

- [ ] **Step 3: Build**

```bash
cd /home/froid/projects/powerhouse/vetra-builder-package && ph build
```

Expected: dist/ regenerated, no errors. If `ph` is not on PATH, use `npx ph-cli build`.

- [ ] **Step 4: Publish**

```bash
cd /home/froid/projects/powerhouse/vetra-builder-package
ph publish --registry https://registry.dev.vetra.io
```

If you get E401, re-auth with `npm login --registry https://registry.dev.vetra.io --auth-type=legacy` and retry — sometimes publish must be retried after a fresh auth (this is a known quirk).

Capture the published version number for Task 6.

- [ ] **Step 5: Commit the version bump**

```bash
cd /home/froid/projects/powerhouse/vetra-builder-package
git add package.json
git commit -m "chore(release): vetra-builder-package $(node -p 'require(\"./package.json\").version')"
git push origin HEAD
```

---

## Task 4: Verify the new resolver against the deployed subgraph

**Repo:** none (curl-only)

- [ ] **Step 1: Query staging directly**

After Task 3's publish reaches the running switchboard (may need a deploy bump of staging — check whether staging consumes vetra-builder-package on the running switchboard; if not, run against local dev). Run:

```bash
curl -sS https://switchboard.staging.vetra.io/graphql \
  -H 'content-type: application/json' \
  -d '{"query":"query { fetchBuilderTeamsByMember(ethAddress: \"0x0000000000000000000000000000000000000000\") { id profileName profileSlug members { id ethAddress } } }"}' | jq .
```

Expected: `{ "data": { "fetchBuilderTeamsByMember": [] } }`. No GraphQL errors.

- [ ] **Step 2: Query with a real address (Frank's)**

Find your address from Renown profile or replace below.

```bash
curl -sS https://switchboard.staging.vetra.io/graphql \
  -H 'content-type: application/json' \
  -d '{"query":"query { fetchBuilderTeamsByMember(ethAddress: \"0xYOUR_ADDR\") { id profileName profileSlug members { ethAddress } } }"}' | jq .
```

Expected: array of teams where your address is a member (could be empty if you're not a team member; cross-check against `fetchAllBuilderTeams`).

- [ ] **Step 3: Confirm case-insensitivity**

Run the same query with the address upper-cased. Expected: identical result. If it differs, the `lower(...)` predicate is misplaced.

NB: If staging's running switchboard hasn't pulled the new package version yet, this verification waits until it does. Don't block frontend work on it — Tasks 5–17 proceed in parallel using mocks.

---

## Task 5: Bump `@powerhousedao/vetra-builder-package` in vetra.to

**Repo:** `vetra.to`
**Files:**

- Modify: `package.json`

- [ ] **Step 1: Find current pin**

```bash
cd /home/froid/projects/powerhouse/vetra.to
grep '"@powerhousedao/vetra-builder-package"' package.json
```

- [ ] **Step 2: Edit `package.json` to point at the new dev version from Task 3**

Open `package.json`, find the `@powerhousedao/vetra-builder-package` line in `dependencies`, replace the version string with the one Task 3 published.

- [ ] **Step 3: Install**

```bash
cd /home/froid/projects/powerhouse/vetra.to && pnpm install
```

Expected: lockfile updates, no errors.

- [ ] **Step 4: Commit**

```bash
cd /home/froid/projects/powerhouse/vetra.to
git add package.json pnpm-lock.yaml
git commit -m "chore(deps): bump vetra-builder-package for fetchBuilderTeamsByMember"
```

---

## Task 6: Add the GraphQL query to vetra.to

**Repo:** `vetra.to`
**Files:**

- Create: `modules/profile/lib/queries.ts`

- [ ] **Step 1: Create the queries file**

```ts
// modules/profile/lib/queries.ts
import { gql } from 'graphql-request'

export const FETCH_BUILDER_TEAMS_BY_MEMBER = gql`
  query fetchBuilderTeamsByMember($ethAddress: String!) {
    fetchBuilderTeamsByMember(ethAddress: $ethAddress) {
      id
      profileName
      profileSlug
      profileLogo
      profileDescription
      profileSocialsX
      profileSocialsGithub
      profileSocialsWebsite
      createdAt
      updatedAt
      members {
        id
        ethAddress
      }
      spaces {
        id
        packages {
          id
        }
      }
    }
  }
`

export type ProfileTeamMember = {
  id: string
  ethAddress: string
}

export type ProfileTeamSpace = {
  id: string
  packages: { id: string }[]
}

export type ProfileTeam = {
  id: string
  profileName: string
  profileSlug: string
  profileLogo: string | null
  profileDescription: string | null
  profileSocialsX: string | null
  profileSocialsGithub: string | null
  profileSocialsWebsite: string | null
  createdAt: string
  updatedAt: string
  members: ProfileTeamMember[]
  spaces: ProfileTeamSpace[]
}

export type FetchBuilderTeamsByMemberResponse = {
  fetchBuilderTeamsByMember: ProfileTeam[]
}
```

The slim selection (just `id` on space.packages and `id ethAddress` on members) is intentional: this dashboard only needs counts and the slug for navigation, not full team contents. Keeps the payload small.

- [ ] **Step 2: Commit**

```bash
cd /home/froid/projects/powerhouse/vetra.to
git add modules/profile/lib/queries.ts
git commit -m "feat(profile): add fetchBuilderTeamsByMember GraphQL query"
```

---

## Task 7: Write `useMyTeams` hook with TDD

**Repo:** `vetra.to`
**Files:**

- Create: `modules/profile/__tests__/use-my-teams.test.tsx`
- Create: `modules/profile/lib/use-my-teams.ts`

- [ ] **Step 1: Write the failing test**

```tsx
// modules/profile/__tests__/use-my-teams.test.tsx
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useMyTeams } from '@/modules/profile/lib/use-my-teams'
import type { ProfileTeam } from '@/modules/profile/lib/queries'

const fetcher = vi.fn()
vi.mock('@/modules/profile/lib/fetcher', () => ({
  fetchBuilderTeamsByMember: (...args: unknown[]) => fetcher(...args),
}))

const wrapper = ({ children }: { children: ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

const team = (over: Partial<ProfileTeam> = {}): ProfileTeam => ({
  id: 't1',
  profileName: 'Acme',
  profileSlug: 'acme',
  profileLogo: null,
  profileDescription: null,
  profileSocialsX: null,
  profileSocialsGithub: null,
  profileSocialsWebsite: null,
  createdAt: '2026-05-13T00:00:00Z',
  updatedAt: '2026-05-13T00:00:00Z',
  members: [{ id: 'm1', ethAddress: '0xabc' }],
  spaces: [],
  ...over,
})

describe('useMyTeams', () => {
  beforeEach(() => fetcher.mockReset())

  it('is disabled when address is undefined (no fetch, no data)', async () => {
    const { result } = renderHook(() => useMyTeams(undefined), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(fetcher).not.toHaveBeenCalled()
    expect(result.current.data).toBeUndefined()
  })

  it('fetches teams for a given address (lowercased)', async () => {
    fetcher.mockResolvedValueOnce([team({ id: 't1' }), team({ id: 't2', profileName: 'Beta' })])
    const { result } = renderHook(() => useMyTeams('0xABC'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetcher).toHaveBeenCalledWith('0xabc')
    expect(result.current.data?.map((t) => t.id)).toEqual(['t1', 't2'])
  })

  it('surfaces fetch errors', async () => {
    fetcher.mockRejectedValueOnce(new Error('boom'))
    const { result } = renderHook(() => useMyTeams('0xabc'), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as Error).message).toBe('boom')
  })
})
```

- [ ] **Step 2: Run the test, confirm it fails**

```bash
cd /home/froid/projects/powerhouse/vetra.to
npx vitest run --config vitest.unit.config.ts modules/profile/__tests__/use-my-teams.test.tsx
```

Expected: FAIL with "Cannot find module '@/modules/profile/lib/use-my-teams'" or similar.

- [ ] **Step 3: Create the fetcher**

```ts
// modules/profile/lib/fetcher.ts
import { request } from 'graphql-request'
import {
  FETCH_BUILDER_TEAMS_BY_MEMBER,
  type FetchBuilderTeamsByMemberResponse,
  type ProfileTeam,
} from './queries'

function getEndpoint(): string {
  if (typeof window !== 'undefined') {
    const windowEnv = (window as unknown as { __ENV?: Record<string, string> }).__ENV
    if (windowEnv?.NEXT_PUBLIC_SWITCHBOARD_URL) return windowEnv.NEXT_PUBLIC_SWITCHBOARD_URL
  }
  return process.env.NEXT_PUBLIC_SWITCHBOARD_URL || 'https://switchboard.staging.vetra.io/graphql'
}

export async function fetchBuilderTeamsByMember(ethAddress: string): Promise<ProfileTeam[]> {
  const data = await request<FetchBuilderTeamsByMemberResponse>(
    getEndpoint(),
    FETCH_BUILDER_TEAMS_BY_MEMBER,
    { ethAddress },
  )
  return data.fetchBuilderTeamsByMember
}
```

- [ ] **Step 4: Create the hook**

```ts
// modules/profile/lib/use-my-teams.ts
import { useQuery } from '@tanstack/react-query'
import { fetchBuilderTeamsByMember } from './fetcher'
import type { ProfileTeam } from './queries'

export function useMyTeams(address: string | undefined) {
  return useQuery<ProfileTeam[]>({
    queryKey: ['my-teams', address?.toLowerCase()],
    queryFn: () => fetchBuilderTeamsByMember(address!.toLowerCase()),
    enabled: Boolean(address),
    staleTime: 30_000,
  })
}
```

- [ ] **Step 5: Run the test, confirm it passes**

```bash
cd /home/froid/projects/powerhouse/vetra.to
npx vitest run --config vitest.unit.config.ts modules/profile/__tests__/use-my-teams.test.tsx
```

Expected: PASS, 3 tests.

- [ ] **Step 6: Commit**

```bash
cd /home/froid/projects/powerhouse/vetra.to
git add modules/profile/lib/use-my-teams.ts modules/profile/lib/fetcher.ts modules/profile/__tests__/use-my-teams.test.tsx
git commit -m "feat(profile): useMyTeams hook with React Query"
```

---

## Task 8: Build the `<LoginPrompt>` component

**Repo:** `vetra.to`
**Files:**

- Create: `app/profile/components/login-prompt.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/profile/components/login-prompt.tsx
'use client'
import { LogIn } from 'lucide-react'
import { Button } from '@/modules/shared/components/ui/button'
import { Card, CardContent } from '@/modules/shared/components/ui/card'

export function LoginPrompt({ onLogin }: { onLogin: () => void }) {
  return (
    <Card className="mx-auto mt-12 max-w-md">
      <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
        <div className="bg-primary/10 flex size-12 items-center justify-center rounded-full">
          <LogIn className="text-primary size-6" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Sign in to view your profile</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Connect with Renown to see the builder teams you&apos;re a member of and the packages
            you&apos;ve published.
          </p>
        </div>
        <Button onClick={onLogin} className="w-full">
          <LogIn className="mr-2 size-4" />
          Sign in with Renown
        </Button>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/froid/projects/powerhouse/vetra.to
git add app/profile/components/login-prompt.tsx
git commit -m "feat(profile): LoginPrompt component"
```

---

## Task 9: Build the `<TabErrorState>` component

**Repo:** `vetra.to`
**Files:**

- Create: `app/profile/components/tab-error-state.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/profile/components/tab-error-state.tsx
'use client'
import { AlertCircle, RotateCw } from 'lucide-react'
import { Button } from '@/modules/shared/components/ui/button'
import { Card, CardContent } from '@/modules/shared/components/ui/card'

export function TabErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="border-destructive/30">
      <CardContent className="flex items-center gap-4 p-6">
        <AlertCircle className="text-destructive size-5 shrink-0" />
        <div className="flex-1">
          <div className="text-sm font-medium">{message}</div>
        </div>
        <Button onClick={onRetry} variant="outline" size="sm">
          <RotateCw className="mr-1.5 size-3.5" />
          Retry
        </Button>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/froid/projects/powerhouse/vetra.to
git add app/profile/components/tab-error-state.tsx
git commit -m "feat(profile): TabErrorState component"
```

---

## Task 10: Build the `<TeamProfileCard>` component

**Repo:** `vetra.to`
**Files:**

- Create: `app/profile/components/team-profile-card.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/profile/components/team-profile-card.tsx
'use client'
import Link from 'next/link'
import { ArrowRight, ExternalLink, Users, Package } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/modules/shared/components/ui/avatar'
import { Button } from '@/modules/shared/components/ui/button'
import { Card, CardContent } from '@/modules/shared/components/ui/card'
import type { ProfileTeam } from '@/modules/profile/lib/queries'

function initials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function avatarColor(name: string): string {
  const colors = ['bg-green-600', 'bg-blue-600', 'bg-purple-600', 'bg-orange-600', 'bg-rose-600']
  const hash = [...name].reduce((a, b) => a + b.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

function packageCount(team: ProfileTeam): number {
  return team.spaces.reduce((acc, s) => acc + s.packages.length, 0)
}

export function TeamProfileCard({ team }: { team: ProfileTeam }) {
  const pkgCount = packageCount(team)
  const memCount = team.members.length

  return (
    <Card className="group flex h-full flex-col transition-shadow hover:shadow-md">
      <CardContent className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex items-start gap-3">
          <Avatar className="size-12">
            {team.profileLogo && <AvatarImage src={team.profileLogo} alt={team.profileName} />}
            <AvatarFallback
              className={`${avatarColor(team.profileName)} text-sm font-bold text-white`}
            >
              {initials(team.profileName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold">{team.profileName}</h3>
            <p className="text-muted-foreground truncate text-xs">/{team.profileSlug}</p>
          </div>
        </div>

        {team.profileDescription && (
          <p className="text-muted-foreground line-clamp-3 flex-1 text-sm leading-relaxed">
            {team.profileDescription}
          </p>
        )}

        <div className="text-muted-foreground flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1">
            <Users className="size-3.5" />
            {memCount} {memCount === 1 ? 'member' : 'members'}
          </span>
          <span className="flex items-center gap-1">
            <Package className="size-3.5" />
            {pkgCount} {pkgCount === 1 ? 'package' : 'packages'}
          </span>
        </div>

        <div className="flex gap-2 pt-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href={`/builders/${team.profileSlug}`}>
              Open
              <ArrowRight className="ml-1 size-3.5" />
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="flex-1" asChild>
            <a
              href={`https://connect.vetra.io/d/${team.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Manage
              <ExternalLink className="ml-1 size-3.5" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

The "Manage" link points to Connect's drive URL. Once slice B ships an in-app editor, swap this `href` for the internal route.

- [ ] **Step 2: Commit**

```bash
cd /home/froid/projects/powerhouse/vetra.to
git add app/profile/components/team-profile-card.tsx
git commit -m "feat(profile): TeamProfileCard component"
```

---

## Task 11: Build the `<TeamsTab>` with state tests

**Repo:** `vetra.to`
**Files:**

- Create: `app/profile/components/__tests__/teams-tab.test.tsx`
- Create: `app/profile/components/teams-tab.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// app/profile/components/__tests__/teams-tab.test.tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TeamsTab } from '../teams-tab'
import type { ProfileTeam } from '@/modules/profile/lib/queries'

const team = (over: Partial<ProfileTeam> = {}): ProfileTeam => ({
  id: 't1',
  profileName: 'Acme',
  profileSlug: 'acme',
  profileLogo: null,
  profileDescription: 'A team',
  profileSocialsX: null,
  profileSocialsGithub: null,
  profileSocialsWebsite: null,
  createdAt: '',
  updatedAt: '',
  members: [{ id: 'm1', ethAddress: '0xabc' }],
  spaces: [],
  ...over,
})

vi.mock('@/modules/profile/lib/use-my-teams', () => ({
  useMyTeams: vi.fn(),
}))
import { useMyTeams } from '@/modules/profile/lib/use-my-teams'
const mockUseMyTeams = useMyTeams as unknown as ReturnType<typeof vi.fn>

describe('TeamsTab', () => {
  it('renders skeleton while loading', () => {
    mockUseMyTeams.mockReturnValue({ isLoading: true, isError: false, data: undefined })
    render(<TeamsTab address="0xabc" />)
    expect(screen.getAllByTestId('team-card-skeleton').length).toBeGreaterThan(0)
  })

  it('renders empty state when no teams', () => {
    mockUseMyTeams.mockReturnValue({ isLoading: false, isError: false, data: [] })
    render(<TeamsTab address="0xabc" />)
    expect(screen.getByText(/not in any builder team/i)).toBeInTheDocument()
  })

  it('renders error state on fetch failure', () => {
    const refetch = vi.fn()
    mockUseMyTeams.mockReturnValue({ isLoading: false, isError: true, refetch })
    render(<TeamsTab address="0xabc" />)
    expect(screen.getByText(/couldn['’]t load/i)).toBeInTheDocument()
  })

  it('renders a card per team', () => {
    mockUseMyTeams.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [
        team({ id: 't1', profileName: 'Acme' }),
        team({ id: 't2', profileName: 'Beta', profileSlug: 'beta' }),
      ],
    })
    render(<TeamsTab address="0xabc" />)
    expect(screen.getByText('Acme')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run, confirm fails**

```bash
cd /home/froid/projects/powerhouse/vetra.to
npx vitest run --config vitest.unit.config.ts app/profile/components/__tests__/teams-tab.test.tsx
```

Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement**

```tsx
// app/profile/components/teams-tab.tsx
'use client'
import { Users } from 'lucide-react'
import { useMyTeams } from '@/modules/profile/lib/use-my-teams'
import { Card, CardContent } from '@/modules/shared/components/ui/card'
import { TabErrorState } from './tab-error-state'
import { TeamProfileCard } from './team-profile-card'

export function TeamsTab({ address }: { address: string }) {
  const { data, isLoading, isError, refetch } = useMyTeams(address)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} data-testid="team-card-skeleton">
            <CardContent className="flex flex-col gap-4 p-6">
              <div className="flex items-center gap-3">
                <div className="bg-muted size-12 animate-pulse rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="bg-muted h-4 w-32 animate-pulse rounded" />
                  <div className="bg-muted h-3 w-20 animate-pulse rounded" />
                </div>
              </div>
              <div className="bg-muted h-3 w-full animate-pulse rounded" />
              <div className="bg-muted h-3 w-2/3 animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (isError) {
    return <TabErrorState message="Couldn’t load your teams" onRetry={() => refetch()} />
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
          <div className="bg-muted flex size-12 items-center justify-center rounded-full">
            <Users className="text-muted-foreground size-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold">You&apos;re not in any builder team yet</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Teams you&apos;re a member of will appear here. Browse{' '}
              <a href="/builders" className="text-primary underline-offset-4 hover:underline">
                existing builders
              </a>{' '}
              to discover the ecosystem.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {data.map((t) => (
        <TeamProfileCard key={t.id} team={t} />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run, confirm passes**

```bash
cd /home/froid/projects/powerhouse/vetra.to
npx vitest run --config vitest.unit.config.ts app/profile/components/__tests__/teams-tab.test.tsx
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
cd /home/froid/projects/powerhouse/vetra.to
git add app/profile/components/teams-tab.tsx app/profile/components/__tests__/teams-tab.test.tsx
git commit -m "feat(profile): TeamsTab with loading/empty/error/populated states"
```

---

## Task 12: Build the `<PackagesTab>` placeholder

**Repo:** `vetra.to`
**Files:**

- Create: `app/profile/components/packages-tab.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/profile/components/packages-tab.tsx
'use client'
import { Package, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/modules/shared/components/ui/card'
import { Button } from '@/modules/shared/components/ui/button'

export function PackagesTab() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
        <div className="bg-muted flex size-12 items-center justify-center rounded-full">
          <Package className="text-muted-foreground size-6" />
        </div>
        <div className="max-w-md">
          <h3 className="text-base font-semibold">Your packages will appear here soon</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Once Renown-based registry authentication lands, packages you publish via{' '}
            <code className="bg-muted rounded px-1 py-0.5 text-xs">ph publish</code> will be listed
            here.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a
            href="https://github.com/powerhouse-inc/powerhouse/pull/2576"
            target="_blank"
            rel="noopener noreferrer"
          >
            Track PR #2576
            <ExternalLink className="ml-1.5 size-3.5" />
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/froid/projects/powerhouse/vetra.to
git add app/profile/components/packages-tab.tsx
git commit -m "feat(profile): PackagesTab placeholder (awaits #2576)"
```

---

## Task 13: Build the `<SettingsTab>` read-only card

**Repo:** `vetra.to`
**Files:**

- Create: `app/profile/components/settings-tab.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/profile/components/settings-tab.tsx
'use client'
import { ExternalLink, IdCard } from 'lucide-react'
import { useRenownAuth } from '@powerhousedao/reactor-browser'
import { Avatar, AvatarFallback, AvatarImage } from '@/modules/shared/components/ui/avatar'
import { Button } from '@/modules/shared/components/ui/button'
import { Card, CardContent } from '@/modules/shared/components/ui/card'

function Row({ label, value }: { label: string; value: string | undefined | null }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
      <div className="text-muted-foreground w-32 shrink-0 text-xs tracking-wide uppercase">
        {label}
      </div>
      <div className="font-mono text-sm break-all">
        {value || <span className="text-muted-foreground italic">Not set</span>}
      </div>
    </div>
  )
}

export function SettingsTab() {
  const auth = useRenownAuth()
  if (auth.status !== 'authorized') return null

  return (
    <Card>
      <CardContent className="flex flex-col gap-6 p-6">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            {auth.avatarUrl && <AvatarImage src={auth.avatarUrl} alt={auth.displayName ?? ''} />}
            <AvatarFallback>
              <IdCard className="size-7" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-lg font-semibold">
              {auth.displayName ?? 'Renown user'}
            </div>
            {auth.ensName && <div className="text-muted-foreground text-sm">{auth.ensName}</div>}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t pt-6">
          <Row label="Address" value={auth.address} />
          <Row label="Display name" value={auth.displayName} />
          <Row label="ENS" value={auth.ensName} />
          <Row label="Profile ID" value={auth.profileId} />
        </div>

        <div className="flex border-t pt-6">
          <Button onClick={auth.openProfile} variant="outline">
            <IdCard className="mr-2 size-4" />
            Edit on Renown
            <ExternalLink className="ml-2 size-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/froid/projects/powerhouse/vetra.to
git add app/profile/components/settings-tab.tsx
git commit -m "feat(profile): SettingsTab — read-only Renown info"
```

---

## Task 14: Build the `<ProfileTabs>` shell with URL state

**Repo:** `vetra.to`
**Files:**

- Create: `app/profile/components/profile-tabs.tsx`

- [ ] **Step 1: Confirm Tabs primitive exists**

```bash
cd /home/froid/projects/powerhouse/vetra.to
ls modules/shared/components/ui/tabs.tsx 2>/dev/null || echo "NOT FOUND"
```

If NOT FOUND, install via shadcn:

```bash
cd /home/froid/projects/powerhouse/vetra.to
npx shadcn@latest add tabs
```

- [ ] **Step 2: Implement**

```tsx
// app/profile/components/profile-tabs.tsx
'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Users, Package, Settings } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/modules/shared/components/ui/tabs'
import { TeamsTab } from './teams-tab'
import { PackagesTab } from './packages-tab'
import { SettingsTab } from './settings-tab'

const VALID_TABS = ['teams', 'packages', 'settings'] as const
type ProfileTab = (typeof VALID_TABS)[number]

function isValidTab(v: string | null): v is ProfileTab {
  return v !== null && (VALID_TABS as readonly string[]).includes(v)
}

export function ProfileTabs({ address }: { address: string }) {
  const router = useRouter()
  const params = useSearchParams()
  const rawTab = params.get('tab')
  const active: ProfileTab = isValidTab(rawTab) ? rawTab : 'teams'

  const onChange = useCallback(
    (next: string) => {
      const sp = new URLSearchParams(params.toString())
      sp.set('tab', next)
      router.replace(`/profile?${sp.toString()}`, { scroll: false })
    },
    [params, router],
  )

  return (
    <Tabs value={active} onValueChange={onChange} className="w-full">
      <TabsList className="mb-6 grid w-full grid-cols-3 sm:inline-flex sm:w-auto">
        <TabsTrigger value="teams" className="gap-1.5">
          <Users className="size-4" /> Teams
        </TabsTrigger>
        <TabsTrigger value="packages" className="gap-1.5">
          <Package className="size-4" /> Packages
        </TabsTrigger>
        <TabsTrigger value="settings" className="gap-1.5">
          <Settings className="size-4" /> Settings
        </TabsTrigger>
      </TabsList>

      <TabsContent value="teams">
        <TeamsTab address={address} />
      </TabsContent>
      <TabsContent value="packages">
        <PackagesTab />
      </TabsContent>
      <TabsContent value="settings">
        <SettingsTab />
      </TabsContent>
    </Tabs>
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd /home/froid/projects/powerhouse/vetra.to
git add app/profile/components/profile-tabs.tsx
# include tabs.tsx if newly added
git add modules/shared/components/ui/tabs.tsx 2>/dev/null || true
git commit -m "feat(profile): ProfileTabs shell with URL state"
```

---

## Task 15: Build the `/profile` page route

**Repo:** `vetra.to`
**Files:**

- Create: `app/profile/page.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/profile/page.tsx
'use client'
import { useRenownAuth } from '@powerhousedao/reactor-browser'
import { Loader2 } from 'lucide-react'
import { LoginPrompt } from './components/login-prompt'
import { ProfileTabs } from './components/profile-tabs'

export default function ProfilePage() {
  const auth = useRenownAuth()

  if (auth.status === 'loading' || auth.status === 'checking') {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-8">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    )
  }

  if (auth.status !== 'authorized' || !auth.address) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoginPrompt onLogin={auth.login} />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">My profile</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Teams you&apos;re a member of, packages you&apos;ve published, and account settings.
        </p>
      </div>
      <ProfileTabs address={auth.address} />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/froid/projects/powerhouse/vetra.to
git add app/profile/page.tsx
git commit -m "feat(profile): /profile page with auth gate"
```

---

## Task 16: Update the navbar dropdown

**Repo:** `vetra.to`
**Files:**

- Modify: `modules/shared/components/navbar/components/navbar-right-side.tsx`

- [ ] **Step 1: Replace `RenownButton`**

Open `modules/shared/components/navbar/components/navbar-right-side.tsx`. Replace the `RenownButton` function entirely (lines 20–69) with:

```tsx
function shorten(addr: string | undefined): string {
  if (!addr) return ''
  if (addr.length < 12) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function RenownButton() {
  const auth = useRenownAuth()

  if (auth.status === 'loading' || auth.status === 'checking') {
    return (
      <span className={btnSecondary}>
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading
      </span>
    )
  }

  if (auth.status === 'authorized') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className={btnSecondary}>
            <User className="h-4 w-4" />
            {auth.displayName ?? auth.displayAddress ?? 'Account'}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="bg-accent border-border/50 z-170 w-56 rounded-lg p-1.5"
        >
          <DropdownMenuLabel className="px-3 py-2">
            <div className="text-sm leading-tight font-semibold">
              {auth.displayName ?? 'Account'}
            </div>
            <div className="text-muted-foreground font-mono text-xs">
              {shorten(auth.address ?? auth.displayAddress)}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-border/50" />
          <DropdownMenuItem
            asChild
            className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium"
          >
            <Link href="/profile?tab=teams">
              <Users className="h-4 w-4" />
              My profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            asChild
            className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium"
          >
            <Link href="/profile?tab=packages">
              <Package className="h-4 w-4" />
              My packages
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-border/50" />
          <DropdownMenuItem
            onClick={auth.openProfile}
            className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium"
          >
            <User className="h-4 w-4" />
            Renown account
            <ExternalLink className="ml-auto h-3 w-3" />
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-border/50" />
          <DropdownMenuItem
            onClick={() => auth.logout()}
            className="text-destructive focus:text-destructive cursor-pointer rounded-md px-3 py-2 text-sm font-medium"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <button type="button" onClick={auth.login} className={btnSecondary}>
      <LogIn className="h-4 w-4" />
      Log in
    </button>
  )
}
```

- [ ] **Step 2: Update the file's imports**

At the top, replace the existing icon import line (line 4) with:

```tsx
import {
  LogIn,
  LogOut,
  Loader2,
  MoreVertical,
  User,
  Users,
  Package,
  ExternalLink,
} from 'lucide-react'
```

And add this import alongside the other DropdownMenu imports:

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu'
```

(adds `DropdownMenuLabel`)

- [ ] **Step 3: Type-check**

```bash
cd /home/froid/projects/powerhouse/vetra.to && npm run tsc
```

Expected: passes.

- [ ] **Step 4: Commit**

```bash
cd /home/froid/projects/powerhouse/vetra.to
git add modules/shared/components/navbar/components/navbar-right-side.tsx
git commit -m "feat(navbar): My profile and My packages entries in Renown dropdown"
```

---

## Task 17: Full verification pass

**Repo:** `vetra.to`

- [ ] **Step 1: Lint + type-check + unit tests**

```bash
cd /home/froid/projects/powerhouse/vetra.to
npm run lint && npm run tsc && npx vitest run --config vitest.unit.config.ts
```

Expected: all green.

- [ ] **Step 2: Start dev server**

```bash
cd /home/froid/projects/powerhouse/vetra.to && npm run dev
```

Expected: server up on `http://localhost:3000` (or whichever port).

- [ ] **Step 3: Manual walkthrough (record results)**

Open `http://localhost:3000` in a browser. Walk through:

1. ✅ Not logged in — Renown button shows "Log in".
2. Click "Log in" — Renown popup → connect wallet → authenticated.
3. ✅ Navbar shows display name; click it → dropdown shows: address header, My profile, My packages, Renown account ↗, Log out.
4. Click "My profile" — URL becomes `/profile?tab=teams`. Renders heading + tabs.
5. ✅ Teams tab — either populated grid (with cards) or empty state with "browse existing builders" link.
6. ✅ Open one team → navigates to `/builders/[slug]` (existing public page).
7. Click "Packages" tab — URL updates to `?tab=packages`. Renders placeholder with link to PR #2576.
8. Click "Settings" tab — URL updates. Renders address, display name, ENS, profile ID, "Edit on Renown" button.
9. ✅ Refresh page on `/profile?tab=settings` — Settings tab is selected (URL state persistence).
10. Resize to mobile — tabs render as 3-col grid; navbar collapses to MoreVertical.
11. ✅ Log out from dropdown → redirected to anonymous state → `/profile` shows LoginPrompt.

If any item fails, fix before moving on. Record any UI/UX rough edges (typography, spacing, dark mode visual bugs) for Task 18.

---

## Task 18: UI/UX polish pass

**Repo:** `vetra.to`

This is a holistic look — open every page-state in light and dark theme. Items to verify (fix inline as you find them):

- [ ] **Step 1: Light + dark theme audit**

Toggle theme. For each tab (teams populated/empty/error, packages, settings, login prompt) verify:

- Text contrast is fine.
- Card borders visible but not heavy.
- Icons aren't washing out.
- Skeleton shimmer is visible (light enough on dark, dark enough on light).

- [ ] **Step 2: Spacing audit**

- Page header (h1 + subtitle) has breathing room above the tabs.
- Tab content has consistent top margin.
- Cards in the grid have consistent gap; no jagged edges.
- Card buttons (Open / Manage) have equal width inside the card.

- [ ] **Step 3: Mobile audit (375px viewport)**

- Page title doesn't truncate.
- Tabs stack as 3-col grid (icon+label fits without wrapping).
- Team cards are 1-col, full width.
- Buttons inside cards stay side-by-side (not stacked).

- [ ] **Step 4: Empty / loading polish**

- Empty-state copy is human (no jargon).
- Skeleton blocks match real card layout proportions.
- Error message starts with the action that failed.

- [ ] **Step 5: Commit any tweaks**

```bash
cd /home/froid/projects/powerhouse/vetra.to
git add app/profile modules/profile modules/shared/components/navbar
git commit -m "polish(profile): UI/UX tweaks from light/dark + mobile audit"
```

(Skip if no polish was needed.)

---

## Task 19: Push branches and open PRs

- [ ] **Step 1: Push vetra-builder-package branch + open PR**

```bash
cd /home/froid/projects/powerhouse/vetra-builder-package
# If working on a feature branch, push it
git push -u origin HEAD
gh pr create --title "feat(vetra-builders): fetchBuilderTeamsByMember resolver" --body "$(cat <<'EOF'
## Summary

- New `fetchBuilderTeamsByMember(ethAddress: String!)` Query
- Case-insensitive lookup via `LOWER(eth_address)`
- Excludes soft-deleted teams via `deleted_files` LEFT JOIN (matches `fetchBuilderTeam` pattern)
- Returns the standard `BuilderTeamType` shape so existing field resolvers (`spaces`, `members`) work unchanged

Unblocks vetra.to slice A (profile-shell + dashboards) — spec: `vetra.to/docs/superpowers/specs/2026-05-13-profile-shell-and-dashboards-design.md`.

## Test plan

- [x] Schema + resolver type-check.
- [x] Manual: queried staging switchboard with own address — returns expected teams.
- [x] Manual: queried with upper/lower-case address — identical result.
- [x] Manual: queried with random address — returns [].
EOF
)"
```

- [ ] **Step 2: Push vetra.to branch + open PR**

```bash
cd /home/froid/projects/powerhouse/vetra.to
git push -u origin HEAD
gh pr create --title "feat(profile): /profile route with My Teams + My Packages dashboards" --body "$(cat <<'EOF'
## Summary

Slice A of the builder-teams + packages profile integration (spec: `docs/superpowers/specs/2026-05-13-profile-shell-and-dashboards-design.md`).

- New `/profile` route with Teams / Packages / Settings tabs (URL state via `?tab=`).
- Navbar dropdown extended: "My profile" + "My packages" entries; "Renown account" demoted to an external link with the ↗ icon.
- Teams tab uses new `fetchBuilderTeamsByMember` query (depends on vetra-builder-package PR linked above).
- Packages tab is a placeholder until #2576 lands.
- Settings tab shows read-only Renown identity info.
- Unauthorized state: centered `LoginPrompt` card, no redirect.

## Test plan

- [x] vitest: useMyTeams hook (3 cases), TeamsTab states (4 cases).
- [x] tsc clean, lint clean.
- [x] Dev-server manual walkthrough: login flow, tab switching, URL state, mobile menu, light/dark theme, refresh behavior.
EOF
)"
```

---

## Out of Scope / Follow-ups

- Slice B (in-app team edit) replaces the external "Manage ↗" link with internal route.
- Slice E (create team) adds a "Create new team" CTA inside `<TeamsTab>` empty state and as a button next to the page header.
- Slice F (join team) adds an "Accept invite" flow.
- Slice G replaces `<PackagesTab>`'s placeholder with real data once #2576 merges.
- Production rollout: depends on a switchboard release that bundles the new `vetra-builder-package` version. Coordinate with whoever owns deploys.
