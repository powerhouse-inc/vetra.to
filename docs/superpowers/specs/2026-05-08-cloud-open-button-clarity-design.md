# Cloud "Open" button clarity

**Status:** draft
**Date:** 2026-05-08
**Driver:** liberuum feedback — "Open" on the cloud platform isn't precise; expected
to open the running service / agent, not in-app details.

## Problem

Across the cloud UI, three buttons say **"Open"** and pair the label with the
`ExternalLink` icon, but they all open in-app drawers or pages — not the live,
running thing. Meanwhile, the existing **"Visit"** dropdown on the env detail
page hero correctly uses the same icon for true external navigation. The icon
no longer reliably signals "this opens in a new tab", and the word "Open" reads
to users (per liberuum) as a promise to launch the running service or agent.

The three offending sites:

| Site                      | File                                              | Today                                                              |
| ------------------------- | ------------------------------------------------- | ------------------------------------------------------------------ |
| Env card on cloud listing | `app/cloud/cloud-projects.tsx:110`                | Primary blue **"Open"** → `/cloud/<id>` (in-app)                   |
| Service row on env detail | `app/cloud/[project]/tabs/overview.tsx:303-313`   | Outline **"Open"** + `ExternalLink` icon → service drawer (in-app) |
| Agent card on env detail  | `modules/cloud/components/agent-card.tsx:258-269` | Outline **"Open"** + `ExternalLink` icon → agent drawer (in-app)   |

The env card never offers a way to jump to the running environment at all —
the user has to click into the env page to find the "Visit" dropdown.

## Goals

- Establish a single, codebase-wide rule for "in-app" vs. "external" buttons,
  matching the language the env detail page already uses.
- Make the env card surface a one-click "Visit" link to the live environment
  when it makes sense.
- Keep the change targeted: rename + (one) added button. No drawer/page
  reorganisation, no design-system additions.

## Non-goals

- Reworking the env detail page hero "Visit" dropdown (already on-pattern).
- Touching `modules/cloud/components/service-card.tsx` — it is dead code
  (not imported anywhere; only referenced by a comment in `live-status-pill.tsx`).
  Removing it is a separate cleanup, not part of this work.
- Adding a "Visit" affordance to agents — agent endpoints are API/webhook
  surfaces, not browser destinations. `Details` is the only meaningful button.
- Changing icons, colors, or spacing of buttons beyond what this rename forces.

## The pattern

```
Visit   = ExternalLink icon + opens live URL in a new tab (target="_blank")
Manage  = primary action that takes the user into the in-app admin surface
Details = secondary action that opens an in-app drawer for inspection
```

`ExternalLink` is reserved for true external navigation. In-app actions never
use it. `Manage` is used only on the env card (the "open the environment in
the dashboard" primary action); inside the env, the secondary inspect actions
use `Details`. This keeps the visual hierarchy intact while removing the
language ambiguity.

## Per-site changes

### 1. Env card — `app/cloud/cloud-projects.tsx`

Current button row (lines 108–123):

```tsx
<div className="flex gap-2">
  <Button variant="default" asChild className="flex-1">
    <Link href={`/cloud/${env.id}`}>Open</Link>
  </Button>
  <AlertDialog ...>{/* trash icon */}</AlertDialog>
</div>
```

After:

```tsx
<div className="flex gap-2">
  <Button variant="default" asChild className="flex-1">
    <Link href={`/cloud/${env.id}`}>Manage</Link>
  </Button>
  {canVisit && (
    <Button variant="outline" size="sm" asChild className="shrink-0">
      <a
        href={visitUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Visit ${displayName}`}
      >
        <ExternalLink className="h-4 w-4" />
        Visit
      </a>
    </Button>
  )}
  <AlertDialog ...>{/* trash icon, unchanged */}</AlertDialog>
</div>
```

`canVisit` and `visitUrl` derive inline from `env.state`, using the same field
names the env detail page uses (`app/cloud/[project]/page.tsx:47,142,220`):

```ts
const connectService = env.state.services.find((s) => s.type === 'CONNECT' && s.enabled)
const subdomain = env.state.genericSubdomain ?? null
const baseDomain = env.state.genericBaseDomain ?? 'vetra.io'
const canVisit = env.state.status === 'READY' && !!subdomain && !!connectService
const visitUrl = canVisit
  ? `https://${connectService.prefix}.${subdomain}.${baseDomain}`
  : undefined
```

Inline derivation is fine for a single call-site; no helper is required.
If a second card-level call-site appears later, lift to a helper then.

### 2. Service row — `app/cloud/[project]/tabs/overview.tsx`

Lines 303–313 today:

```tsx
{
  isEnabled && onOpenDetail && (
    <Button
      variant="outline"
      size="sm"
      onClick={onOpenDetail}
      aria-label={`Open ${label} details`}
      className="hidden gap-1.5 sm:inline-flex"
    >
      <ExternalLink className="h-3.5 w-3.5" />
      Open
    </Button>
  )
}
```

After:

```tsx
{
  isEnabled && onOpenDetail && (
    <Button
      variant="outline"
      size="sm"
      onClick={onOpenDetail}
      aria-label={`View ${label} details`}
      className="hidden sm:inline-flex"
    >
      Details
    </Button>
  )
}
```

Removes `<ExternalLink />` import use (only if no other usage in the file —
verify), drops the `gap-1.5` class (no icon, no gap needed), updates
`aria-label`, changes label text. The clickable serviceUrl text on the same
row already provides the "Visit" affordance for services here.

### 3. Agent card — `modules/cloud/components/agent-card.tsx`

Lines 260–269 today:

```tsx
{onOpenDetail ? (
  <Button
    variant="outline"
    size="sm"
    onClick={onOpenDetail}
    aria-label="Open agent details"
  >
    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
    Open
  </Button>
) : (...)}
```

After:

```tsx
{onOpenDetail ? (
  <Button
    variant="outline"
    size="sm"
    onClick={onOpenDetail}
    aria-label="View agent details"
  >
    Details
  </Button>
) : (...)}
```

Drop the `ExternalLink` import (verify it's not used elsewhere in the file).
The internal JSDoc comments at lines 87–93 still describe an "Open" button —
update them to say "Details".

## Verification

After the change:

1. **Visual check (env listing):** A `READY` env with CONNECT enabled shows
   `[Manage] [↗ Visit] [🗑]`. A `DRAFT` or `STOPPED` env shows just
   `[Manage] [🗑]`. Click `Visit` → opens `connect.<subdomain>.vetra.io` in a
   new tab. Click `Manage` → navigates to the env detail page in the same tab.
2. **Visual check (env detail page):** Each enabled service row shows
   `[Details]` (no icon) on `sm+` breakpoints, hidden below. Click → opens the
   service drawer. The serviceUrl text link beside it still opens the live URL.
3. **Visual check (agent cards):** Each agent card shows `[Details]` (no icon).
   Click → opens the agent drawer.
4. **No `ExternalLink` icon survives on any in-app navigation button.** Grep
   the diff to confirm.
5. **Type-check + lint pass:** `pnpm tsc` and `pnpm lint` clean.
6. **No test breakage:** the only lookups by "Open" text are the source files
   themselves; there are no tests asserting on `Open agent details` or
   `Open <service> details` aria-labels (verified pre-implementation).

## Out of scope / follow-ups

- Removing dead `service-card.tsx` is a separate small cleanup PR.
- A future change could let users edit the env-card "Visit" target (e.g.
  "Visit on custom domain") once custom-domain-on-env-card is wired up.
