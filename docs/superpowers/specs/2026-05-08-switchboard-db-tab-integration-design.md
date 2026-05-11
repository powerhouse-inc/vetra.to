# Switchboard drawer — Database tab integration

**Status:** draft
**Date:** 2026-05-08
**Driver:** Database lives as a standalone row + drawer next to the Switchboard
service, but it's conceptually owned by Switchboard (SWITCHBOARD is the chart's
gating service for the CNPG cluster). Surfacing it as a tab inside the
Switchboard drawer matches that reality and removes a duplicate UI surface.

## Problem

On the env detail page today:

- Services CONNECT / SWITCHBOARD / FUSION live in the overview list. Each opens
  `ServiceDetailDrawer` with three tabs: **Logs / Metrics / Activity**.
- The database lives in a **separate** `DatabaseRow` (a single button row
  below the services) that opens `DatabaseDetailDrawer` with two tabs:
  **Backups / Overview**.
- The `DatabaseRow` only renders when `SWITCHBOARD` is enabled — the comment
  at `app/cloud/[project]/page.tsx:273-276` calls SWITCHBOARD the
  "gating service" for the CNPG cluster.

So the DB is already a child of Switchboard at the platform level, but the UI
treats it as an independent peer with its own row, its own drawer, its own
tabs. That split means:

- Users learn two patterns for what is one resource.
- The DB Overview tab is barely useful content (cluster name, engine, pooler
  - one sentence about Grafana) yet eats a top-level tab and a drawer mount.
- Drawer URL state has three top-level scopes (`service`, `agent`, `database`)
  when it could have two.

## Goal

Fold the DB UI into the Switchboard service drawer as a single **Database**
tab. Remove the standalone row and the standalone DB drawer. Keep the dump
pipeline, hooks, and `DumpRow` component untouched — only the framing changes.

## Non-goals

- Redesigning the dump list or the dump pipeline (recently shipped — leave
  alone).
- Adding similar tabs to CONNECT or FUSION (no DB association there).
- Redirecting old `?drawer=database:main` URLs (this is admin UI; old links
  no-op rather than error).
- Renaming `database-backups-tab.tsx` — its content is reused, the file name
  isn't load-bearing.

## The pattern

The Switchboard drawer gains one tab. When `kind === 'switchboard'` and
`tenantId` is set, the tab list goes from 3 to 4:

```
Switchboard drawer
├ Logs
├ Metrics
├ Activity
└ Database  ← new (conditional on switchboard + tenantId)
```

Other services (CONNECT, FUSION) stay at 3 tabs.

The Database tab body is the existing `DatabaseBackupsTab` content, with a
compact cluster-info header strip absorbed from the old `DatabaseOverviewTab`
and the existing "Restore" footnote retained.

## Components

### `modules/cloud/components/service-detail-drawer.tsx`

Add a conditional fourth tab:

```tsx
import { Database } from 'lucide-react'
import { DatabaseBackupsTab } from './database-backups-tab'

// new prop
type Props = {
  // ...existing props...
  canEdit: boolean
}

// inside the TabsList:
{
  kind === 'switchboard' && tenantId && (
    <TabsTrigger value="database" className="gap-1.5">
      <Database className="h-3.5 w-3.5" /> Database
    </TabsTrigger>
  )
}

// inside the tab content area, after Activity:
{
  kind === 'switchboard' && tenantId && (
    <TabsContent value="database" className="mt-0">
      <div className="text-muted-foreground mb-4 flex items-center justify-between text-xs">
        <span>
          <span className="font-mono">{tenantId}-pg</span> · postgres 16
        </span>
      </div>
      <DatabaseBackupsTab tenantId={tenantId} canEdit={canEdit} />
      <p className="text-muted-foreground mt-4 text-[11px]">
        Detailed metrics, replication lag and connection counts live in the cluster-wide Grafana
        dashboards.
      </p>
    </TabsContent>
  )
}
```

The Database tab is only mounted when both gates pass; for other services
the tab trigger and content simply don't render.

### `modules/cloud/components/database-backups-tab.tsx`

No code change. Already self-contained (uses `useEnvironmentDumps`, renders
`DumpRow`, owns its create-dump button). The existing inner footnote
`Restore: pg_restore -d <url> file.dump` stays as-is.

### Deletions

- `modules/cloud/components/database-row.tsx` (34 lines)
- `modules/cloud/components/database-detail-drawer.tsx` (77 lines)
- `modules/cloud/components/database-overview-tab.tsx` (29 lines)

### `app/cloud/[project]/page.tsx`

Remove the `DatabaseRow` import + render block (currently lines 277-282).

Remove the `DatabaseDetailDrawer` import + mount block (currently lines
310-320).

Pass `canEdit={canSign && !isInactive}` to `ServiceDetailDrawer` (the same
value previously passed to `DatabaseDetailDrawer`).

### `modules/cloud/hooks/use-detail-drawer.ts`

Narrow the `DrawerScope` union — drop the `database` variant:

```ts
export type DrawerScope =
  | { kind: 'service'; id: 'connect' | 'switchboard' | 'fusion' }
  | { kind: 'agent'; id: string }
```

In `parseDrawer`, drop the `kind === 'database'` branch. Old URLs with
`?drawer=database:main` will silently no-op (parse returns null = no drawer
open), which is the desired graceful fallback.

## URL migration

| Today                                      | After                                                |
| ------------------------------------------ | ---------------------------------------------------- |
| `?drawer=database:main&drawerTab=backups`  | `?drawer=service:switchboard&drawerTab=database`     |
| `?drawer=database:main&drawerTab=overview` | same as above (Overview tab is gone, content folded) |

No explicit redirect. Pre-existing bookmarks are admin-internal and rare;
worst case the drawer doesn't open.

## Verification

After the change:

1. **Switchboard enabled, env READY**: Open the Switchboard drawer. Four tabs
   show: Logs / Metrics / Activity / Database. Click Database → dump list
   renders, cluster-info header reads `<tenant>-pg · postgres 16`, "Create
   dump" button is enabled when `canEdit` is true.
2. **Switchboard disabled** (or env without SWITCHBOARD): The Switchboard
   service row doesn't render at all (existing behaviour). No Database tab to
   miss. No standalone DatabaseRow visible (it's been removed).
3. **CONNECT / FUSION drawers**: Still show 3 tabs (Logs / Metrics / Activity).
   No Database tab leaks in.
4. **Direct dump-URL load**: Hitting `/cloud/<id>?drawer=service:switchboard&drawerTab=database`
   opens the Switchboard drawer on the Database tab.
5. **Stale URL fallback**: `/cloud/<id>?drawer=database:main` no longer opens
   anything; the rest of the page renders normally.
6. **Type-check + lint pass**: `pnpm tsc` and `pnpm lint` clean.

## Out of scope / follow-ups

- A future change could move the dump cancellation polling logic from the
  hook to a server-driven event stream; out of scope here.
- Renaming `DatabaseBackupsTab` → `DatabaseTabBody` once it's clear the
  component is used in only one place; cosmetic, defer.
