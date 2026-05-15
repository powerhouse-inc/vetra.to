# Async UX polish — pending buttons, intent-lock, transitions

**Status:** draft
**Date:** 2026-05-11
**Driver:** Two user-reported issues that share the same underlying causes:

1. Clicking **Save** on the Add-Agent modal: modal flickers, then a "prefix in
   use" error toast lands on a page where the modal is already gone — no
   chance to fix and retry.
2. Clicking **Approve** on the floating action bar: bar shows "Deploying…",
   regresses to "Approve", then settles on "Deploying…" — a visible
   double-flicker.

Across the env page, click → response feels glitchy: buttons stay enabled
during slow mutations, switches whip back and forth on subscription resync,
the floating bar pops in and out abruptly, and rows shift width when transient
buttons mount / unmount.

## Problem

Three independent UX failures compound into one experience of jank:

- **No "pending" state on async buttons.** Most async handlers manage their
  own `isLoading` / `isDeleting` / `isRequesting` state by hand and don't all
  thread it back to the button. So buttons stay clickable mid-mutation, and
  modals close on click instead of on the resolved result.
- **`justApproved` only guards the first race.** The bar flips back to
  "Approve" when a stale subscription resync briefly reverts status to
  `CHANGES_PENDING` _after_ the optimistic update has cleared the flag.
- **Hard mount / unmount transitions.** The floating bar pops in/out, button
  cells appear and disappear, and the resulting layout shifts read as
  glitches.

## Goal

Make every async click feel deterministic and pleasant:

- The clicked button visibly tells the user it's working.
- Modals stay open on error; close on success.
- The action bar shows "Deploying…" continuously after a click; a temporary
  subscription regression doesn't drag it back.
- Mounting/unmounting elements transition rather than pop, and don't shift
  neighbouring layout.

## Non-goals

- No changes to the mutations themselves, the controller, or the doc
  subscription wiring.
- No retry / back-off logic on failed mutations.
- No new dependencies — `framer-motion` is already in the tree.
- No mobile-specific work beyond what falls out of using the same primitives.

## Components

### New: `modules/cloud/hooks/use-async-action.ts`

Generic hook:

```ts
export function useAsyncAction<Args extends unknown[], R>(
  fn: (...args: Args) => Promise<R>,
): {
  run: (...args: Args) => Promise<R>
  isPending: boolean
  error: Error | null
}
```

`run` sets `isPending = true`, awaits `fn`, captures `error` on throw, and
returns the resolved value so callers can chain (e.g. close a modal on
success). Re-throws so the caller can decide whether to toast or handle
inline. `isPending` flips back to `false` in both success and error paths.

### New: `modules/cloud/components/async-button.tsx`

Thin wrapper around the codebase's existing `Button`:

```ts
type Props = Omit<ButtonProps, 'onClick'> & {
  onClickAsync: (event: React.MouseEvent<HTMLButtonElement>) => Promise<unknown>
  /** When pending, the button content is replaced by spinner + this label. */
  pendingLabel?: string
}
```

While `isPending`, the button is `disabled`, content shows
`<Loader2 className="animate-spin" />` plus `pendingLabel ?? children`.
Internally uses `useAsyncAction` so callers don't have to.

### New: `modules/cloud/hooks/use-debounced-value.ts`

```ts
export function useDebouncedValue<T>(value: T, delayMs: number): T
```

Standard 25-line debouncer. Used to coalesce subscription resyncs feeding into
visible status pills.

### Changed: `modules/cloud/components/env-action-bar.tsx`

Replace the `justApproved` boolean (consumed via props) with an internal
**intent lock**:

```ts
type Intent = { kind: 'deploying'; expiresAt: number }
```

- New prop `intentDeploying: boolean` from the page — flipped synchronously on
  click.
- The bar derives `intent` from `intentDeploying` plus `Date.now()` window
  (~3000ms after the flip).
- Render logic: while `intent && Date.now() < intent.expiresAt`, render the
  `Deploying…` body regardless of raw `status`. Otherwise render based on
  raw status (existing rules).
- A `setTimeout` triggers a re-render at `expiresAt` to drop the intent.

Mount / unmount is wrapped in `AnimatePresence` with a `motion.div` doing
opacity + 12px translateY over 150ms.

### Changed: `app/cloud/[project]/page.tsx`

- Replace `justApproved: boolean` with `intentDeploying: boolean` (same
  semantics — flipped synchronously on click, cleared when status confirms
  progress). Existing useEffect that clears the flag stays as a safety net.
- Wrap `envStatus` in `useDebouncedValue(envStatus, 250)` before passing to
  `EnvActionBar` + `EnvSettingsDrawer`'s Activity tab. Stale resyncs that
  flicker for < 250ms disappear entirely.

### Changed: modals that mutate

For each, swap the primary CTA to `<AsyncButton onClickAsync={...}>` and move
the "close modal" call into the **resolved success** path. On error, the
modal stays open with the error visible. Files:

- `modules/cloud/components/add-agent-modal.tsx` — Save / Add buttons.
- `modules/cloud/components/add-package-modal.tsx` — Add Package.
- `modules/cloud/components/upgrade-package-modal.tsx` — Upgrade.
- `modules/cloud/components/package-row.tsx` (UninstallDialog) — Uninstall.
- `modules/cloud/components/env-settings-drawer.tsx` (DangerZone) — Delete +
  Terminate.
- `modules/cloud/components/config-row.tsx` — Save / Delete inline buttons.
- `modules/cloud/components/database-backups-tab.tsx` — Create dump,
  Cancel dump.

The `dialog.disabled` while mutation is in-flight prevents
double-submission and accidental close-by-overlay.

### Changed: service row (overview.tsx) and package row

Reserve action-cell width so toggling enabled state doesn't shift the row:

- Service row: wrap the right-side action cluster in a fixed-width container
  (`min-w-44` or similar). When `isEnabled` is false, the `Details` /
  `Resize` slot is rendered with `invisible` rather than removed, preserving
  width.
- Package row: the action `⋮` cell already has `text-right`. Add `min-w-12`
  to the chevron cell so chevron rotate doesn't influence row width.

## Data flow

```
Click (e.g. Approve)
├ setIntentDeploying(true)
├ <EnvActionBar intentDeploying={true} status={debouncedStatus} />
│    intent window opens, bar renders "Deploying…" speculatively
├ await detail.approveChanges()
│    local optimistic doc-state update lands → status='CHANGES_APPROVED'
│    subscription pushes server snapshot → status briefly back to 'CHANGES_PENDING'
│    debounced value smooths the flicker; bar still on "Deploying…" via intent
└ server settles → status='DEPLOYING'
     intent window closes (3s) → bar takes over from raw debounced status
     same body, no visible change
```

```
Click (e.g. Add agent)
├ <AsyncButton onClickAsync={async () => { await addAgent(); onClose() }}>
├ button disables + spinner shown
├ await addAgent()
│    if reject → re-throw, button re-enables, error toast/inline
│    if resolve → run continues → onClose() called → modal exits
└ resolved success: modal animates out cleanly
```

## Edge cases

- **Mutation throws synchronously before await** — `useAsyncAction` flips
  `isPending` to false in the catch, button re-enables.
- **Unmount during pending** — `useAsyncAction` uses a ref to guard
  `setIsPending` after unmount. (React 18 strict-mode safe.)
- **Click during pending** — `<AsyncButton>` is `disabled`; nothing happens.
- **Intent window vs slow approve** — if Approve takes > 3s, the intent
  window closes and the bar falls back to raw status. By then the server has
  almost always moved past `CHANGES_PENDING`. Acceptable.
- **Intent window vs error** — `handleApprove` clears `intentDeploying` in
  its catch path so the bar doesn't lie about progress.
- **AnimatePresence + portaled drawers** — the floating bar isn't portaled;
  AnimatePresence wraps it directly. No portal interaction.

## Verification

After the change:

1. **Add Agent with duplicate prefix**: Save button shows spinner +
   "Saving…", modal stays open on the error, prefix field is editable
   without re-typing the rest.
2. **Approve a pending change**: bar shows "Deploying…" within 50ms of
   click and stays that way through the resync — no regression to "Approve".
3. **Switch a service off / on rapidly**: switch follows the click; the
   "Details" button next to it does not pop in/out and the row doesn't shift
   width.
4. **Floating bar enter / exit**: bar fades + slides over ~150ms instead of
   popping.
5. **Set / save a config row**: Save button shows spinner; row updates on
   success; on validation error the value remains editable.
6. **Type-check + lint pass**: `pnpm tsc` and `pnpm lint` clean.

## Implementation order (small commits)

1. **Spec** — this document.
2. **Primitives**: `useAsyncAction`, `<AsyncButton>`, `useDebouncedValue`.
   No consumers yet.
3. **Action bar** + page intent-lock + AnimatePresence + debounced status.
4. **Modals**: migrate AddAgent / AddPackage / UpgradePackage / Uninstall /
   Delete / Terminate / ConfigRow / dump buttons to `<AsyncButton>` with
   close-on-success semantics.
5. **Layout slots**: stable widths in service row + package row.

Each commit compiles independently.
