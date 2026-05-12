# Database rollback — restore from dump

**Status:** frontend-ready / blocked on backend (`restoreEnvironmentDump`
mutation absent — see Backend dependencies)
**Date:** 2026-05-12
**Driver:** The dump pipeline ships READY dump rows with a Download
button. Owners want one-click server-side restore rather than running
`pg_restore` locally.

## Problem

`database-backups-tab.tsx:104-109` surfaces a `pg_restore` CLI footnote
as the current restore path. That shifts ops burden to the owner.
Grepping `modules/cloud/graphql.ts` for "restore" in the dump section
returns zero matches: the observability subgraph has no
`restoreEnvironmentDump` mutation.

## Goal

- "Restore" action on each READY, non-expired dump row.
- Aggressive destructive confirm dialog before firing.
- Lock further DB tab actions while restore is in flight; show a warning
  banner.
- Toast on success and failure; surface server error codes inline
  (modal-stays-open pattern from `env-settings-drawer.tsx`).
- Use `<AsyncButton>` for the confirm CTA.

## Non-goals

- Scheduled or automated restores.
- New fields on `DatabaseDump` or changes to the dump pipeline.
- Restoring FAILED, PENDING, RUNNING, or expired dumps.
- Cross-tenant restore.
- Restore completion detection / status polling in v1 (fire-and-forget;
  the banner clears when `restoringId` clears).

## Components

### Backend dependency — `restoreEnvironmentDump` mutation (does not exist today)

Required addition to the observability subgraph schema:

```graphql
extend type Mutation {
  """
  Owner-gated. Triggers a pg_restore Job in the tenant namespace from
  the named S3 dump. Dump must be status=READY and not expired. Returns
  immediately; restore runs asynchronously. Error codes surfaced in
  message: RESTORE_IN_PROGRESS | DUMP_NOT_READY | DUMP_EXPIRED | FORBIDDEN
  """
  restoreEnvironmentDump(dumpId: ID!): RestoreAck!
}

type RestoreAck {
  ok: Boolean!
  message: String
}
```

Auth mirrors `requestEnvironmentDump` — verify Renown bearer address
against `envRow.owner`. Concurrency: reject with `RESTORE_IN_PROGRESS`
if a restore Job is already running for the tenant. Job shape mirrors
the dump Job but runs `pg_restore --clean --if-exists` reading from S3.

### `modules/cloud/graphql.ts` — add `restoreEnvironmentDump`

Pattern mirrors `cancelEnvironmentDump`:

```ts
export async function restoreEnvironmentDump(
  dumpId: string,
  token?: string | null,
): Promise<{ ok: boolean; message: string | null }> {
  const data = await gqlObservability<{
    restoreEnvironmentDump: { ok: boolean; message: string | null }
  }>(
    '',
    `mutation ($dumpId: ID!) {
      restoreEnvironmentDump(dumpId: $dumpId) { ok message }
    }`,
    { dumpId },
    token,
  )
  return data.restoreEnvironmentDump
}
```

### `modules/cloud/hooks/use-environment-dumps.ts` — add `restore`

After `cancellingId`:

```ts
const [restoringId, setRestoringId] = useState<string | null>(null)
```

After the `cancel` callback — mirrors `cancel` exactly:

```ts
const restore = useCallback(async (dumpId: string) => {
  setRestoringId(dumpId)
  try {
    const token = await getAuthToken(renownRef.current)
    await restoreEnvironmentDump(dumpId, token)
    // No refetch — restore is async server-side; dump list is unchanged.
  } finally {
    setRestoringId(null)
  }
}, [])
```

Extend the return object with `restoringId` and `restore`.

### `modules/cloud/components/dump-row.tsx` — add `onRestore` + confirm dialog

Extend `Props`:

```ts
type Props = {
  dump: DatabaseDump
  onRetry?: () => void
  onCancel?: () => void
  isCancelling?: boolean
  onRestore?: () => void
  isRestoring?: boolean
}
```

Add `const [confirmOpen, setConfirmOpen] = useState(false)` at the top.

In the action button area, after the Download block:

```tsx
{
  dump.status === 'READY' && !isExpired && onRestore && (
    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={isRestoring}>
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          Restore
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Restore this dump?</AlertDialogTitle>
          <AlertDialogDescription>
            This will overwrite the current database with the contents of{' '}
            <span className="font-mono">dump-{dump.id}.dump</span>. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AsyncButton
            variant="destructive"
            size="sm"
            pendingLabel="Restoring…"
            onClickAsync={async (e) => {
              e.preventDefault()
              await onRestore()
              setConfirmOpen(false)
            }}
          >
            Restore
          </AsyncButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

New imports: `RotateCcw` from `lucide-react`; `useState` from `react`;
the `AlertDialog*` family from `@/modules/shared/components/ui/alert-dialog`;
`AsyncButton` from `@/modules/cloud/components/async-button`.

### `modules/cloud/components/database-backups-tab.tsx` — wire it up

1. Destructure `restoringId`, `restore` from the hook.
2. Derive `isRestoring = restoringId !== null`.
3. Extend `inFlight`:

   ```ts
   const inFlight =
     dumps.some((d) => d.status === 'PENDING' || d.status === 'RUNNING') || isRestoring
   ```

4. Add `handleRestore`:

   ```ts
   const handleRestore = async (dumpId: string) => {
     try {
       await restore(dumpId)
       toast.success('Restore started — the database will be replaced shortly.')
     } catch (err) {
       const msg = err instanceof Error ? err.message : 'Failed to start restore'
       if (msg.includes('RESTORE_IN_PROGRESS')) {
         toast.error('A restore is already in progress for this environment.')
       } else if (msg.includes('DUMP_NOT_READY') || msg.includes('DUMP_EXPIRED')) {
         toast.error('This dump is no longer available for restore.')
       } else if (msg.includes('FORBIDDEN')) {
         toast.error('Only the environment owner can restore a dump.')
       } else {
         toast.error(msg)
       }
     }
   }
   ```

5. Add in-flight banner between toolbar and error block:

   ```tsx
   {
     isRestoring && restoringId && (
       <div className="bg-warning/10 text-warning flex items-center gap-2 rounded-md px-3 py-2 text-sm">
         <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
         <span>
           Restoring from <span className="font-mono">dump-{restoringId}.dump</span>&hellip;
         </span>
       </div>
     )
   }
   ```

6. Pass new props to `DumpRow`:

   ```tsx
   onRestore={
     d.status === 'READY' && canEdit && !isRestoring
       ? () => handleRestore(d.id)
       : undefined
   }
   isRestoring={restoringId === d.id}
   ```

7. Remove the `pg_restore` footnote — superseded.
8. New import: `Loader2`.

## Data flow

```
User clicks "Restore" on a READY row
  DumpRow opens AlertDialog
  User confirms (AsyncButton)
    onClickAsync fires → await onRestore()
      handleRestore(dumpId)
        restore(dumpId) in useEnvironmentDumps
          setRestoringId(dumpId)
          restoreEnvironmentDump(dumpId, token)
            [error] → throws → handleRestore catches → toast.error; finally: setRestoringId(null)
            [ok]    → finally: setRestoringId(null)
    setConfirmOpen(false) → dialog closes
    toast.success("Restore started…")
```

## Edge cases

- **Dump expires between render and confirm** — subgraph returns
  `DUMP_EXPIRED`; toast targets that path; dialog stays open.
- **Concurrent callers** — subgraph returns `RESTORE_IN_PROGRESS`.
- **Tab closed during restore** — banner gone on re-open; restore
  continues server-side. v2 can add a `restore_status` column.
- **Expired READY dump** — `onRestore` prop is `undefined`; button
  doesn't render. Backend secondary guard.
- **In-flight dump + restore** — `onRestore` is undefined while
  `isRestoring`; existing dump rows still show Cancel.
- **Async-mutation unmount during pending** — `useAsyncAction` guards
  via `mountedRef`; React 18 strict-mode safe.

## Verification

1. READY dump, `canEdit=true`: "Restore" appears next to Download.
2. Clicking "Restore" opens AlertDialog with the title
   "Restore this dump?" and the dump filename in the body.
3. Confirming: AsyncButton shows spinner + "Restoring…"; dialog stays
   open until mutation resolves; closes on success; `toast.success`.
4. While `restoringId !== null`: warning banner visible; "Create dump"
   disabled; no Restore button on any row.
5. Mutation error: dialog stays open (`e.preventDefault()`);
   `toast.error` fires; banner disappears.
6. Expired READY dump: no Restore button.
7. CONNECT / FUSION drawers: unaffected.
8. `pnpm tsc` + `pnpm lint` clean.

## Implementation order

1. Spec (this document).
2. `modules/cloud/graphql.ts` — add `restoreEnvironmentDump` stub.
3. `modules/cloud/hooks/use-environment-dumps.ts` — add `restoringId`,
   `restore`.
4. `modules/cloud/components/dump-row.tsx` — add `onRestore`,
   `isRestoring`, AlertDialog.
5. `modules/cloud/components/database-backups-tab.tsx` — wire restore,
   banner, error handling; remove footnote.
6. Backend: `restoreEnvironmentDump` mutation + restore Job in
   `vetra-cloud-observability`.

Steps 2-5 are independently compilable commits. Feature is user-invisible
until step 6 lands.

## Backend dependencies

| Requirement                                                                                                    | Blocks go-live           |
| -------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `restoreEnvironmentDump(dumpId: ID!): RestoreAck!` mutation in observability subgraph                          | yes                      |
| `pg_restore` Job launcher (RBAC, S3 read creds, concurrency guard)                                             | yes                      |
| Error codes `RESTORE_IN_PROGRESS` / `DUMP_NOT_READY` / `DUMP_EXPIRED` / `FORBIDDEN` surfaced in GraphQL errors | yes — frontend maps them |
