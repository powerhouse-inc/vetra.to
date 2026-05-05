# Vetra UI Overhaul — Design Specification

## Overview

Complete UI overhaul of vetra.to: remove Framer dependency, rebuild homepage and cloud landing as native Next.js pages, align the entire app to the new Vetra design system, and redesign cloud management and builder pages with improved UX.

**Approach:** Design System First, Then Pages (Approach A). All token/typography/spacing work lands first so every page built afterwards inherits the correct visual language.

---

## Workstream 1: Design Token Alignment

### 1.1 Color Tokens

Replace current oklch generic values in `globals.css` with design system hex values. Keep CSS custom property architecture intact — Tailwind and all components consume these automatically.

**Light Theme (`:root`)**

| Token                          | Current                | New                   |
| ------------------------------ | ---------------------- | --------------------- |
| `--background`                 | `oklch(0.985 0 0)`     | `#FCFCFC`             |
| `--foreground`                 | `oklch(0.09 0 0)`      | `#343839`             |
| `--primary`                    | `#04c161`              | `#04C161` (unchanged) |
| `--primary-foreground`         | `oklch(1 0 0)`         | `#FFFFFF`             |
| `--secondary`                  | `oklch(0.97 0 0)`      | `#F4F4F4`             |
| `--secondary-foreground`       | `oklch(0.09 0 0)`      | `#343839`             |
| `--muted`                      | `oklch(0.97 0 0)`      | `#EFEFEF`             |
| `--muted-foreground`           | `oklch(0.5 0 0)`       | `#9EA0A1`             |
| `--accent`                     | `oklch(0.96 0.01 250)` | `#F3F5F7`             |
| `--accent-foreground`          | `oklch(0.09 0 0)`      | `#343839`             |
| `--destructive`                | `oklch(0.55 0.22 25)`  | `#EA4335`             |
| `--destructive-foreground`     | `oklch(1 0 0)`         | `#FFFFFF`             |
| `--card`                       | `oklch(1 0 0)`         | `#FFFFFF`             |
| `--card-foreground`            | `oklch(0.09 0 0)`      | `#343839`             |
| `--popover`                    | `oklch(1 0 0)`         | `#FFFFFF`             |
| `--popover-foreground`         | `oklch(0.09 0 0)`      | `#343839`             |
| `--border`                     | `oklch(0.92 0 0)`      | `#D7D8D9`             |
| `--input`                      | `oklch(1 0 0)`         | `#FFFFFF`             |
| `--ring`                       | `oklch(0.65 0.15 145)` | `#04C161`             |
| `--sidebar`                    | `oklch(1 0 0)`         | `#FFFFFF`             |
| `--sidebar-foreground`         | `oklch(0.09 0 0)`      | `#343839`             |
| `--sidebar-primary`            | `oklch(0.65 0.15 145)` | `#04C161`             |
| `--sidebar-primary-foreground` | `oklch(1 0 0)`         | `#FFFFFF`             |
| `--sidebar-accent`             | `oklch(0.97 0 0)`      | `#F3F5F7`             |
| `--sidebar-accent-foreground`  | `oklch(0.09 0 0)`      | `#343839`             |
| `--sidebar-border`             | `oklch(0.92 0 0)`      | `#D7D8D9`             |
| `--sidebar-ring`               | `oklch(0.5 0 0)`       | `#04C161`             |

**Dark Theme (`.dark`)**

| Token                          | New       |
| ------------------------------ | --------- |
| `--background`                 | `#1B1E24` |
| `--foreground`                 | `#FCFCFC` |
| `--primary`                    | `#04C161` |
| `--primary-foreground`         | `#FFFFFF` |
| `--secondary`                  | `#4F596F` |
| `--secondary-foreground`       | `#FCFCFC` |
| `--muted`                      | `#343839` |
| `--muted-foreground`           | `#6C7275` |
| `--accent`                     | `#373E4D` |
| `--accent-foreground`          | `#FCFCFC` |
| `--destructive`                | `#EA4335` |
| `--destructive-foreground`     | `#FCFCFC` |
| `--card`                       | `#252A34` |
| `--card-foreground`            | `#FCFCFC` |
| `--popover`                    | `#252A34` |
| `--popover-foreground`         | `#FCFCFC` |
| `--border`                     | `#485265` |
| `--input`                      | `#252A34` |
| `--ring`                       | `#04C161` |
| `--sidebar`                    | `#1B1E24` |
| `--sidebar-foreground`         | `#FCFCFC` |
| `--sidebar-primary`            | `#04C161` |
| `--sidebar-primary-foreground` | `#FFFFFF` |
| `--sidebar-accent`             | `#373E4D` |
| `--sidebar-accent-foreground`  | `#FCFCFC` |
| `--sidebar-border`             | `#485265` |
| `--sidebar-ring`               | `#04C161` |

**New Semantic Color Tokens (both themes)**

Added to `@theme inline` block for Tailwind access:

| Token       | Light     | Dark      | Usage                                    |
| ----------- | --------- | --------- | ---------------------------------------- |
| `--success` | `#4FC86F` | `#4FC86F` | Environment running, deploy success      |
| `--info`    | `#329DFF` | `#329DFF` | In-progress states, informational badges |
| `--warning` | `#FFA132` | `#FFA132` | Warnings, pending states                 |
| `--purple`  | `#8E55EA` | `#8E55EA` | Special highlights, Web3 features        |

Each semantic color also gets a `--{name}-30` variant at 30% opacity for background tints.

### 1.2 Typography

**Font:** Inter (already loaded via `next/font/google` in layout.tsx). Update `--font-sans` to use the Inter CSS variable as primary.

**Type Scale (responsive with clamp for H1-H3):**

| Element    | Size                       | Weight | Line Height |
| ---------- | -------------------------- | ------ | ----------- |
| H1         | `clamp(40px, 5vw, 64px)`   | 700    | 1.1         |
| H2         | `clamp(28px, 3.5vw, 40px)` | 700    | 1.2         |
| H3         | `clamp(24px, 2.5vw, 32px)` | 700    | 1.2         |
| H4         | 24px                       | 700    | 1.3         |
| H5         | 20px                       | 700    | 1.3         |
| H6         | 18px                       | 700    | 1.3         |
| Subtitle 1 | 16px                       | 600    | 1.5         |
| Subtitle 2 | 14px                       | 600    | 1.5         |
| Body       | 16px                       | 400    | 1.6         |
| Small      | 14px                       | 400    | 1.6         |
| Caption    | 12px                       | 500    | 1.5         |

These are reference values. We don't add global CSS for every heading — instead, Tailwind classes are used. The spec ensures consistency in what sizes we pick.

### 1.3 Border Radius

Update `--radius` base and derived values:

| Token         | Value  | Usage                    |
| ------------- | ------ | ------------------------ |
| `--radius`    | `12px` | Base (was 10px)          |
| `--radius-sm` | `6px`  | Small elements, badges   |
| `--radius-md` | `8px`  | Buttons, inputs          |
| `--radius-lg` | `12px` | Cards, containers        |
| `--radius-xl` | `16px` | Large cards, hero images |

### 1.4 Spacing & Layout

| Token               | Current   | New                   |
| ------------------- | --------- | --------------------- |
| `--container-width` | `1332px`  | `1200px`              |
| `--spacing`         | `0.25rem` | `0.25rem` (unchanged) |

Navbar height: 64px (set via component, not token).

### 1.5 Files Changed

- `app/globals.css` — All color tokens, radius, container width, font-sans
- `tailwind.config.js` — Update container max-width reference
- `app/layout.tsx` — Verify Inter font loaded with weights 400-800

---

## Workstream 2: Shared Components

### 2.1 Navbar

**Current:** Fixed navbar with logo, nav links (Packages, Builders, Academy, Cloud), theme toggle, Renown login. Mobile dropdown. Works well structurally.

**Changes:**

- Update to use design system's navbar pattern: 64px height, border-bottom using new `--border` color
- Add `backdrop-filter: blur(12px)` with semi-transparent background
- Use Vetra SVG logos from `vetra-design-system/logos/` (light: `vetra-full-logo.svg`, dark: `vetra-full-logo-light.svg`)
- Primary CTA button in nav: Show "Join Waitlist" (green, links to Mailchimp signup) for unauthenticated users. Show no CTA for authenticated users (they already have access via nav links).
- Ensure nav links use `--foreground` at 70% opacity, full opacity on hover/active

### 2.2 Footer

**Current:** Minimal "Made with [Powerhouse logo]" bar.

**Changes:** Replace with a proper multi-column footer matching the design system template:

- 4-column grid: Product, Resources, Socials, Legal
- Product: Academy, PH-CLI, Vetra Studio
- Resources: Dev Docs, Academy, Tools
- Socials: Powerhouse on X, Discord
- Bottom bar: "Powered by Powerhouse" logo, Privacy Policy, Terms & Conditions
- Vetra logo in footer header area
- Responsive: stacks to 2 columns on tablet, 1 on mobile

### 2.3 Striped Card Update

The `StripedCard` component is used for builder profiles and cloud environment cards. Update its styling:

- Use new `--card` background and `--border` colors
- Hover shadow using design system shadow tokens
- Border radius: `--radius-lg` (12px)

---

## Workstream 3: Homepage Rebuild

### 3.1 Remove Framer Rewrite

In `next.config.ts`, remove the rewrite rule that proxies `/` to the Framer app. Create `app/(home)/page.tsx` as the new homepage.

### 3.2 Page Structure

Rebuild using the design system's landing page template as the structural reference, populated with Vetra's actual content from the Framer site:

**Section 1 — Hero**

- Badge: "Local-first. Built to Scale."
- Headline: "Local first. Built to scale."
- Subtext: "Vetra helps you build any type of web application, ERP, CMS, or SaaS Backend on a reactive document architecture. Define workflows once, deploy them globally, and co-own the software you create."
- CTAs: "Get Started" (primary green) + "Explore Academy" (secondary)
- Hero image: Product screenshot/video placeholder (the Framer site has a video embed)

**Section 2 — Trust Bar**

- "Build on the tech-stack of tomorrow"
- Tech logos: GraphQL, TypeScript, React

**Section 3 — Features: Reactive Document Architecture**

- Tabbed section with two tabs: "Reactive Document Architecture" / "Specification Driven AI"
- 6 feature cards in a responsive grid:
  - Reactive, Document, Architecture, Git-like, Stateful, Sagas
  - Each with title + short description from Framer content

**Section 4 — From Spec to Scale**

- 5-step process tabs: Specify, Build, Launch, Automate, Scale
- Description text updates per active tab
- "Get started with Vetra — The minimal stack that scales" with tech logos
- CTAs: "Explore Academy" + "Explore Open Cloud"

**Section 5 — Who It's Built For**

- 3 audience cards:
  - Builders & Developers
  - System Integrators
  - Data & AI Teams
- Each with icon, title, description

**Section 6 — What's Included**

- Feature showcase sections (alternating left-right layout):
  - Rapid Application Development
  - Build Reactive Apps
  - Collaborative User Experiences
  - Ready to Scale
  - Web3 Built In

**Section 7 — Package Library CTA**

- "Explore the Vetra Package Library" with link to /packages

**Section 8 — Launch with Vetra Cloud**

- Cloud promotion section with CTA to /cloud

**Section 9 — Part of the Powerhouse Stack**

- Powerhouse ecosystem section
- "Start your organization. Hire your operator. Find your builder."
- Link to Powerhouse.inc
- Renown reputation system mention

**Section 10 — Join the Waitlist**

- Email signup form
- "Own your coordination infrastructure and run it on an independent open source back-end."

**Section 11 — FAQ**

- Expandable accordion with 10 Q&A items (content from Framer)
- Two-column layout on desktop

**Section 12 — Footer**

- Uses the new shared footer component

### 3.3 Implementation Notes

- Each section is a separate component in `modules/home/components/`
- Use CSS animations and transitions for scroll effects (no framer-motion dependency — verify if it's a direct dep before using; if not, use CSS-only or add it explicitly)
- Responsive: mobile-first, breakpoints at md (768px) and lg (1024px)
- All images/videos from Framer site downloaded to `public/images/home/` or referenced from CDN
- Skip the Lottie animation from Framer's "Reactive Document Architecture" section for v1. Use a static illustration or CSS-animated diagram instead.

---

## Workstream 4: Cloud Landing Page Rebuild

### 4.1 Remove Framer Rewrite

Remove the `/cloud` rewrite to Framer in `next.config.ts`. The existing `/cloud` route needs to show a landing page for unauthenticated users and the environment dashboard for authenticated users.

### 4.2 Cloud Landing Page Structure

Use conditional rendering in the existing `app/cloud/page.tsx`. If the user has a Renown session (authenticated), show the environment dashboard. Otherwise, show the cloud landing page. This avoids route group complexity and keeps the URL clean.

**Hero Section:**

- "The Open Cloud, on your terms."
- "Independent infrastructure for independent organizations"
- Subtext about combining scalability with on-premise resilience
- CTA: "Get Started" / "Learn More"

**Infrastructure Section:**

- "Vetra Open Cloud runs on" — Hetzner + OpenStack logos
- Key principles: data ownership, local-first resilience, sovereignty-by-default
- Gradient green background (design system's primary with opacity)

**Feature Sections (alternating layout):**

1. "Open cloud. Clear sky." — Data ownership, seamless self-hosting path
2. "Cloud without Captivity." — Pluggable anchoring layer, storage-agnostic
3. "Integrated RAD support" — Reactive document architecture optimization

**CTA Section:**

- "Start building on Open Cloud" with primary button

### 4.3 Transition Logic

When user is authenticated (has Renown session), the `/cloud` page shows the environment dashboard instead of the landing page. Use the existing auth state to conditionally render.

---

## Workstream 5: Cloud Management Pages Redesign

### 5.1 Cloud Dashboard (`/cloud` authenticated view)

**Current:** Simple card grid with basic environment cards showing name, status, package count, and Open/Delete buttons.

**Redesign:**

- **Header area:** "Your Environments" title + "Create Environment" primary button (replace modal with dedicated flow)
- **Stats bar:** Quick overview — total environments, running count, total packages
- **Environment cards (redesigned):**
  - Larger cards with more visual hierarchy
  - Status indicator: colored dot + label (using semantic colors: success=running, warning=deploying, muted=stopped)
  - Environment name as card title
  - Package count with icon
  - Services listed as small badges
  - Last activity timestamp
  - Quick actions: Open (primary), Settings (outline), Delete (ghost/destructive on hover)
- **Empty state:** Improved illustration + "Create your first environment" CTA with description of what environments do
- **Grid layout:** Responsive grid (1 col mobile, 2 cols tablet, 3 cols desktop)

### 5.2 Create Environment Flow

**Current:** Modal with single "Name" field.

**Redesign:** Replace modal with a dedicated page at `/cloud/new` that provides a better creation experience:

- **Environment name** (required)
- **Description** (optional textarea)
- **"Create Environment"** button
- On success: redirect to the new environment's detail page at `/cloud/[id]`
- Package addition happens post-creation on the environment detail page (this matches the existing API which creates first, then adds packages via separate operations)

The page uses the same form infrastructure as today but with better layout, clearer labeling, and a back link to the dashboard. No multi-step wizard — keep it simple since the API creates environments in a single call.

### 5.3 Environment Detail Page (`/cloud/[project]`)

**Current:** 3-column layout with status, packages table, settings, and info.

**Redesign:**

- **Header:** Environment name (editable inline) + status badge + breadcrumbs
- **Tab navigation:** Overview | Packages | Settings
- **Overview tab:**
  - Status card with uptime indicator
  - Quick stats (packages, services, revision count)
  - Recent activity feed (last operations/changes)
  - Connection info (API endpoint URL, copy button)
- **Packages tab:**
  - Table with package name, version, status, actions
  - "Add Package" button in header
  - Bulk actions for package management
- **Settings tab:**
  - Rename environment
  - Environment metadata (ID, type, created date)
  - Danger zone: delete environment with confirmation
- **Sidebar (desktop only):**
  - Quick info: ID, type, revision, created/modified dates
  - Quick links: API endpoint, documentation

### 5.4 Add Package Page (`/cloud/new/server/[project]`)

**Current:** Basic form with package name and version fields.

**Redesign:**

- Better layout with search-first approach
- Package search with autocomplete from available packages
- Version selector dropdown
- Package info preview (description, dependencies)
- "Add Package" button with loading state

---

## Workstream 6: Builder Pages Redesign

### 6.1 Builders Directory (`/builders`)

**Current:** Simple search bar + vertical list of builder team cards.

**Redesign:**

- **Hero section:** "Vetra Builder Directory" with subtitle about finding builders
- **Filter bar:** Search + filter by category/expertise + sort (alphabetical, most packages, newest)
- **Featured builders:** Highlighted section for top/verified builders (optional, data-dependent)
- **Builder cards (redesigned):**
  - Card grid layout (not vertical list) — 1 col mobile, 2 cols tablet, 3 cols desktop
  - Each card: Logo/avatar, team name, description (truncated), package count badge, expertise tags, social links as icons, "View Profile" button
  - Hover effect: subtle lift + shadow
- **Empty state:** "No builders found" with suggestion to adjust search

### 6.2 Builder Profile (`/builders/[team-name]`)

**Current:** Linear top-to-bottom layout with profile card, team members grid, builder spaces.

**Redesign:**

- **Profile header:** Full-width section with:
  - Large avatar/logo
  - Team name (large heading)
  - Description
  - Social links as icon buttons
  - Expertise tags as badges
  - Stats: package count, member count
- **Tab navigation:** Packages | Team | About
- **Packages tab:**
  - Package cards in a grid (not nested under "spaces")
  - Each card: package name, description, category badge, action buttons (GitHub, NPM, Connect)
  - Filter by space/category if multiple spaces exist
- **Team tab:**
  - Member cards in responsive grid
  - Avatar, name, role, ETH address (truncated with copy), Renown link
  - Cleaner than current 6-column grid — use 2-3 columns with more info per card
- **About tab:**
  - Extended description
  - Industry expertise detailed
  - Contact/hiring info if available

---

## Workstream 7: Cleanup

### 7.1 Remove Framer Dependencies

- Remove both rewrite rules from `next.config.ts`
- Remove any Framer-specific assets or references
- Verify no pages reference the Framer app URL

### 7.2 Asset Migration

- Download all unique images/illustrations from the Framer site
- Store in `public/images/` organized by section (home, cloud, etc.)
- Use Vetra SVG logos from `vetra-design-system/logos/`

### 7.3 Responsive Audit

- All pages tested at 375px (mobile), 768px (tablet), 1200px+ (desktop)
- Navbar collapses properly
- Footer stacks properly
- All grids adapt

---

## File Impact Summary

### New Files

- `modules/home/components/` — All homepage section components (~12 files)
- `app/(home)/page.tsx` — Homepage route
- `modules/cloud/components/cloud-landing.tsx` — Cloud landing page
- `modules/cloud/components/cloud-landing/` — Cloud landing page for unauthenticated users
- `public/images/` — Migrated assets

### Modified Files

- `app/globals.css` — Complete token overhaul
- `tailwind.config.js` — Container width
- `app/layout.tsx` — Font verification
- `next.config.ts` — Remove Framer rewrites
- `modules/shared/components/navbar/` — Design system alignment, new logos
- `modules/shared/components/footer/footer.tsx` — Complete redesign
- `app/cloud/page.tsx` — Landing/dashboard conditional
- `app/cloud/cloud-projects.tsx` — Card redesign
- `app/cloud/[project]/page.tsx` — Tab layout redesign
- `app/cloud/new-project-form.tsx` — Improved create form layout
- `app/builders/page.tsx` — Grid layout, filters
- `modules/builders/components/builder-list.tsx` — Card grid
- `modules/builders/components/list-card/list-card.tsx` — Card redesign
- `modules/builders/components/builder-profile/` — Tab layout
- `modules/builders/components/builder-spaces/` — Grid layout
- `modules/builders/components/team-members/` — Better card layout

### Deleted/Deprecated

- Framer rewrite rules in next.config.ts
