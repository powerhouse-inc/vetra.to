# Database Explorer

**Status:** draft
**Date:** 2026-05-12
**Driver:** Tenant owners want schema introspection and ad-hoc SQL execution
against their environment's Postgres from within the Vetra Cloud UI, without
a local psql client or a separate admin tool.

## Problem

The Database tab in the Switchboard service drawer surfaces only dump
management today. Owners who want to inspect the schema, run a diagnostic
SELECT, or understand a data problem must shell into a pod or configure a
local psql client with the tenant's connection string — a barrier that is
especially painful during on-call incidents.

## Goal

Add a **Database Explorer** sub-surface within the existing Database section
of the Switchboard drawer. The explorer has four capabilities shipped in
ordered slices:

1. **Schema browser** — collapsible tree of schemas, tables, columns, and
   indexes. Read-only describe, no query execution.
2. **Query execution** — SQL editor + results table. Read-only queries only
   (SELECT, EXPLAIN, SHOW). Results capped at 1 000 rows (user-bumpable to
   10 000). Execution wrapped server-side in `BEGIN READ ONLY … ROLLBACK`
   with a 5 s statement timeout.
3. **Query history** — per-environment recent-queries list, localStorage
   only.
4. **Result charting / export** — time-series chart for numeric result
   columns; CSV download.

## Non-goals

- Write access of any kind (INSERT, UPDATE, DELETE, DDL, COPY, CALL, DO).
  Not in any slice; requires a separate security review before consideration.
- Direct browser-to-Postgres connections. All queries route through the
  backend.
- Server-side audit log in v1. Flagged as future work.
- Per-env feature flag (`dbExplorerEnabled`) in the doc model in v1. Gating
  is owner-check in the resolver and `canEdit` in the UI. A kill-switch
  state field can be added post-v1 without a breaking doc-model change.
- Explorer for envs where SWITCHBOARD is disabled or `tenantId` is null.
- A dedicated read-only Postgres role per tenant in v1. The `READ ONLY`
  transaction wrapping is the primary guard; a `vetra_explorer` role with
  SELECT-only grants is the recommended future hardening step.

---

## Security

This section is mandatory reading before any slice implementation begins.

### Authentication

Every call to the observability subgraph carries a Renown bearer token
minted by `getAuthToken(renown)` at `modules/cloud/graphql.ts:51`. The
token is a DID-JWT signed by the user's wallet; the subgraph verifies it
via `verifyAuthBearerToken`. This is identical to the mechanism used by
every existing privileged mutation (`requestEnvironmentDump`, `setEnvVar`,
`setCustomDomain`). No call is made without a valid token; callers surface
an error banner if `getAuthToken` returns null.

### Authorization

Both `describeDatabase` and `executeReadOnlyQuery` are **owner-only**. The
resolver loads the env row by `tenantId`, compares `envRow.owner.toLowerCase()`
with the verified caller address, and raises `ForbiddenError` otherwise.
This mirrors the dump resolver pattern documented in
`2026-05-07-environment-database-dump-design.md`.

The UI additionally gates both operations behind `canEdit` (= `canSign &&
!isInactive`). `canEdit` is already threaded into `ServiceDetailDrawer`
via `props.canEdit`. The Explorer sub-tab trigger is not rendered when
`canEdit` is false — a non-owner sees Backups only.

### Transport

Queries are never sent from the browser to Postgres. The browser sends a
signed GraphQL mutation to the observability subgraph (same switchboard
host and `Authorization: Bearer` pattern as all other mutations). The
subgraph opens a server-side Postgres connection using the tenant's
existing app credentials (the `<tenantNs>-pg-app` secret) and executes
the query server-side. This is the same credential path used by the
`pg_dump` Job.

### Statement sandboxing (`executeReadOnlyQuery` resolver)

The resolver wraps every execution in:

```sql
BEGIN READ ONLY;
SET LOCAL statement_timeout = '5s';
SET LOCAL lock_timeout = '2s';
<user sql — first statement only>
ROLLBACK;
```

`READ ONLY` is a transaction-level guard that prevents any write
regardless of the Postgres role. `statement_timeout = 5s` kills runaway
full-table scans. `ROLLBACK` is unconditional, preventing any side-effects
from functions called inside the query. The resolver extracts only the
first statement from the submitted SQL (splits on `;`, takes index 0,
trims); remaining statements are discarded and the UI displays an inline
notice.

### Blocked keyword check (defence-in-depth)

Before hitting the DB, the resolver pattern-matches the first statement
(case-insensitive, after stripping `--` line and `/* */` block comments)
and rejects without execution if the leading keyword is any of: `INSERT`,
`UPDATE`, `DELETE`, `DROP`, `CREATE`, `ALTER`, `TRUNCATE`, `GRANT`,
`REVOKE`, `COPY`, `CALL`, `DO`, `EXECUTE`. This is defence-in-depth on
top of `READ ONLY`, not a replacement for it.

### Max result size

`executeReadOnlyQuery` accepts an optional `limit` argument (default
1 000, hard cap 10 000). The resolver appends `LIMIT <n>` when the user
SQL has no `LIMIT` clause; when one is already present it is capped to
the enforced maximum. The response JSON is additionally capped at 4 MB;
the resolver truncates rows until the payload fits and sets `truncatedAt`
in the response.

---

## Doc-model / backend contract

### New types — `modules/cloud/types.ts`

```ts
export type DatabaseQueryResult = {
  columns: string[]
  rows: (string | null)[][] // cells serialized to string; null = SQL NULL
  rowCount: number
  truncatedAt: number | null // set when rows were capped at the limit
  executionMs: number
}

export type DatabaseColumnInfo = {
  name: string
  type: string
  nullable: boolean
  default: string | null
  isPrimaryKey: boolean
}

export type DatabaseIndexInfo = {
  name: string
  columns: string[]
  unique: boolean
}

export type DatabaseTableInfo = {
  name: string
  columns: DatabaseColumnInfo[]
  indexes: DatabaseIndexInfo[]
}

export type DatabaseSchemaInfo = {
  name: string
  tables: DatabaseTableInfo[]
  truncated?: boolean // true when table count exceeded the server cap (500)
}

export type DatabaseSchema = {
  schemas: DatabaseSchemaInfo[]
}
```

### New GraphQL functions — `modules/cloud/graphql.ts`

```ts
// Slice 1 — owner-gated query
export async function describeDatabase(
  tenantId: string,
  token?: string | null,
): Promise<DatabaseSchema>

// Slice 2 — owner-gated mutation
export async function executeReadOnlyQuery(
  tenantId: string,
  sql: string,
  limit: number,
  token?: string | null,
): Promise<DatabaseQueryResult>
```

`describeDatabase` is a GraphQL `query`. `executeReadOnlyQuery` is a
GraphQL `mutation` (non-idempotent by GraphQL convention, even though it
produces no persistent writes).

### Observability subgraph additions (not in this repo)

**`describeDatabase(tenantId: String!): DatabaseSchema!`** — query,
owner-gated. Runs `information_schema.tables`,
`information_schema.columns`, and `pg_indexes` via the tenant's Postgres.
Capped at 500 tables per schema. Returns a static structural snapshot.

**`executeReadOnlyQuery(tenantId: String!, sql: String!, limit: Int): DatabaseQueryResult!`**
— mutation, owner-gated. Wraps execution in `BEGIN READ ONLY … ROLLBACK`
as described in Security above. Cells serialized to strings for JSON
transport. Returns `executionMs`.

---

## Components

### Slice 1 — schema browser

**New: `modules/cloud/components/database-schema-tree.tsx`**

```ts
type Props = {
  schema: DatabaseSchema | null
  isLoading: boolean
  onTableClick: (schemaName: string, tableName: string) => void
}
```

Collapsible tree using `Collapsible*` primitives. Three levels: schema →
table → column list. Index count shown as a `<Badge size="xs">`. Column
rows show `name`, `type`, and a nullable indicator dot. `onTableClick` is
wired in Slice 2 to inject SQL.

**New: `modules/cloud/hooks/use-database-schema.ts`**

```ts
export function useDatabaseSchema(tenantId: string | null): {
  schema: DatabaseSchema | null
  isLoading: boolean
  error: string | null
  refresh: () => void
}
```

Fetches once on mount + on `tenantId` change. No polling. `refresh()`
re-fetches on demand. Follows `use-environment-dumps.ts`'s pattern.

**New: `modules/cloud/components/database-explorer-tab.tsx`** (Slice 1
stub) — header bar + `<DatabaseSchemaTree>`. No editor / result panel yet.

**New: `modules/cloud/components/database-tab-body.tsx`** — inner sub-tabs
(Backups | Explorer). Absorbs the Restore footnote from the drawer.

**Changed: `modules/cloud/components/service-detail-drawer.tsx`** —
replace the inline `TabsContent value="database"` body with
`<DatabaseTabBody tenantId canEdit />`. Remove the direct
`DatabaseBackupsTab` import.

### Slice 2 — query execution

**Changed: `database-explorer-tab.tsx`** — full split-pane layout via
`ResizablePanelGroup direction="vertical"`. Left = schema tree; right =
CodeMirror SQL editor + toolbar; bottom = result panel.

Editor: `@uiw/react-codemirror` + `@codemirror/lang-sql` extension.
Cmd/Ctrl+Enter fires run.

Toolbar: `<AsyncButton pendingLabel="Running…">Run</AsyncButton>` plus a
row-limit `<Select>` (100 / 1 000 / 5 000 / 10 000; default 1 000).

Result panel states: pre-run empty / loading skeleton / error banner /
success table with sticky header. Null cells render as italic `null`.
Footer shows `{rowCount} rows · {executionMs} ms` and a truncation
notice when set.

**New: `modules/cloud/hooks/use-database-query.ts`**

```ts
export function useDatabaseQuery(tenantId: string | null): {
  result: DatabaseQueryResult | null
  isRunning: boolean
  error: string | null
  run: (sql: string, limit: number) => Promise<void>
}
```

**New dependencies — `package.json`**

```json
"@codemirror/lang-sql": "^6.0.0",
"@uiw/react-codemirror": "^4.0.0"
```

Other `@codemirror/*` packages are already resolved as transitive deps of
`@powerhousedao/reactor-browser`.

### Slice 3 — query history

**New: `modules/cloud/hooks/use-query-history.ts`** — localStorage-backed
per-tenant history (`db-query-history:${tenantId}`), capped at 20,
deduplicated (matching SQL moves to the front rather than appending).

**Changed: `database-explorer-tab.tsx`** — history popover toolbar button
opens a `<Popover>` listing recent queries; clicking sets editor value.
Successful runs call `history.push(sql)`.

### Slice 4 — charting and export

**New: `modules/cloud/components/database-result-chart.tsx`** — when the
result has ≥1 numeric column, render a `recharts` `LineChart`. First
non-numeric column is the X axis; each numeric column is a series.
Reuses the `COLORS` constant from `sparkline.tsx`.

**Changed: `database-explorer-tab.tsx`** — Chart toggle in the result
footer (visible only when ≥1 numeric column) + Download CSV button
(RFC 4180-quoted; no server round-trip).

---

## Data flow

```
ServiceDetailDrawer (kind=switchboard, tenantId set, canEdit=true)
└ TabsContent value="database"
  └ DatabaseTabBody
    ├ "backups" sub-tab → DatabaseBackupsTab (unchanged)
    └ "explorer" sub-tab → DatabaseExplorerTab
       ├ useDatabaseSchema(tenantId)
       │     getAuthToken(renown) → Bearer token
       │     describeDatabase(tenantId, token)    [subgraph query]
       │     → DatabaseSchema → DatabaseSchemaTree renders
       │
       ├ ResizablePanelGroup (vertical)
       │   ├ [left]  DatabaseSchemaTree → onTableClick injects SQL
       │   ├ [right] CodeMirror SQL editor + toolbar (Run + limit)
       │   └ ResultPanel (Table + footer)
       │
       └ handleRun → useDatabaseQuery.run(sql, limit)
             getAuthToken(renown) → Bearer token
             executeReadOnlyQuery(tenantId, sql, limit, token)  [mutation]
             → DatabaseQueryResult → ResultPanel renders
```

---

## Edge cases

- **`tenantId` null** — hooks return empty state; Explorer sub-tab is
  not rendered.
- **Env not READY** — `canEdit` is false; Explorer sub-tab is not
  rendered. No subgraph calls are made.
- **Expired auth token** — `getAuthToken` returns null; error banner
  surfaces; user re-authenticates via Renown.
- **Schema too large** — server caps at 500 tables/schema and sets
  `truncated: true`. Tree renders a "more tables (truncated)" leaf.
- **Multi-statement input** — resolver runs only the first statement;
  the UI displays an inline notice when a trailing `;` is detected.
- **Query in flight at unmount** — the HTTP connection closes; the
  subgraph `statement_timeout` (5 s) is the backstop. `useAsyncAction`'s
  `mountedRef` guard prevents state updates on the unmounted component.
- **CodeMirror SSR** — `DatabaseExplorerTab` is `'use client'` already;
  no `dynamic(…, { ssr: false })` wrapper is needed.
- **Concurrent Run clicks** — `AsyncButton` disables itself while
  pending; double-clicks naturally suppressed.

---

## Verification

### Slice 1 — schema browser

1. Open Switchboard drawer on a READY env you own. Database tab shows
   two sub-tabs: **Backups** and **Explorer**.
2. Click Explorer. Schema tree loads within ~2 s for a typical env.
3. Clicking a schema or table expands/collapses children.
4. Index count renders as `<Badge size="xs" variant="outline">`.
5. Non-owner viewer: Explorer sub-tab absent; Backups unchanged.
6. Refresh button re-fetches the snapshot.
7. `pnpm tsc` + `pnpm lint` clean.

### Slice 2 — query execution

1. `SELECT 1 AS n, 'hello' AS s` → table shows one data row.
2. Cmd/Ctrl+Enter runs the query.
3. Row-limit `100` against a large table → at most 100 rows; footer
   reads "Truncated at 100 rows".
4. `DELETE FROM foo` → blocked-keyword error banner; no rows affected.
5. `SELECT pg_sleep(10)` → statement-timeout error within ~6 s.
6. Clicking a table name in the tree populates the editor with
   `SELECT * FROM <schema>.<table> LIMIT 100`.
7. SQL NULL cells render as italic `null`.
8. `pnpm tsc` + `pnpm lint` clean.

### Slice 3 — query history

1. Run three distinct queries. Clock icon → popover lists them newest-first.
2. Clicking an entry sets the editor value.
3. Reload page → history persists.
4. Different env shows a separate list.
5. "Clear" empties the list.

### Slice 4 — charting and export

1. `SELECT generate_series(1,5) AS x, random() AS y` → "Chart" toggle
   appears; toggling renders a line chart.
2. "Download CSV" produces `result.csv` with the right header + rows.
3. Result with no numeric columns: no Chart toggle.

---

## Implementation order

### Slice 1 — schema browser

- [ ] Types in `modules/cloud/types.ts`.
- [ ] `describeDatabase()` in `modules/cloud/graphql.ts`.
- [ ] `modules/cloud/hooks/use-database-schema.ts`.
- [ ] `modules/cloud/components/database-schema-tree.tsx`.
- [ ] `modules/cloud/components/database-explorer-tab.tsx` (schema tree only).
- [ ] `modules/cloud/components/database-tab-body.tsx` (Backups | Explorer).
- [ ] `service-detail-drawer.tsx`: replace inline body with `<DatabaseTabBody>`.
- [ ] Storybook story: `database-schema-tree.stories.tsx`.
- [ ] Commit: `feat(cloud): database explorer — schema browser (slice 1)`

### Slice 2 — query execution

- [ ] `DatabaseQueryResult` type.
- [ ] `executeReadOnlyQuery()` in `graphql.ts`.
- [ ] Add `@codemirror/lang-sql` + `@uiw/react-codemirror` to `package.json`.
- [ ] `modules/cloud/hooks/use-database-query.ts`.
- [ ] Extend `database-explorer-tab.tsx` with the split-pane layout +
      CodeMirror editor + toolbar + result panel.
- [ ] Storybook story: `database-explorer-tab.stories.tsx`.
- [ ] Commit: `feat(cloud): database explorer — query execution (slice 2)`

### Slice 3 — query history

- [ ] `modules/cloud/hooks/use-query-history.ts`.
- [ ] Extend `database-explorer-tab.tsx` with history popover.
- [ ] Commit: `feat(cloud): database explorer — query history (slice 3)`

### Slice 4 — charting and export

- [ ] `modules/cloud/components/database-result-chart.tsx`.
- [ ] Extend `database-explorer-tab.tsx` with Chart toggle and CSV download.
- [ ] Commit: `feat(cloud): database explorer — chart and CSV export (slice 4)`
