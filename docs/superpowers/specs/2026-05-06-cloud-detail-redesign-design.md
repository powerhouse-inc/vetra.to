# Cloud Environment Detail — Redesign

**Status:** spec, not implemented
**Path:** `app/cloud/[project]/page.tsx` and `modules/cloud/components/*`
**Driver:** the page grew per-feature without a coherent IA. Goal is to make the page legible enough that a non-operator can self-serve: install packages, start agents, manage observability, approve changes.

## Mental model

The cloud env hosts two parallel kinds of things, and only the env-level concerns wrap both:

- **Services** — runtime hosts that come with the env. **Connect**, **Switchboard**, eventually **Fusion**. Each service consumes **packages** as plugins:
  - Connect ← UI packages ("apps")
  - Switchboard ← reactor modules
  - Fusion ← (TBD)
  - Packages never exist outside a service. Removing a service removes its packages.
- **Agents (CLINTs)** — independent pods, one package each, with their own endpoints. Not tied to a service.
- **Env-level** — identity, custom domain, apex, tenant env vars/secrets, activity, danger zone.

An env can be services-only, agents-only, both, or partial (e.g. Switchboard without Connect). The IA must accept all four shapes without looking broken.

## Layout

Top-to-bottom on the env detail page. **Tabs at the env level go away** — they were the wrong abstraction for this product.

1. **HeroCard** — already shipped (#38). Identity, health, custom domain, primary CTA. No change.
2. **Services** — full-width section. Each enabled service renders as its own inline-expanded card showing: status pill, version, channel, the **list of installed packages** (apps for Connect, reactor modules for Switchboard) with per-package edit affordances, and per-service observability buttons (Logs / Metrics / Activity) that open a service-scoped drawer. Empty/disabled service shows a one-line "not deployed" affordance with `[Add Connect]`. Installing a package happens inside its host service card — no global "Install package" button at env level.
3. **Agents** — full-width section, parallel to Services. List of compact cards: avatar, name, prefix, live status, restart count, endpoints summary, "Open" button. Click opens a **per-agent drawer** containing tabs: **Logs / Metrics / Activity / Config**. Agent-level config (resource size, service command, env vars) lives inside the drawer's Config tab; the AgentCard inline expand goes away. Empty: `[Add your first agent]`.
4. **Configuration** — env-level only: custom domain, apex picker (service-only in v1), tenant env vars, secrets. Per-package config moves under each service's package row (manifest-declared keys). Per-agent config moves into the agent drawer.
5. **Activity & Approvals** — single timeline merging: doc-model approvals (pending and resolved), ArgoCD syncs, recent kube events. Pending approvals surface as a banner above the timeline with a `[Review]` action. This replaces the standalone "Recent Activity" card and folds in the deployment events that today live in the Deployments tab.
6. **Danger Zone** — bottom, unchanged behavior.

## Drawer pattern

- One drawer per object (one service, one agent). Right-side slide-out (already a Radix primitive in the project).
- Driven by URL state: `?drawer=service:switchboard` or `?drawer=agent:<prefix>&tab=logs`. Deep-linkable, refresh-stable, back-button closes.
- Drawer contents per kind:
  - **Service drawer** — Logs / Metrics / Activity tabs. No Config tab in v1 (service config = installed packages, edited inline on the service card).
  - **Agent drawer** — Logs / Metrics / Activity / Config tabs.
- Logs/Metrics/Activity inside the drawer reuse the existing `LogViewer`, `MetricCard`, `EventTimeline` components, with their query inputs scoped by service or agent.

## Data layer

- **Logs** — `vetra-cloud-package` schema gains `logs(..., agent: String)`. The resolver translates an agent prefix into a Loki `pod=~` matcher built from `environmentPods` filtered by `agent` label. Existing `service: TenantService` arg stays for backward compat. New error: `INVALID_SCOPE` when both `service` and `agent` are passed.
- **Metrics** — no schema change. Filter `MetricSeries[]` client-side by `label` (the pod name) against the agent's pod-name pattern, derived from `environmentPods` data already on the page.
- **Events** — no schema change. Filter `KubeEvent[].involvedObject` client-side against the agent's pod-name pattern.
- **Per-service** — for both logs and metrics, the existing `service: TenantService` enum already supports Connect/Switchboard scoping. No backend change needed for service-scoped views.
- **Approvals** — no new query in v1. The existing doc-model state already exposes pending change sets via the reactor. Surface count + "Review" link to the existing approval flow.

## Empty / new-env / partial-env states

- Empty Services section → coaching CTA: "This env doesn't run any services yet. [Add Connect]".
- Empty Agents section → coaching CTA: "No agents yet. [Add your first agent]".
- A disabled-but-defined service (e.g. Connect off) → collapsed strip: "Connect: not deployed [Enable]".
- Provisioning → each card shows an inline progress badge ("Provisioning…") with a soft skeleton inside.
- Same page renders all states. The page never branches between "setup view" and "operate view"; the affordance shape changes with content.

## Out of scope for v1

- Agents being apex-able. Apex stays service-only (today's `apexService: TenantService`).
- Fusion service rendering — schema slot is reserved, nothing rendered until Fusion exists.
- New Activity feed types from the doc-model approval reducer — wire the existing approval state, no new audit pipeline.
- Multi-select / bulk actions on agents.

## Migration of existing tabs

| Today                  | Tomorrow                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| Overview tab           | Becomes the page itself                                                                                      |
| Configuration tab      | Env-level config section. Per-package config moves to service cards. Per-agent config moves to agent drawer. |
| Logs tab               | Per-service drawer (Logs tab) and per-agent drawer (Logs tab). No env-wide logs view.                        |
| Deployments tab        | Folded into Activity & Approvals timeline (events) plus per-service/per-agent drawer Activity tab.           |
| Metrics tab            | Per-service drawer (Metrics tab) and per-agent drawer (Metrics tab). No env-wide metrics view.               |
| Available Updates card | Stays where it is — top of the env page above Services.                                                      |
| Auto-Update card       | Folds into the Services section header (auto-update is a service-level setting).                             |
| Recent Activity card   | Replaced by Activity & Approvals.                                                                            |
| Metadata card          | Stays at the bottom near Danger Zone, lower visual weight.                                                   |

## Implementation order

1. Backend: `vetra-cloud-package` — add `agent: String` arg to `logs(...)`. Resolver builds Loki pod-regex from k8s label lookup.
2. Frontend: drawer primitive + URL-state hook (read `?drawer=`/`?tab=`).
3. Frontend: refactor `ServicesSection` (already exists in the form of inline service rows) into the new card-with-packages-inside shape.
4. Frontend: refactor `AgentsSection` to compact cards opening drawers.
5. Frontend: build per-agent and per-service drawer content, reusing `LogViewer`, `MetricCard`, `EventTimeline`.
6. Frontend: collapse Activity & Approvals into one timeline, lift it onto the env page.
7. Frontend: replace `app/cloud/[project]/page.tsx` tabs scaffold with the new top-to-bottom layout. Delete `app/cloud/[project]/tabs/*` once nothing imports them.

Each step is independently shippable behind a feature flag if needed; we have no flag system in place today, so likely a single PR.

## Risks

- **Drawer-on-mobile** — right-side drawers don't always feel right on narrow viewports; we may need them to bottom-sheet on mobile. Doable with a media query.
- **URL state ergonomics** — opening a drawer pushes URL state, which mixes with existing query params (auth callbacks etc.). Ensure we use a single `drawer` key with a serialized value, not multiple keys.
- **Activity timeline source-mixing** — three different event sources (doc-model approvals, kube events, ArgoCD syncs) need a unified shape. We already have most of the data on the page, just not unified.
- **Agent log scoping at the Loki layer** — pods labeled `clint.vetra.io/agent` are not currently promoted to Loki labels via the Alloy config. Backend resolves this by translating agent → pod-name list. A future Alloy relabel would let us drop that translation.
