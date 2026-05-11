# Design system unification — buttons, badges, status tokens

**Status:** draft
**Date:** 2026-05-11
**Driver:** Cloud UI buttons feel ad-hoc: floating bar uses hand-rolled
emerald + blue, the env card "Manage" is a different size than other CTAs,
"+ Add" / "+ Add agent" / "Install agent" / "Add Package" all coexist for the
same role. The user asked to also audit Cards, Inputs, Badges, and theming
while we're at it.

## Audit findings

| Primitive    | Uses                     | Issue                                                                                                                                                                                                                               |
| ------------ | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button       | ~125 (across 5 variants) | Hand-rolled colors in `env-action-bar.tsx`; sizes mixed (sm / default / lg without rule); naming inconsistent.                                                                                                                      |
| Badge        | 39                       | 4 variants in use ✓ but **45 ad-hoc font-size overrides** — `text-[9px]` ×16, `text-[10px]` ×22, `text-[11px]` ×12. Three pixel sizes for one conceptual "tiny badge".                                                              |
| Card         | 26                       | Already consistent — `rounded-xl`, auto padding via header/content. No changes.                                                                                                                                                     |
| Input        | 18                       | Single primitive, no variants. Two informal conventions: `font-mono text-sm` for identifiers/code, default for everything else. Acceptable.                                                                                         |
| Theme tokens | —                        | `--primary` / `--secondary` / `--accent` / `--destructive` cover buttons. **No semantic status tokens** (success/warning/info) — status dots and pills use raw Tailwind palette (`bg-emerald-500`, `bg-amber-500`, …), drift-prone. |

## Goal

Three coordinated changes:

1. **Button role system** — every Button mapped to one of four roles
   (primary / secondary / ghost / destructive) tied to existing tokens. No
   hand-rolled colors. Sizes by surface: `sm` for compact rows, `default` for
   modal CTAs, `lg` for landing-page hero CTAs.
2. **Badge size variant** — add `size: 'default' | 'xs'` to the Badge
   primitive; sweep 45 ad-hoc font-size overrides to `size="xs"`.
3. **Semantic status tokens** — add `--success` / `--warning` / `--info` to
   `globals.css` and expose as Tailwind colors. Sweep status dots / pills /
   `LiveStatusPill` / `ActivityStatusStrip` to use them.

## Non-goals

- No new Button or Badge variants beyond what's listed above.
- No Card "tone" / coloured-border variant — Danger Zone (the only consumer)
  has moved.
- No Input variants — informal `font-mono text-sm` convention stays as
  className.
- No icon-system audit (Lucide → custom set).
- No light/dark theming rework. Only token additions.
- No `design-system` package extraction.

## Components

### Changed: `app/globals.css`

Add to both `:root` and `.dark`:

```css
--success: #04c161; /* brand green — "good" / "synced" / "ready" */
--success-foreground: #ffffff;
--warning: #ffa132;
--warning-foreground: #1b1e24;
--info: #329dff;
--info-foreground: #ffffff;
/* danger uses existing --destructive; no new token. */
```

Add to the `@theme inline` block that exposes CSS vars as Tailwind utility
classes:

```css
--color-success: var(--success);
--color-success-foreground: var(--success-foreground);
--color-warning: var(--warning);
--color-warning-foreground: var(--warning-foreground);
--color-info: var(--info);
--color-info-foreground: var(--info-foreground);
```

This unlocks `bg-success`, `text-warning`, etc. across the codebase.

### Changed: `modules/shared/components/ui/badge.tsx`

Add a `size` variant axis to `badgeVariants`:

```ts
size: {
  default: 'px-2 py-0.5 text-xs',
  xs: 'px-1.5 py-0 text-[10px]',
}
defaultVariants: {
  variant: 'default',
  size: 'default',
}
```

(The existing base class has `px-2 py-0.5 text-xs` inline — move that under
the `default` size so the `xs` size can swap it cleanly.)

### Changed: `modules/cloud/components/env-action-bar.tsx`

Drop the hand-rolled `bg-emerald-600` / `bg-blue-600` button styles. Use
`<Button variant="default">` for both Deploy and Approve, plus a
`rounded-full px-5` className override to keep the pill silhouette.

Both CTAs are the user's primary action at their respective lifecycle
states — they're the same role.

### Changed: `app/cloud/cloud-projects.tsx`

Env card buttons sized to `sm` (was `default`-size):

- `Manage` → `<Button variant="default" size="sm" asChild className="flex-1">`
- `Visit` → `<Button variant="outline" size="sm" asChild className="shrink-0">`

### Changed: `modules/cloud/components/packages-section.tsx`

`AddPackageModal`'s trigger button label `+ Add` → `+ Add package`. (Verb-object
consistency with `+ Add agent`.)

### Changed: status surfaces

Sweep these to use semantic tokens instead of raw palette:

- `app/cloud/[project]/tabs/overview.tsx` `StatusDot` (lines ~47-60): the
  `bg-emerald-500` / `bg-yellow-500` / `bg-blue-500` / `bg-red-500` /
  `bg-muted-foreground` mapping → `bg-success` / `bg-warning` / `bg-info` /
  `bg-destructive` / `bg-muted-foreground`.
- `modules/cloud/components/live-status-pill.tsx` — pill tone classes
  switch from `bg-emerald-500/15 text-emerald-400` style to
  `bg-success/15 text-success` style. (Each tone — `running`, `restarting`,
  `failed`, `idle` — picks one of success / warning / destructive / muted.)
- `modules/cloud/components/env-settings-drawer.tsx` `ActivityStatusStrip`
  pills — `text-emerald-500` → `text-success`, `text-amber-500` →
  `text-warning`.
- `app/cloud/cloud-projects.tsx` env-card `STATUS_LABELS` map — same:
  `bg-success` / `bg-warning` / `bg-destructive` / `bg-muted-foreground`.

### Sweep: Badge size

Replace `className="text-[10px]"` (and `text-[9px]`, `text-[11px]`) on
`<Badge>` instances with `size="xs"`. Three pixel sizes collapse to one.

Affected files (approximate, from grep):
`config-row.tsx`, `package-config-form.tsx`, `package-row.tsx`,
`auto-update-card.tsx`, `agent-detail-drawer.tsx`,
`mobile-filters.tsx` (packages page), `package-card.tsx`,
`app/packages/[id]/page.tsx`, plus a handful in overview.tsx.

### Sweep: button roles app-wide

Audit hand-rolled colors and odd sizes across `app/(home)`, `modules/home`,
`app/builders`, `app/packages`, `app/contributors`, `app/finances`. Most
likely already on the variant system; only fix the outliers.

### New: doc comments

Top of `modules/shared/components/ui/button.tsx` gains a short block
explaining the four-role intent so future contributors don't reinvent.
Same for `badge.tsx` re. the size convention.

## Edge cases

- **Buttons inside `<Link>` / `asChild`** — variant changes still apply
  because they're className-based; sizes too.
- **Dark mode parity** — status tokens added to both `:root` and `.dark`;
  same hex values (the brand green works in both, as does the warning
  amber). Foregrounds adjusted only for warning (dark text on light amber).
- **Action bar still has `rounded-full`** — overrides Button's default
  `rounded-md`. That's fine; pill shape is intentional.
- **`AlertDialogAction` retains its destructive solid style** for the final
  commit step (Delete / Uninstall / Terminate). The role system explicitly
  reserves `variant="destructive"` for those, not the pre-confirm trigger.

## Verification

1. **Visual sweep**: every Button on the env page (cloud listing + project
   detail + drawers) reads as one of four roles; no hand-rolled `bg-*`
   colors remain on action buttons.
2. **Badge audit**: `grep -r 'text-\[9\|10\|11\]px.*Badge'` returns nothing
   on the touched files.
3. **Status tokens**: `bg-emerald-500` / `bg-amber-500` / `bg-yellow-500`
   etc. only appear in non-status contexts (e.g. decorative landing-page
   gradients).
4. **Type-check + lint clean**: `pnpm tsc` and `pnpm lint`.
5. **Dev compile**: `/cloud/test-id` returns HTTP 200.

## Implementation order (small commits)

1. **Spec** — this document.
2. **Theme tokens**: add `--success` / `--warning` / `--info` + Tailwind
   exposure in `globals.css`.
3. **Badge `size="xs"`**: primitive change. No consumers updated yet.
4. **Action bar to Button + brand green**: drop hand-rolled colors.
5. **Status surfaces use semantic tokens**: `StatusDot`, `LiveStatusPill`,
   `ActivityStatusStrip`, env-card status map.
6. **Badge sweep**: replace ad-hoc `text-[9-11px]` with `size="xs"` across
   cloud + packages pages.
7. **Env card sizing + label tweaks**: `Manage` / `Visit` to `sm`,
   `+ Add` → `+ Add package`.
8. **App-wide audit** (home / builders / packages / contributors /
   finances): fix any remaining hand-rolled colors or off-spec sizes.
9. **Doc comments** at the top of `button.tsx` + `badge.tsx`.

Each commit independently compiles.
