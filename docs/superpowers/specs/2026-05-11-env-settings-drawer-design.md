# Env settings drawer

**Status:** draft
**Date:** 2026-05-11
**Driver:** The gear / info modal added in the previous redesign holds metadata

- danger zone today. The env page still carries three full-width cards —
  Domain Configuration, Auto-update, Recent Activity — that are all
  configuration / admin surfaces. Collapse them under the gear icon to finish
  the simplification.

## Problem

After the previous redesign, the env page still renders top-to-bottom:

1. Hero + Visit dropdown + Info icon (opens metadata modal).
2. Services row + Installed Packages.
3. Agents row.
4. **Domain Configuration** card (generic + custom domain).
5. **Auto-update** card (channel, update now, rollback).
6. **Recent Activity** card (ArgoCD pills + event timeline).

Items 4-6 are all "configure / inspect the env" surfaces that the user
touches rarely. They eat the bottom half of the page even when there's
nothing actionable.

## Goal

Replace the metadata modal with a right-side **settings drawer** triggered by
a gear icon. Four tabs: **Domain / Updates / Activity / Metadata**. The page
becomes just hero + services + packages + agents.

## Non-goals

- No URL state for the drawer's open/tab — settings is ephemeral, no need to
  link a specific tab.
- No change to `AutoUpdateCard`, `EventTimeline`, `useEnvironmentEvents`,
  `useEnvironmentStatus` internals.
- No change to the floating action bar (still surfaces drift on `READY`).
- No mobile-specific layout — sheet inherits its responsive breakpoints from
  the existing service / agent drawers.

## Components

### New: `modules/cloud/components/custom-domain-section.tsx`

Extract `CustomDomainSection` (currently inline at `overview.tsx:519-716`) +
the `OWNED_DNS_ZONES` constant + the `isOwnedDomain` helper into a dedicated
file. No behavioural change — just a move + named export, so the drawer can
import it without pulling overview.tsx along.

### New: `modules/cloud/components/env-settings-drawer.tsx`

Right-side `Sheet` (the codebase's existing primitive). Mirrors the
service / agent drawer shape: header (title + close), `Tabs` with four
triggers, body scrolls.

```ts
type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  environment: CloudEnvironment
  tenantId: string | null
  subdomain: string | null
  /**
   * Snapshot from `useEnvironmentStatus` — passed in so the drawer doesn't
   * re-subscribe to status, and so the Activity tab's pills stay coherent
   * with the floating action bar (both read the same status).
   */
  status: EnvironmentStatus | null
  statusLoading: boolean
  onSetCustomDomain: (
    enabled: boolean,
    domain?: string | null,
    apexService?: CloudEnvironmentServiceType | null,
  ) => Promise<void>
  /** When unset, the Updates tab renders an empty state instead of the card. */
  onSetAutoUpdateChannel?: (channel: AutoUpdateChannel | null) => Promise<void>
  onUpdateToLatest?: () => Promise<string[]>
  onRollbackRelease?: () => Promise<string[]>
  /** When unset, the Danger Zone hides Terminate (leaves Delete in place). */
  onTerminate?: () => Promise<void>
}
```

Tab layout (default `value="domain"`):

| Tab          | Body                                                                                                                                                                                                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Domain**   | Generic-domain readonly input (`{subdomain}.vetra.io`) + `<CustomDomainSection ...>`.                                                                                                                                                                                                                        |
| **Updates**  | `<AutoUpdateCard environment={...} onChangeChannel={...} onUpdateNow={...} onRollback={...} />` when all three callbacks are set; otherwise a muted "Updates aren't available for this env right now" line.                                                                                                  |
| **Activity** | Local `ActivityStatusStrip` (ArgoCD + drift pills + last-sync timestamp, reading from `status`) + `<EventTimeline events={events} isLoading={eventsLoading} />`. `useEnvironmentEvents(subdomain, tenantId, 5, environment.id)` is called inside the drawer body — only fetches while the drawer is mounted. |
| **Metadata** | Read-only field list (Document ID with click-to-copy, Type, Revision, Created, Modified) + collapsed Danger Zone (Terminate when eligible + Delete with AlertDialog confirmation, navigates to `/cloud` on success).                                                                                         |

The `ActivityStatusStrip` helper lives inline in the drawer file — same shape
as the one currently in `overview.tsx`, just relocated. The existing helper
in `overview.tsx` is deleted.

### Changed: `app/cloud/[project]/page.tsx`

- `Info` icon → **`Settings`** icon (lucide gear). Button stays
  `variant="ghost" size="icon"`; `aria-label` changes to "Environment
  settings".
- State rename: `metadataOpen` → `settingsOpen`.
- Replace the `<EnvMetadataDialog .../>` mount with `<EnvSettingsDrawer .../>`,
  threading the new props (`tenantId`, `subdomain`, `status`, `statusLoading`,
  plus the three update mutations).
- Drop the imports for `EnvMetadataDialog`, `Info`.
- Stop passing `setCustomDomain`, `setAutoUpdateChannel`, `updateToLatest`,
  `rollbackRelease` to `OverviewTab` — those move into the drawer.

### Deleted: `modules/cloud/components/env-metadata-dialog.tsx`

The drawer absorbs everything it did. The file goes.

### Changed: `app/cloud/[project]/tabs/overview.tsx`

Removals:

- **Domain Configuration card** (`overview.tsx:1136-1157`).
- **Auto-update mount** (`overview.tsx:1002-1010`).
- **Recent Activity card** (`overview.tsx:1162-1186`).
- **`ActivityStatusStrip` helper** (moves into the drawer file).
- **`CustomDomainSection` inline definition** (`overview.tsx:505-716`,
  including `OWNED_DNS_ZONES` constant + `isOwnedDomain` helper) — replaced by
  the import from the new shared file. The drawer is now the only consumer,
  but the import path keeps `overview.tsx` from holding orphan code.

Wait — overview.tsx no longer renders the section, so it doesn't import it.
Only the drawer file imports `CustomDomainSection`. Drop the inline definition
from overview.tsx entirely.

Prop signature changes on `OverviewTabProps`:

- Drop `setCustomDomain`, `setAutoUpdateChannel`, `updateToLatest`,
  `rollbackRelease`.

Hook + state cleanup inside `OverviewTab`:

- Drop `useEnvironmentEvents` call (`events`, `eventsLoading`) — only the
  Activity card consumed them.
- Drop `usePackageUpdates` if no other consumer remains (verify before
  removing). `AvailableUpdatesCard` still uses package updates via prop, so
  this stays for now — verify in implementation.
- Drop unused icon imports surfaced by lint after the cards are gone.

## Data flow

```
page.tsx
├ useEnvironmentStatus → status, statusLoading             (existing)
├ Hero ⚙ icon → setSettingsOpen(true)
├ <OverviewTab .../>                                       (services + packages + agents only)
├ <ServiceDetailDrawer .../>                               (existing)
├ <AgentDetailDrawer .../>                                 (existing)
├ <EnvActionBar .../>                                      (existing)
└ <EnvSettingsDrawer
     open={settingsOpen}
     onOpenChange={setSettingsOpen}
     environment, tenantId, subdomain
     status, statusLoading
     onSetCustomDomain, onSetAutoUpdateChannel,
     onUpdateToLatest, onRollbackRelease, onTerminate
   />
   ├ Tabs: Domain | Updates | Activity | Metadata
   ├ Activity tab → useEnvironmentEvents(subdomain, tenantId, 5, env.id)
   └ Metadata tab → existing read-only fields + collapsed Danger Zone
```

## Edge cases

- **Settings drawer open while a service drawer is also open** — the existing
  service drawer uses URL state (`?drawer=service:switchboard`); the settings
  drawer uses local React state. They can both be "open" simultaneously
  because they're different scopes; in practice opening one doesn't dismiss
  the other unless we add focus management. Acceptable for v1; users can close
  one manually. Revisit if it becomes a real annoyance.
- **Auto-update callbacks unset** (read-only viewer, no signer) — Updates tab
  shows the muted empty-state copy instead of `AutoUpdateCard`.
- **Terminate unavailable** (DRAFT / TERMINATING / DESTROYED / ARCHIVED) — same
  gating as today; the Danger Zone hides the Terminate row, Delete stays.
- **Events refresh** — the drawer mounts `useEnvironmentEvents` only while open.
  Closing the drawer unmounts it; reopening triggers a fresh fetch. This matches
  how the existing service / agent drawers handle their logs / metrics hooks.
- **Default tab** — `value="domain"` on first open. The drawer doesn't
  remember the last-selected tab across opens; that's fine for ephemeral
  settings access.

## Verification

After the change:

1. **Env page**: hero shows a gear icon (no more `i`). Below the hero: only
   services + packages + agents. No Domain, no Auto-update, no Recent Activity
   cards.
2. **Click gear**: settings drawer slides in from the right with four tabs.
   Default tab is **Domain** showing generic + custom domain editor.
3. **Updates tab**: AutoUpdateCard renders with channel selector + update-now
   - rollback buttons (when the env is owned + signed in).
4. **Activity tab**: ArgoCD + drift pills + last-sync timestamp render at the
   top; recent kube events listed below. Pills match the floating bottom bar's
   drift signal.
5. **Metadata tab**: doc id (click-to-copy), type, revision, timestamps.
   Danger Zone toggles open to reveal Terminate (when eligible) + Delete.
   Delete confirmation navigates to `/cloud` on success.
6. **Floating bar** still shows for DRAFT / pending / deploying / drift —
   unchanged.
7. **Type + lint pass**: `pnpm tsc` and `pnpm lint` clean (no new warnings).

## Implementation order (small commits)

1. **Spec** — this document.
2. **Extract `CustomDomainSection`** to `modules/cloud/components/custom-domain-section.tsx`. Update overview.tsx to import (still rendered there at this point). No behavioural change.
3. **Build `EnvSettingsDrawer`** + wire into `page.tsx` (replaces the
   `EnvMetadataDialog` mount). Change icon to `Settings`. Delete
   `env-metadata-dialog.tsx`. **Drawer renders alongside the old cards** at
   this point — page has the settings in both places temporarily.
4. **Strip overview.tsx**: delete the Domain / Auto-update / Recent Activity
   cards, `ActivityStatusStrip` helper, `useEnvironmentEvents` call, related
   prop drops. Now the page is the simplified version and the drawer is the
   single source of those surfaces.

Each commit compiles independently. After commit 3 there's transient
duplication (cards on page + drawer have the same content). Commit 4 resolves
it.
