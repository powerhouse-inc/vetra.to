# Vetra.to — Agent Install Flow Redesign (Design)

**Status:** Draft
**Date:** 2026-04-30
**Owner:** Frank (vetra.to)
**Cross-repo dependency:** `ph-clint` (announce-URL env var contract), `vetra-cloud-package` (system env var injection on CLINT pods, ph-pirate-cli manifest)
**Supersedes:** N/A — extends [`2026-04-28-clint-service-vetra-to-design.md`](./2026-04-28-clint-service-vetra-to-design.md)

## 1. Summary

The current "Add Agent" flow on the cloud env detail page is two-step and order-dependent: the user first installs the agent package via the Reactor Modules section, then opens `EnableClintModal` which only lists already-installed clint-project packages. This redesign collapses both steps into a single self-contained modal launched from the Agents section, decouples agent discovery from the modules list, and adds explicit handling for system env vars the platform must inject so the agent can announce its endpoints.

We also publish `@powerhousedao/ph-pirate-cli` to `registry.dev.vetra.io` as the canonical example agent for the new flow.

## 2. Goals

- "Add Agent" is one button, one modal, one submit. No package-install prerequisite.
- Agent discovery uses registry search, filtered to package names ending in `-cli`. Manifest validates the choice (`type === 'clint-project'`).
- Agents are no longer visible in the Reactor Modules section. They appear only as agents.
- Manifest-declared env vars (`config[]`) are first-class in the install modal, identical to the experience `AddPackageModal` provides today.
- Platform-managed env vars (announce URL, service id, tenant id, env id) are auto-injected on the CLINT pod and surfaced read-only in the modal so users can see what the platform sets.
- `@powerhousedao/ph-pirate-cli` is published to `registry.dev.vetra.io` and installs end-to-end via the new flow.

## 3. Non-goals (deferred)

- Restructuring the doc model so agents are a separate primitive from packages (rejected — a UI-only filter satisfies the user concern at far lower cost).
- Marketplace-style browse page for agents.
- Per-endpoint enable/disable toggles (still runtime read-only, as today).
- Atomic three-way install (config write + package add + service enable wrapped in a single mutation). Best-effort with toast-driven manual reconcile is sufficient for v1.
- Migrating existing envs that already have a clint-project package installed as a Reactor Module — they keep working; the package just stops showing in the modules section.

## 4. Architectural decision: agents stay packages, hidden from modules UI

A clint-project package is still a package in `state.packages[]`, and a CLINT service still references it via `service.config.package`. No schema change. The change is purely UI-side: any package whose registry manifest declares `type === 'clint-project'` is filtered out of the Reactor Modules section and surfaced only under Agents.

**Why not a separate `state.agents[]` field?** It would require schema changes to the cloud-environment doc model, processor updates, GraphQL field additions, migration of existing envs, and parallel handling in auto-update / available-updates / package-version logic. The user-facing concern is "I don't want to see this package in two places" — a UI filter solves that without any of the above.

**Consequence:** Versioning, removal, and auto-update for agents continue to flow through the existing package primitives. The Agents section's `AgentCard` already drives version controls via the manifest; the Reactor Modules section just stops listing agent packages.

## 5. Cross-repo prerequisites

### 5.1 ph-clint

Define the announce-URL env var contract. The published library reads, in order:

1. `VETRA_SERVICE_ANNOUNCE_URL` — explicit URL for the announce endpoint. This is the new contract and the only one new agents should rely on.
2. (fallback) Whatever derivation logic ph-clint uses today (likely from `VETRA_SWITCHBOARD_URL` or another already-injected var). Kept only so existing pods that haven't been redeployed since the env var injection lands continue to work; can be removed once all CLINT services have cycled at least once.

Document the four system env vars (see §7) the platform guarantees on every CLINT pod. Update the ph-pirate-cli scaffold's `framework.ts`/`cli.ts` to consume `VETRA_SERVICE_ANNOUNCE_URL` rather than relying on a derived default.

### 5.2 vetra-cloud-package — system env var injection

Whatever component renders the k8s pod spec for a CLINT service (controller / processor / gitops template) must inject these env vars into the pod, computed per environment:

- `VETRA_SERVICE_ANNOUNCE_URL` — see §7 for the canonical formula.
- `VETRA_SERVICE_PREFIX` — the service prefix (e.g. `ph-pirate`).
- `VETRA_TENANT_ID` — for scoping cross-subgraph calls.
- `VETRA_ENV_DOCUMENT_ID` — the cloud-environment doc id, so observability can correlate.

These are not part of `VetraCloudServiceClint.env[]` (which is user-managed config). They live in the gitops template as platform-injected env, evaluated at deploy time.

User-supplied env vars (manifest `config[]` plus the modal's "Custom" block) are layered on top and may not reuse the `VETRA_*` prefix — the gitops layer rejects/ignores user-set vars whose names collide with the system set.

### 5.3 vetra-cloud-package — ph-pirate-cli manifest fix

`vetra-cloud-package/ph-pirate/ph-pirate-cli/powerhouse.manifest.json` currently has `"agent": false` and no `config` declarations. Before publishing:

1. Set `features.agent` to a real object: `{ id: "ph-pirate", name: "Pirate", description: "arr", image: "<url>", models: [...] }` (port from the treasury-management copy as the starting point).
2. Add `config` entries reflecting `framework.ts`'s schema:
   - `MODEL` — type `var`, default `anthropic/claude-sonnet-4-5`, description "LLM model to use", required false.
   - `ANTHROPIC_API_KEY` — type `secret`, required true, description "Anthropic API key for the agent".
3. Verify `serviceCommand: "ph-pirate"`, `serviceAnnouncement: true`, and `supportedResources` are intact.

### 5.4 Publish ph-pirate-cli

From `vetra-cloud-package/ph-pirate`, locally (not via CI):

```
ph build && ph publish --registry https://registry.dev.vetra.io
```

(or `pnpm exec ph publish:dev` per the existing `package.json` script — they should resolve to the same registry).

Verify:

- `https://registry.dev.vetra.io/@powerhousedao/ph-pirate-cli` returns a tarball + version metadata.
- The registry's manifest endpoint (`/api/registry/manifest?registry=…&package=@powerhousedao/ph-pirate-cli`) returns the corrected manifest including the `agent` block, `config[]`, `serviceCommand`, `supportedResources`.
- A search for `pirate` against the registry surfaces the package with name ending in `-cli`.

## 6. New `AddAgentModal` (replaces `EnableClintModal`)

File: `modules/cloud/components/add-agent-modal.tsx`. Replaces the current `enable-clint-modal.tsx` (kept around in git history; no stub left behind).

### 6.1 Section: Pick agent

- Combobox driven by `useRegistryPackages(env.state.defaultPackageRegistry, search)` (already exists, used by `AddPackageModal`).
- Client-side filter: `pkg.name.endsWith('-cli')`. Applied in the result-render step. The convention is documented in user-facing copy: "Agents are published as packages whose name ends in -cli."
- On selection: fetch manifest via `useRegistryManifest(registry, packageName, version || null)`.
- Manifest validation: if `manifest.type !== 'clint-project'`, render an inline error in place of the agent preview ("This package isn't a Powerhouse agent. Pick another or contact the package author.") and disable submit. The `-cli` suffix is a discovery filter, not a guarantee.
- On valid manifest: render the existing agent preview card (icon, name, description, models) — port the JSX from `EnableClintModal`.

### 6.2 Section: Version

- Identical to `AddPackageModal`'s version combobox: `useRegistryVersions(registry, packageName)` + dist-tags + version list.
- Default to whatever the registry surfaces as `latest`.

### 6.3 Section: Configuration

- **Prefix** — `Input` component. Default derived from `manifest.features.agent.id` (sanitized via the existing `sanitize()` helper in `EnableClintModal`). Validated against `PREFIX_RE` and existing `services[].prefix` for collisions, identical to today.
- **Resource size** — `ResourceSizePicker` driven by `manifest.supportedResources` mapped through `SIZE_TO_TS`. Default: first supported size.
- **Service command** — `Textarea` with default from `manifest.serviceCommand`, plus the existing "Reset to default" affordance.

### 6.4 Section: Environment variables (three groups)

The modal's env-var section is split into three visually distinct blocks. All three render in the modal even when empty (so the user understands what's happening).

**a. System (auto-injected, read-only)**

A non-editable `dl`-style list rendering the four `VETRA_*` vars defined in §5.2. Values shown as preview strings — for the announce URL, computed from the env's subdomain + base domain (matches the gitops injection logic). Help text below the list:

> These environment variables are set automatically by the platform when the agent runs. They are listed here so you can see what the agent will receive.

**b. Manifest-declared (required + optional from `manifest.config[]`)**

Renders the existing `PackageConfigForm` component verbatim — the same one `AddPackageModal` uses for tenant config (`var` and `secret` entries with required-field validation, defaults, descriptions, secret masking). State threaded through `ConfigFormState`.

This block is hidden when `manifest.config` is empty or absent.

**c. Custom (free-form)**

Renders the existing `EnvVarsEditor` component. State stored separately from the manifest-declared block. Empty by default.

Validation: at submit time, reject any custom var whose name collides with a `VETRA_*` system var or a manifest-declared var (inline error, focus the offending row).

### 6.5 Submit flow

```
1. validateForm()                                       // local, sync
2. if (manifest.config.length && tenantId)              // tenant-config writes
     applyConfigChanges(tenantId, configChanges, renown)
3. addPackage(packageName, version)                     // env doc model
4. enableService('CLINT', prefix, {                     // env doc model
     package: { name, version },
     env: customEnvVars,
     serviceCommand,
     selectedRessource,
   })
5. close modal, toast 'Agent installed'
```

Failure handling — the modal stays open on any failure and surfaces the error inline:

- Step 2 fail → no env mutation occurred. Safe to retry by fixing inputs.
- Step 3 fail after step 2 succeeded → tenant config has been written but no package yet. Toast: "Tenant config saved but agent install failed — retry to add the package." User can retry; `applyConfigChanges` is idempotent for set-equal values.
- Step 4 fail after steps 2+3 succeeded → package exists in env but no CLINT service yet. The package is **not** visible anywhere in the UI in this transient broken state (it's clint-project so the modules section filters it out, and there's no CLINT service yet so the agents section doesn't render it either). Toast: "Package installed but agent enable failed — retry to finish, or contact support to clean up." User-driven retry of the modal with the same inputs completes step 4. If the user closes the modal without retrying, the orphaned package sits in `state.packages` until manually removed via API.

A small follow-up to harden this: §8.1's filter could surface clint-project packages in the modules section _only when_ there's no corresponding CLINT service for them, giving the user a remove path. Out of scope for v1 — flagged here so the v1 implementation can leave a TODO at the filter site.

True atomicity is out of scope; if needed, a future v2 controller-side `installAgent` mutation can wrap all three.

## 7. System env var contract (canonical reference)

Reproduced for both ph-clint and vetra-cloud-package implementers:

| Var name                     | Source             | Computed as                                                                                    |
| ---------------------------- | ------------------ | ---------------------------------------------------------------------------------------------- |
| `VETRA_SERVICE_ANNOUNCE_URL` | gitops / processor | `https://switchboard.<subdomain>.<basedomain>/graphql` (announce mutation invoked at this URL) |
| `VETRA_SERVICE_PREFIX`       | gitops / processor | `<service.prefix>`                                                                             |
| `VETRA_TENANT_ID`            | gitops / processor | `<tenantId>` (subdomain-derived)                                                               |
| `VETRA_ENV_DOCUMENT_ID`      | gitops / processor | `<environment.id>`                                                                             |

ph-clint reads `VETRA_SERVICE_ANNOUNCE_URL` directly. The other three are available to user code but ph-clint does not depend on them. Names are reserved — user-set env vars matching `VETRA_*` are rejected (gitops side) and warned about (UI side).

## 8. UI changes outside the modal

### 8.1 Reactor Modules section filter

In `tabs/overview.tsx`, the package list rendered in the Reactor Modules card filters by manifest type:

```ts
const moduleManifests = clintManifestsByName // already computed by useClintPackages
const modulePackages = state.packages.filter(
  (p) => moduleManifests[p.name]?.type !== 'clint-project',
)
```

`AvailableUpdatesCard` and `AutoUpdateCard` similarly exclude clint-project packages from their package-update sets — agents have their own update path through `AgentCard`.

The empty state for the modules section is updated: "No reactor modules installed" (was "No packages installed").

### 8.2 Agents section

Replaces the wiring from `EnableClintModal` to `AddAgentModal`:

```tsx
<AddAgentModal
  open={addAgentOpen}
  onOpenChange={setAddAgentOpen}
  env={environment}
  registryUrl={state.defaultPackageRegistry ?? 'https://registry.dev.vetra.io'}
  tenantId={tenantId}
  installedPackages={state.packages}
  onSubmit={async ({ packageName, version, prefix, clintConfig }) => {
    await addPackage(packageName, version)
    await enableService('CLINT', prefix, clintConfig)
  }}
/>
```

The "Add Agent" button copy stays. Empty-state text in the Agents section can be updated from "Run AI agents in this environment" to "Install your first agent — they're packages whose name ends in -cli." (TBD with copy).

## 9. Open questions

- **Announce mutation path** — the §7 table assumes the announce URL is the env's switchboard `/graphql` endpoint. Need to confirm with the observability subgraph owner that announces target switchboard's GraphQL (vs. a dedicated mutation endpoint). If different, update the table and the gitops template accordingly.
- **`-cli` filter strictness** — should we hard-block names not matching `*-cli` from the search dropdown, or surface them with a "this looks unusual" warning? Spec assumes hard-block in the dropdown filter; manifest validation handles edge cases.
- **Custom env var name reservation** — spec rejects user vars matching `VETRA_*`. Should we also reserve the manifest-declared names (so a user can't shadow a `config` entry via the Custom block)? Probably yes; cleanest is to reject any custom name that collides with system vars OR manifest-declared vars at submit time.

## 10. Implementation order

This becomes the writing-plans input. Sketched here to validate scope:

1. **vetra-cloud-package** — fix `ph-pirate-cli/powerhouse.manifest.json` (agent block + config entries). No code change.
2. **vetra-cloud-package** — implement system env var injection in the gitops template / processor (§5.2).
3. **ph-clint** — read `VETRA_SERVICE_ANNOUNCE_URL` with fallback (§5.1).
4. **Publish** — `ph build && ph publish` for ph-pirate-cli to `registry.dev.vetra.io`.
5. **vetra.to** — write `AddAgentModal`, replacing `EnableClintModal`. Reuse `PackageConfigForm`, `EnvVarsEditor`, `useRegistryPackages`, `useRegistryManifest`, `useRegistryVersions`, `applyConfigChanges`.
6. **vetra.to** — wire `AddAgentModal` into `tabs/overview.tsx`. Pass `addPackage` + `enableService` through the submit handler.
7. **vetra.to** — filter clint-project packages out of Reactor Modules section + cards (§8.1).
8. **vetra.to** — system env var preview in the modal (§6.4.a). Pull computed values from the env state (subdomain, baseDomain, tenantId, env.id).
9. **vetra.to** — tests: `add-agent-modal.test.tsx` covers the three-section layout, manifest validation, system env preview, submit ordering, and the failure-mode toasts. `tabs/overview.tsx` test covers the modules-section filter.
10. **Validation** — install ph-pirate-cli end-to-end via the new modal in a dev environment. Confirm the agent boots, reads `VETRA_SERVICE_ANNOUNCE_URL`, and announces endpoints visible in `AgentCard`.

Steps 1–4 are blocking for step 10 but not for steps 5–9 (the UI can be built and tested against a mocked registry/manifest).
