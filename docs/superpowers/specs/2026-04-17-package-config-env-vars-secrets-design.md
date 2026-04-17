# Package Config (Env Vars & Secrets) — Design Spec

Date: 2026-04-17
Status: approved, implementation in progress

## Summary

Extend `powerhouse.manifest.json` so packages can declare the env vars and secrets they require. When a user installs a package into a Vetra Cloud environment, vetra.to fetches the package's manifest, prompts for any required config in the install modal, and refuses to complete the install until required fields are set. A new "Configuration" tab on the environment detail page lets the user view, edit, and remove env vars and secrets for the environment and its installed packages.

## Goals

- Packages declare their env-var and secret requirements alongside `documentModels` / `apps` / `subgraphs`.
- Installing a package forces required config to be entered up-front.
- Upgrading a package that adds new required config re-opens the modal before the version is written.
- Config is visible and editable after install via a Configuration tab.
- Uninstalling a package gives the user the option to delete keys it exclusively declared.

## Non-Goals

- No change to the `vetra-cloud-secrets` subgraph schema or storage. Keys remain tenant-flat (one namespace per tenant).
- No validation of env-var or secret **values** (no URL / number / regex constraints) in v1. Only key-name validation.
- No per-environment role-based access control for config edits beyond what exists today.

## Decisions (answered during brainstorm)

| Q                   | Decision                                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Key scoping         | **C** — tenant-scoped storage, package-scoped declaration, client-side collision detection. Pods see bare names (e.g. `REQUEST_FINANCE_API_KEY`). |
| Manifest shape      | **A** — top-level `config` array with `type: "var" \| "secret"` discriminator.                                                                    |
| Upgrade flow        | **A** — block the version change until new required config is provided.                                                                           |
| Uninstall           | **B** — prompt with a checkbox per declared key; exclusive keys pre-checked, shared keys unchecked.                                               |
| Collision detection | **A** — computed client-side from manifests of currently-installed packages; no new DB schema.                                                    |

## Architecture

```
┌──────────────────┐  declares config  ┌──────────────────┐
│ powerhouse       │ ─────────────────▶│ powerhouse.      │
│ (monorepo)       │                    │ manifest.json    │
│ - extend         │                    └────────┬─────────┘
│   Manifest type  │                             │ published via npm
│ - default        │                             │ + registry CDN
│   template       │                             ▼
│ - codegen merge  │                    ┌──────────────────┐
└──────────────────┘                    │ registry CDN     │
                                        │ /-/cdn/<pkg>@<v>/│
                                        │ powerhouse.      │
                                        │ manifest.json    │
                                        └────────┬─────────┘
                                                 │ fetched on install
                                                 ▼
┌──────────────────┐                    ┌──────────────────┐
│ vetra-cloud-     │◀──GraphQL─────────┤ vetra.to         │
│ secrets subgraph │  setEnvVar          │ - install modal  │
│ (unchanged)      │  setSecret          │ - configuration  │
│                  │  deleteEnvVar       │   tab            │
│                  │  deleteSecret       │ - upgrade gating │
│                  │  envVars / secrets  │ - uninstall      │
└──────────────────┘                     │   cleanup prompt │
                                         └──────────────────┘
```

## Manifest Schema Extension

File: `powerhouse/packages/shared/document-model/types.ts`

```ts
export type ConfigEntryType = 'var' | 'secret'

export type ConfigEntry = {
  name: string // must match ^[A-Z][A-Z0-9_]*$
  type: ConfigEntryType
  description?: string
  required?: boolean // default: false
  default?: string // vars only; ignored on secrets
}

export type Manifest = {
  // ... existing fields ...
  config?: ConfigEntry[]
}
```

**Validation rules** (enforced by `generateManifest` and `vetra.to` modal):

- `name` matches `/^[A-Z][A-Z0-9_]*$/` (same rule used by the subgraph today).
- Names are unique within a single manifest.
- `default` is ignored (and stripped) for `type: "secret"`.

**Example (contributor-billing):**

```json
"config": [
  {
    "name": "REQUEST_FINANCE_API_KEY",
    "type": "secret",
    "description": "API key for Request Finance integration",
    "required": true
  },
  {
    "name": "INVOICE_WEBHOOK_URL",
    "type": "var",
    "description": "Webhook destination for invoice events",
    "required": false
  }
]
```

### Codegen changes (`powerhouse/packages/codegen`)

- `templates/boilerplate/powerhouse.manifest.json.ts` — add empty `"config": []` to the default template.
- `codegen/generate.ts` `generateManifest` — include `config` in the merge pass (preserve existing entries by `name`, merge new ones).

## Manifest Fetching (vetra.to)

New Next.js API route:

```
GET /api/registry/manifest?registry=<url>&package=<pkg>&version=<v?>
```

Implementation: fetch `${registry}/-/cdn/<pkg>@<version>/powerhouse.manifest.json` (omit `@<version>` for latest), return JSON. Same shape as the existing `/api/registry/packages` and `/api/registry/versions` routes.

Client hook: `useRegistryManifest(registryUrl, packageName, version)` in `modules/cloud/hooks/use-registry-search.ts`.

## Collision Detection (vetra.to, client-side)

Pure helper in `modules/cloud/lib/config-collisions.ts`:

```ts
type InstalledManifest = { name: string; config: ConfigEntry[] }

/** Key → list of package names that declare it. */
export function buildCollisionMap(manifests: InstalledManifest[]): Record<string, string[]>

/** Keys declared by `packageName` that no other installed package declares. */
export function exclusiveKeys(packageName: string, manifests: InstalledManifest[]): string[]
```

Used in:

- Install/upgrade modal — to annotate each entry with "also declared by X".
- Uninstall dialog — to pre-check exclusive keys.

## Install Modal (vetra.to)

`app/cloud/[project]/tabs/overview.tsx` → `AddPackageModal`.

Flow:

1. User picks a package and version.
2. Modal fetches that version's manifest.
3. If `manifest.config` is empty/missing → single "Add Package" button dispatches `addPackage` (current behavior).
4. If `manifest.config` has entries:
   - Render a "Configuration" section grouped by required vs. optional.
   - For `type: "var"`: text input, pre-populated with the current tenant value if the key already exists.
   - For `type: "secret"`: password input, empty. If the tenant already has a value for that key, show `"(existing value — leave blank to keep)"`.
   - Annotate entries whose key is already declared by another installed package with an info badge ("Also used by: contributor-billing").
   - "Add Package" button disabled until all required fields satisfy: `var` has a value (either entered or pre-existing in tenant), `secret` has a value OR an existing tenant value.
5. On submit (order matters — configs first so a failure aborts the install):
   1. For each entry with a newly-entered value, call `setEnvVar` / `setSecret` in parallel.
   2. If any mutation fails → stop, show error toast, do NOT dispatch `addPackage`. Partial writes remain (upserts are idempotent).
   3. On success, dispatch `addPackage({ packageName, version })`.

## Upgrade Flow

The `PackageRow` dropdown currently has a disabled `Upgrade to version...` item. Replace with a version picker (same UX as the Service version picker).

On version pick:

1. Fetch the new version's manifest.
2. Compute `newRequired` = entries where `required: true` AND key is not already set in tenant AND not already required by the currently-installed version of this package.
3. If `newRequired` is empty → call `setPackageVersion(packageName, version)` directly.
4. Else → open the install modal prefilled with the new required entries only; on success, run config mutations then `setPackageVersion`.

## Configuration Tab

New tab on the environment detail page (`app/cloud/[project]/page.tsx`), rendered from `app/cloud/[project]/tabs/configuration.tsx`.

Layout, top to bottom:

1. **Per-package sections.** For each installed package:
   - Header: package name + version.
   - Table of rows: one per declared config entry. Columns: name, type badge, description, current value (for vars — rendered; for secrets — "set"/"not set"), required badge, actions (edit, clear).
   - Missing required field → red "required — not set" indicator.
   - Inline edit: opens a small form with an input. Save calls `setEnvVar` or `setSecret`.
2. **Unused keys section** (collapsed by default). Tenant keys that are not declared by any installed package. Useful for cleanup of orphaned keys. Columns: name, type, value (vars) / "set" (secrets), actions (edit, delete).

The tab fetches, in parallel:

- Manifests for every installed package (via the new `/api/registry/manifest` route, with revalidation).
- Tenant env vars and secret keys from the `vetra-cloud-secrets` subgraph.

Secret **values** are never returned by the subgraph (by design). Editing a secret always means typing a new value.

## Uninstall with Config Cleanup

`PackageRow.handleUninstall` becomes a two-step flow:

1. Fetch the package's manifest (or reuse cached one).
2. Compute exclusive keys vs. shared keys from the installed manifests.
3. Open a confirmation dialog:

   ```
   Uninstall contributor-billing?

   [✓] REQUEST_FINANCE_API_KEY (exclusive to this package)
   [ ] INVOICE_WEBHOOK_URL (also used by other-package)

   [Cancel]  [Uninstall]
   ```

4. On confirm: call `deleteEnvVar` / `deleteSecret` for checked keys, then dispatch `removePackage`.

## Error Handling

| Failure mode                                                 | Behavior                                                                                            |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Manifest fetch fails on install                              | Treat as "no declared config" — warn in the modal, allow install to proceed.                        |
| Manifest fetch fails on configuration tab                    | Show inline error in that package's section; other packages render normally.                        |
| `setEnvVar` / `setSecret` mutation fails mid-install         | Abort, toast error, do not dispatch `addPackage`. Partial writes remain (idempotent). User retries. |
| Invalid key name (shouldn't happen — caught at publish time) | Skip that entry with a console warning.                                                             |
| Key collision across packages                                | Show info badge in modal; don't block.                                                              |

## Testing Strategy

### `powerhouse` monorepo

- Unit: `generateManifest` preserves existing `config` entries when merging new ones (by `name`).
- Unit: manifest schema accepts the new `config` field without breaking existing manifests.

### `vetra.to`

- Unit: `buildCollisionMap` / `exclusiveKeys` — empty input, single package, multi-package collision.
- Unit: required-field validation in the install modal (required var empty → button disabled; required secret with existing tenant value → button enabled).
- Integration: install a mock package with required secret → writes subgraph mutation before `addPackage` dispatch.
- E2E (Playwright): add package with config → modal opens, required field blocks submit, filling it submits, row appears with config tab showing the new value.

## Out-of-scope (explicitly deferred)

- Rotation / expiry for secrets.
- Type validation beyond `var` / `secret`.
- Config templates / shared config across environments.
- CLI parity (`ph install` does not prompt for config in v1).
- Drift detection between declared manifest config and what's actually set in the tenant.
