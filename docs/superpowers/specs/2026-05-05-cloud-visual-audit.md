# Cloud product visual audit (2026-05-05)

The cloud surface area today reads as **functional but visually disconnected from the Vetra brand on the landing page**. The landing page (CloudLandingHero, CloudLandingFeatures) uses bold lime-green gradients, an iso-grid 3D pattern, and real depth. Once you cross into the authenticated `/cloud` dashboard the product flattens into stock shadcn primitives — flat cards, plain dialogs, a dim grey overlay. Same for env detail, modals, popovers.

This audit catalogs what's there, what's weak, and what the high-level themes are for an upgrade.

## Per-surface findings

### `/cloud` (unauthenticated landing)

- Already on-brand. Nothing to do.

### `/cloud` (authenticated dashboard) — `app/cloud/cloud-dashboard.tsx`

- Three flat stat tiles (`bg-card border-border rounded-lg border px-4 py-3`) — no visual hierarchy, no accent for readiness ratio, no spark/trend
- `<h1>Your Environments</h1>` is large but lonely; no illustration, no welcome cue
- Breadcrumb is `Cloud / Dashboard` — borderline noise (the page title already says it)
- Empty state of `CloudEnvironments` (no envs yet) is unverified but probably basic too
- Create Environment CTA is a green button — fine, but doesn't feel "premium"

### `/cloud/[id]` env detail — `app/cloud/[project]/page.tsx` + `tabs/overview.tsx`

- Header: title + StatusBadge + Visit dropdown — minimal, no env identity (e.g., subdomain shown as small text only)
- Tabs (Overview / Configuration / Deployments / Logs / Metrics) — default shadcn `TabsList`, no emphasis on active state
- Overview tab has many stacked Cards with similar flat treatment — the page reads as a long vertical scroll with no anchoring rhythm
- `OverviewTab` is **1100+ lines** in a single file — UI maintenance hazard
- Auto-update card, available updates card, status card, services, packages, agents, custom domain, terminate — each a separate Card with similar rendering
- Status indicators are good (StatusBadge has clear semantics) but information density is low
- No background art or texture; the body is just `bg-background`

### Modals — Dialog / AlertDialog primitives

- `bg-background` (so they blend into the page in dark mode), thin border, default shadow — feel like a popped-up div, not an "important moment"
- Overlay is `bg-black/50` — dim only, no `backdrop-blur` → background stays sharp through it, breaks the "modal is foreground" expectation
- No icon or illustration in headers
- Animation is fade + zoom-95 — fine but unremarkable
- Save/cancel layout is right-aligned, basic spacing — doesn't read as decisive

### AddAgentModal, AddPackageModal, UpgradeModal — 559 / 399 / 359 LOC each

- Heavy multi-step flows inside basic Dialog frames
- Forms use `Input` / `Textarea` / `Label` defaults — sufficient but not delightful
- Long flows don't progress-disclose well; users see everything at once
- BookMeetingModal — same skin

### Empty states

- AgentsSection now has a friendlier empty state (today's PR), but the cloud dashboard's no-env state, configuration tab's no-package state, and most others are bare text + maybe one icon
- No illustrations, no animations, no encouragement

### Loading states

- `Loading environment...` plain text
- `Loading package manifest…` plain text inside cards
- No skeletons, no shimmer, no progressive scaffolding

### Status / data visualization

- `StatusBadge` with text labels — solid
- Recently added `LiveStatusPill` (today) — good, consistent
- `Sparkline` exists but only on metrics; could be used elsewhere (per-env health, per-agent)
- Pod restart counts shown as small text — fine but feel like an afterthought
- No "this env vs avg" comparisons, no historical context anywhere on Overview

### Forms / inputs

- `Input` and `Textarea` defaults — `border` + `bg-background` + small focus ring. Fine but unstylish.
- No inline validation states with clear visual cue (just `text-destructive` text below)
- `Combobox` (used in AddAgentModal package search) is OK but the popover treatment is plain
- ResourceSizePicker — checked the file; renders boxes with size labels; could be a nicer toggle group

### Micro-interactions

- Hover states: mostly bg color shifts. No motion, no spring, no playful state changes.
- Drawing user attention to fresh data: nothing. New deploys land silently.
- Transitions between tab content: instant.
- Optimistic updates exist (use-optimistic.ts) but no UI indication.

### Backgrounds

- `--background` is a single solid color in both modes
- No gradients, no noise, no subtle pattern, no aurora/blob, no grid
- The landing page has all of this; the product has none

### Typography

- Tailwind defaults via Inter (assumed) — readable, not distinctive
- Heading sizes are appropriate but **no font weight contrast** between primary section titles and minor labels
- Numerals are not tabular in some places (env counters etc.)

## High-level themes

These are the recurring axes where impact is highest:

### 1. Backgrounds & ambient depth

Everywhere uses flat `--background`. Add subtle layered depth: a dim radial gradient mesh on the body, very low-opacity grain texture, an iso-grid echo behind big stat tiles. This single change has the largest "visual upgrade" return per line of code because every surface inherits it.

### 2. Glass / elevation on key cards

Frosted-glass treatment for hero cards (env detail header, status, primary CTAs). `bg-card/70 backdrop-blur` over a textured background reads as a premium, modern product. Reserve this for "moments" — agent header card, env-status panel, modals — not every card, to keep hierarchy.

### 3. Modal upgrade (highest user-felt impact)

- Backdrop: `bg-black/40 backdrop-blur-md` (glass overlay)
- Content: rounded-xl + frosted background + subtle ring border + a soft accent gradient at the top edge, optional icon in the header
- Animations: keep the existing spring; add a subtle scale-on-open and a backdrop blur transition

### 4. Status & data richness on Overview

- Add a "health bar" / sparkline to the env header showing the last hour at a glance
- Per-agent: a tiny restart-count timeline or last-seen timestamp instead of a static counter
- Stat tiles on `/cloud` dashboard: include a tiny up-arrow / down-arrow with delta vs last week

### 5. Empty + loading states

- Replace text-only empty states with friendly mini-illustrations (line-art, single brand color) and a clear primary CTA
- Replace loading text with skeleton cards (we already have shadcn `Skeleton` in the design system based on pattern naming — verify)

### 6. Micro-interactions

- Subtle scale + shadow lift on hover for primary cards
- Soft fade-in for newly arrived data (e.g. an env that just finished provisioning)
- Confetti or accent flash on first successful deploy (single moment, not noise)

### 7. Component-level rhythm

Today's PR #32 already addressed this for AgentCard / ServiceCard / EndpointRow. Need to extend the same treatment to PackageRow, ResourceSizePicker rows, and any inner-list pattern in Configuration / Deployments / Metrics tabs.

### 8. Refactor `tabs/overview.tsx`

1100+ lines is a hazard — splitting into per-section components (StatusSection, ServicesSection, PackagesSection, AutoUpdateSection, AgentsSection, CustomDomainSection, DangerZone) makes the design pass realistic AND makes the file maintainable for the team.

## What's NOT broken

- StatusBadge is solid, color semantics work
- LiveStatusPill (just shipped) is good
- Tabs structure is appropriate
- Iconography is consistent (lucide-react throughout)
- Color tokens via CSS variables — easy to adjust globally

## Scope check

This is too broad for a single PR. The realistic decomposition:

1. **Foundation (1 PR)** — body backgrounds, ambient depth, base Card/Modal upgrades. Affects every page; biggest perceived impact per LOC.
2. **Modals (1 PR)** — Dialog + AlertDialog primitives upgraded; all modal surface inherits.
3. **Env detail header + tabs (1 PR)** — env-detail header upgrade, tab styling, status hero card.
4. **Empty + loading states (1 PR)** — small illustrations, skeletons, friendlier copy.
5. **Overview refactor + per-section polish (1-2 PRs)** — split overview.tsx, then polish each section individually.

PR #1 is the natural starting point: it sets the visual language that everything else builds on.
