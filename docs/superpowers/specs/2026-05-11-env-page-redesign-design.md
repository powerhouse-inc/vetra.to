# Env detail page — redesign

**Status:** draft
**Date:** 2026-05-11
**Driver:** The env detail page has grown into a stack of seven full-width
cards (ArgoCD, Config, Domain, Services, Recent Activity, Metadata, Danger
Zone). Approve / Deploy lives as a `size="sm"` button in the hero — easy to
miss. Status and admin info compete for the same vertical real estate.

## Problem

Today the env page renders, top to bottom:

1. Hero card (title, status badge, Deploy/Approve button, Visit dropdown).
2. Status row — 2 or 3 cards: **ArgoCD**, **Config drift**, optionally **Domain**.
3. Services + Packages + Agents.
4. **Recent Activity** card (event timeline).
5. **Metadata** card (document ID, type, revision, created, modified).
6. **Danger Zone** card (Terminate, Delete).

Two specific pains the user called out:

- The **Approve / Deploy button** sits inline in the hero at `size="sm"`. When
  the user needs to act on a pending change, it's easy to miss.
- The **ArgoCD card** and **Config drift card** are two single-fact cards that
  duplicate information the Activity panel below them already implies. Three
  surfaces for "what's happening to this env."
- **Metadata** is admin-only diagnostic info that takes up a whole card.
- **Danger Zone** sits permanently at the bottom as a destructive red card.

## Goal

Simplify the page surface:

- One **Activity** panel that absorbs ArgoCD sync + drift status as pills in
  its header. The status-row cards disappear.
- The Approve / Deploy / "Deploying…" action lives in a **floating bottom bar**
  that appears only when there's an action to take or a state to report.
- **Metadata** + **Danger Zone** move behind an info icon → small dialog.

## Non-goals

- No change to the env doc model, lifecycle graph, or approve mutation.
- No change to the `EventTimeline` component or the events hook.
- No invented actions ("Reconcile drift", "Discard pending changes") — the bar
  only surfaces verbs the doc model already supports.
- No change to package / agent / database UI (settled in prior specs).
- No mobile redesign — bar uses the same layout breakpoint as the rest of the
  page.

## Components

### New: `modules/cloud/components/env-action-bar.tsx`

Fixed-position pill bar that mounts at the page level (so it floats over the
scrolling content, not inside it).

```ts
type Props = {
  status: string // CloudEnvironmentStatus
  justApproved: boolean // race-mask from page; bar hides immediately on click
  driftDetected: boolean
  onApprove: () => void // page already debounces; bar just fires
}
```

Render rules (the source of truth):

| `status` (and other flags)                                             | Bar shown? | Contents                                                |
| ---------------------------------------------------------------------- | ---------- | ------------------------------------------------------- |
| `justApproved === true`                                                | no         | (race-mask: user just clicked)                          |
| `DRAFT`                                                                | yes        | "Ready to deploy" + green **Deploy** button             |
| `CHANGES_PENDING`                                                      | yes        | "1 pending change" + blue **Approve** button            |
| `CHANGES_APPROVED`, `CHANGES_PUSHED`, `DEPLOYING`, `DEPLOYMENt_FAILED` | yes        | spinner + "Deploying…" (no button)                      |
| `READY` + `driftDetected`                                              | yes        | amber "⚠ Config drift detected" (informational, no CTA) |
| `READY` + no drift                                                     | no         | (clean page)                                            |
| `STOPPED`, `TERMINATING`, `DESTROYED`, `ARCHIVED`                      | no         | (terminal / off states)                                 |

Styling: a `fixed bottom-6 left-1/2 -translate-x-1/2 z-40` container holding a
rounded-full `bg-background border` pill, soft shadow, ~36-40px tall. Buttons
inside are rounded-full to match the pill. The pill uses the same Button
variants the codebase already has (primary blue, success green, secondary).

Accessibility: bar has `role="status"` so screen readers announce changes; the
button keeps `aria-label` consistent with the verb.

### New: `modules/cloud/components/env-metadata-dialog.tsx`

Modal dialog (using existing shadcn `Dialog` component) triggered by an info
icon in the hero. Two sections:

**Metadata** (read-only)

- Document ID (`font-mono`, click-to-copy)
- Document Type
- Revision
- Created (localized date)
- Last Modified (localized date)

**Danger Zone** (collapsed `Disclosure`-style by default, expandable)

- Terminate Environment (only when `status` ∉ `['DRAFT', 'TERMINATING', 'DESTROYED', 'ARCHIVED']`) — same `onTerminate` callback the OverviewTab uses today.
- Delete Environment — same `AlertDialog` confirmation flow, same controller call. On success, navigates to `/cloud`.

Props:

```ts
type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  environment: CloudEnvironment
  onTerminate?: () => Promise<void> // optional, only passed for non-terminal states
}
```

### Changed: `app/cloud/[project]/page.tsx`

- Remove the inline Deploy / Approve `<Button>`s from the hero (`page.tsx:183-196`).
- Add an info icon `<Button variant="ghost" size="icon">` to the hero's right-side action group, between the title and the Visit dropdown. Click toggles a new `metadataOpen` state.
- Keep the existing `justApproved` state + `handleApprove` callback (unchanged) — pass them into `EnvActionBar`.
- Mount `<EnvActionBar status={state?.status ?? ''} justApproved={justApproved} driftDetected={!!envStatus?.configDriftDetected} onApprove={handleApprove} />` once at the end of the page (sibling to the drawers).
- Mount `<EnvMetadataDialog open={metadataOpen} onOpenChange={setMetadataOpen} environment={environment} onTerminate={detail.terminate} />`.
- Stop passing `onTerminate` to `OverviewTab` — its terminate path lives in the dialog now.

### Changed: `app/cloud/[project]/tabs/overview.tsx`

- Remove the `ArgoCD Card` and `Config Card` from the status row (`overview.tsx:920-976`).
- Convert the status row wrapper:
  - With `hasCustomDomain` → render the Domain card alone (full width or as a single-card row).
  - Without custom domain → drop the wrapper entirely.
- In the **Recent Activity** card header, render a status strip above the
  `CardTitle`:
  - ArgoCD sync pill — green "● ArgoCD synced" / red "● ArgoCD <status>"
  - Drift pill — green "● No drift" / amber "● Drift detected"
  - Last synced timestamp on the right
  - When `statusLoading && !status`, show a small spinner + "Loading status…"
- Remove the **Metadata** card (1222-1260).
- Remove the **Danger Zone** card (1262-1320), plus the `isDeleting`, `handleDelete`, and related imports that only powered it.
- Drop `onTerminate` and `onDelete` from `OverviewTab`'s prop signature. Callers that passed them either pass through the dialog (page.tsx) or didn't pass them in the first place.

## Data flow

```
page.tsx
├ state, envStatus, statusLoading, justApproved
├ <HeroCard>
│   ├ title, status badge
│   ├ <Info icon> → setMetadataOpen(true)
│   └ <Visit dropdown>
├ <OverviewTab ...no onTerminate/onDelete... />
│   ├ Domain card (when custom domain)
│   ├ Services / Packages / Agents
│   └ Recent Activity card
│       ├ status pills row (ArgoCD + drift + last synced)
│       └ <EventTimeline />
├ <ServiceDetailDrawer .../>
├ <AgentDetailDrawer .../>
├ <EnvActionBar status={..} onApprove={..} driftDetected={..}/>   ← new, fixed bottom
└ <EnvMetadataDialog open={metadataOpen} ... onTerminate={..}/>   ← new
```

## Edge cases

- **Subscription race** when approving: `justApproved` flips immediately,
  hides the bar; the existing `useEffect` clears it once the server status
  leaves DRAFT/CHANGES_PENDING. Re-use as-is.
- **Drift in non-READY states**: drift can technically be reported during
  deploying. The bar respects the deploy state first (spinner wins); drift pill
  still shows in the Activity panel header.
- **Custom domain card with no status row neighbours**: render it as a single
  card on its own row. Don't try to be clever with width — Tailwind container
  handles it.
- **Terminate during DRAFT**: hidden today; keep that. Dialog only renders the
  Terminate row when the status is non-terminal (`!['DRAFT', 'TERMINATING', 'DESTROYED', 'ARCHIVED'].includes(state.status)`).
- **Delete from inside the dialog**: navigates to `/cloud` like today. The
  dialog closes via `onOpenChange(false)` first to avoid orphaning a
  half-rendered AlertDialog on top of the navigation.
- **Mobile**: the bar uses `bottom-6 left-1/2 -translate-x-1/2` which keeps it
  centered. Buttons stay readable down to `sm:` breakpoint without changes.

## Verification

After the change:

1. **DRAFT env**: bar appears at the bottom of the viewport, says "Ready to
   deploy", with a green Deploy button. Click → bar disappears (justApproved
   race-mask) and reappears in the deploying form once the doc updates.
2. **CHANGES_PENDING**: bar reads "1 pending change" with a blue Approve.
3. **DEPLOYING**: bar shows the spinner + "Deploying…" with no clickable
   button.
4. **READY, no drift**: no bar visible.
5. **READY with drift**: bar reads amber "⚠ Config drift detected" with no CTA.
6. **Hero Info icon**: click opens the Metadata dialog. Doc ID + revision +
   timestamps render. Danger Zone disclosure expands to show Terminate (when
   eligible) and Delete. Both call the same handlers as today.
7. **Status row**: no ArgoCD / Config cards. Domain card only when the env
   has a custom domain.
8. **Activity panel**: ArgoCD + drift pills render in the header; event list
   unchanged.
9. **Type-check + lint pass**: `pnpm tsc` and `pnpm lint` clean (no new
   warnings introduced).

## Implementation order (small commits)

1. **Spec** — this document.
2. **`EnvActionBar`** — new component file + replace the inline hero
   Deploy/Approve buttons. Page still has the old cards; just the action moves.
3. **`EnvMetadataDialog`** — new component file + Info icon in the hero. Move
   Metadata and Danger Zone content into the dialog. Delete the two cards from
   `overview.tsx`.
4. **Activity panel consolidation** — remove ArgoCD + Config cards from the
   status row; add status pills to the Recent Activity card header. Domain
   card becomes a single-card row when present.

Each commit compiles and is independently revertable. The page reads better
after each step but the full simplification only lands at step 4.
