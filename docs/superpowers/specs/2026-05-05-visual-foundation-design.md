# Visual foundation design (PR #1 of cloud visual upgrade)

**Direction:** "Subtle Depth + Glass" (Direction A from `2026-05-05-cloud-visual-audit.md`).

**Goal:** Bridge the visual gap between the on-brand landing page and the utilitarian product surface. Single foundational PR that every page on `vetra.to` inherits — backgrounds, modals, opt-in hero card variant, accent tokens. No per-page redesign.

**Site-wide impact (explicit):** changes are made at the root layout and shared design-system primitives. Every existing surface — cloud landing, cloud dashboard, env detail and its tabs, modals, packages, builders, contributors, finances, ecosystem-staging — gets the ambient background and upgraded modals automatically. Pages that paint their own backgrounds (e.g. CloudLanding hero) layer naturally above the ambient layer (`-z-10`).

## Architecture

```
app/layout.tsx
  └── <body bg-background>
        ├── <AmbientBackground />        (fixed inset-0 -z-10 pointer-events-none)
        ├── ThemeProvider
        │     └── ...
        │           └── <main>{children}</main>   ← every page
        │
        └── (modals portal into here)
              ↳ Dialog / AlertDialog now glass-on-blur
```

The ambient layer sits behind everything via `-z-10`. Page content lives at the default stacking. Pages with stronger custom backgrounds (CloudLanding hero) cover it via their own larger painted area; everything else is `bg-transparent` over the ambient.

The `<body>`'s existing `bg-background` becomes the base color _behind_ the ambient layer, ensuring no flash-of-unstyled-content during hydration.

## Components & changes

### `app/globals.css` — accent tokens

Add to both `:root` and `.dark`:

```css
:root {
  --accent: #04c161; /* matches landing primary CTA */
  --accent-2: #c2f5cd; /* lighter pair for gradients */
  --background-subtle: rgba(4, 193, 97, 0.04);
}
.dark {
  --accent: #00b76e;
  --accent-2: #1a3d2a;
  --background-subtle: rgba(4, 193, 97, 0.06);
}
@theme inline {
  --color-accent: var(--accent);
  --color-accent-2: var(--accent-2);
  --color-background-subtle: var(--background-subtle);
}
```

### `modules/shared/components/ui/ambient-background.tsx` — new

```tsx
'use client'

/**
 * Site-wide ambient backdrop. Mounted once at app/layout.tsx, sits
 * behind everything via fixed -z-10. Uses pure CSS — no JS, no canvas.
 *
 *  - 3 large blurred radial blobs at low opacity, anchored at viewport
 *    corners, providing soft pools of brand colour.
 *  - Low-opacity SVG noise tile to break banding and add film grain.
 *
 * Theme-aware via CSS variables (--accent, --accent-2). Pages that
 * paint their own background (e.g. landing hero) naturally stack above.
 */
export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* radial blobs */}
      <div className="absolute -top-[20%] -right-[10%] h-[60vh] w-[60vh] rounded-full bg-[radial-gradient(circle,_var(--accent)_0%,_transparent_60%)] opacity-[0.06] blur-3xl dark:opacity-[0.08]" />
      <div className="absolute -bottom-[20%] -left-[10%] h-[55vh] w-[55vh] rounded-full bg-[radial-gradient(circle,_var(--accent-2)_0%,_transparent_60%)] opacity-[0.05] blur-3xl dark:opacity-[0.07]" />
      <div className="absolute top-[30%] left-[40%] h-[50vh] w-[50vh] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_var(--accent)_0%,_transparent_70%)] opacity-[0.03] blur-3xl dark:opacity-[0.05]" />

      {/* film grain — fixed-size SVG noise tile, repeats */}
      <div
        className="absolute inset-0 opacity-[0.025] mix-blend-overlay dark:opacity-[0.04]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          backgroundSize: '160px 160px',
        }}
      />
    </div>
  )
}
```

### `app/layout.tsx` — mount the ambient layer

Single insert inside `<body>`:

```tsx
<body className={`${inter.variable} bg-background antialiased`}>
  <AmbientBackground />
  <NuqsAdapter>
    ...
```

### `modules/shared/components/ui/dialog.tsx` — overlay + content upgrade

Update `DialogOverlay`:

```tsx
className={cn(
  'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
  'fixed inset-0 z-50 bg-background/40 backdrop-blur-md',
  className,
)}
```

Update `DialogContent`'s root `className`:

```tsx
className={cn(
  // base
  'fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-xl p-6 sm:max-w-lg',
  // glass surface
  'bg-card/85 backdrop-blur-xl border border-border/40 shadow-2xl',
  // soft top accent stripe
  "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-accent before:to-transparent before:opacity-60",
  // animations
  'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-250',
  className,
)}
```

Add an optional `icon` slot in `DialogHeader` (small accent circle when provided):

```tsx
function DialogHeader({
  icon,
  className,
  children,
  ...props
}: React.ComponentProps<'div'> & { icon?: React.ReactNode }) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    >
      {icon && (
        <div className="bg-accent/10 text-accent mb-2 flex h-10 w-10 items-center justify-center rounded-full">
          {icon}
        </div>
      )}
      {children}
    </div>
  )
}
```

### `modules/shared/components/ui/alert-dialog.tsx` — same upgrades

Mirror the Dialog overlay/content/header treatment. AlertDialog's existing button styling (Cancel = outline, Action = primary) keeps working.

### `modules/shared/components/ui/card.tsx` — additive HeroCard variant

Existing `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter` keep their current implementations untouched (no consumer breaks).

Add a new export:

```tsx
function HeroCard({
  className,
  glass = false,
  accentTop = true,
  ...props
}: React.ComponentProps<'div'> & { glass?: boolean; accentTop?: boolean }) {
  return (
    <div
      data-slot="hero-card"
      className={cn(
        'relative flex flex-col overflow-hidden rounded-xl shadow-sm dark:border dark:border-gray-800',
        glass ? 'bg-card/70 backdrop-blur-xl' : 'bg-card text-card-foreground',
        accentTop &&
          'before:via-accent before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:to-transparent before:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
```

`HeroCard` is opt-in. Future polishing PRs can swap `<Card>` → `<HeroCard>` per surface (env-detail header, primary status panel, etc.). Today's PR doesn't migrate any existing usage — that's deliberate scope-control.

## What this PR explicitly does NOT do

- No env-detail header redesign
- No tab styling changes
- No empty/loading state illustrations or skeletons
- No `tabs/overview.tsx` refactor
- No swap from `Card` to `HeroCard` anywhere yet
- No new copy/microcopy

These all become individual follow-up PRs that build on this foundation.

## Visual verification

`tests/visual-foundation.spec.ts` (new playwright test):

1. Navigate to `/cloud` (landing) — screenshot in light + dark
2. Navigate to `/audit-preview` (existing temp page; will be removed in cleanup PR but useful here) — screenshot
3. Trigger AlertDialog (Open AlertDialog button) — screenshot in light + dark
4. Trigger Dialog (Open Dialog button) — screenshot in light + dark
5. Save under `tests/__visuals__/` for manual review

This is for human eyes, not automated diff (intentionally — the brand language is what we're validating, and that's a judgment call).

## Risks

1. **Backdrop-blur on Safari with weak GPU** can stutter. Mitigation: limit to modal overlay + content (small surface area). The ambient blur is on a fixed div with no scrolling, so it composites once.
2. **Accent color contrast** in light mode against the existing `bg-card` (#fcfcfc) — the lime is very pale. Verify the top-edge gradient is visible without being garish; tune opacity if needed during implementation.
3. **Ambient layer + dark mode + low-end displays** — banding can appear. The grain layer should kill this; verify on a low-quality screen if available.
4. **Print stylesheets** — the grain SVG could be heavy. Add `@media print { .ambient-background { display: none } }` if needed (future PR).

## Out of scope (future PRs in this initiative)

- PR #2: Modal-by-modal copy + flow polish (AddAgent, AddPackage, Upgrade, BookMeeting)
- PR #3: env-detail header migration to HeroCard + tabs visual upgrade
- PR #4: Empty + loading states (skeletons, illustrations)
- PR #5: Overview tab refactor (1100-line file split into per-section components, each polished individually)
- PR #6: Per-section visual polish (Configuration, Deployments, Logs, Metrics tabs)
