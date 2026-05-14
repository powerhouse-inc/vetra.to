# Multi-Drive Ownership Model — Design

**Status:** Approved (2026-05-14)
**Touches:** vetra-builder-package, vetra-cloud-package, vetra.to, vetra-renown-registry-plugin

## Problem

Today every Powerhouse document in the Vetra ecosystem (cloud environments + builder teams) lives in a single shared drive — `'powerhouse'` on staging — keyed by `NEXT_PUBLIC_CLOUD_DRIVE_ID`. There is no document-model expression of "this thing belongs to user X" beyond an `owner` eth-address field on cloud env docs; teams are entirely unmanaged at the drive level.

We want:

1. **Every user gets their own drive.** Their `BuilderAccount` profile, their personal cloud environments, and a denormalized list of packages they have published all live there.
2. **Every team gets their own drive.** Their `BuilderTeam` profile, their team-owned cloud environments, and a denormalized list of team-published packages all live there.
3. **A package can be published by a builder team or by a user.** The registry (Verdaccio + Renown plugin) is the authoritative source of "who owns this name"; entity drives carry a denormalized index for UI.

## Decisions (made during brainstorm)

| Decision                  | Choice                                                                                    |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| Scope                     | Full end-to-end model (per-user + per-team + packages + discovery + migration)            |
| Package representation    | npm registry name (string). Not a Powerhouse document.                                    |
| Drive identity convention | `user:<eth-lowercase>` and `team:<slug>`. Type derivable from prefix.                     |
| Drive contents            | Everything owned by an entity lives in its drive (profile + envs + package records).      |
| Discovery                 | One drive-agnostic processor per subgraph, one DB, records tagged with `source_drive_id`. |
| Package namespacing       | Team packages scoped `@<slug>/<name>`. User packages unscoped (publisher eth recorded).   |
| Cloud env ownership       | Replace `owner: EthereumAddress` with `ownerDrive: string`. Doc's drive IS its owner.     |

## Architecture

### Drive identity

- **User drive:** `user:<eth-lowercase>` (e.g. `user:0xd8da6bf26964af9d7eed9e03e53415d37aa96045`)
- **Team drive:** `team:<slug>` (e.g. `team:powerhouse-dao`)
- Type is derivable from the `user:` / `team:` prefix. No separate index doc.
- Drive IDs are immutable. Because a team's drive id embeds its slug (`team:<slug>`), renaming a slug would require moving the drive — so `slug` is immutable for any team created under this design. The `setSlug` action throws `SlugLockedError` whenever the team already lives in a `team:<slug>` drive (any drive matching `parseDriveId(driveId).type === 'team'`). Legacy teams in `'powerhouse'` keep their slug during migration; no rename is offered.
- Legacy `'powerhouse'` drive is deprecated; it stays read-only during the migration window and is decommissioned in Phase 3.

### Drive contents

| Drive                 | Documents inside                                                                                                                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `user:<eth>`          | One `BuilderAccount` profile doc. Zero or more `VetraCloudEnvironment` docs owned by this user. (Package ownership records are denormalized inside `BuilderAccount.packages[]` — not separate docs.) |
| `team:<slug>`         | One `BuilderTeam` profile doc. Zero or more `VetraCloudEnvironment` docs owned by this team. (Package ownership records are denormalized inside `BuilderTeam.spaces[].packages[]`.)                  |
| `powerhouse` (legacy) | Existing teams + envs awaiting migration. Frozen after Phase 1.                                                                                                                                      |

### Drive bootstrap

- **User drive:** lazy. The first authenticated write from a user (creating a team, creating an env, recording a publish) triggers `ensureUserDrive(auth.address)`, which probes `reactor.getDrive(driveId)` and calls `addDrive` with a seed `BuilderAccount` doc if missing. Idempotent.
- **Team drive:** eager. The team-creation wizard's submit batch does `addDrive('team:<slug>') + addDocument(BuilderTeam)` as a single Renown-signed operation.

### Discovery topology

- Each subgraph processor is drive-agnostic (`filter.documentId: ["*"]`).
- Every persisted row gains a `source_drive_id` column.
- Resolvers filter by drive prefix:
  - `fetchAllBuilderTeams` → `WHERE source_drive_id LIKE 'team:%'`
  - `fetchBuilderAccount(eth)` → `WHERE source_drive_id = 'user:<eth>'`
  - `myEnvironments(scope: MINE)` → `WHERE source_drive_id = 'user:<auth.eth>'`
  - `myEnvironments(scope: TEAM, teamSlug)` → `WHERE source_drive_id = 'team:<slug>'` AND caller is a team member
- During migration, resolvers also accept `source_drive_id = 'powerhouse'` rows so the UI is uninterrupted.

## Components

### vetra-builder-package

- **Implement `BuilderAccount` reducers.** Currently stubs (throw "not implemented"). Mirror the `BuilderTeam` action set for:
  - `profile/*` — `setName`, `setDescription`, `setLogo`, `setSocials` (no slug on accounts — eth is the identity)
  - `spaces/*` — `addSpace`, `updateSpaceInfo`, `removeSpace`
  - `member/*` — single-member self-record (the account owner)
  - `packages/*` — `addPackage`, `updatePackageInfo`, `removePackage`, plus `setPackageDriveId` (already in schema)
- **`BuilderTeam` tightening.** `setSlug` action becomes draft-only — after the first state transition out of draft (or always, for newly-created teams under this design), `setSlug` throws `SlugLockedError`. Existing teams keep their slug.
- **Subgraph schema.** Add `source_drive_id: text NOT NULL` to `builder_teams`, `builder_team_spaces`, `builder_team_packages`, `builder_team_members`. Add new mirror tables `builder_accounts`, `builder_account_spaces`, `builder_account_packages` (single-row-per-account; the account-spaces/packages mirror team-spaces/packages).
- **Processor.** Drive-agnostic. Pulls operations from all drives. On `BuilderTeam` ops, writes to `builder_teams*` tagged with the drive id. On `BuilderAccount` ops, writes to `builder_accounts*`.
- **Resolvers.** Drop the `driveId` resolver-context parameter (deprecated). Add `fetchBuilderAccount(ethAddress: String!)`. `fetchAllBuilderTeams` filters by `source_drive_id LIKE 'team:%'`. Backward compat: continue accepting `'powerhouse'`-sourced rows for legacy teams.

### vetra-cloud-package

- **`VetraCloudEnvironment.state.owner` → `state.ownerDrive`.** Type `string` with shape `${'user'|'team'}:${string}`. Backfill helper in the reducer: on any action against a doc with `ownerDrive` unset, derive it from the legacy `owner` field (`user:<owner>`).
- **`INITIALIZE` reducer.** Enforces `ownerDrive` matches the drive id the doc is being added to. Rejects mismatches with `OwnerDriveMismatchError`.
- **`SET_OWNER_DRIVE` action.** Replaces `SET_OWNER`. Only allowed when current `ownerDrive` is unset (i.e. transferring an unclaimed env) or by admin override.
- **Subgraph schema.** Add `source_drive_id` to `environments` and any related tables. Backfill `'powerhouse'` for legacy rows.
- **`myEnvironments` resolver.** Adds `scope: TEAM, teamSlug: String` variant. Authorization check: caller must be in `BuilderTeam.members[]` for the requested team slug. Existing `scope: MINE` continues to filter by `source_drive_id = 'user:<auth.eth>'`.

### vetra.to

- **Replace `DRIVE_ID` singleton with `useDriveContext()`.** New module `modules/cloud/drive-context.ts`:
  ```ts
  export function userDriveFor(eth: string): string // returns `user:${eth.toLowerCase()}`
  export function teamDriveFor(slug: string): string // returns `team:${slug}`
  export function parseDriveId(id: string): { type: 'user' | 'team' | 'legacy'; key: string }
  export function useUserDrive(): string | null // derived from useRenownAuth().address
  ```
- **Controllers accept `parentIdentifier` per call.** Remove the constant import in `modules/cloud/controller.ts` and `modules/profile/lib/builder-team-controller.ts`. Caller passes the resolved drive id.
- **User drive auto-bootstrap.** New hook `useEnsureUserDrive()` runs on first authenticated render of any /profile route; calls `client.getDrive` and, if 404, `client.addDrive` with a seed `BuilderAccount` doc. Idempotent server-side.
- **Team-creation wizard.** `useCreateTeam.createTeam()` issues `addDrive('team:<slug>')` then `createNewBuilderTeamController({ parentIdentifier: 'team:<slug>' }).push()`. Slug-availability check (`useSlugAvailability`) already exists; reuse.
- **Cloud env creation.** On `/profile` page (personal envs): controller `parentIdentifier = useUserDrive()`. On `/profile/teams/[slug]` (team envs): `parentIdentifier = teamDriveFor(slug)`.
- **Routes.**
  - `/profile/*` writes to user drive.
  - `/profile/teams/[slug]/*` writes to team drive (auth: caller must be team member).
  - `/builders/[slug]` reads team drive (public).
  - `/builders` lists all teams via federated subgraph query.
  - `/packages` lists all packages from registry `_search` (already does this; unchanged).

### Verdaccio + Renown plugin

- **Repo:** vetra-renown-registry-plugin (the PR referenced by the user).
- **Auth check at publish time.** Verdaccio calls into the plugin's `allow_publish(user, pkg)`:
  - **Scoped name `@<scope>/<name>`:**
    - Fetch `BuilderTeam` where `slug = scope` (subgraph query, cached 30s).
    - 404 → reject with "team scope does not exist".
    - Reject if `user.eth` not in `team.members[].ethAddress`.
  - **Unscoped name `<name>`:**
    - Allow if user is authenticated.
    - Persist `publisher: user.eth` in npm metadata (Verdaccio `_uplinks` or custom field).
- **No synchronous coordination with drives.** Drive-side index is eventually consistent via the reconciler.

### Publish reconciler

- **Lives in:** vetra-builder-package subgraph (v1, poll-based).
- **Cadence:** 60s cron tick.
- **Source of truth:** `GET <registry>/-/v1/search?text=&size=250` (or `/-/all` for full sweep on first run).
- **Logic:**
  ```
  for each package in registry:
    name, latestVersion, publisher, time
    if name matches /^@([^/]+)\//: ownerDrive = team:<scope>
    else: ownerDrive = user:<publisher>
    if (name, version) already recorded in subgraph DB: skip
    else: system-signed dispatch
      - addPackage({ id: oid(name), spaceId: defaultSpaceId(ownerDoc) })  if new
      - updatePackageInfo({ id, npm: registryUrl, version: latestVersion, description, github })
    record (name, version, ownerDrive) in subgraph dedupe table
  ```
- **System signer:** a reserved key the subgraph holds; reducers accept it as an "operator" with elevated rights for the `recordPublish`-shaped actions only. New `assertSystemOrMember` helper in vetra-builder-package.
- **Failure mode:** transient registry error → retry on next tick. Permanent (team scope doesn't exist) → log + skip.

## Data flow examples

1. **First sign-in** → Renown auth resolves → `useEnsureUserDrive()` fires → `user:<eth>` drive created with `BuilderAccount` seed doc.
2. **Create team** → wizard submit → `addDrive('team:foo') + addDocument(BuilderTeam{slug:'foo', members:[creator]})` signed batch. Slug locked.
3. **Create personal cloud env** → controller `parentIdentifier = 'user:<eth>'` → new env with `ownerDrive: 'user:<eth>'`.
4. **Create team cloud env** → `/profile/teams/foo/envs/new` → controller `parentIdentifier = 'team:foo'` → new env with `ownerDrive: 'team:foo'`. Reducer asserts caller is a team member.
5. **Publish `@foo/widget`** → Verdaccio + Renown plugin verifies (foo exists, eth ∈ members) → publish stored → reconciler picks up within 60s → `team:foo`'s BuilderTeam doc gets `addPackage` + `updatePackageInfo`.
6. **Publish `widget-cli` (unscoped)** → any authenticated user → reconciler routes to `user:<publisher-eth>` drive → BuilderAccount doc gets `addPackage` + `updatePackageInfo`.
7. **Discovery: `/builders`** → vetra-builders subgraph query, `WHERE source_drive_id LIKE 'team:%' OR source_drive_id = 'powerhouse'` (during migration) → single result set, no fan-out.

## Auth / permissions

- **Write to `user:<eth>` drive.** Doc reducers (`BuilderAccount`, user-owned `VetraCloudEnvironment`) call `assertOwner(action.context.signer.user.address === eth)`. Same pattern as today's `vetra-cloud-package/reducers/data-management.ts:assertOwner`.
- **Write to `team:<slug>` drive.** Doc reducers call `assertTeamMember(team, signerAddress)`. Helper lives in vetra-builder-package and is reused by team-env reducers in vetra-cloud-package via a small `getTeamMembers(teamSlug)` resolver call at validation time (or membership snapshot embedded in the action context).
- **Drive-level ACL.** Out of scope for v1. Reactor-level drive ACLs would harden against malicious clients bypassing reducer checks; we rely on signature-validating reducer guards for now.
- **Reads.** All drives are publicly readable. No change.
- **Verdaccio publish auth.** Plugin enforces "scope = team slug" + "eth ∈ team.members" for scoped names; allows any authenticated user for unscoped names. The plugin is the only enforcement layer for publishing — the registry is the source of truth.

## Migration

### Phase 0 — Foundation, no behavior change

**Goal:** New schema + helpers shipped; behavior unchanged.

- vetra-builder-package: `BuilderAccount` reducers implemented; `setSlug` no-op-on-non-draft; subgraph adds `source_drive_id` column (nullable, backfilled to `'powerhouse'`).
- vetra-cloud-package: `ownerDrive` field added to `VetraCloudEnvironment`; reducer backfills from legacy `owner` for unset docs; subgraph adds `source_drive_id` column.
- vetra.to: drive-context helpers (`userDriveFor`, `teamDriveFor`, `useUserDrive`, etc.) added; controllers refactored to accept `parentIdentifier` per call but callers still pass the legacy `DRIVE_ID` constant.

**Verification:** existing flows (create-team, list teams, list envs) unchanged on staging.

### Phase 1 — New writes target new drives

**Goal:** All new teams and new envs land in their per-entity drives. Reads federate over old + new.

- vetra.to: team-creation wizard writes to `team:<slug>`. User drive auto-bootstrap on first authenticated render. Personal env creation targets `user:<eth>`. Team env creation targets `team:<slug>`.
- Subgraph processors now process every drive (drive-agnostic).
- Resolvers federate: `'powerhouse'` rows + `'user:'`/`'team:'` rows both appear in discovery queries.
- Registry: still flat (Verdaccio plugin work not yet shipped; treat all packages as legacy/unscoped → user-drive).

**Verification:** new teams appear on /builders. New envs appear on /profile. Existing teams + envs unchanged.

### Phase 2 — One-shot migration

**Goal:** Move existing 'powerhouse' docs into their per-entity drives.

- Migration tool (script in vetra-builder-package + vetra-cloud-package; runnable as `ph migrate-to-multi-drive --dry-run | --execute`):
  - For each `BuilderTeam` doc in `'powerhouse'`: create `team:<slug>` drive (skip if exists), copy doc preserving id + history, append a `MIGRATED_TO` system op to the legacy doc.
  - For each `VetraCloudEnvironment` in `'powerhouse'`: ensure `ownerDrive` is set, copy to that drive, append `MIGRATED_TO`.
- Subgraph dedupe: any row whose source doc has `MIGRATED_TO` set is dropped from the federated read.
- Dry-run mode reports what would move; execute mode actually writes.

**Verification:** migration tool's dry-run output matches execute run; pre/post discovery returns the same teams and envs.

### Phase 3 — Cutover

**Goal:** Remove all references to `'powerhouse'`.

- Subgraph processors stop reading `'powerhouse'`.
- `NEXT_PUBLIC_CLOUD_DRIVE_ID` env var removed from vetra.to.
- `'powerhouse'` drive marked read-only for archival.
- Verdaccio + Renown plugin extension shipped (scope auth). Reconciler enabled.

**Verification:** end-to-end smoke — new user, publish unscoped, see on profile; create team, publish scoped, see on /builders/[slug].

## Testing

### Unit

- `BuilderAccount` reducers: full coverage of profile / spaces / member / packages actions (TDD).
- `assertTeamMember` and `assertOwner` helpers: signer × state matrix (signer matches member, signer != member, no signer, deleted member).
- Drive-id helpers: `userDriveFor`, `teamDriveFor`, `parseDriveId` round-trip.
- `VetraCloudEnvironment` `ownerDrive` backfill: legacy fixture with `owner` only → reducer reads → `ownerDrive` derived correctly.
- `setSlug` lock: pre-draft permits, post-draft throws `SlugLockedError`.

### Integration

- vetra.to with mocked reactor:
  - Create team flow → drive created, doc inside, slug locked.
  - Create env (personal) → targets user drive, `ownerDrive: 'user:<eth>'`.
  - Create env (team) → targets team drive, `ownerDrive: 'team:<slug>'`, non-member writes rejected.
  - User drive auto-bootstrap → idempotent on second render.
- vetra-builder-package: end-to-end "publish event → reconciler → BuilderTeam.addPackage" simulated with a stubbed registry.

### Migration

- Idempotent: running `--execute` twice produces the same end-state.
- Round-trip: serialize a small fixture of teams + envs into 'powerhouse', run migration, serialize the resulting per-entity drives, compare semantically equal.
- Dry-run: report output matches execute-mode side effects.

### End-to-end (staging smoke)

- New user signs in → user drive auto-created → publishes unscoped pkg → sees it on /profile.
- User creates team → publishes `@team-slug/pkg` → pkg shows on /builders/[slug].
- Cross-drive discovery: /builders returns teams from both legacy and new drives during migration.

## Out of scope (v1)

- Drive-level ACL in the reactor (reducer guards are sufficient).
- Webhook-based publish notification (poll-based reconciler is enough; webhooks are an upgrade).
- Cross-team package transfer (manual admin operation if ever needed).
- Per-package drives (the `vetraDriveUrl` field stays free-form and can become a future "package gets its own drive" iteration).
- Multi-version package history surfaced in UI (the registry already has it; UI exposure can come later).
- Paid packages / billing integration (separate concept doc).

## Open questions

None blocking. The following are deferred to implementation:

- Exact shape of the `system signer` identity used by the reconciler (Renown-managed key vs reactor-internal). Picked at Phase 3 implementation.
- Cache invalidation strategy for the Verdaccio plugin's "is user a team member?" check (30s TTL is a starting point).
- Whether `BuilderAccount.spaces[]` and `BuilderAccount.members[]` are useful at all, or whether we should slim the account doc down to `profile` + `packages[]` only. Defaulting to "implement what the schema already has" to avoid schema churn; can simplify later.
