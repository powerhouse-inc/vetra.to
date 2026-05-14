# Multi-Drive Ownership — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Flip new team creation to write into per-team drives (`team:<slug>`) and surface enough drive context so existing team edit/manage flows continue to work. Existing teams in the `'powerhouse'` drive remain editable through Phase 1 — they are only migrated in Phase 2.

**Architecture:** Per the spec at `docs/superpowers/specs/2026-05-14-multi-drive-ownership-design.md`. This plan covers Section B of the Phase 1 work: backend (vetra-builder-package) shared-namespace processor + `source_drive_id` column, and frontend (vetra.to) wizard flip + drive-aware edit hooks.

**Tech Stack:** vetra-builder-package (Kysely relational processor + GraphQL subgraph + Renown signer), vetra.to (Next.js 16 + @powerhousedao/reactor-browser).

**Out of scope (deferred to Phase 1b / Phase 2):**

- `BuilderAccount` processor + tables (user drives carry the docs but no read surface yet — Phase 1b)
- User drive auto-bootstrap on first auth (Phase 1b — depends on BuilderAccount read surface)
- Cloud env routing to `user:<eth>` / `team:<slug>` drives (separate session, similar pattern in vetra-cloud-package)
- Verdaccio + Renown plugin (Phase 3)
- Publish reconciler (Phase 3)
- One-shot migration of legacy `'powerhouse'` teams (Phase 2)

---

## Section A — vetra-builder-package (subgraph + processor)

**Repo:** `/home/froid/projects/powerhouse/vetra-builder-package`
**Branch:** `feat/phase1-shared-namespace` (off `dev`)
**Prerequisite:** `ph vetra` MCP **not required** for this work — pure code refactor, no document-model schema changes.

### Task A1: Fixed namespace + propagate drive id

**Files:**

- Modify: `processors/vetra-builder-relational-db-processor/factory.ts`
- Modify: `processors/vetra-builder-relational-db-processor/index.ts`

- [ ] **Step 1: Refactor factory to use a fixed namespace and capture the drive id**

```ts
// factory.ts
import {
  type IProcessorHostModule,
  type ProcessorFilter,
  type ProcessorRecord,
} from '@powerhousedao/reactor'
import { type PHDocumentHeader } from 'document-model'
import { VetraBuilderRelationalDbProcessor } from './index.js'

// "powerhouse" is the existing default namespace key — keeping it preserves
// all current rows. Per-drive processor instances now share the same tables;
// rows are distinguished by source_drive_id.
const SHARED_NAMESPACE_KEY = 'powerhouse'

export const vetraBuilderTeamRelationalDbProcessorFactory =
  (module: IProcessorHostModule) =>
  async (driveHeader: PHDocumentHeader): Promise<ProcessorRecord[]> => {
    const namespace = VetraBuilderRelationalDbProcessor.getNamespace(SHARED_NAMESPACE_KEY)
    const store =
      await module.relationalDb.createNamespace<VetraBuilderRelationalDbProcessor>(namespace)
    const filter: ProcessorFilter = {
      branch: ['main'],
      documentId: ['*'],
      documentType: ['powerhouse/builder-team', 'powerhouse/document-drive'],
      scope: ['global'],
    }
    const processor = new VetraBuilderRelationalDbProcessor(
      namespace,
      filter,
      store,
      driveHeader.id,
    )
    return [{ processor, filter }]
  }
```

- [ ] **Step 2: Update processor to store driveId and pass it to handlers**

```ts
// index.ts (relevant changes only)
export class VetraBuilderRelationalDbProcessor extends RelationalDbProcessor<DB> {
  private builderTeamHandlers: BuilderTeamHandlers;
  private readonly driveId: string;

  constructor(
    _namespace: string,
    _filter: ProcessorFilter,
    relationalDb: IRelationalDb<DB>,
    driveId: string,
  ) {
    super(_namespace, _filter, relationalDb);
    this.driveId = driveId;
    this.builderTeamHandlers = new BuilderTeamHandlers(relationalDb, driveId);
  }

  override async onOperations(operations: OperationWithContext[]): Promise<void> {
    if (operations.length === 0) return;
    for (const op of operations) {
      try {
        if (op.context.documentType.includes("powerhouse/document-drive")) {
          await this.handleDocumentDriveOperation(
            op.context.documentId,
            this.driveId, // was "" — now the actual drive id
            op.operation.action as unknown as { type: string; input: Record<string, unknown> },
            op.operation.resultingState
              ? (JSON.parse(op.operation.resultingState) as Record<string, unknown>)
              : undefined,
          );
        } else {
          await this.builderTeamHandlers.handleBuilderTeamOperation(
            op.context.documentId,
            op.operation.action as unknown as BuilderTeamAction,
            op.operation.resultingState
              ? JSON.parse(op.operation.resultingState)
              : ({} as BuilderTeamState),
          );
        }
      } catch (error) {
        console.error(...); break;
      }
    }
  }
}
```

The drive-drive operation handler uses `this.driveId` instead of `""` for `deleted_files.drive_id`.

- [ ] **Step 3: typecheck**

```bash
npm run typecheck
```

Expected errors: `BuilderTeamHandlers` constructor doesn't take a second arg yet (fixed in A3) — the call site reference is fine for now.

- [ ] **Step 4: Commit**

```bash
git add processors/vetra-builder-relational-db-processor/factory.ts processors/vetra-builder-relational-db-processor/index.ts
git commit -m "feat(processor): shared 'powerhouse' namespace + capture driveId per instance"
```

### Task A2: Add `source_drive_id` column + idempotent migration

**Files:**

- Modify: `processors/vetra-builder-relational-db-processor/schema.ts`
- Modify: `processors/vetra-builder-relational-db-processor/migrations.ts`

- [ ] **Step 1: Add `source_drive_id` to each table interface in `schema.ts`**

Append to `BuilderTeamMembers`, `BuilderTeamPackageKeywords`, `BuilderTeamPackages`, `BuilderTeams`, `BuilderTeamSpaces`:

```ts
source_drive_id: string
```

Add a header comment explaining the semantics. Leave `DeletedFiles` alone — it already has `drive_id`.

- [ ] **Step 2: Update `up()` in migrations.ts**

Two parts:

(a) For each `createTable(...)` call, add the column up-front so any new namespace starts with it:

```ts
.addColumn("source_drive_id", "varchar(255)", (col) =>
  col.defaultTo("powerhouse").notNull(),
)
```

(b) Append a small, idempotent block at the end of `up()` that retroactively adds the column to tables that may already exist without it (deployed staging):

```ts
const tablesNeedingSourceDriveId = [
  'builder_teams',
  'builder_team_members',
  'builder_team_spaces',
  'builder_team_packages',
  'builder_team_package_keywords',
] as const
for (const table of tablesNeedingSourceDriveId) {
  try {
    await db.schema
      .alterTable(table)
      .addColumn('source_drive_id', 'varchar(255)', (col) => col.defaultTo('powerhouse').notNull())
      .execute()
  } catch (err) {
    // Column already exists — postgres throws on duplicate column.
    // Safe to swallow because the migration is meant to be idempotent.
  }
}

// Index for fast prefix filtering in resolvers.
for (const table of tablesNeedingSourceDriveId) {
  await db.schema
    .createIndex(`idx_${table}_source_drive_id`)
    .on(table)
    .column('source_drive_id')
    .ifNotExists()
    .execute()
}
```

- [ ] **Step 3: typecheck**

```bash
npm run typecheck
```

Expected: errors elsewhere (handlers, helpers) — fixed in A3/A4. The schema and migrations file should compile.

- [ ] **Step 4: Commit**

```bash
git add processors/vetra-builder-relational-db-processor/schema.ts processors/vetra-builder-relational-db-processor/migrations.ts
git commit -m "feat(processor): add source_drive_id column to builder_team_* tables"
```

### Task A3: Thread driveId through `BuilderTeamHandlers` and `DatabaseHelpers`

**Files:**

- Modify: `processors/vetra-builder-relational-db-processor/builder-team-handlers.ts`
- Modify: `processors/vetra-builder-relational-db-processor/database-helpers.ts`

- [ ] **Step 1: Update `BuilderTeamHandlers` constructor to take driveId**

```ts
export class BuilderTeamHandlers {
  private dbHelpers: DatabaseHelpers

  constructor(
    private db: IRelationalDb<DB>,
    private driveId: string,
  ) {
    this.dbHelpers = new DatabaseHelpers(db, driveId)
  }
  // ...
}
```

- [ ] **Step 2: Set `source_drive_id` on every insert in this file**

Find every `.insertInto("builder_teams" | "builder_team_members" | "builder_team_spaces" | "builder_team_packages" | "builder_team_package_keywords") .values({...})` call (use grep — there are roughly 5–10 such inserts). For each, add `source_drive_id: this.driveId` to the `values({...})` object.

```bash
grep -n "\.insertInto(" processors/vetra-builder-relational-db-processor/builder-team-handlers.ts
```

For each: extend the values object. Example:

```ts
// Before
await this.db
  .insertInto('builder_teams')
  .values({
    id: documentId,
    profile_name: state.profile.name,
    profile_slug: state.profile.slug,
    // ...
  })
  .execute()

// After
await this.db
  .insertInto('builder_teams')
  .values({
    id: documentId,
    profile_name: state.profile.name,
    profile_slug: state.profile.slug,
    // ...
    source_drive_id: this.driveId,
  })
  .execute()
```

If any handler uses `onConflict((oc) => oc.column("id").doUpdateSet(...))`, also add `source_drive_id: this.driveId` to the update set so cross-drive overwrites don't leave stale source ids.

- [ ] **Step 3: Update `DatabaseHelpers` constructor + `ensurePackageExists`**

```ts
export class DatabaseHelpers {
  constructor(
    private db: IRelationalDb<DB>,
    private driveId: string,
  ) {}

  async ensurePackageExists(documentId: string, driveId: string): Promise<void> {
    // existing logic, but the insert needs:
    //   source_drive_id: this.driveId
  }
}
```

Note that `ensurePackageExists` already has a `driveId` parameter (it's the package's _internal_ drive id from `SetPackageDriveIdInput`, not the source drive). Keep that, just add `source_drive_id: this.driveId` to the insert values.

- [ ] **Step 4: typecheck**

```bash
npm run typecheck
```

Expected: all errors cleared. If new errors surface from inserts that don't have `source_drive_id`, find them via grep.

- [ ] **Step 5: Commit**

```bash
git add processors/vetra-builder-relational-db-processor/builder-team-handlers.ts processors/vetra-builder-relational-db-processor/database-helpers.ts
git commit -m "feat(processor): tag every BuilderTeam row with source_drive_id"
```

### Task A4: Resolver — drop env-var default, expose `sourceDriveId`

**Files:**

- Modify: `subgraphs/vetra-builders/resolvers.ts`
- Modify: `subgraphs/vetra-builders/schema.ts`

- [ ] **Step 1: Update GraphQL schema to expose `sourceDriveId` on `BuilderTeam`**

Find the `BuilderTeam` type in `schema.ts` and add:

```graphql
sourceDriveId: String!
```

- [ ] **Step 2: Resolvers — replace env-var default with the shared namespace constant**

Find this line (resolvers.ts:9 area):

```ts
const DEFAULT_DRIVE_ID = process.env.VETRA_BUILDER_DRIVE_ID || 'powerhouse'
```

Replace with:

```ts
const SHARED_NAMESPACE_KEY = 'powerhouse'
```

Then everywhere the resolver currently passes `driveId ?? DEFAULT_DRIVE_ID` into `getNamespace(...)`, replace with `SHARED_NAMESPACE_KEY` so all queries hit the shared schema regardless of caller-supplied `driveId`.

The optional `driveId` resolver-context parameter becomes vestigial — keep accepting it for backward compat, but ignore it.

- [ ] **Step 3: Return `source_drive_id` in selected columns**

Every query that builds a `BuilderTeam` result should include `source_drive_id` in `.select([...])`, mapped to `sourceDriveId` in the GraphQL response object:

```ts
.select([
  "id",
  "profile_name",
  "profile_slug",
  // ...existing...
  "source_drive_id",
])
// ...
return rows.map((r) => ({
  id: r.id,
  name: r.profile_name,
  slug: r.profile_slug,
  // ...existing...
  sourceDriveId: r.source_drive_id,
}))
```

- [ ] **Step 4: typecheck + lint**

```bash
npm run typecheck && npm run lint:fix
```

- [ ] **Step 5: Commit**

```bash
git add subgraphs/vetra-builders/
git commit -m "feat(vetra-builders): expose sourceDriveId, drop env-var default"
```

### Task A5: Build, version bump, publish

- [ ] **Step 1: Build**

```bash
ph build
```

Watch for any rolldown errors (esp. around the renamed namespace).

- [ ] **Step 2: Bump version in `package.json`** (next dev tag, e.g. `5.2.0-dev.63`).

- [ ] **Step 3: Publish**

```bash
ph publish --registry https://registry.dev.vetra.io
```

If npm login required, STOP and ping user. Capture the published version.

- [ ] **Step 4: Push branch + open PR**

```bash
git push -u origin feat/phase1-shared-namespace
gh pr create --base dev --title "feat(processor): shared namespace + source_drive_id (Phase 1)" --body "..."
```

---

## Section B — vetra.to (drive-aware edit hooks + wizard flip)

**Repo:** `/home/froid/projects/powerhouse/vetra.to`
**Branch:** `feat/phase1-team-drives` (off `staging`)
**Prerequisite:** Section A merged and published.

### Task B1: Bump vetra-builder-package version

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Update tarball URL** to the new version from Section A5.

```bash
pnpm install
npm run tsc
```

Expected: GraphQL types need regeneration if codegen is used; otherwise the new `sourceDriveId` field should already typecheck via `Maybe<string>` defaults.

If codegen needed:

```bash
npm run codegen
```

- [ ] **Step 2: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: bump vetra-builder-package for sourceDriveId support"
```

### Task B2: Surface `sourceDriveId` in `FullTeam`

**Files:**

- Modify: `modules/profile/lib/create-team-queries.ts` (or wherever `FullTeam` + GQL queries live)
- Modify: any callers consuming `FullTeam`

- [ ] **Step 1: Add `sourceDriveId` to the GraphQL query**

Grep for the `fetchBuilderTeamBySlug` and related queries; add `sourceDriveId` to the selection set.

- [ ] **Step 2: Extend the `FullTeam` TypeScript type** to include `sourceDriveId: string`.

- [ ] **Step 3: Update any place that constructs a `FullTeam` from GQL response** to copy through `sourceDriveId`.

- [ ] **Step 4: typecheck**

```bash
npm run tsc
```

- [ ] **Step 5: Commit**

```bash
git add modules/profile/lib/
git commit -m "feat(profile): surface sourceDriveId on FullTeam"
```

### Task B3: Edit hooks use the team's source drive

**Files:**

- Modify: `modules/profile/lib/use-update-team-profile.ts`
- Modify: `modules/profile/lib/use-team-members.ts`
- Modify: `modules/profile/lib/use-team-spaces.ts`

- [ ] **Step 1: In each hook, change `parentIdentifier: DRIVE_ID` to `parentIdentifier: team.sourceDriveId`**

```ts
const controller = await loadBuilderTeamController({
  documentId: team.id,
  parentIdentifier: team.sourceDriveId, // was DRIVE_ID
  signer,
})
```

This makes the edit hook target whichever drive the team actually lives in — `'powerhouse'` for legacy teams, `'team:<slug>'` for new teams.

- [ ] **Step 2: Drop the now-unused `DRIVE_ID` import** from each file.

- [ ] **Step 3: typecheck**

```bash
npm run tsc
```

- [ ] **Step 4: Commit**

```bash
git add modules/profile/lib/use-update-team-profile.ts modules/profile/lib/use-team-members.ts modules/profile/lib/use-team-spaces.ts
git commit -m "feat(profile): edit hooks target team.sourceDriveId"
```

### Task B4: Wizard flips to `team:<slug>` drive

**Files:**

- Modify: `modules/profile/lib/use-create-team.ts`

- [ ] **Step 1: Imports**

```ts
import { teamDriveFor } from '@/modules/cloud/drive-context'
import { client } from '@/modules/cloud/client'
```

- [ ] **Step 2: Inside `createTeam` — add drive before doc**

The reactor exposes `client.mutations.addDrive(...)` or similar. Confirm exact name by:

```bash
grep -n "addDrive" node_modules/@powerhousedao/reactor-browser/dist/*.d.ts | head -5
```

Then before `createNewBuilderTeamController({...})`:

```ts
const driveId = teamDriveFor(form.slug)
// Create the team drive (idempotent — if it exists, the reactor returns
// the existing drive without error). The drive holds the BuilderTeam doc.
await client.mutations.addDrive({
  id: driveId,
  name: form.name,
  slug: form.slug,
})

const controller = createNewBuilderTeamController({
  parentIdentifier: driveId, // was DRIVE_ID
  signer,
})
```

If `client.mutations.addDrive` doesn't exist on reactor-browser, fall back to a raw GraphQL call against `getEndpoint()` using the `addDrive` mutation that's already in `modules/__generated__/graphql/gql-generated.ts:1282`.

- [ ] **Step 3: typecheck**

```bash
npm run tsc
```

- [ ] **Step 4: Commit**

```bash
git add modules/profile/lib/use-create-team.ts
git commit -m "feat(profile): create-team wizard writes to team:<slug> drive"
```

### Task B5: Push staging, validate end-to-end

- [ ] **Step 1: Final checks**

```bash
npm run tsc && npm run lint
```

- [ ] **Step 2: Push staging**

```bash
git checkout staging
git merge feat/phase1-team-drives
git push origin staging
```

Watch staging build, wait for Argo sync.

- [ ] **Step 3: Smoke test on staging**

- Create a new team via the wizard. Confirm:
  - `team:<slug>` drive exists (via switchboard introspection or `client.queries.drives`)
  - The team appears on `/builders`
  - The team is editable via `/profile/teams/[slug]` (member add, space add, etc.)
- Confirm an existing legacy team in `'powerhouse'` drive is still editable.

---

## Stopping conditions

- npm login required for `ph publish` in Section A5
- `pnpm install` fails or pulls a different transitive set of `@powerhousedao/*` versions (re-resolve carefully)
- Wizard submit fails with "drive already exists" — make sure slug uniqueness is enforced in `useSlugAvailability` (already exists but verify)
- Smoke test on staging shows the new team isn't visible on /builders — likely a resolver bug (check the GraphQL response for `sourceDriveId`)

## Acceptance

Phase 1 is done when:

- vetra-builder-package: new dev version published, PR open against `dev`, processor uses shared namespace, all BuilderTeam rows carry `source_drive_id`, resolvers expose `sourceDriveId`.
- vetra.to: wizard creates `team:<slug>` drive + writes BuilderTeam doc there. Edit hooks target `team.sourceDriveId`. Existing teams still work. Pushed to `staging`.
- Smoke test on staging passes end-to-end.

## Follow-ups (Phase 1b / Phase 2)

- BuilderAccount processor + tables (read surface for user drives)
- User drive auto-bootstrap on first auth
- vetra-cloud-package equivalent (`source_drive_id` on env tables, cloud env writes target `user:<eth>` / `team:<slug>`)
- One-shot migration of legacy `'powerhouse'` teams into per-team drives (Phase 2)
- Verdaccio + Renown plugin extension (Phase 3)
- Publish reconciler (Phase 3)
