# Vetra UI Overhaul Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Framer dependency and rebuild the entire vetra.to UI using the new Vetra design system — homepage, cloud landing, cloud management, and builder pages.

**Architecture:** Design-system-first approach. Update CSS tokens and shared components first, then rebuild/redesign pages. All pages use Next.js App Router with Tailwind CSS + Radix UI components. Homepage and cloud landing are new pages replacing Framer proxy rewrites.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v4, Radix UI, shadcn/ui components, Inter font, CSS animations (no framer-motion).

**Spec:** `docs/superpowers/specs/2026-03-17-vetra-ui-overhaul-design.md`

---

## File Structure

### New Files

| File                                                  | Responsibility                                              |
| ----------------------------------------------------- | ----------------------------------------------------------- |
| `app/(home)/page.tsx`                                 | Homepage route — imports and composes all homepage sections |
| `modules/home/components/hero.tsx`                    | Hero section with headline, subtext, CTAs                   |
| `modules/home/components/trust-bar.tsx`               | Tech stack logos bar                                        |
| `modules/home/components/features-tabs.tsx`           | Tabbed features section (RDA / Spec AI)                     |
| `modules/home/components/spec-to-scale.tsx`           | 5-step process tabs                                         |
| `modules/home/components/audience-cards.tsx`          | Who it's built for — 3 cards                                |
| `modules/home/components/feature-showcase.tsx`        | Alternating left-right feature sections                     |
| `modules/home/components/package-cta.tsx`             | Package library CTA banner                                  |
| `modules/home/components/cloud-cta.tsx`               | Cloud promotion section                                     |
| `modules/home/components/powerhouse-stack.tsx`        | Powerhouse ecosystem section                                |
| `modules/home/components/waitlist-signup.tsx`         | Email signup form                                           |
| `modules/home/components/faq-section.tsx`             | Expandable FAQ accordion                                    |
| `modules/cloud/components/cloud-landing.tsx`          | Cloud landing page for unauthenticated users                |
| `modules/cloud/components/cloud-landing-hero.tsx`     | Cloud landing hero                                          |
| `modules/cloud/components/cloud-landing-features.tsx` | Cloud landing feature sections                              |
| `app/cloud/new/page.tsx`                              | Dedicated create environment page                           |

### Modified Files

| File                                                                | Changes                                                                       |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `app/globals.css`                                                   | Replace all color tokens, update radius, container width, add semantic colors |
| `tailwind.config.js`                                                | Update container max-width                                                    |
| `app/layout.tsx`                                                    | Update Inter font weights, update body class                                  |
| `next.config.ts`                                                    | Remove Framer rewrites                                                        |
| `modules/shared/components/footer/footer.tsx`                       | Complete redesign — multi-column footer                                       |
| `modules/shared/components/navbar/navbar.tsx`                       | Design system styling alignment                                               |
| `modules/shared/components/navbar/navbar-config.tsx`                | Add Join Waitlist CTA config                                                  |
| `modules/shared/components/navbar/components/navbar-brand.tsx`      | Use design system SVG logos                                                   |
| `modules/shared/components/navbar/components/navbar-right-side.tsx` | Add Join Waitlist button                                                      |
| `app/cloud/page.tsx`                                                | Conditional landing/dashboard based on auth                                   |
| `app/cloud/cloud-projects.tsx`                                      | Redesigned environment cards with semantic status colors                      |
| `app/cloud/[project]/page.tsx`                                      | Tab layout with Overview/Packages/Settings                                    |
| `app/cloud/new-project-form.tsx`                                    | Improved form layout                                                          |
| `app/cloud/new-project-modal-button.tsx`                            | Link to /cloud/new instead of modal                                           |
| `app/builders/page.tsx`                                             | Grid layout, hero section, filters                                            |
| `modules/builders/components/builder-list.tsx`                      | Card grid instead of vertical list                                            |
| `modules/builders/components/list-card/list-card.tsx`               | Card redesign for grid                                                        |
| `modules/builders/components/builder-profile/builder-profile.tsx`   | Redesigned profile header                                                     |
| `modules/builders/components/builder-spaces/builder-spaces.tsx`     | Package grid layout                                                           |
| `modules/builders/components/team-members/team-members.tsx`         | Improved member cards                                                         |
| `app/builders/[team-name]/page.tsx`                                 | Tab navigation layout                                                         |

---

## Task 1: Design Tokens — Update globals.css

**Files:**

- Modify: `app/globals.css`

- [ ] **Step 1: Replace light theme color tokens**

Replace the `:root` block in `app/globals.css` with design system values. Reference: `vetra-design-system/colors.css`.

```css
:root {
  --background: #fcfcfc;
  --foreground: #343839;
  --card: #fcfcfc;
  --card-foreground: #343839;
  --popover: #ffffff;
  --popover-foreground: #343839;
  --primary: #04c161;
  --primary-foreground: #ffffff;
  --secondary: #f4f4f4;
  --secondary-foreground: #343839;
  --muted: #efefef;
  --muted-foreground: #9ea0a1;
  --accent: #f3f5f7;
  --accent-foreground: #343839;
  --destructive: #ea4335;
  --destructive-foreground: #fcfcfc;
  --border: #d7d8d9;
  --input: #ffffff;
  --ring: #04c161;
  --sidebar: #ffffff;
  --sidebar-foreground: #343839;
  --sidebar-primary: #04c161;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #f3f5f7;
  --sidebar-accent-foreground: #343839;
  --sidebar-border: #d7d8d9;
  --sidebar-ring: #04c161;
  /* Semantic status colors */
  --success: #4fc86f;
  --success-30: rgba(79, 200, 111, 0.3);
  --info: #329dff;
  --info-30: rgba(50, 157, 255, 0.3);
  --warning: #ffa132;
  --warning-30: rgba(255, 161, 50, 0.3);
  --purple: #8e55ea;
  --purple-30: rgba(142, 85, 234, 0.3);
  /* Opacity variants */
  --primary-30: rgba(4, 193, 97, 0.3);
  --foreground-70: rgba(52, 56, 57, 0.5);
  --destructive-30: rgba(234, 67, 53, 0.3);
  /* Typography */
  --font-sans:
    var(--font-inter), ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji',
    'Segoe UI Symbol', 'Noto Color Emoji';
  --font-serif: ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif;
  --font-mono:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
  /* Layout */
  --radius: 0.75rem;
  --shadow-2xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-sm: 0 1px 3px 0px hsl(0 0% 0% / 0.1), 0 1px 2px -1px hsl(0 0% 0% / 0.1);
  --shadow: 0 1px 3px 0px hsl(0 0% 0% / 0.1), 0 1px 2px -1px hsl(0 0% 0% / 0.1);
  --shadow-md: 0 4px 6px -1px hsl(0 0% 0% / 0.1), 0 2px 4px -2px hsl(0 0% 0% / 0.1);
  --shadow-lg: 0 10px 15px -3px hsl(0 0% 0% / 0.1), 0 4px 6px -4px hsl(0 0% 0% / 0.1);
  --shadow-xl: 0 20px 25px -5px hsl(0 0% 0% / 0.1), 0 8px 10px -6px hsl(0 0% 0% / 0.1);
  --shadow-2xl: 0 25px 50px -12px hsl(0 0% 0% / 0.25);
  --tracking-normal: 0em;
  --spacing: 0.25rem;
  --container-width: 1200px;
}
```

- [ ] **Step 2: Replace dark theme tokens**

Replace the `.dark` block:

```css
.dark {
  --background: #1b1e24;
  --foreground: #fcfcfc;
  --card: #252a34;
  --card-foreground: #f3f5f7;
  --popover: #1e222b;
  --popover-foreground: #fcfcfc;
  --primary: #04c161;
  --primary-foreground: #ffffff;
  --secondary: #4f596f;
  --secondary-foreground: #a6b1c7;
  --muted: #343839;
  --muted-foreground: #6c7275;
  --accent: #373e4d;
  --accent-foreground: #f3f5f7;
  --destructive: #ea4335;
  --destructive-foreground: #fcfcfc;
  --border: #485265;
  --input: #1b1e24;
  --ring: #f3f5f7;
  --sidebar: #1b1e24;
  --sidebar-foreground: #fcfcfc;
  --sidebar-primary: #04c161;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #373e4d;
  --sidebar-accent-foreground: #fcfcfc;
  --sidebar-border: #485265;
  --sidebar-ring: #04c161;
  --success: #4fc86f;
  --success-30: rgba(79, 200, 111, 0.3);
  --info: #329dff;
  --info-30: rgba(50, 157, 255, 0.3);
  --warning: #ffa132;
  --warning-30: rgba(255, 161, 50, 0.3);
  --purple: #8e55ea;
  --purple-30: rgba(142, 85, 234, 0.3);
  --primary-30: rgba(4, 193, 97, 0.3);
  --foreground-70: rgba(252, 252, 252, 0.5);
  --destructive-30: rgba(234, 67, 53, 0.3);
  --font-sans:
    var(--font-inter), ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji',
    'Segoe UI Symbol', 'Noto Color Emoji';
  --font-serif: ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif;
  --font-mono:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
  --radius: 0.75rem;
  --shadow-2xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-sm: 0 1px 3px 0px hsl(0 0% 0% / 0.1), 0 1px 2px -1px hsl(0 0% 0% / 0.1);
  --shadow: 0 1px 3px 0px hsl(0 0% 0% / 0.1), 0 1px 2px -1px hsl(0 0% 0% / 0.1);
  --shadow-md: 0 4px 6px -1px hsl(0 0% 0% / 0.1), 0 2px 4px -2px hsl(0 0% 0% / 0.1);
  --shadow-lg: 0 10px 15px -3px hsl(0 0% 0% / 0.1), 0 4px 6px -4px hsl(0 0% 0% / 0.1);
  --shadow-xl: 0 20px 25px -5px hsl(0 0% 0% / 0.1), 0 8px 10px -6px hsl(0 0% 0% / 0.1);
  --shadow-2xl: 0 25px 50px -12px hsl(0 0% 0% / 0.25);
}
```

- [ ] **Step 3: Add semantic color tokens to @theme inline block**

Add these lines inside the existing `@theme inline { }` block:

```css
--color-success: var(--success);
--color-success-30: var(--success-30);
--color-info: var(--info);
--color-info-30: var(--info-30);
--color-warning: var(--warning);
--color-warning-30: var(--warning-30);
--color-purple: var(--purple);
--color-purple-30: var(--purple-30);
--color-primary-30: var(--primary-30);
--color-foreground-70: var(--foreground-70);
--color-destructive-30: var(--destructive-30);
```

- [ ] **Step 4: Update radius values in @theme inline**

Replace the radius calculations:

```css
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
```

- [ ] **Step 5: Update Inter font in layout.tsx**

In `app/layout.tsx`, update the Inter import to include all needed weights:

```tsx
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
})
```

- [ ] **Step 6: Verify the app still builds**

Run: `npx next build` (or `npm run build`)

Expected: Build succeeds. All existing pages render with updated colors.

- [ ] **Step 7: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -m "feat: align design tokens with Vetra design system

Update all color tokens, border radius, typography, and spacing to match
the Vetra design system. Add semantic status colors (success, info,
warning, purple). Switch primary font to Inter."
```

---

## Task 2: Footer Redesign

**Files:**

- Modify: `modules/shared/components/footer/footer.tsx`

- [ ] **Step 1: Rewrite footer with multi-column layout**

Replace the entire content of `modules/shared/components/footer/footer.tsx`:

```tsx
import Link from 'next/link'
import { PowerhouseLogoIsotype } from '../svgs'

const footerLinks = {
  product: [
    { label: 'Academy', href: 'https://academy.vetra.io/' },
    { label: 'PH-CLI', href: 'https://academy.vetra.io/' },
    { label: 'Vetra Studio', href: 'https://academy.vetra.io/' },
  ],
  resources: [
    { label: 'Dev Docs', href: 'https://academy.vetra.io/' },
    { label: 'Academy', href: 'https://academy.vetra.io/' },
    { label: 'Tools', href: 'https://academy.vetra.io/' },
  ],
  socials: [
    { label: 'Powerhouse on X', href: 'https://x.com/PowerhouseDAO' },
    { label: 'Discord', href: 'https://discord.gg/pwQJwgaQKd' },
  ],
}

function FooterLinkGroup({
  title,
  links,
}: {
  title: string
  links: { label: string; href: string }[]
}) {
  return (
    <div>
      <h5 className="text-foreground mb-3 text-sm font-semibold">{title}</h5>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              target={link.href.startsWith('http') ? '_blank' : undefined}
              rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="border-border bg-background border-t">
      <div className="mx-auto max-w-[var(--container-width)] px-6 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="text-foreground text-lg font-bold">
              VETRA
            </Link>
            <p className="text-muted-foreground mt-2 text-sm">Build smarter, ship faster.</p>
          </div>

          <FooterLinkGroup title="Product" links={footerLinks.product} />
          <FooterLinkGroup title="Resources" links={footerLinks.resources} />
          <FooterLinkGroup title="Socials" links={footerLinks.socials} />
        </div>

        {/* Bottom bar */}
        <div className="border-border mt-8 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
          <Link
            href="https://powerhouse.inc"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors"
          >
            Powered by <PowerhouseLogoIsotype className="size-4" />
          </Link>
          <div className="text-muted-foreground flex gap-6 text-sm">
            <Link href="/" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/" className="hover:text-foreground transition-colors">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 2: Verify footer renders on all pages**

Run: `npm run dev` and check `/builders` and `/cloud` pages.

Expected: Multi-column footer appears with proper responsive behavior.

- [ ] **Step 3: Commit**

```bash
git add modules/shared/components/footer/footer.tsx
git commit -m "feat: redesign footer with multi-column layout

Replace minimal one-line footer with a proper multi-column layout
matching the Vetra design system. Includes Product, Resources, and
Socials sections with a bottom bar."
```

---

## Task 3: Navbar Design System Alignment

**Files:**

- Modify: `modules/shared/components/navbar/navbar.tsx`
- Modify: `modules/shared/components/navbar/components/navbar-right-side.tsx`
- Modify: `modules/shared/components/navbar/components/navbar-brand.tsx`

- [ ] **Step 1: Update navbar container styling**

In `modules/shared/components/navbar/navbar.tsx`, replace the current return JSX with a cleaner design-system-aligned navbar:

```tsx
return (
  <div className="border-border bg-background/80 fixed top-0 right-0 left-0 z-160 border-b backdrop-blur-xl">
    <div className="mx-auto flex h-16 max-w-[var(--container-width)] items-center justify-between px-6">
      <div className="flex items-center gap-6">
        <NavbarBrand
          isAchraPage={false}
          isotypeLogo={Isotype}
          logotype={Logotype}
          logotypeClassName={logotypeClassName}
          logoHref={logoHref}
        />
        <NavbarItemsDesk navItems={navItems} pathname={pathname} />
        <NavbarItemMobile navItems={navItems} pathname={pathname} />
      </div>
      <NavbarRightSide />
    </div>
  </div>
)
```

- [ ] **Step 2: Add "Join Waitlist" button to navbar right side**

In `modules/shared/components/navbar/components/navbar-right-side.tsx`, add a Join Waitlist link for unauthenticated users. Import `Link` from `next/link` and add the button before ThemeToggle:

```tsx
import Link from 'next/link'

// In the desktop section, before ThemeToggle:
;<Link
  href="https://gmail.us21.list-manage.com/subscribe/post?u=a65ca7e437961008f5f5c1bad&id=c8ea339c46&f_id=00fda7e6f0"
  target="_blank"
  rel="noopener noreferrer"
  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-semibold transition-colors"
>
  Join Waitlist
</Link>
```

- [ ] **Step 3: Update nav link opacity styling**

In `modules/shared/components/navbar/components/navbar-items-desk.tsx`, ensure nav links use `text-foreground/70` for inactive state and `text-foreground` for active/hover.

- [ ] **Step 4: Update layout.tsx to remove background image and adjust for new navbar height**

In `app/layout.tsx`:

- Remove the fixed background image div (lines 40-49)
- Change `mt-[80px]` references won't be needed since pages set their own margin
- Remove `bg-muted/30` from body class, use just `bg-background`

```tsx
<body className={`${inter.variable} bg-background antialiased`}>
```

Remove the background image block entirely:

```tsx
{
  /* Remove this entire block */
}
;<div className="pointer-events-none fixed top-[100px] right-0 z-0 h-[480px] w-full overflow-hidden">
  ...
</div>
```

- [ ] **Step 5: Verify navbar on all pages**

Run: `npm run dev`, check `/builders`, `/cloud`, test mobile responsive.

- [ ] **Step 6: Commit**

```bash
git add modules/shared/components/navbar/ app/layout.tsx
git commit -m "feat: align navbar with design system

Simplify navbar to 64px height with backdrop blur. Add Join Waitlist
CTA. Remove decorative background image. Update body background."
```

---

## Task 4: Remove Framer Rewrites

**Files:**

- Modify: `next.config.ts`

- [ ] **Step 1: Remove the rewrites function**

In `next.config.ts`, remove the entire `async rewrites()` block (lines 24-48). The final config should be:

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'euc.li',
      },
      {
        protocol: 'https',
        hostname: '*.ipfs.w3s.link',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.io',
      },
    ],
  },
  experimental: {
    externalDir: true,
  },
  output: 'standalone',
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
}

export default nextConfig
```

- [ ] **Step 2: Commit**

```bash
git add next.config.ts
git commit -m "feat: remove Framer proxy rewrites

Homepage and cloud landing will be rebuilt as native Next.js pages."
```

---

## Task 5: Homepage — Hero + Trust Bar

**Files:**

- Create: `app/(home)/page.tsx`
- Create: `modules/home/components/hero.tsx`
- Create: `modules/home/components/trust-bar.tsx`

- [ ] **Step 1: Create homepage route**

Create `app/(home)/page.tsx`:

```tsx
import { Hero } from '@/modules/home/components/hero'
import { TrustBar } from '@/modules/home/components/trust-bar'

export const metadata = {
  title: 'Vetra — Local first. Built to scale.',
  description:
    'Build any type of web application, ERP, CMS, or SaaS Backend on a reactive document architecture.',
}

export default function HomePage() {
  return (
    <div className="pt-16">
      <Hero />
      <TrustBar />
    </div>
  )
}
```

- [ ] **Step 2: Create hero component**

Create `modules/home/components/hero.tsx`:

```tsx
import Link from 'next/link'

export function Hero() {
  return (
    <section className="px-6 py-20 text-center md:py-28">
      <div className="mx-auto max-w-[var(--container-width)]">
        <div className="bg-primary-30 text-primary mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold">
          Local-first. Built to Scale.
        </div>
        <h1 className="mx-auto mb-5 max-w-3xl text-[clamp(40px,5vw,64px)] leading-[1.1] font-bold tracking-tight">
          Local first. Built to scale.
        </h1>
        <p className="text-foreground-70 mx-auto mb-9 max-w-xl text-lg leading-relaxed">
          Vetra helps you build any type of web application, ERP, CMS, or SaaS Backend on a reactive
          document architecture. Define workflows once, deploy them globally, and co-own the
          software you create.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/cloud"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center rounded-lg px-8 py-3.5 text-base font-semibold transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="https://academy.vetra.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-accent text-foreground hover:bg-accent/80 inline-flex items-center rounded-lg px-8 py-3.5 text-base font-semibold transition-colors"
          >
            Explore Academy
          </Link>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Create trust bar component**

Create `modules/home/components/trust-bar.tsx`:

```tsx
export function TrustBar() {
  return (
    <section className="border-border border-y py-12 text-center">
      <div className="mx-auto max-w-[var(--container-width)] px-6">
        <p className="text-muted-foreground mb-6 text-sm font-medium">
          Build on the tech-stack of tomorrow
        </p>
        <p className="text-foreground-70 mx-auto max-w-lg text-sm">
          Use structured document models and declarative design to formalize human intent. Enable AI
          agents to act safely, predictably, and with domain specificity.
        </p>
        <div className="mt-6 flex items-center justify-center gap-8">
          <span className="text-muted-foreground text-sm font-medium">GraphQL</span>
          <span className="text-muted-foreground text-sm font-medium">TypeScript</span>
          <span className="text-muted-foreground text-sm font-medium">React</span>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Verify homepage renders**

Run: `npm run dev` and visit `http://localhost:3000/`

Expected: Hero section with green badge, headline, subtext, two CTA buttons, and trust bar below.

- [ ] **Step 5: Commit**

```bash
git add app/\(home\)/page.tsx modules/home/
git commit -m "feat: add homepage hero and trust bar sections

First sections of the native homepage replacing Framer. Hero with
headline, CTAs, and trust bar with tech stack."
```

---

## Task 6: Homepage — Features Tabs + Spec to Scale

**Files:**

- Create: `modules/home/components/features-tabs.tsx`
- Create: `modules/home/components/spec-to-scale.tsx`
- Modify: `app/(home)/page.tsx`

- [ ] **Step 1: Create features tabs component**

Create `modules/home/components/features-tabs.tsx` — a tabbed section with "Reactive Document Architecture" and "Specification Driven AI" tabs, showing 6 feature cards in a responsive grid. Use the `Tabs` component from `@/modules/shared/components/ui/tabs`.

Feature cards content (from Framer snapshot):

- Reactive: "Realtime, responsive, message driven. With an elastic scalable architecture."
- Document: "Documents as a local first, self contained data structure and node in a decentralized network."
- Architecture: "EDA / CQRS inspired with read models for data aggregation and scalability."
- Git-like: "State of the art editing UX that offers history branching, merging, and commenting."
- Stateful: "Documents with a document history and well-defined operations as state transitions become mini-api's."
- Sagas: "Workflow sagas are the orchestration layer that combine multiple documents into a process with specific stage gates."

- [ ] **Step 2: Create spec-to-scale component**

Create `modules/home/components/spec-to-scale.tsx` — 5 tabs (Specify, Build, Launch, Automate, Scale) with descriptive text that switches per tab. Include the "Get started with Vetra" CTA block and two buttons: "Explore Academy" + "Explore Open Cloud".

- [ ] **Step 3: Add to homepage**

Update `app/(home)/page.tsx` to import and render both components after TrustBar.

- [ ] **Step 4: Verify sections render**

Run: `npm run dev`, check tab switching works.

- [ ] **Step 5: Commit**

```bash
git add modules/home/components/features-tabs.tsx modules/home/components/spec-to-scale.tsx app/\(home\)/page.tsx
git commit -m "feat: add features tabs and spec-to-scale homepage sections"
```

---

## Task 7: Homepage — Audience Cards + Feature Showcase

**Files:**

- Create: `modules/home/components/audience-cards.tsx`
- Create: `modules/home/components/feature-showcase.tsx`
- Modify: `app/(home)/page.tsx`

- [ ] **Step 1: Create audience cards**

Create `modules/home/components/audience-cards.tsx` — "Who it's built for" section with 3 cards:

1. Builders & Developers: "Want control without overhead? Use Vetra to launch services, build extensions, and own your deployment."
2. System Integrators: "Deploy Vetra stacks for clients, offer managed services, and customize solutions. Get paid for uptime and support."
3. Data & AI Teams: "Subscribe to events across workflows and contributor actions. Train AI on structured, cross-org data streams."

Use the Card component from `@/modules/shared/components/ui/card`. 3-column grid on desktop, 1 column on mobile.

- [ ] **Step 2: Create feature showcase**

Create `modules/home/components/feature-showcase.tsx` — "What's included?" heading followed by alternating left-right feature sections:

1. "Rapid Application Development" — Turn specifications into applications with spec-driven AI.
2. "Build Reactive Apps" — Create interfaces that react in real time.
3. "Collaborative User Experiences" — Built 'Git-like' user experiences with branching, merging & pull-requests.
4. "Ready to Scale" — Grow from a single node to millions of users.
5. "Web3 Built In" — Add Web3 to your workflows without extra setup.

Each section: heading + description text on one side, placeholder image area on the other. Alternate sides on each row.

- [ ] **Step 3: Add to homepage**

Update `app/(home)/page.tsx`.

- [ ] **Step 4: Commit**

```bash
git add modules/home/components/audience-cards.tsx modules/home/components/feature-showcase.tsx app/\(home\)/page.tsx
git commit -m "feat: add audience cards and feature showcase homepage sections"
```

---

## Task 8: Homepage — CTAs + Waitlist + FAQ

**Files:**

- Create: `modules/home/components/package-cta.tsx`
- Create: `modules/home/components/cloud-cta.tsx`
- Create: `modules/home/components/powerhouse-stack.tsx`
- Create: `modules/home/components/waitlist-signup.tsx`
- Create: `modules/home/components/faq-section.tsx`
- Modify: `app/(home)/page.tsx`

- [ ] **Step 1: Create package CTA**

Create `modules/home/components/package-cta.tsx` — "Explore the Vetra Package Library" banner with link to `/packages`.

- [ ] **Step 2: Create cloud CTA**

Create `modules/home/components/cloud-cta.tsx` — "Launch with Vetra Cloud" section promoting the cloud product with "Explore Open Cloud" button linking to `/cloud`.

- [ ] **Step 3: Create Powerhouse stack section**

Create `modules/home/components/powerhouse-stack.tsx` — "Part of the Powerhouse Stack" section describing the ecosystem. Include "Start your organization. Hire your operator. Find your builder." tagline and a "Visit Powerhouse" link.

- [ ] **Step 4: Create waitlist signup**

Create `modules/home/components/waitlist-signup.tsx` — "Join the Waitlist" section with email input and subscribe button. Form action posts to the Mailchimp URL: `https://gmail.us21.list-manage.com/subscribe/post?u=a65ca7e437961008f5f5c1bad&id=c8ea339c46&f_id=00fda7e6f0`. Subtext: "Own your coordination infrastructure and run it on an independent open source back-end."

- [ ] **Step 5: Create FAQ section**

Create `modules/home/components/faq-section.tsx` — "Frequently Asked Questions" with expandable accordion. Use the `Accordion` component from `@/modules/shared/components/ui/accordion`. Two-column layout on desktop. FAQ items (from Framer):

1. "What can I do with Vetra?" — Vetra is the builder platform...
2. "Where to get started?" — A good place to start is the powerhouse.academy...
3. "What code languages are required?" — Knowledge of Typescript and GraphQL...
4. "Is all code open-source?" — All Powerhouse code is created under the DDPL...
5. "How can I get support?" — Through Discord...
6. "Can I integrate other tools?" — We invite you to integrate...
7. "What is Vetra Cloud?" — Vetra Cloud is a hosting and deployment solution...
8. "What is Switchboard?" — Multiple host applications...
9. "I'm interested! How can I contribute?" — GitHub repository...
10. "What blockchains do you integrate with?" — Ethereum and Solana...

- [ ] **Step 6: Compose complete homepage**

Update `app/(home)/page.tsx` to import and render all sections in order:
Hero → TrustBar → FeaturesTabs → SpecToScale → AudienceCards → FeatureShowcase → PackageCta → CloudCta → PowerhouseStack → WaitlistSignup → FaqSection

- [ ] **Step 7: Verify complete homepage**

Run: `npm run dev`, scroll through entire page. Verify responsive at mobile/tablet/desktop.

- [ ] **Step 8: Commit**

```bash
git add modules/home/ app/\(home\)/page.tsx
git commit -m "feat: complete homepage with all sections

Add package CTA, cloud CTA, Powerhouse stack, waitlist signup, and
FAQ accordion. Homepage is now fully native, no Framer dependency."
```

---

## Task 9: Cloud Landing Page

**Files:**

- Create: `modules/cloud/components/cloud-landing.tsx`
- Create: `modules/cloud/components/cloud-landing-hero.tsx`
- Create: `modules/cloud/components/cloud-landing-features.tsx`
- Modify: `app/cloud/page.tsx`

- [ ] **Step 1: Create cloud landing hero**

Create `modules/cloud/components/cloud-landing-hero.tsx`:

- "The Open Cloud, on your terms."
- "Independent infrastructure for independent organizations"
- Subtext about combining scalability with on-premise resilience
- CTA: "Get Started" button linking to login/signup

- [ ] **Step 2: Create cloud landing features**

Create `modules/cloud/components/cloud-landing-features.tsx`:

- Infrastructure section: "Vetra Open Cloud runs on" with Hetzner + OpenStack mention, green gradient background
- Three feature blocks (alternating layout):
  1. "Open cloud. Clear sky."
  2. "Cloud without Captivity."
  3. "Integrated RAD support"
- Bottom CTA: "Start building on Open Cloud"

- [ ] **Step 3: Create cloud landing composite**

Create `modules/cloud/components/cloud-landing.tsx` that composes hero + features:

```tsx
import { CloudLandingHero } from './cloud-landing-hero'
import { CloudLandingFeatures } from './cloud-landing-features'

export function CloudLanding() {
  return (
    <div className="pt-16">
      <CloudLandingHero />
      <CloudLandingFeatures />
    </div>
  )
}
```

- [ ] **Step 4: Update cloud page with conditional rendering**

Modify `app/cloud/page.tsx` to be a client component that shows the landing page for unauthenticated users and the dashboard for authenticated users:

```tsx
'use client'

import { useRenown } from '@powerhousedao/reactor-browser'
import { CloudLanding } from '@/modules/cloud/components/cloud-landing'
import { CloudDashboard } from './cloud-dashboard'

export default function CloudPage() {
  const renown = useRenown()
  const isAuthenticated = !!renown?.user

  if (!isAuthenticated) {
    return <CloudLanding />
  }

  return <CloudDashboard />
}
```

Extract the existing cloud page content into a new `app/cloud/cloud-dashboard.tsx` component.

- [ ] **Step 5: Verify both states**

Test unauthenticated: landing page shows.
Test authenticated (login with Renown): dashboard shows.

- [ ] **Step 6: Commit**

```bash
git add modules/cloud/components/ app/cloud/
git commit -m "feat: add native cloud landing page

Show landing page for unauthenticated users, dashboard for
authenticated users. Replaces Framer proxy."
```

---

## Task 10: Cloud Dashboard Redesign

**Files:**

- Create: `app/cloud/cloud-dashboard.tsx`
- Modify: `app/cloud/cloud-projects.tsx`
- Create: `app/cloud/new/page.tsx`
- Modify: `app/cloud/new-project-modal-button.tsx`

- [ ] **Step 1: Create cloud dashboard component**

Create `app/cloud/cloud-dashboard.tsx` — extracted from current `page.tsx` with improvements:

- "Your Environments" heading
- Stats bar: total environments count, running count
- "Create Environment" primary button linking to `/cloud/new`
- `CloudEnvironments` grid below

- [ ] **Step 2: Redesign environment cards**

Update `app/cloud/cloud-projects.tsx`:

- Wider cards in a responsive grid (1/2/3 columns)
- Status indicator using semantic colors: `bg-success` for STARTED, `bg-warning` for deploying, `bg-muted-foreground` for stopped
- Colored dot + status label instead of plain badge
- Card shows: name, status dot+label, package count, services as small badges, last modified date
- Actions: "Open" primary button, delete icon button

- [ ] **Step 3: Create dedicated create environment page**

Create `app/cloud/new/page.tsx`:

```tsx
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { NewEnvironmentForm } from '@/app/cloud/new-project-form'

export default function CreateEnvironmentPage() {
  return (
    <main className="mx-auto mt-20 max-w-lg px-6 py-8">
      <Link
        href="/cloud"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-2 text-sm transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Cloud
      </Link>
      <h1 className="mb-2 text-2xl font-bold">Create Environment</h1>
      <p className="text-muted-foreground mb-8 text-sm">
        Set up a new cloud environment to host your Powerhouse applications.
      </p>
      <NewEnvironmentForm />
    </main>
  )
}
```

- [ ] **Step 4: Update new-project-modal-button to link instead of modal**

Replace `app/cloud/new-project-modal-button.tsx` to use a Link instead of Dialog:

```tsx
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/modules/shared/components/ui/button'

export function NewEnvironmentButton() {
  return (
    <Button asChild>
      <Link href="/cloud/new">
        <Plus className="mr-2 h-4 w-4" />
        Create Environment
      </Link>
    </Button>
  )
}
```

- [ ] **Step 5: Verify cloud dashboard flow**

Test: Dashboard → Create Environment page → fill form → success → redirects to detail page.

- [ ] **Step 6: Commit**

```bash
git add app/cloud/
git commit -m "feat: redesign cloud dashboard with improved cards and create flow

Redesigned environment cards with semantic status colors. Replaced modal
with dedicated create environment page. Added stats overview."
```

---

## Task 11: Cloud Environment Detail Redesign

**Files:**

- Modify: `app/cloud/[project]/page.tsx`

- [ ] **Step 1: Add tab navigation to detail page**

Redesign `app/cloud/[project]/page.tsx` with a tab layout using the `Tabs` component. Three tabs: Overview, Packages, Settings.

**Overview tab:** Status card with semantic color dot, quick stats (packages, services, revision), connection info (document ID with copy button).

**Packages tab:** Existing packages table + Add Package modal.

**Settings tab:** Rename form + metadata info + danger zone with delete button.

- [ ] **Step 2: Improve header with inline status**

Replace the current header with: environment name + status badge (using semantic colors) + breadcrumbs.

- [ ] **Step 3: Verify all tabs work**

Test: Navigate to an environment, switch between tabs, add a package, rename environment, verify delete dialog still works.

- [ ] **Step 4: Commit**

```bash
git add app/cloud/[project]/page.tsx
git commit -m "feat: redesign environment detail with tab navigation

Overview, Packages, and Settings tabs. Semantic status colors.
Cleaner information hierarchy."
```

---

## Task 12: Builders Directory Redesign

**Files:**

- Modify: `app/builders/page.tsx`
- Modify: `modules/builders/components/builder-list.tsx`
- Modify: `modules/builders/components/list-card/list-card.tsx`

- [ ] **Step 1: Add hero section to builders page**

Update `app/builders/page.tsx` — add a hero section at the top:

```tsx
<div className="border-border border-b pb-8">
  <h1 className="text-[clamp(28px,3.5vw,40px)] font-bold">Vetra Builder Directory</h1>
  <p className="text-muted-foreground mt-2 max-w-lg text-base">
    Discover builder teams with expertise in the Powerhouse tech stack. Find the right team for your
    project.
  </p>
</div>
```

Move search to a filter bar below the hero. Add sort options if data supports it.

- [ ] **Step 2: Switch builder list to card grid**

Update `modules/builders/components/builder-list.tsx` — change from `space-y-4` vertical list to a responsive card grid:

```tsx
<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
  {builders.map((team) => (
    <BuilderTeamCard key={team.id} ... />
  ))}
</div>
```

- [ ] **Step 3: Redesign builder team card for grid layout**

Update `modules/builders/components/list-card/list-card.tsx`:

- Vertical card layout (logo on top, content below)
- Avatar/logo at top
- Team name as card title
- Description (truncated to 2-3 lines with `line-clamp-3`)
- Social links as small icon buttons at bottom
- "View Profile" button
- Hover effect: `hover:shadow-md transition-shadow`
- Use `Card` component from shared UI

- [ ] **Step 4: Update page container width**

Ensure `app/builders/page.tsx` uses `mt-20` (for 64px navbar + 16px gap) instead of `mt-[80px]`.

- [ ] **Step 5: Verify builders page**

Run: `npm run dev`, check `/builders`. Test search, verify cards display correctly on all breakpoints.

- [ ] **Step 6: Commit**

```bash
git add app/builders/page.tsx modules/builders/components/builder-list.tsx modules/builders/components/list-card/
git commit -m "feat: redesign builders directory with card grid layout

Replace vertical list with responsive 3-column card grid. Add hero
section. Improved card design with hover effects."
```

---

## Task 13: Builder Profile Redesign

**Files:**

- Modify: `app/builders/[team-name]/page.tsx`
- Modify: `modules/builders/components/builder-profile/builder-profile.tsx`
- Modify: `modules/builders/components/builder-spaces/builder-spaces.tsx`
- Modify: `modules/builders/components/team-members/team-members.tsx`

- [ ] **Step 1: Redesign profile header**

Update `modules/builders/components/builder-profile/builder-profile.tsx`:

- Full-width layout with large avatar, team name (H2 size), description
- Social links as icon buttons in a row
- Expertise tags as colored badges
- Stats: package count, member count

- [ ] **Step 2: Add tab navigation to profile page**

Update `app/builders/[team-name]/page.tsx` — add `Tabs` component with: Packages | Team | About.

Move BuilderSpaces into Packages tab, TeamMembers into Team tab, and create an About tab with extended description + expertise.

- [ ] **Step 3: Improve package grid in builder spaces**

Update `modules/builders/components/builder-spaces/builder-spaces.tsx`:

- Grid layout for packages (2-3 columns)
- Each package card: name, description, category badge, action buttons
- Remove nested "space" headers if there's only one space

- [ ] **Step 4: Improve team member cards**

Update `modules/builders/components/team-members/team-members.tsx`:

- 2-3 column grid (not 6 columns)
- Each card: larger avatar, name, role, truncated ETH address with copy, Renown link
- Remove the "Add Member" placeholder card

- [ ] **Step 5: Verify builder profile**

Test: Navigate to a builder profile, switch tabs, verify responsive layout.

- [ ] **Step 6: Commit**

```bash
git add app/builders/[team-name]/ modules/builders/components/
git commit -m "feat: redesign builder profile with tabs and improved layout

Tab navigation for Packages/Team/About. Improved profile header,
package grid, and team member cards."
```

---

## Task 14: Responsive Audit + Final Polish

**Files:**

- Various — fixes identified during testing

- [ ] **Step 1: Test all pages at 375px mobile width**

Check: Homepage, Cloud landing, Cloud dashboard, Cloud detail, Create environment, Builders directory, Builder profile.

Fix any layout issues: overflowing text, broken grids, navbar collapse, footer stacking.

- [ ] **Step 2: Test all pages at 768px tablet width**

Verify grids transition properly (3 cols → 2 cols for most grids).

- [ ] **Step 3: Test all pages at 1200px+ desktop**

Verify max-width container, proper spacing, no content stretching.

- [ ] **Step 4: Test dark mode on all pages**

Toggle theme. Verify: all backgrounds, text, borders, badges, buttons use correct dark theme colors. No white-on-white or dark-on-dark issues.

- [ ] **Step 5: Fix any issues found**

Apply fixes for issues identified in steps 1-4.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "fix: responsive and dark mode fixes across all pages"
```

---

## Task 15: Copy Vetra Logos to Public Assets

**Files:**

- Copy: `vetra-design-system/logos/*.svg` → `public/logos/`
- Modify: Navbar brand to use new logo paths if needed

- [ ] **Step 1: Copy logo SVGs**

```bash
mkdir -p public/logos
cp vetra-design-system/logos/*.svg public/logos/
```

- [ ] **Step 2: Update navbar brand if using new logos**

If the current SVG imports in `navbar-brand.tsx` need updating, switch to the design system logos. The current setup uses `@svgr/webpack` to import SVGs as React components — this should continue to work.

- [ ] **Step 3: Commit**

```bash
git add public/logos/ modules/shared/components/navbar/
git commit -m "feat: add Vetra design system logos to public assets"
```

---

## Summary

| Task | What                          | Key Files                                     |
| ---- | ----------------------------- | --------------------------------------------- |
| 1    | Design tokens                 | globals.css, layout.tsx                       |
| 2    | Footer redesign               | footer.tsx                                    |
| 3    | Navbar alignment              | navbar.tsx, navbar-right-side.tsx, layout.tsx |
| 4    | Remove Framer                 | next.config.ts                                |
| 5    | Homepage: Hero + Trust        | (home)/page.tsx, hero.tsx, trust-bar.tsx      |
| 6    | Homepage: Features + Scale    | features-tabs.tsx, spec-to-scale.tsx          |
| 7    | Homepage: Audience + Showcase | audience-cards.tsx, feature-showcase.tsx      |
| 8    | Homepage: CTAs + FAQ          | package-cta.tsx, cloud-cta.tsx, etc.          |
| 9    | Cloud landing page            | cloud-landing.tsx, cloud page.tsx             |
| 10   | Cloud dashboard redesign      | cloud-dashboard.tsx, cloud-projects.tsx       |
| 11   | Cloud detail redesign         | [project]/page.tsx                            |
| 12   | Builders directory            | builders/page.tsx, builder-list.tsx           |
| 13   | Builder profile               | [team-name]/page.tsx, builder-profile.tsx     |
| 14   | Responsive audit              | Various                                       |
| 15   | Logo assets                   | public/logos/                                 |
