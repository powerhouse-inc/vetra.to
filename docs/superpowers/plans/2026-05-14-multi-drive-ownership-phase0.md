# Multi-Drive Ownership — Phase 0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lay the foundation for the multi-drive ownership model. Implement `BuilderAccount` reducers, add `ownerDrive` to `VetraCloudEnvironment`, refactor vetra.to controllers + add drive-id helpers. **No behavior change yet** — team creation still writes to `'powerhouse'`, cloud envs still resolve through the legacy `owner` field via backfill.

**Architecture:** Per the spec at `docs/superpowers/specs/2026-05-14-multi-drive-ownership-design.md`. This plan covers only Phase 0: foundation that ships in three repos (vetra-builder-package, vetra-cloud-package, vetra.to) with unit tests, type checks, and no live-data risk.

**Tech Stack:** document-model (ph-cli, mutative reducers), vetra-builder-package (vitest), vetra-cloud-package (vitest), vetra.to (Next.js 16, vitest, @powerhousedao/reactor-browser).

**Out of scope (deferred to Phase 1+):**

- Flipping team creation to `team:<slug>` drive
- User drive auto-bootstrap on first auth
- Subgraph schema changes (`source_drive_id` columns, drive-agnostic processors)
- `fetchBuilderAccount` resolver
- `myEnvironments(scope: TEAM)` resolver
- Verdaccio + Renown plugin extension
- Publish reconciler
- One-shot migration of legacy 'powerhouse' data

---

## Section A — vetra-builder-package

**Repo:** `/home/froid/projects/powerhouse/vetra-builder-package`
**Branch:** `feat/builder-account-reducers` (off `dev`)

### Task A1: BuilderAccount.profile reducers

**Files:**

- Modify: `document-models/builder-account/v1/src/reducers/profile.ts`
- Test: `document-models/builder-account/v1/src/reducers/profile.test.ts`

- [ ] **Step 1: Inspect current stub and the BuilderTeam profile reducer as reference**

Run:

```bash
cat document-models/builder-account/v1/src/reducers/profile.ts
cat document-models/builder-team/src/reducers/profile.ts
```

Confirm BuilderTeam profile reducer set: `setName`, `setDescription`, `setLogo`, `setSocials`. BuilderAccount mirrors except no `setSlug` (account identity is eth, not slug).

- [ ] **Step 2: Write the failing tests** in `document-models/builder-account/v1/src/reducers/profile.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { reducer } from '../reducer'
import { actions } from '../index'
import { createEmptyState } from '../../gen/utils'

describe('BuilderAccount.profile reducers', () => {
  it('setName updates the name', () => {
    const initial = createEmptyState()
    const next = reducer(initial, actions.setName({ name: 'Alice' }))
    expect(next.state.global.profile.name).toBe('Alice')
  })

  it('setDescription updates the description', () => {
    const initial = createEmptyState()
    const next = reducer(initial, actions.setDescription({ description: 'hello world' }))
    expect(next.state.global.profile.description).toBe('hello world')
  })

  it('setLogo updates the logo', () => {
    const initial = createEmptyState()
    const next = reducer(initial, actions.setLogo({ logo: 'ipfs://abc' }))
    expect(next.state.global.profile.logo).toBe('ipfs://abc')
  })

  it('setSocials updates only provided fields', () => {
    const initial = createEmptyState()
    const next = reducer(initial, actions.setSocials({ xProfile: 'https://x.com/alice' }))
    expect(next.state.global.profile.socials?.xProfile).toBe('https://x.com/alice')
    expect(next.state.global.profile.socials?.github).toBeFalsy()
  })
})
```

- [ ] **Step 3: Run tests, verify they fail**

```bash
npm test -- profile.test
```

Expected: FAIL with "not implemented" or similar.

- [ ] **Step 4: Implement the reducers** in `document-models/builder-account/v1/src/reducers/profile.ts`

Mirror `document-models/builder-team/src/reducers/profile.ts`. Replace stubs (which throw "not implemented") with actual mutative updates against `state.global.profile`. Match the BuilderTeam pattern field-by-field. Drop any `setSlug` reducer if present (accounts don't have a slug).

- [ ] **Step 5: Run tests, verify pass + typecheck**

```bash
npm test -- profile.test && npm run typecheck
```

Expected: PASS, no type errors.

- [ ] **Step 6: Commit**

```bash
git add document-models/builder-account/v1/src/reducers/profile.ts document-models/builder-account/v1/src/reducers/profile.test.ts
git commit -m "feat(builder-account): implement profile reducers"
```

### Task A2: BuilderAccount.spaces reducers

**Files:**

- Modify: `document-models/builder-account/v1/src/reducers/spaces.ts`
- Test: `document-models/builder-account/v1/src/reducers/spaces.test.ts`

- [ ] **Step 1: Reference BuilderTeam.spaces** — `document-models/builder-team/src/reducers/spaces.ts`. Note action set: `addSpace`, `updateSpaceInfo`, `removeSpace`.

- [ ] **Step 2: Write failing tests** mirroring the team-spaces test file at `document-models/builder-team/src/reducers/spaces.test.ts`. Use `actions.addSpace({ id: 's1' })`, etc.

- [ ] **Step 3: Run tests, verify they fail**

```bash
npm test -- spaces.test
```

- [ ] **Step 4: Implement spaces reducers** mirroring BuilderTeam spaces logic. Replace each stub.

- [ ] **Step 5: Run tests, verify pass**

```bash
npm test -- spaces.test && npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add document-models/builder-account/v1/src/reducers/spaces.ts document-models/builder-account/v1/src/reducers/spaces.test.ts
git commit -m "feat(builder-account): implement spaces reducers"
```

### Task A3: BuilderAccount.member reducer (single self-member)

**Files:**

- Modify: `document-models/builder-account/v1/src/reducers/member.ts`
- Test: `document-models/builder-account/v1/src/reducers/member.test.ts`

- [ ] **Step 1: Inspect** the member reducer stub and the schema. BuilderAccount represents a single user, so the member set is conceptually a single entry — the account owner. Action set is whatever the gen schema exposes (likely `addMember`, `updateMemberInfo`, `removeMember` mirroring BuilderTeam, OR a single `setSelf` operation).

```bash
cat document-models/builder-account/v1/src/reducers/member.ts
cat document-models/builder-account/v1/gen/schema/types.ts | head -100
```

- [ ] **Step 2: Write failing tests** based on what the schema actually exposes. If it mirrors BuilderTeam's member actions, test all of them. If it has a single `setSelf`, test that.

- [ ] **Step 3: Run tests, verify they fail.**

```bash
npm test -- member.test
```

- [ ] **Step 4: Implement reducers.** Mirror BuilderTeam member where the schema matches; otherwise implement the simplest single-self pattern (state.global.members[0] gets set/updated).

- [ ] **Step 5: Run tests, verify pass.**

```bash
npm test -- member.test && npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add document-models/builder-account/v1/src/reducers/member.ts document-models/builder-account/v1/src/reducers/member.test.ts
git commit -m "feat(builder-account): implement member reducer"
```

### Task A4: BuilderAccount.packages reducers

**Files:**

- Modify: `document-models/builder-account/v1/src/reducers/packages.ts`
- Test: `document-models/builder-account/v1/src/reducers/packages.test.ts`

- [ ] **Step 1: Inspect** `document-models/builder-account/v1/src/reducers/packages.ts` and the schema. Action set per spec: `addPackage`, `updatePackageInfo`, `removePackage`, `setPackageDriveId`.

- [ ] **Step 2: Write failing tests** for each action. Reference `document-models/builder-team/src/reducers/packages.ts` for the team-side semantics. The `setPackageDriveId` action is new — it should set the `driveId` field on the matching package record.

```ts
it('setPackageDriveId attaches a driveId to an existing package', () => {
  let s = createEmptyState()
  s = reducer(s, actions.addPackage({ id: 'pkg-1', spaceId: 'sp-1' }))
  s = reducer(s, actions.setPackageDriveId({ id: 'pkg-1', driveId: 'powerhouse-package' }))
  // Find the package and assert driveId
  const pkg = findPackage(s, 'pkg-1')
  expect(pkg.driveId).toBe('powerhouse-package')
})
```

- [ ] **Step 3: Run tests, verify they fail.**

```bash
npm test -- packages.test
```

- [ ] **Step 4: Implement reducers.** Mirror BuilderTeam.packages for the shared actions. Add `setPackageDriveId` that locates the package by id and sets `pkg.driveId = action.input.driveId`.

- [ ] **Step 5: Run tests + typecheck.**

```bash
npm test -- packages.test && npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add document-models/builder-account/v1/src/reducers/packages.ts document-models/builder-account/v1/src/reducers/packages.test.ts
git commit -m "feat(builder-account): implement packages reducers"
```

### Task A5: BuilderTeam setSlug guard (SlugLockedError)

**Files:**

- Modify: `document-models/builder-team/src/reducers/profile.ts`
- Modify (via MCP or hand): `document-models/builder-team/...errors` (define `SlugLockedError`)
- Test: `document-models/builder-team/src/reducers/profile.test.ts`

- [ ] **Step 1: Inspect** the current `setSlug` reducer. Determine whether action context exposes `parentIdentifier` (the drive id the doc lives in). If yes, the guard is straightforward; if no, skip this task entirely and note in commit that it's deferred to a later slice.

```bash
grep -n "setSlug" document-models/builder-team/src/reducers/profile.ts
grep -rn "parentIdentifier\|context.driveId\|context.parent" document-models/builder-team/src/reducers/ | head
```

- [ ] **Step 2: If `parentIdentifier`/drive context is accessible in the reducer's action context:**

Write a failing test:

```ts
it('setSlug throws SlugLockedError when team lives in a team:<slug> drive', () => {
  const state = createEmptyState()
  expect(() =>
    reducer(state, actions.setSlug({ slug: 'foo' }), { signer, parentIdentifier: 'team:original' }),
  ).toThrow(/SlugLocked/)
})

it('setSlug allows changes when team lives in legacy powerhouse drive', () => {
  const state = createEmptyState()
  const next = reducer(state, actions.setSlug({ slug: 'foo' }), {
    signer,
    parentIdentifier: 'powerhouse',
  })
  expect(next.state.global.profile.slug).toBe('foo')
})
```

- [ ] **Step 3: Add `SlugLockedError` to the document-model via MCP** (per CLAUDE.md). If MCP is unavailable, define the error class inline as a follow-up and skip the throw path for now.

- [ ] **Step 4: Implement the guard** in the reducer:

```ts
const driveId = action.context?.parentIdentifier
if (driveId && driveId.startsWith('team:')) {
  throw new SlugLockedError('Team slug is immutable once the team has its own drive')
}
state.global.profile.slug = action.input.slug
```

- [ ] **Step 5: Run tests + typecheck.**

```bash
npm test -- profile.test && npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add document-models/builder-team/...
git commit -m "feat(builder-team): lock slug when team has its own drive"
```

**Fallback:** If reducer context does not surface `parentIdentifier`, skip this task and add a SKIPPED comment in the commit message of the next task. Frontend can enforce slug immutability at the UI level in Phase 1.

### Task A6: Publish vetra-builder-package

- [ ] **Step 1: Bump version** in `package.json` (next dev tag).

- [ ] **Step 2: Build + verify**

```bash
npm run build && npm run typecheck && npm test
```

- [ ] **Step 3: Publish**

```bash
ph build && ph publish --registry https://registry.dev.vetra.io
```

If npm login is required, STOP and ask the user. Otherwise capture the published version string (`5.2.0-dev.NN`) from output.

- [ ] **Step 4: Commit + push**

```bash
git add package.json
git commit -m "chore: publish 5.2.0-dev.NN"
git push -u origin feat/builder-account-reducers
```

- [ ] **Step 5: Open PR targeting `dev`**

```bash
gh pr create --base dev --title "feat(builder-account): implement reducers (Phase 0)" --body "Implements BuilderAccount reducers + tightens BuilderTeam.setSlug. See spec at vetra.to/docs/superpowers/specs/2026-05-14-multi-drive-ownership-design.md"
```

---

## Section B — vetra-cloud-package

**Repo:** `/home/froid/projects/powerhouse/vetra-cloud-package`
**Branch:** `feat/cloud-env-owner-drive` (off `dev`)

### Task B1: Add `ownerDrive` field to VetraCloudEnvironment state schema

**Files:**

- Modify (via MCP per CLAUDE.md): `document-models/vetra-cloud-environment/...` (SET_STATE_SCHEMA)
- Modify: `document-models/vetra-cloud-environment/src/utils.ts` (if init helper exists)

- [ ] **Step 1: Read current state schema** to identify exact path.

```bash
grep -rn "owner.*EthereumAddress\|ownerDrive" document-models/vetra-cloud-environment/ | head -20
cat document-models/vetra-cloud-environment/gen/schema/types.ts | head -120
```

- [ ] **Step 2: Add `ownerDrive: String` to state schema via MCP.** Per CLAUDE.md, use `mcp__reactor-mcp__addActions` against the `powerhouse/document-model` doc. If MCP unavailable, manually edit the schema file under `document-models/vetra-cloud-environment/src/` and regenerate.

- [ ] **Step 3: Update `createEmptyState` initial value** to include `ownerDrive: null`.

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add document-models/vetra-cloud-environment/
git commit -m "feat(cloud-env): add ownerDrive field to state schema"
```

### Task B2: Add SET_OWNER_DRIVE action + reducer + tests

**Files:**

- Modify (via MCP): add operation `SET_OWNER_DRIVE` to the `data_management` module
- Modify: `document-models/vetra-cloud-environment/src/reducers/data-management.ts`
- Test: `document-models/vetra-cloud-environment/src/reducers/data-management.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
describe('SET_OWNER_DRIVE', () => {
  it('sets ownerDrive when unset', () => {
    const state = createEmptyState()
    const next = reducer(state, actions.setOwnerDrive({ ownerDrive: 'user:0xabc' }), { signer })
    expect(next.state.global.ownerDrive).toBe('user:0xabc')
  })

  it('rejects when current ownerDrive does not match signer', () => {
    let state = reducer(createEmptyState(), actions.setOwnerDrive({ ownerDrive: 'user:0xabc' }), {
      signer: alice,
    })
    expect(() =>
      reducer(state, actions.setOwnerDrive({ ownerDrive: 'user:0xdef' }), { signer: bob }),
    ).toThrow(/OwnerDrive|Owner|permission/i)
  })

  it('backfills ownerDrive from legacy owner on first SET_OWNER_DRIVE if matching', () => {
    // legacy doc has owner = 0xabc, ownerDrive = null
    const legacy = applyAction(createEmptyState(), { type: 'SET_OWNER', input: { owner: '0xabc' } })
    const next = reducer(legacy, actions.setOwnerDrive({ ownerDrive: 'user:0xabc' }), {
      signer: alice('0xabc'),
    })
    expect(next.state.global.ownerDrive).toBe('user:0xabc')
  })
})
```

- [ ] **Step 2: Run tests, verify they fail.**

```bash
npm test -- data-management.test
```

- [ ] **Step 3: Add `SET_OWNER_DRIVE` operation via MCP** to the `data_management` module with input `{ ownerDrive: String! }` and error `OwnerDriveMismatchError`.

- [ ] **Step 4: Implement the reducer**

```ts
if (state.global.ownerDrive && state.global.ownerDrive !== action.input.ownerDrive) {
  const driveEth = parseDriveOwner(state.global.ownerDrive)
  if (
    !driveEth ||
    driveEth.toLowerCase() !== action.context?.signer?.user?.address?.toLowerCase()
  ) {
    throw new OwnerDriveMismatchError(
      `Cannot reassign ownerDrive from ${state.global.ownerDrive} to ${action.input.ownerDrive}`,
    )
  }
}
state.global.ownerDrive = action.input.ownerDrive
```

`parseDriveOwner` returns the eth address for a `user:` drive id, or null otherwise (team drives use member-set authorization which is checked elsewhere).

- [ ] **Step 5: Run tests + typecheck**

```bash
npm test -- data-management.test && npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add document-models/vetra-cloud-environment/
git commit -m "feat(cloud-env): add SET_OWNER_DRIVE action + reducer"
```

### Task B3: Backfill `ownerDrive` from legacy `owner` field

**Files:**

- Modify: `document-models/vetra-cloud-environment/src/reducers/data-management.ts` (helper)
- Test: `document-models/vetra-cloud-environment/src/reducers/data-management.test.ts`

- [ ] **Step 1: Write failing test**

```ts
it('reducer backfills ownerDrive from legacy owner on first write', () => {
  // Simulate a legacy doc loaded from 'powerhouse' drive: owner='0xabc', ownerDrive=null
  let state = createEmptyState()
  state.global.owner = '0xabc' // simulate legacy backfill
  const next = reducer(state, actions.setLabel({ label: 'env-1' }), { signer: alice('0xabc') })
  expect(next.state.global.ownerDrive).toBe('user:0xabc')
})
```

- [ ] **Step 2: Run tests, verify they fail.**

- [ ] **Step 3: Add a helper that runs at the top of every reducer that takes a signed action:**

```ts
function backfillOwnerDriveIfMissing(state: WritableDraft<VetraCloudEnvironmentState>) {
  if (state.global.ownerDrive == null && state.global.owner) {
    state.global.ownerDrive = `user:${state.global.owner.toLowerCase()}`
  }
}
```

Call `backfillOwnerDriveIfMissing(state)` as the first line of each reducer in `data-management.ts`.

- [ ] **Step 4: Run tests + typecheck.**

```bash
npm test && npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add document-models/vetra-cloud-environment/
git commit -m "feat(cloud-env): backfill ownerDrive from legacy owner on first write"
```

### Task B4: Publish vetra-cloud-package

- [ ] **Step 1: Bump version** in `package.json`.

- [ ] **Step 2: Build + verify**

```bash
npm run build && npm run typecheck && npm test
```

- [ ] **Step 3: Publish**

```bash
ph build && ph publish --registry https://registry.dev.vetra.io
```

Stop + ask user if npm login required. Capture the published version (`0.0.3-dev.NN`).

- [ ] **Step 4: Commit + push + PR**

```bash
git add package.json
git commit -m "chore: publish 0.0.3-dev.NN"
git push -u origin feat/cloud-env-owner-drive
gh pr create --base dev --title "feat(cloud-env): add ownerDrive field (Phase 0)" --body "..."
```

---

## Section C — vetra.to

**Repo:** `/home/froid/projects/powerhouse/vetra.to`
**Branch:** `feat/multi-drive-ownership` (already created, off `staging`)

### Task C1: Drive-context helpers

**Files:**

- Create: `modules/cloud/drive-context.ts`
- Test: `modules/cloud/drive-context.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from 'vitest'
import { userDriveFor, teamDriveFor, parseDriveId } from './drive-context'

describe('drive-context', () => {
  it('userDriveFor lowercases eth address', () => {
    expect(userDriveFor('0xABC123')).toBe('user:0xabc123')
  })

  it('teamDriveFor uses raw slug', () => {
    expect(teamDriveFor('powerhouse-dao')).toBe('team:powerhouse-dao')
  })

  it('parseDriveId recognizes user prefix', () => {
    expect(parseDriveId('user:0xabc')).toEqual({ type: 'user', key: '0xabc' })
  })

  it('parseDriveId recognizes team prefix', () => {
    expect(parseDriveId('team:foo')).toEqual({ type: 'team', key: 'foo' })
  })

  it('parseDriveId treats anything else as legacy', () => {
    expect(parseDriveId('powerhouse')).toEqual({ type: 'legacy', key: 'powerhouse' })
  })
})
```

- [ ] **Step 2: Run tests, verify they fail.**

```bash
npx vitest run modules/cloud/drive-context.test.ts
```

- [ ] **Step 3: Implement helpers**

```ts
// modules/cloud/drive-context.ts
export type DriveId = `user:${string}` | `team:${string}` | string

export type ParsedDriveId =
  | { type: 'user'; key: string }
  | { type: 'team'; key: string }
  | { type: 'legacy'; key: string }

export function userDriveFor(ethAddress: string): DriveId {
  return `user:${ethAddress.toLowerCase()}`
}

export function teamDriveFor(slug: string): DriveId {
  return `team:${slug}`
}

export function parseDriveId(driveId: string): ParsedDriveId {
  if (driveId.startsWith('user:')) return { type: 'user', key: driveId.slice('user:'.length) }
  if (driveId.startsWith('team:')) return { type: 'team', key: driveId.slice('team:'.length) }
  return { type: 'legacy', key: driveId }
}
```

- [ ] **Step 4: Run tests, verify pass.**

```bash
npx vitest run modules/cloud/drive-context.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add modules/cloud/drive-context.ts modules/cloud/drive-context.test.ts
git commit -m "feat(cloud): add drive-context helpers (userDriveFor, teamDriveFor, parseDriveId)"
```

### Task C2: Add `useUserDrive` hook

**Files:**

- Modify: `modules/cloud/drive-context.ts`
- Test: cover in `modules/cloud/drive-context.test.ts` with a simple wrapper test (mocked `useRenownAuth`)

- [ ] **Step 1: Write failing test** (mocked auth)

```ts
import { renderHook } from '@testing-library/react'
import { useUserDrive } from './drive-context'
vi.mock('@powerhousedao/reactor-browser', () => ({
  useRenownAuth: () => ({ status: 'authorized', address: '0xABC' }),
}))

it('useUserDrive returns user:<eth-lowercase> when authorized', () => {
  const { result } = renderHook(() => useUserDrive())
  expect(result.current).toBe('user:0xabc')
})
```

- [ ] **Step 2: Run, verify fail.**

- [ ] **Step 3: Implement** `useUserDrive` in `drive-context.ts`:

```ts
'use client'
import { useRenownAuth } from '@powerhousedao/reactor-browser'

export function useUserDrive(): DriveId | null {
  const auth = useRenownAuth()
  if (auth.status !== 'authorized' || !auth.address) return null
  return userDriveFor(auth.address)
}
```

- [ ] **Step 4: Run + typecheck**

```bash
npx vitest run modules/cloud/drive-context.test.ts && npm run tsc
```

- [ ] **Step 5: Commit**

```bash
git add modules/cloud/drive-context.ts modules/cloud/drive-context.test.ts
git commit -m "feat(cloud): add useUserDrive hook"
```

### Task C3: Refactor cloud controller to accept `parentIdentifier` per call

**Files:**

- Modify: `modules/cloud/controller.ts`

- [ ] **Step 1: Read current controller**

```bash
cat modules/cloud/controller.ts
```

- [ ] **Step 2: Refactor** `loadEnvironmentController` and `createNewEnvironmentController` to accept `parentIdentifier: string` as a required option. Stop importing `DRIVE_ID` from `./client` inside the controller. Callers pass it explicitly.

```ts
// Before:
// import { client, DRIVE_ID } from './client'
// export async function loadEnvironmentController(options: { documentId; signer }) {
//   return RemoteDocumentController.pull(VetraCloudEnvironmentController, {
//     client, documentId, mode: 'batch', parentIdentifier: DRIVE_ID, signer, onConflict: 'rebase',
//   })
// }

// After:
import { client } from './client'

export async function loadEnvironmentController(options: {
  documentId: string
  parentIdentifier: string
  signer: ISigner
}) {
  return RemoteDocumentController.pull(VetraCloudEnvironmentController, {
    client,
    documentId: options.documentId,
    mode: 'batch',
    parentIdentifier: options.parentIdentifier,
    signer: options.signer,
    onConflict: 'rebase',
  })
}

export function createNewEnvironmentController(options: {
  parentIdentifier: string
  signer: ISigner
}) {
  const inner = new VetraCloudEnvironmentController()
  return RemoteDocumentController.from(inner, {
    client,
    mode: 'batch',
    parentIdentifier: options.parentIdentifier,
    signer: options.signer,
  })
}
```

- [ ] **Step 3: Update all callers** to pass `parentIdentifier`. Grep for usages and update each one to pass either `DRIVE_ID` (preserving Phase 0 behavior) or `userDriveFor(auth.address)`/`teamDriveFor(slug)` (will flip in Phase 1).

```bash
grep -rn "loadEnvironmentController\|createNewEnvironmentController" --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v __generated__
```

For Phase 0, pass `DRIVE_ID` to preserve existing behavior:

```ts
import { client, DRIVE_ID } from '@/modules/cloud/client'
// ...
const controller = await loadEnvironmentController({
  documentId,
  parentIdentifier: DRIVE_ID,
  signer,
})
```

- [ ] **Step 4: Typecheck**

```bash
npm run tsc
```

- [ ] **Step 5: Commit**

```bash
git add modules/cloud/controller.ts <any caller files>
git commit -m "refactor(cloud): controllers accept parentIdentifier per call"
```

### Task C4: Refactor builder-team controller to accept `parentIdentifier` per call

**Files:**

- Modify: `modules/profile/lib/builder-team-controller.ts`

- [ ] **Step 1: Same shape as Task C3** but for builder team. Drop the `DRIVE_ID` import; add `parentIdentifier: string` to both `loadBuilderTeamController` and `createNewBuilderTeamController` option types.

- [ ] **Step 2: Update all callers**

```bash
grep -rn "loadBuilderTeamController\|createNewBuilderTeamController" --include="*.ts" --include="*.tsx" | grep -v node_modules
```

Update each call site to pass `parentIdentifier: DRIVE_ID` (preserves Phase 0 behavior). Callers include `modules/profile/lib/use-create-team.ts`, `use-update-team-profile.ts`, `use-team-members.ts`, `use-team-spaces.ts`.

- [ ] **Step 3: Typecheck**

```bash
npm run tsc
```

- [ ] **Step 4: Commit**

```bash
git add modules/profile/lib/
git commit -m "refactor(profile): builder-team controller accepts parentIdentifier per call"
```

### Task C5: Bump dependencies to new dev versions

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Update `@powerhousedao/vetra-builder-package` and `@powerhousedao/vetra-cloud-package` tarball URLs** to the versions published in A6 and B4.

```bash
# Replace the URLs in package.json with the newly-published tarball URLs from Tasks A6 + B4.
# Example pattern:
# "@powerhousedao/vetra-builder-package": "https://registry.dev.vetra.io/@powerhousedao/vetra-builder-package/-/vetra-builder-package-5.2.0-dev.NN.tgz"
# "@powerhousedao/vetra-cloud-package": "https://registry.dev.vetra.io/@powerhousedao/vetra-cloud-package/-/vetra-cloud-package-0.0.3-dev.NN.tgz"
```

- [ ] **Step 2: Install + typecheck + test + lint**

```bash
npm install
npm run tsc
npm test
npm run lint
```

If any of these fail due to package surface changes (the BuilderAccount reducers now exist, the cloud env has ownerDrive), update the shim at `modules/profile/lib/builder-team-package.d.ts` to add typed BuilderAccount class and re-run.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json modules/profile/lib/builder-team-package.d.ts
git commit -m "chore: bump vetra-builder-package + vetra-cloud-package to Phase 0 versions"
```

### Task C6: Push to staging branch

- [ ] **Step 1: Verify clean state + all checks green**

```bash
git status
npm run tsc && npm test && npm run lint
```

- [ ] **Step 2: Rebase onto staging if needed and push**

```bash
git fetch origin staging
git rebase origin/staging
# Resolve conflicts if any. Likely clean since this is purely additive.

git checkout staging
git merge --ff-only feat/multi-drive-ownership || git merge feat/multi-drive-ownership
git push origin staging
```

If `--ff-only` fails, do a rebase merge.

- [ ] **Step 3: Watch staging build**

Tail the staging deploy until ArgoCD reports synced. (Per memory: vetra.to staging → docker build → auto-bumps k8s-hosting → Argo sync.) No active intervention needed — just verify the deploy starts.

```bash
# Confirm staging tip
git log --oneline origin/staging | head -5
```

---

## Stopping conditions

Stop and report to user if any of these occur:

- npm login required for `ph publish` in Section A or B
- A reducer test fails after implementation and the failure is non-obvious (3 attempts to fix)
- `parentIdentifier` is not surfaced in the document-model action context (Task A5 falls back gracefully; if Tasks B2/B3 also need it for cross-team checks and it's missing, halt and consult)
- MCP unavailable for schema changes in Sections A or B; user needs to run `ph vetra` MCP server
- Staging build fails after push (Task C6)

## Acceptance

Phase 0 is done when:

- vetra-builder-package: `BuilderAccount` reducers fully implemented; `SlugLockedError` either implemented or explicitly deferred; new dev version published; PR open against `dev`.
- vetra-cloud-package: `ownerDrive` field added; `SET_OWNER_DRIVE` action; backfill helper; new dev version published; PR open against `dev`.
- vetra.to: drive-context helpers landed; controllers refactored; deps bumped; typecheck + tests + lint all green; pushed to `staging`.
- No behavior change visible to users. Existing teams + envs still work identically.
