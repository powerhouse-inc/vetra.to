# Packages Page Redesign

## Problem

The packages page (listing + detail) was added by a junior dev and deviates from the established design system: hardcoded inline shadows, no mobile responsiveness, custom checkbox instead of shared UI, manual color rotation, legacy unused code in `/modules/packages/`.

## Approach

Full redesign of both pages using established design system components and Tailwind defaults. No custom CSS tokens — if Tailwind has a built-in way to do it, use that.

## Global Changes

### Responsive Typography

Add `clamp()` values for `--font-size-xl` through `--font-size-5xl` in `@theme` block in `globals.css`. All pages benefit automatically.

```css
@theme {
  --font-size-xl: clamp(1.15rem, 1.5vw, 1.25rem);
  --font-size-2xl: clamp(1.35rem, 2vw, 1.5rem);
  --font-size-3xl: clamp(1.6rem, 2.5vw, 1.875rem);
  --font-size-4xl: clamp(1.875rem, 3.5vw, 2.25rem);
  --font-size-5xl: clamp(2.25rem, 5vw, 3rem);
}
```

### Container Width

Replace all `max-w-[var(--container-width)]` (26 usages) with `max-w-screen-xl`. Remove `--container-width` from globals.css.

## Listing Page (`/packages/page.tsx`)

### Layout

- Header: `Breadcrumb` component (not hand-rolled div), heading uses standard `text-4xl`
- Content: `grid lg:grid-cols-4` — filters `lg:col-span-1`, package grid `lg:col-span-3`
- Package grid: inner `grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3`

### Mobile Filters

- Below `lg`: sidebar hidden, "Filters" button shown above grid
- Button opens `Sheet` (shadcn/ui, already in shared) with same `Filters` component
- Badge on button shows active filter count

### Package Cards

- Use `Card` component: `rounded-xl shadow-sm hover:shadow-md`
- Content: cover image, name, publisher, description (2-line clamp), category badge, module type badges
- Entire card links to `/packages/[name]`

### Empty State

- Centered, muted text, search icon

## Filters Component

- Replace inline `boxShadow` with `shadow-sm bg-card rounded-xl`
- Replace custom `PackagesCheckbox` with shared `Checkbox` from `modules/shared/components/ui/checkbox`
- Replace raw `<input>` with shared `Input` component
- Remove hardcoded `min-w-76`, let it size naturally
- Keep color-coded filter labels (useful UX)

## Detail Page (`/packages/[id]/page.tsx`)

- Keep `StripedCard` usage (appropriate for detail views)
- Move `server-data.ts` + `VetraPackage` type into `/app/packages/lib/`
- Move `RepositoryActionButton` into `/app/packages/components/`
- Update imports accordingly

## Cleanup

- Delete `/modules/packages/` entirely (legacy, unused after moves)
- Delete `/app/packages/components/checkbox.tsx` (replaced by shared)

## Out of Scope

- Server-side filtering (existing TODO, separate concern)
- Data source unification between listing (REST) and detail (GraphQL) pages
- Waitlist section redesign (kept as-is)
