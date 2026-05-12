# Scheduled database backups

**Status:** draft
**Date:** 2026-05-12
**Driver:** On-demand dumps shipped and are stable. Env owners now want
automatic, recurring dumps without having to remember to click "Create dump".
The feature is frontend-only: the UI persists a schedule intent in the env
doc model; a backend job runner (out of scope here) reads that intent and
fires the dump mutation on the configured cadence.

## Problem

The Database tab today surfaces only on-demand dumps. There is no way to:

- Enable recurring dumps (daily / weekly / hourly).
- Configure how many scheduled dumps to retain.
- Tell at a glance whether an existing dump was created automatically or
  manually.

The env doc model (`CloudEnvironmentState`) has no backup-schedule fields.
The `requestEnvironmentDump` mutation accepts only `tenantId` — there is no
`source` / `trigger` discriminator. Both gaps are backend dependencies that
must be resolved before the frontend can meaningfully implement this feature.

## Goal

Let an env owner, from the existing Database tab inside the Switchboard
service drawer:

1. Toggle scheduled backups on / off.
2. Pick a cadence via simple presets: **Off / Hourly / Daily / Weekly**.
3. Pick a retention count: how many scheduled dumps to keep (default 7).
4. See the next scheduled run as a relative time ("next run in 6h").
5. Distinguish scheduled dumps from manual ones in the dump list via an
   `auto` badge on each `DumpRow`.

## Non-goals

- Free-form cron syntax. Presets only; power users can request it later.
- Actually running the cron in Kubernetes — that is owned by the backend.
- Scheduling non-Postgres resources (S3, config exports, etc.).
- Retention policy for **manual** dumps — their TTL remains 24h via S3
  lifecycle and 7d row pruning, unchanged.
- Modifying `DumpRow`, `useEnvironmentDumps`, or the dump cancellation flow.
- Pagination or search of the dump list.

## Components

### `modules/cloud/types.ts`

Add the frontend representation of the schedule (read from doc-model state
once the backend ships the field):

```ts
export type BackupCadence = 'HOURLY' | 'DAILY' | 'WEEKLY'
export type DumpSource = 'MANUAL' | 'SCHEDULED'

export type BackupSchedule = {
  enabled: boolean
  cadence: BackupCadence
  /** Number of completed scheduled dumps to retain. Older ones are pruned
   *  by the backend runner. Default 7. */
  retention: number
  /** ISO timestamp of the next scheduled run, computed server-side. */
  nextRunAt: string | null
}
```

`CloudEnvironmentState` gains an optional field:

```ts
backupSchedule?: BackupSchedule | null
```

`DatabaseDump` gains an optional discriminator:

```ts
source?: DumpSource | null
```

Both additions are **read-tolerant**: `undefined` / `null` means "not set
yet" and the UI degrades gracefully (schedule panel shows defaults; no `auto`
badge on old dumps).

### `modules/cloud/components/backup-schedule-panel.tsx`

New component. Renders above the dump-count stat bar inside
`DatabaseBackupsTab`. Anatomy (top to bottom):

```
┌─────────────────────────────────────────────────────────┐
│  Scheduled backups                   [toggle: on / off]  │
│  Next run in 6h                                          │
├─────────────────────────────────────────────────────────┤
│  Cadence       [Off] [Hourly] [Daily*] [Weekly]          │
│  Keep          [−]  7  [+]                               │
└─────────────────────────────────────────────────────────┘
```

The cadence row and keep row are only rendered when `enabled === true`.
The "Next run in 6h" line is only rendered when `enabled && nextRunAt`.

Props:

```ts
type Props = {
  schedule: BackupSchedule | null | undefined
  canEdit: boolean
  onSave: (next: { enabled: boolean; cadence: BackupCadence; retention: number }) => Promise<void>
}
```

`onSave` is called when the toggle flips or when the user changes cadence /
retention and blurs / presses Enter. The component holds local draft state
for cadence and retention; the toggle is committed immediately via
`<AsyncButton>`.

Design tokens used:

- Container: `bg-background/40 rounded-lg p-3` — matches the stat-bar panel
  immediately below it.
- Toggle: `<AsyncButton size="sm" variant="outline">` showing "Enable" /
  "Disable" with a spinner while the mutation is in flight.
- Cadence pills: `<Button size="sm" variant={active ? 'default' : 'outline'}>`.
- Retention stepper: plain `<Button size="sm" variant="outline">` for `−` /
  `+`, a `<span className="w-8 text-center text-sm font-medium">` for the
  count. Min 1, max 30.
- Next-run line: `text-muted-foreground text-xs` with a `<Clock>` icon
  (`h-3 w-3`), using a shared `timeUntil` helper extracted from `dump-row.tsx`.

### `modules/cloud/lib/time-format.ts`

Extract `timeAgo`, `timeUntil`, `fmtBytes` from `dump-row.tsx` into a shared
utility module. Update `dump-row.tsx` to import from there. No behaviour
change.

### `modules/cloud/components/database-backups-tab.tsx`

Add `documentId: string` to `Props` (needed to call `setBackupSchedule` via
the detail hook, which needs the doc id to locate the controller). Thread it
down from the caller in `service-detail-drawer.tsx`.

Insert `<BackupSchedulePanel>` above the dump-count stat bar:

```tsx
<BackupSchedulePanel schedule={schedule} canEdit={canEdit} onSave={handleSaveSchedule} />
<div className="bg-background/40 flex items-center justify-between rounded-lg p-3">
  …existing stat bar…
</div>
```

Update the stat bar's "24h retention" copy to be conditional:

- `schedule?.enabled` is true: show "Sched. · {schedule.retention} kept"
- otherwise: "24h retention" (unchanged)

Pass `source={d.source}` to `DumpRow` so it can render the `auto` badge.

### `modules/cloud/components/dump-row.tsx`

Add optional `source?: DumpSource | null` to `Props`. When
`source === 'SCHEDULED'`, render a `<Badge size="xs" variant="secondary">`
with text `auto` next to the filename span. No other changes.

### `modules/cloud/hooks/use-environment-schedule.ts`

New hook wrapping the `setBackupSchedule` mutation:

```ts
export function useEnvironmentSchedule(documentId: string) {
  // Reads schedule from the env detail hook's environment.state.backupSchedule.
  // Exposes a save() that calls detail.setBackupSchedule({ enabled, cadence, retention }).
}
```

Depends on `useEnvironmentDetail` (already used in the page; pass
`environment.state.backupSchedule` as the read value).

### `modules/cloud/hooks/use-environment-detail.ts`

Add one mutation wrapper (once the doc-model action ships):

```ts
const setBackupSchedule = useCallback(
  (opts: { enabled: boolean; cadence: BackupCadence; retention: number }) =>
    mutate((c) => c.setBackupSchedule(opts)),
  [mutate],
)
```

Expose in the returned object alongside `setAutoUpdateChannel`.

### `modules/cloud/graphql.ts`

Add `source` to the dump query fields once the backend exposes it.

## Backend dependencies

The frontend design is complete; the following backend work must land before
the UI goes beyond read-only display.

### 1. Doc-model action `SET_BACKUP_SCHEDULE` (critical — blocks all writes)

The `@powerhousedao/vetra-cloud-package` doc model must add:

- **State field** `backupSchedule: BackupSchedule | null` in
  `CloudEnvironmentState`.
- **Action** `SET_BACKUP_SCHEDULE` with input
  `{ enabled: boolean; cadence: 'HOURLY' | 'DAILY' | 'WEEKLY'; retention: number }`.
- **Reducer** that writes the field; ownership check (only owner can dispatch).
- The controller class in the published package must expose
  `setBackupSchedule(input)`.

Until this lands, `BackupSchedulePanel` renders in a disabled / read-only
state with a "Scheduled backups coming soon" notice rather than crashing.

### 2. `DumpSource` discriminator on dump records (blocks `auto` badge)

The observability subgraph must:

- Add a `source: DumpSource` column to `database_dumps` (default `'MANUAL'`).
- Populate `source = 'SCHEDULED'` when the runner fires the dump.
- Expose `source` on the `DatabaseDump` GraphQL type.

Until this lands, `dump.source` is `undefined`; no badge renders. Graceful.

### 3. `nextRunAt` on `BackupSchedule` (blocks "next run in Xh")

The observability subgraph (or a dedicated scheduler service) must compute
and expose `nextRunAt` as part of the schedule state read-back. The frontend
needs it to render the relative time display. Until it lands, the next-run
line is hidden.

### 4. Scheduled dump runner (blocks actual automation)

A k8s CronJob (or Temporal workflow) that:

- Reads `backupSchedule` from all non-destroyed envs.
- Fires `requestEnvironmentDump(tenantId)` on the configured cadence.
- Enforces the `retention` count by cancelling / deleting the oldest completed
  scheduled dumps that exceed it.

This is infrastructure-only and does not affect the frontend spec.

## Doc-model action contract

```
Action type:   SET_BACKUP_SCHEDULE
Payload:
  enabled:    boolean
  cadence:    'HOURLY' | 'DAILY' | 'WEEKLY'
  retention:  number  // 1–30; validated by reducer

Auth:   env owner (same rules as existing SET_LABEL, ADD_PACKAGE, etc.)
Scope:  global

Effect on state:
  cloudEnvironmentState.backupSchedule = {
    enabled,
    cadence,
    retention,
    nextRunAt: null  // computed by runner, not by the reducer
  }
```

The frontend dispatches this action via the existing `mutate()` helper in
`use-environment-detail.ts`:

```ts
mutate((c) => c.setBackupSchedule({ enabled, cadence, retention }))
```

## Edge cases

- **Schedule toggled off mid-run dump**: The in-flight dump completes
  normally. The runner simply does not schedule the next one.
- **retention < existing scheduled dumps**: The runner prunes on its next
  tick, not immediately on the action. The UI may temporarily show more
  dumps than the retention limit.
- **canEdit false**: `BackupSchedulePanel` renders in read-only mode (no
  toggle, no cadence pills, no stepper). Non-owners can see the schedule.
- **Doc-model package not yet updated**: `c.setBackupSchedule` does not
  exist. Guard: check `typeof controller.setBackupSchedule === 'function'`
  before exposing the save handler; the panel renders "coming soon" if the
  guard fails.
- **Concurrent edit from another session**: The `RemoteDocumentController`
  uses `onConflict: 'rebase'`; the last writer wins on this scalar field.
- **`nextRunAt` in the past** (runner lagged): Show "overdue" rather than
  a negative time. `timeUntil` already returns `'expired'` for past dates;
  map that to "overdue".

## Verification

After the full stack lands:

1. **Enable schedule (Daily, 7)**: Toggle flips, `AsyncButton` shows
   spinner, toast confirms. Next-run line appears with a relative time
   under 25h.
2. **Change cadence to Hourly**: Pill highlights, next-run time shrinks to
   ≤ 1h. Existing dumps unaffected.
3. **Scheduled dump fires**: New `DumpRow` appears with `auto` badge.
   Status cycles PENDING → RUNNING → READY normally.
4. **Retention pruning**: After the 8th scheduled dump, the oldest READY
   scheduled dump is gone from the list.
5. **Disable schedule**: Toggle off. Cadence/keep rows collapse. Next-run
   line disappears. No new auto dumps created.
6. **canEdit false (non-owner)**: Panel renders schedule state but all
   controls are absent.
7. **Doc-model not updated yet**: Panel shows "Scheduled backups coming
   soon" with no controls; existing dump list is unaffected.
8. **Type-check + lint pass**: `pnpm tsc` and `pnpm lint` clean.

## Implementation order (small commits)

1. **Spec** — this document.
2. **Types**: Add `BackupCadence`, `DumpSource`, `BackupSchedule` to
   `modules/cloud/types.ts`. Extend `CloudEnvironmentState` and
   `DatabaseDump` as optional fields. No runtime change.
3. **Shared time utils**: Extract `timeAgo`, `timeUntil`, `fmtBytes` from
   `dump-row.tsx` into `modules/cloud/lib/time-format.ts`; update imports.
4. **`DumpRow` source badge**: Accept `source` prop; render `<Badge>` when
   `source === 'SCHEDULED'`. Guard on `undefined` — no badge for old dumps.
5. **`BackupSchedulePanel`**: New component, read-only mode only (no
   `onSave` wiring yet). Renders disabled controls with "coming soon"
   notice.
6. **`DatabaseBackupsTab` integration**: Add `documentId` prop, mount
   `<BackupSchedulePanel>`, pass `source` to `DumpRow`. Update stat bar
   copy.
7. **Hook + detail wiring**: `useEnvironmentSchedule`, `setBackupSchedule`
   in `use-environment-detail.ts` — gated on `typeof c.setBackupSchedule`.
8. **`BackupSchedulePanel` write path**: Wire `onSave` once doc-model
   package ships. Enable the controls; remove the "coming soon" notice.
9. **GraphQL `source` field**: Add to the dump query fields once the
   subgraph ships.

Each commit compiles and type-checks independently. Steps 2–6 can land on
staging before the backend dependencies are met.
