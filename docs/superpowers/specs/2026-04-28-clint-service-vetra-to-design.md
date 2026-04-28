# Vetra.to — CLINT Service Support (Design)

**Status:** Draft
**Date:** 2026-04-28
**Owner:** Frank (vetra.to)
**Cross-repo dependency:** `vetra-cloud-package` (dev branch, uncommitted CLINT extensions)

## 1. Summary

`vetra-cloud-package` is being extended with a new service type `CLINT` plus a per-service config type `VetraCloudServiceClint` that captures the package, environment variables, service command, resource size, and enabled endpoints for an agent. This spec describes the corresponding work in `vetra.to` to surface, configure, and edit CLINT services on the cloud env detail page.

The deliverable is a new "Agents" section on the env detail page that supports multiple CLINT services per environment, each tied to a clint-project package, with combined enable+configure on add and inline edit afterwards.

## 2. Goals

- Render CLINT services as first-class citizens alongside CONNECT / SWITCHBOARD / FUSION on the env detail page.
- Let signed-in users add ("enable") a CLINT service with full configuration in one step.
- Let signed-in users edit a CLINT service's resource size, command, endpoints, and env vars after enabling.
- Render endpoint metadata (graphql / mcp / website) with type-appropriate affordances.
- Support N CLINT services per env from day one.

## 3. Non-goals (deferred)

- Pricing / billing display for resource sizes.
- Env-var secret treatment (masking, separate secrets store).
- Per-endpoint live runtime status (depends on a future agent-callback schema extension).
- Inline package install inside the Add Agent modal — users install packages first via the existing flow.
- Restart-agent action.
- Drag-reorder of CLINT services (alphabetical sort by prefix for v1).
- Adoption telemetry / analytics events.

## 4. Cross-repo prerequisites (vetra-cloud-package)

These changes must land in `vetra-cloud-package` before vetra.to can ship the edit flow. They are listed here for coordination; their implementation is owned by that repo.

1. Pull the current `dev` branch cleanly. Drop the accidental removals (`owner`, `apexService`, `autoUpdateChannel`, `version`, `STOPPED`, the related ops/inputs/errors). Keep only the CLINT-related additions.
2. Extend `VetraCloudServiceClint` with:
   - `package: VetraCloudPackage!` — which clint package this config drives.
   - `env: [VetraCloudServiceEnv!]!` — env vars (name/value pairs).
3. Add type `VetraCloudServiceEnv { name: String!  value: String! }`.
4. Extend `EnableServiceInput` with optional `clintConfig: VetraCloudServiceClintInput`. The `ENABLE_SERVICE` reducer rejects when `type == CLINT && clintConfig == null`, and ignores `clintConfig` for non-CLINT types.
5. Add operation `SET_SERVICE_CONFIG(prefix: String!, config: VetraCloudServiceClintInput!)` for post-enable edits, keyed by `prefix` since multiple CLINT services can coexist.
6. Reducer enforces: `config` is mandatory iff `type == CLINT`; `prefix` unique within `services[]`.

Optional for v2 (not blocking vetra.to v1):

- Extend the agent callback ingestion to populate per-endpoint runtime status (e.g., `runtimeEndpoints: [...]` alongside `enabledEndpoints`) so vetra.to can render a live indicator.

## 5. Manifest convention (cross-cutting)

Clint-project packages declare themselves in `powerhouse.manifest.json` with the following fields. This convention is documented in `ph-clint`'s README and template; vetra.to validates with a Zod schema and silently filters non-conformant packages out of the picker.

```json
{
  "type": "clint-project",
  "serviceCommand": "ph-rupert --stand-alone --mode \"one-shot\"",
  "supportedResources": [
    "vetra-agent-s",
    "vetra-agent-m",
    "vetra-agent-l",
    "vetra-agent-xl",
    "vetra-agent-xxl"
  ],
  "endpoints": [
    {
      "id": "agent-switchboard-graphql-api",
      "type": "api-graphql",
      "port": "12345",
      "status": "disabled"
    },
    { "id": "agent-switchboard-mcp-api", "type": "api-mcp", "port": "12345", "status": "disabled" },
    { "id": "agent-connect-studio", "type": "website", "port": "12345", "status": "disabled" }
  ]
}
```

Field semantics for vetra.to consumption:

- `type === 'clint-project'` is the discriminator. Packages without it never appear in the CLINT package picker.
- `serviceCommand` becomes the default in the enable modal; user-set values are stored in `VetraCloudServiceClint.serviceCommand` (and override the manifest default).
- `supportedResources` filters the resource-size picker. Defaults to the smallest supported value.
- `endpoints[]` populates the endpoint checklist. Endpoints with `status: 'enabled'` are pre-checked; the user's selection is stored as `enabledEndpoints: [String!]!` (IDs only). Type/port/icon metadata is re-joined from the manifest at render time.

## 6. Vetra.to data model additions

### 6.1 Local types (`modules/cloud/types.ts`)

Mirror the GraphQL types as plain TS so the rest of the cloud module stays decoupled from codegen output.

```ts
export type CloudEnvironmentServiceType = 'CONNECT' | 'SWITCHBOARD' | 'FUSION' | 'CLINT'

export type CloudResourceSize =
  | 'VETRA_AGENT_S'
  | 'VETRA_AGENT_M'
  | 'VETRA_AGENT_L'
  | 'VETRA_AGENT_XL'
  | 'VETRA_AGENT_XXL'

export type CloudServiceEnv = { name: string; value: string }

export type ClintEndpointType = 'api-graphql' | 'api-mcp' | 'website'

export type ClintEndpoint = {
  id: string
  type: ClintEndpointType
  port: string
  status?: 'enabled' | 'disabled'
}

export type CloudServiceClintConfig = {
  package: CloudPackage // existing type
  env: CloudServiceEnv[]
  serviceCommand: string | null // null = use manifest default
  selectedRessource: CloudResourceSize | null
  enabledEndpoints: string[] // endpoint IDs only
}

export type CloudEnvironmentService = {
  type: CloudEnvironmentServiceType
  prefix: string
  enabled: boolean
  url: string | null
  status: ServiceStatus
  config: CloudServiceClintConfig | null // populated only when type === 'CLINT'
}
```

### 6.2 Manifest schema extension (`modules/cloud/config/types.ts`)

Extend the existing `PackageManifest` Zod schema with optional clint fields. Unknown packages remain valid (backward compatible). Validation in `useClintPackages` rejects manifests where `type === 'clint-project'` but required clint fields are missing — those packages do not appear in the picker.

## 7. UX

### 7.1 Env detail page layout

```
[Env header]
[Status / DNS / Custom Domain cards]
[Services]   ← CONNECT, SWITCHBOARD, FUSION (existing service-card strip)
[Agents]     ← NEW: list of CLINT services + "Add Agent" CTA
[Packages]   (existing)
[Auto-update card] (existing)
[Logs / Metrics / Events] (existing)
```

The Agents section sits between Services and Packages. It is a list of agent cards plus a CTA. When no CLINT services are enabled, an empty state with copy "Run AI agents in this environment" + the same CTA is shown.

### 7.2 Add Agent (Enable CLINT) modal

Single-page form. Submit dispatches the extended `ENABLE_SERVICE` with `clintConfig` and closes the modal; the new agent card appears in the Agents list with `status: PROVISIONING`.

| Field                 | Source / behavior                                                                                                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clint package         | Dropdown sourced from `env.packages` filtered by manifest `type === 'clint-project'`. Empty state links to the existing Add Package modal.                                        |
| Prefix                | Free text. Validated for URL-safety (`/^[a-z0-9-]+$/`) and uniqueness within `env.services[]`. Placeholder = sanitized package name.                                              |
| Resource size         | Radio/dropdown filtered by manifest `supportedResources`. Default = smallest supported. T-shirt labels (Small / Medium / Large / X-Large / 2X-Large).                             |
| Service command       | Textarea (single-line by default, expands) pre-filled from manifest `serviceCommand`. Shows "Reset to default" link when overridden. Same component reused in the configure form. |
| Endpoints             | Checklist from manifest `endpoints[]`. Row layout: `[type-icon] {id}  :{port}  ({type})`. Default-checked = endpoints with `status: 'enabled'` in manifest.                       |
| Environment variables | Key/value rows with +/- buttons. Empty by default. Plaintext only in v1.                                                                                                          |

Submit button is disabled until: package selected, prefix non-empty + valid + unique, at least one resource size selected. Endpoints and env vars may be empty.

### 7.3 Agent card — collapsed

```
[clint icon] rupert@1.2.3  [ACTIVE]  prefix: rupert  2X-Large  3 endpoints  [Configure ▾]
```

Same styling as `service-card.tsx`. Replaces the version pill with `package.name@package.version` and adds a resource-size badge plus enabled-endpoint count. Cards sort alphabetically by `prefix`.

### 7.4 Agent card — expanded (configure form)

Clicking **Configure ▾** expands the card inline (no modal). Form fields mirror the enable modal except for prefix and package, which are read-only after enable (changing them implies re-deploy; out of scope for v1 — user disables and re-adds).

- **Resource size** — dropdown (same options + filter as enable).
- **Service command** — textarea with "reset to default" link.
- **Endpoints** — checklist; each row shows type, port, and a per-type action:
  - `api-graphql` → URL + "Open Playground" button.
  - `api-mcp` → URL + "Copy MCP config" button (copies a JSON snippet for Claude Desktop / MCP clients).
  - `website` → URL + "Visit" button.
- **Env vars** — table with +/- rows.
- **Save** / **Cancel** at the bottom-right. Save is disabled when no pending changes; on click dispatches `SET_SERVICE_CONFIG(prefix, config)` with optimistic update.
- **Disable agent** at the bottom-left, separated, destructive variant. Dispatches `DISABLE_SERVICE`.

### 7.5 Endpoint URL composition

Default: `https://{prefix}.{genericSubdomain}.{genericBaseDomain}/{endpoint.id}`.
If the service `url` is populated by observability, vetra.to uses it directly and appends `/{endpoint.id}`. If a future schema extension provides per-endpoint resolved URLs, vetra.to prefers those (forward compatible).

The composer is a small pure function (`modules/cloud/lib/clint-endpoint-url.ts`) that accepts the service, endpoint, and env metadata and returns the URL — easy to unit-test.

## 8. Components & hooks

### 8.1 New files

```
modules/cloud/
├── components/
│   ├── agents-section.tsx        — list + empty state + "Add Agent" CTA
│   ├── agent-card.tsx            — collapsed + expanded; owns its edit form state
│   ├── enable-clint-modal.tsx    — combined enable + configure
│   ├── endpoint-row.tsx          — per-type rendering
│   ├── resource-size-picker.tsx  — reusable; filters by supportedResources
│   └── env-vars-editor.tsx       — reusable; key/value rows, +/- buttons
├── hooks/
│   ├── use-clint-packages.ts     — filters env.packages by manifest type, fetches manifests in parallel
│   ├── use-enable-clint.ts       — wraps extended ENABLE_SERVICE + optimistic update
│   └── use-update-clint-config.ts — wraps SET_SERVICE_CONFIG + optimistic update
└── lib/
    └── clint-endpoint-url.ts     — URL composition helper
```

### 8.2 Existing files to edit

```
modules/cloud/types.ts                     — add CLINT to enum + mirror config types
modules/cloud/config/types.ts              — extend PackageManifest Zod schema
modules/cloud/components/service-card.tsx  — add Bot icon to SERVICE_ICONS (defensive)
app/cloud/[project]/page.tsx               — insert <AgentsSection /> between Services and Packages
package.json                               — bump @powerhousedao/* deps
```

The regular `service-card` never renders CLINT services at runtime — they go through `agent-card` exclusively. The icon entry is defensive in case a CLINT service is rendered through the legacy code path.

## 9. Sequencing & rollout

1. **vetra-cloud-package PR-1** — pull dev cleanly, restore accidentally-removed fields, then add the CLINT extensions: config sub-fields (`package`, `env`), `VetraCloudServiceEnv` type, extended `EnableServiceInput`, `SET_SERVICE_CONFIG` op + reducer.
2. **vetra-cloud-package PR-2** — version bump, publish dev-channel image.
3. **vetra.to PR-1** — bump dep, run codegen, add types/Zod, register `Bot` in `SERVICE_ICONS`. No UI yet — keeps `main` green.
4. **vetra.to PR-2** — `<AgentsSection />`, `enable-clint-modal`, `agent-card`, hooks. Either ships behind a feature flag for staged rollout or merges directly.

If the vetra-cloud-package mutations slip past the vetra.to PR-2 timeline, vetra.to PR-2 falls back to read-only: render `config` if present, no edit. The optimistic-update hooks become no-ops; the form is hidden. This is the contingency path; the planned path is full edit at PR-2.

## 10. Testing

### 10.1 Unit / component (Vitest + RTL)

- `clint-endpoint-url.test.ts` — URL composition for all 3 endpoint types, with/without service `url`, with/without subdomain.
- `resource-size-picker.test.tsx` — filters by `supportedResources`, defaults to smallest.
- `env-vars-editor.test.tsx` — add/remove rows, dedupe on submit, empty-name rejected.
- `enable-clint-modal.test.tsx` — empty state when no clint packages, prefix uniqueness validation, default-checked endpoints from manifest, submit payload shape.
- `agent-card.test.tsx` — collapsed shows summary, expanded shows form, save dispatches with right payload, optimistic update applies, error rolls back.
- `endpoint-row.test.tsx` — graphql shows playground link, mcp shows copy button + correct JSON, website shows visit button.

### 10.2 Hooks

- `use-clint-packages.test.ts` — filters by manifest type, returns empty when none, surfaces per-package manifest-fetch errors without breaking the list.

### 10.3 Storybook

- `agent-card.stories.tsx` — collapsed/expanded × status states (PROVISIONING/ACTIVE/SUSPENDED/BILLING_ISSUE).
- `enable-clint-modal.stories.tsx` — empty packages, one package, multi-package.
- `endpoint-row.stories.tsx` — one per type, plus disabled state.

### 10.4 E2E (Playwright, smoke level)

- Open env detail → Add Agent → fill form → submit → card appears with PROVISIONING.
- Expand card → toggle endpoint → save → optimistic flip + persisted.
- Disable agent → card removed.
- Auth/signer flow is covered by existing tests; not duplicated.

## 11. Verification before declaring complete

- `npm run tsc` — clean.
- `npm run lint` — clean.
- `npm run codegen` — clean (after vetra-cloud-package bump).
- `npm run test` — all green, including new specs.
- `npm run dev` — manual smoke test in browser:
  - With no clint packages installed, Agents section shows the empty state.
  - Install a clint-project package locally; it appears in the modal package picker.
  - Enable + configure: card appears, status reconciles to ACTIVE.
  - Edit config: changes persist; optimistic UX feels right.
  - All three endpoint types render correctly with their per-type affordances.

## 12. Open risks

- **`useRegistryManifest` field passthrough** — verify the existing fetcher (and `/api/registry/*` routes) does not strip unknown manifest fields when normalizing. If it does, extend it to whitelist the clint fields.
- **Prefix collisions across CLINT services** — frontend validates uniqueness at submit; backend reducer should also reject. Confirm in the vetra-cloud-package PR.
- **Manifest evolution** — `endpoints[]` shape may grow new fields (auth modes, scopes). The Zod schema uses `passthrough()` to remain forward-compatible; renderers default to safe behavior on unknown variants.
- **Optimistic update divergence** — if `SET_SERVICE_CONFIG` reducer rejects (e.g., invalid env var name), the optimistic state must roll back. Hooks rely on the existing `use-optimistic` pattern in the cloud module.
