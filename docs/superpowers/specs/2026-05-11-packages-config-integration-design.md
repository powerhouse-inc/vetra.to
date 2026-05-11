# Packages × Config integration

**Status:** draft
**Date:** 2026-05-11
**Driver:** Per-package config (env vars + secrets) lives in a separate
`ConfigurationTab` block at the bottom of the env detail page, far from
the packages list it operates on. Users have to scroll past services,
packages, agents, and a database row to set a secret on a package they
just installed.

## Problem

On the env detail page today:

- The Installed Packages sub-section (in `overview.tsx` ~lines 1117-1168)
  renders a flat table of `PackageRow`s: name, version, `⋮` menu (change
  version / uninstall). That's it.
- A separate `<ConfigurationTab>` is mounted at `app/cloud/[project]/page.tsx:288`,
  far below. It calls `useTenantConfig` + `useRegistryManifests` once and
  renders one `PackageConfigCard` per installed package — a duplicated
  per-package header followed by a small env-vars/secrets table.
- "Unused Config" (orphan tenant keys not declared by any installed package)
  gets its own card inside `ConfigurationTab`.

Two surfaces, one resource. To set a secret for package `foo`, users
scroll past everything else, find the right card by name, edit. Worse,
the per-package header in `ConfigurationTab` duplicates the package row
above it.

## Goal

Pull per-package config into the package row itself: each row in the
Installed Packages table becomes expandable, and the expanded body shows
the package's config table (env vars + secrets). The bottom
`ConfigurationTab` block is removed. Orphan keys move under the packages
list as a footer card.

## Non-goals

- No drawer alternative; the user picked the inline-expand pattern.
- No URL state for "which row is expanded" — local state is fine; defer
  URL persistence until someone asks.
- No changes to `useTenantConfig`, `useRegistryManifests`,
  `applyConfigChanges`, or `UninstallDialog` collision logic.
- No package-config search or filter.

## Components

### New: `modules/cloud/components/config-row.tsx`

Extract the `ConfigRow` currently defined as an inner function in
`app/cloud/[project]/tabs/configuration.tsx` (lines 251-404) into its own
file. The component is reused by both the expanded package rows and the
"Unused Config" footer.

No behavioural change — just a move + named export.

### Changed: `modules/cloud/components/package-row.tsx`

- Add a `chevron` cell at the start of the row (first `<TableCell>`).
  Click toggles local `expanded: boolean` state. Chevron rotates 90°
  when expanded. The whole row is also clickable for expansion (the
  `⋮` actions menu stops propagation).
- When expanded, render a second `<TableRow>` with a single
  `<TableCell colSpan={N}>` containing the package's config table:
  - Header: "Environment variables & secrets" (small)
  - Body: one `<ConfigRow>` per `manifest.config[]` entry
  - Empty states: "This package declares no configuration." /
    "Could not load this package's manifest." (copy carried over from
    `configuration.tsx`)
- New props:

  ```ts
  manifest: PackageManifest | null
  manifestMissing: boolean // true when the registry fetch finished but no manifest came back
  existingVarValues: Record<string, string>
  existingSecretKeys: Set<string>
  onSetVar: (key: string, value: string) => Promise<void>
  onSetSecret: (key: string, value: string) => Promise<void>
  onDeleteVar: (key: string) => Promise<void>
  onDeleteSecret: (key: string) => Promise<void>
  ```

  Existing props (`pkg`, `tenantId`, `registryUrl`, `installedPackages`,
  `onRemove`, `onSetVersion`) stay.

### New: `modules/cloud/components/packages-section.tsx`

Wraps everything related to installed packages — moved out of
`overview.tsx` to keep that file manageable.

```ts
type Props = {
  tenantId: string | null
  registryUrl: string
  installedPackages: CloudPackage[]
  modulePackages: CloudPackage[] // already partitioned in overview.tsx
  onAddPackage: (name: string, version?: string) => Promise<void>
  onRemovePackage: (name: string) => Promise<void>
  onSetPackageVersion: (name: string, version: string) => Promise<void>
  initialAddPackage: string | null
  initialAddVersion: string | null
}
```

Internally:

- Calls `useTenantConfig(tenantId)` once → `envVars`, `secrets`, setters.
- Calls `useRegistryManifests(registryUrl, packageSpecs)` once → array of
  manifest results, indexed by package name.
- Derives `declaredKeyNames` (union of all declared config entries).
- Derives `orphanVars` / `orphanSecrets` (existing keys not in
  `declaredKeyNames`).
- Renders:
  1. Header (`Package` icon + "Installed Packages" + AddPackageModal)
  2. Table of `<PackageRow>`s, each receiving its per-package
     `manifest`, `manifestMissing`, plus the shared tenant config data
     and setters.
  3. "No packages installed yet…" empty state when `modulePackages` is
     empty (existing copy, unchanged).
  4. **Unused Config** card at the bottom — only rendered when
     `orphanVars.length || orphanSecrets.length > 0`. Same structure as
     today's orphan block but using the shared `ConfigRow`.

### Changed: `app/cloud/[project]/tabs/overview.tsx`

Replace the inline "Installed Packages" block (~lines 1117-1168) with:

```tsx
<PackagesSection
  tenantId={tenantId}
  registryUrl={state.defaultPackageRegistry ?? 'https://registry.dev.vetra.io'}
  installedPackages={state.packages}
  modulePackages={modulePackages}
  onAddPackage={addPackage}
  onRemovePackage={removePackage}
  onSetPackageVersion={setPackageVersion}
  initialAddPackage={initialAddPackage}
  initialAddVersion={initialAddVersion}
/>
```

Drop the now-unused `PackageRow` import from overview.tsx.
`useClintPackages` + `partitionPackagesByManifestType` stay (still
needed for `clintManifestsByName` and `modulePackages`).

### Changed: `app/cloud/[project]/page.tsx`

Remove the `<ConfigurationTab tenantId={tenantId} environment={environment} />`
mount (line 288) and its import. The container `{state && environment && (
... )}` wrapping block stays — it still contains the OverviewTab,
DatabaseRow (already removed in the prior change), etc.

### Deleted: `app/cloud/[project]/tabs/configuration.tsx`

All content is either moved (`ConfigRow` → `config-row.tsx`, orphan
block → `packages-section.tsx`) or made redundant by the row expansion
(`PackageConfigCard` per-package header is the same as the row itself,
so the per-package wrapping `Card` disappears).

## Data flow

```
PackagesSection
├ useTenantConfig(tenantId)                       (1 call)
├ useRegistryManifests(registryUrl, allPackages)  (1 call)
│
└ For each modulePackage:
   └ PackageRow
      ├ row: name, version, [⋮]
      └ when expanded:
         └ for each entry in this package's manifest.config[]:
            └ ConfigRow (env var or secret, edit/save/delete inline)

(at the bottom of PackagesSection)
└ When orphanVars or orphanSecrets exist:
   └ "Unused Config" card
      └ ConfigRow per orphan
```

No per-row hook calls — every row gets its slice of manifest +
shared-config-state via props. No N+1 fetches.

## Edge cases

- **Package declares no config.** Expanded body shows
  "This package declares no configuration." Same copy as today.
- **Manifest fetch failed (registry down or 404).** Expanded body shows
  "Could not load this package's manifest." Same copy as today.
- **Initial load.** While `useTenantConfig` or `useRegistryManifests`
  is loading, expanded bodies show their existing loading state (small
  spinner) — same UX as today inside `ConfigurationTab`.
- **Optimistic updates.** `ConfigRow` already manages an optimistic
  draft overlay that drops when server state catches up. Lifted with
  the component, no rewiring.
- **Uninstall while expanded.** The package row + its expanded body
  unmount when the package leaves `modulePackages`. No state leak.

## Verification

After the change:

1. **Env detail page**: After the Services row, the Installed Packages
   block renders as before. Click a chevron → row expands inline with
   the env vars + secrets table. Click again → collapses. Bottom of page
   no longer has a separate Configuration section.
2. **Set a var, set a secret**: In an expanded package row, click `Set`
   on a `var`, type a value, save → row updates without page reload,
   toast confirms. Same flow for a `secret` (input is type=password,
   value renders as `••••••` afterwards).
3. **Edit and delete**: For an already-set entry, `Edit` populates the
   input, save replaces; trash button deletes; toast confirms each.
4. **Empty / missing manifest**: Expanding a package with no declared
   config shows the "declares no configuration" copy. Expanding a
   package whose registry manifest 404s shows the "Could not load"
   copy.
5. **Unused Config card**: Manually setting a tenant key not declared by
   any installed package surfaces it in the footer card. Editing /
   deleting works the same as for declared keys.
6. **Type + lint pass**: `pnpm tsc` and `pnpm lint` clean (no new
   warnings).

## Implementation order (small commits)

1. **Spec** — this document.
2. **Extract `ConfigRow`** into `modules/cloud/components/config-row.tsx`.
   Update `configuration.tsx` to import it. Zero behavioural change.
   Verify dev still serves the bottom Configuration block.
3. **Build `PackagesSection` and expandable `PackageRow`.** New file
   `packages-section.tsx`. Extend `PackageRow` with expansion +
   per-package config rendering. Wire `overview.tsx` to use
   `PackagesSection`. The bottom `ConfigurationTab` block still exists
   side-by-side at this point — we render the same config twice
   temporarily.
4. **Drop the bottom Configuration block.** Remove `<ConfigurationTab>`
   from `page.tsx`. Delete `configuration.tsx`. Final cleanup.

Each commit is small enough to revert independently and passes `tsc`
on its own.
