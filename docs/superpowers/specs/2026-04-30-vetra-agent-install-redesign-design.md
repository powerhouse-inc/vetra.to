# Vetra.to — Agent Install Flow Redesign (Design)

**Status:** Draft
**Date:** 2026-04-30
**Owner:** Frank (vetra.to)
**Cross-repo dependency:** `vetra-cloud-package` (ph-pirate-cli manifest fix + publish). The system env var contract and chart injection (`SERVICE_ANNOUNCE_URL`, `SERVICE_ANNOUNCE_TOKEN`, `SERVICE_DOCUMENT_ID`, `SERVICE_PREFIX`) already exist in ph-clint + powerhouse-chart and need no changes.
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

### 5.1 System env var contract (already in place — no code changes)

ph-clint's `core/announce.ts` already reads four env vars when announcing:

- `SERVICE_ANNOUNCE_URL` — GraphQL endpoint where the agent posts its endpoints.
- `SERVICE_ANNOUNCE_TOKEN` — bearer token, minted per-pod by `ensureClintAnnounceTokens` in `vetra-cloud-package/processors/vetra-cloud-environment/gitops.ts`.
- `SERVICE_DOCUMENT_ID` — vetra cloud env doc id.
- `SERVICE_PREFIX` — service prefix.

The `powerhouse-chart` template at `powerhouse-k8s-hosting/powerhouse-chart/templates/clint-deployment.yaml` already injects all four onto every CLINT pod, sourcing from the gitops `announce:` block. The agent is a no-op when any are missing.

This contract is documented here as the source of truth for the modal's read-only "System" section in §6.4.a, but no infrastructure changes are needed.

### 5.2 vetra-cloud-package — ph-pirate-cli manifest fix

`vetra-cloud-package/ph-pirate/ph-pirate-cli/powerhouse.manifest.json` currently has `"agent": false` and no `config` declarations. Before publishing:

1. Set `features.agent` to a real object: `{ id: "ph-pirate", name: "Pirate", description: "arr", image: "<url>", models: [...] }` (port from the treasury-management copy as the starting point).
2. Add `config` entries reflecting `framework.ts`'s schema:
   - `MODEL` — type `var`, default `anthropic/claude-sonnet-4-5`, description "LLM model to use", required false.
   - `ANTHROPIC_API_KEY` — type `secret`, required true, description "Anthropic API key for the agent".
3. Verify `serviceCommand: "ph-pirate"`, `serviceAnnouncement: true`, and `supportedResources` are intact.

### 5.3 Publish ph-pirate-cli

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

A non-editable `dl`-style list rendering the four `SERVICE_*` vars from §5.1. Values shown as preview strings:

- `SERVICE_ANNOUNCE_URL` — read from the env's `CLINT_ANNOUNCE_URL` (today the gitops emits a single value per deployment, defaulting to `https://admin-dev.vetra.io/graphql`). The modal can show this as a static informational string for v1; once the announce URL becomes per-environment, the modal switches to deriving from env state. **Open in §9.**
- `SERVICE_ANNOUNCE_TOKEN` — masked as `••••••` with helper text "minted per-agent on first deploy".
- `SERVICE_DOCUMENT_ID` — `environment.id`.
- `SERVICE_PREFIX` — the prefix the user just entered above (live preview).

Help text below the list:

> These environment variables are set automatically by the platform when the agent runs. They are listed here so you can see what the agent will receive.

**b. Manifest-declared (required + optional from `manifest.config[]`)**

Renders the existing `PackageConfigForm` component verbatim — the same one `AddPackageModal` uses for tenant config (`var` and `secret` entries with required-field validation, defaults, descriptions, secret masking). State threaded through `ConfigFormState`.

This block is hidden when `manifest.config` is empty or absent.

**c. Custom (free-form)**

Renders the existing `EnvVarsEditor` component. State stored separately from the manifest-declared block. Empty by default.

Validation: at submit time, reject any custom var whose name collides with a `SERVICE_*` system var, `NODE_OPTIONS`, or a manifest-declared var (inline error, focus the offending row). The chart already emits `NODE_OPTIONS` for V8 heap sizing; user overrides would be silently lost.

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

These are **already injected today** by `powerhouse-chart/templates/clint-deployment.yaml` from values produced by `vetra-cloud-package/processors/vetra-cloud-environment/gitops.ts`. Reproduced here for the modal's read-only display:

| Var name                 | Source (today)               | Computed as                                                                                              |
| ------------------------ | ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| `SERVICE_ANNOUNCE_URL`   | gitops `announce.url`        | `process.env.CLINT_ANNOUNCE_URL` in the processor; default `https://admin-dev.vetra.io/graphql`          |
| `SERVICE_ANNOUNCE_TOKEN` | gitops `announce.token`      | minted per-agent by `ensureClintAnnounceTokens` (random base64url, persisted in `clint_announce_tokens`) |
| `SERVICE_DOCUMENT_ID`    | gitops `announce.documentId` | `environment.id`                                                                                         |
| `SERVICE_PREFIX`         | gitops agent name            | `service.prefix`                                                                                         |

ph-clint's `core/announce.ts` reads all four; the agent is a no-op when any are missing. Names are reserved — the modal rejects user-set env vars matching `SERVICE_*` or `NODE_OPTIONS` to prevent shadowing.

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

- **Per-env announce URL** — today `CLINT_ANNOUNCE_URL` is one global value (`admin-dev.vetra.io/graphql` in dev) shared by every CLINT pod, regardless of environment. The receiving observability subgraph keys announcements by `(documentId, prefix)` so the global URL works fine. The modal therefore shows the announce URL as static informational copy in v1. If/when announce becomes per-env, the modal switches to deriving it from env state.
- **`-cli` filter strictness** — should we hard-block names not matching `*-cli` from the search dropdown, or surface them with a "this looks unusual" warning? Spec assumes hard-block in the dropdown filter; manifest validation handles edge cases.
- **Custom env var name reservation** — spec rejects user vars matching `SERVICE_*` and `NODE_OPTIONS`. Should we also reserve the manifest-declared names (so a user can't shadow a `config` entry via the Custom block)? Probably yes; cleanest is to reject any custom name that collides with system vars OR manifest-declared vars at submit time.

## 10. Implementation order

This becomes the writing-plans input. Sketched here to validate scope:

1. **vetra-cloud-package** — fix `ph-pirate/ph-pirate-cli/powerhouse.manifest.json` (agent block + config entries). No code change.
2. **Publish** — `pnpm publish:dev` from `vetra-cloud-package/ph-pirate` to `registry.dev.vetra.io`. Verify manifest fetch and search.
3. **vetra.to** — write `AddAgentModal`, replacing `EnableClintModal`. Reuse `PackageConfigForm`, `EnvVarsEditor`, `useRegistryPackages`, `useRegistryManifest`, `useRegistryVersions`, `applyConfigChanges`.
4. **vetra.to** — wire `AddAgentModal` into `tabs/overview.tsx`. Pass `addPackage` + `enableService` through the submit handler.
5. **vetra.to** — filter clint-project packages out of Reactor Modules section + cards (§8.1).
6. **vetra.to** — system env var preview in the modal (§6.4.a). Static for v1 per §9.
7. **vetra.to** — tests: `add-agent-modal.test.tsx` covers the three-section layout, manifest validation, system env preview, submit ordering, and the failure-mode toasts. `tabs/overview.tsx` test covers the modules-section filter.
8. **Validation** — install ph-pirate-cli end-to-end via the new modal in a dev environment. Confirm the agent boots, the chart-injected `SERVICE_ANNOUNCE_*` env vars are present, and announces appear in `AgentCard`.

Steps 1–2 are blocking for step 8 but not for steps 3–7 (the UI can be built and tested against a mocked registry/manifest).
