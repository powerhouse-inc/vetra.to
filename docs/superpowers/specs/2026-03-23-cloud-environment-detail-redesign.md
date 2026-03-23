# Cloud Environment Detail Page Redesign

## Problem

The vetra.to environment detail page shows basic configuration (packages, services, domain) but provides no visibility into what's actually happening in the cluster. Users can't see deployment status, pod health, logs, or resource metrics. The new `vetra-cloud-observability` subgraph now makes all this data available — this spec describes the UI to surface it.

## Goal

Redesign the environment detail page into a Vercel-inspired cloud dashboard with five tabs: Overview, Deployments, Logs, Metrics, and Settings. Status and health are front-and-center. The experience should feel like a modern cloud platform control panel.

## Data Source

All observability data comes from the `vetra-cloud-observability` subgraph running inside the tenant's Switchboard. Queries use `tenantId` (format: `{subdomain}-{first8hexOfDocId}`) as the primary key.

Available queries:

- `environmentStatus(tenantId)` — ArgoCD sync/health, drift detection, TLS/domain health
- `environmentPods(tenantId)` — pod name, phase, ready, restartCount, service classification
- `environmentEvents(tenantId, limit)` — K8s events (Normal/Warning) ordered by timestamp DESC
- `cpuUsage(tenantId, range)` — CPU time-series per pod
- `memoryUsage(tenantId, range)` — memory time-series per pod
- `httpRequestRate(tenantId, range)` — requests/sec by status code
- `httpLatency(tenantId, range)` — p95 latency time-series
- `logs(tenantId, service, since, limit)` — recent logs, optionally filtered by service
- `errorLogs(tenantId, since, limit)` — error-only logs

## Page Layout

### Header (always visible)

- Back arrow + breadcrumb: `Cloud / {environment-name}`
- Environment name (editable inline on click)
- Status pill derived from `environmentStatus`:
  - `Healthy` (green) — argoHealthStatus=HEALTHY and argoSyncStatus=SYNCED
  - `Degraded` (yellow) — argoHealthStatus=DEGRADED
  - `Syncing` (blue pulse) — argoHealthStatus=PROGRESSING or argoSyncStatus=OUT_OF_SYNC
  - `Down` (red) — argoHealthStatus=MISSING or all pods not ready
  - `Stopped` (gray) — document status=STOPPED
- Primary action button: Start (when stopped) / Stop (when started)
- "Visit" dropdown: links to Connect and Switchboard URLs (`https://{service}.{subdomain}.vetra.io`)

### Tab Navigation

Five tabs below the header: **Overview** | **Deployments** | **Logs** | **Metrics** | **Settings**

Tab selection is reflected in the URL via a query parameter (`?tab=logs`) for shareability.

## Tab 1: Overview (Default)

### Status Row

Three compact status cards in a horizontal row:

1. **ArgoCD** — sync status icon + label (`Synced` / `Out of Sync`), health status below, last synced timestamp
2. **Config** — drift detection (`No drift` with checkmark, or `Drift detected` with warning icon), message from ArgoCD if available
3. **Domain** — resolves status (`Resolves` with checkmark or `Not resolving` with X), TLS cert valid/expires info

### Services Section

One card per enabled service (Connect, Switchboard), showing:

- Service name + icon
- Pod phase badge (`Running` green, `Pending` yellow, `Failed` red)
- Ready indicator (green dot if all containers ready)
- Restart count (shown if > 0, yellow text)
- Service URL as clickable link
- "Visit" button

### Recent Activity

Last 5 K8s events from `environmentEvents(tenantId, limit: 5)`:

- Relative timestamp ("3m ago")
- Type badge (Normal = gray, Warning = yellow)
- Reason + message truncated to one line
- "View all" link navigates to Deployments tab

## Tab 2: Deployments

### Sync Status Banner

Shown only when `argoSyncStatus` is `OUT_OF_SYNC` or `configDriftDetected` is true:

- Yellow/orange banner with warning icon
- Message: "Environment is out of sync" or "Configuration drift detected"
- ArgoCD message if available

### Event Timeline

Full event list from `environmentEvents(tenantId, limit: 50)`:

- Each row: timestamp (absolute, formatted), type badge, reason (bold), message, involved object (muted)
- Filter toggle: All / Warnings only
- Empty state: "No recent events"
- Sorted by timestamp descending (most recent first)

## Tab 3: Logs

### Controls Bar

- **Service filter**: dropdown — All / Connect / Switchboard
- **Time range**: dropdown — 1m, 5m, 15m, 1h, 6h, 24h (default: 5m)
- **Errors only**: checkbox toggle (switches between `logs` and `errorLogs` queries)
- **Refresh**: manual refresh button + auto-refresh every 10 seconds

### Log Display

- Monospace font, dark background (similar to terminal)
- Each line: timestamp (HH:mm:ss.SSS) + log line text
- Most recent at top
- Max 500 lines
- Empty state: "No logs in this time range"
- Loading state: skeleton lines

## Tab 4: Metrics

### Time Range Selector

Shared across all charts: 5m, 15m, 1h, 6h, 24h (default: 1h). Positioned top-right of the tab.

### Metric Cards (2x2 Grid)

Each card contains:

- Title + current value (latest datapoint)
- Lightweight SVG sparkline chart (no external chart library)
- One line per series (e.g., per pod for CPU, per status code for request rate)
- Subtle grid lines, axis labels for min/max

| Card          | Query             | Y-axis Format         | Series          |
| ------------- | ----------------- | --------------------- | --------------- |
| CPU Usage     | `cpuUsage`        | Percentage or cores   | Per pod         |
| Memory        | `memoryUsage`     | MB / GB (auto-scaled) | Per pod         |
| Request Rate  | `httpRequestRate` | req/s                 | Per status code |
| Latency (p95) | `httpLatency`     | ms                    | Single line     |

Auto-refresh: every 30 seconds.

Empty state per card: "No data" with muted chart placeholder.

## Tab 5: Settings

Restructured from the current Overview + Settings tabs:

### Packages Section

Current package management UI (table with name/version, add/remove actions). No changes needed — move as-is from current Overview tab.

### Services Section

Connect/Switchboard toggle switches with status indicators. Moved from current Overview tab.

### Domain Section

Current domain display (subdomain read-only, custom domain "coming soon"). No changes needed.

### General Section

- Rename environment (inline form)
- Metadata display: Document ID, type, revision, created/modified dates

### Danger Zone

Red-bordered card at the bottom:

- "Delete Environment" button
- Confirmation dialog with environment name typed to confirm

## Data Layer

### Tenant ID Resolution

The subgraph queries require `tenantId`, not `documentId`. Compute it from the environment's subdomain and document ID:

```typescript
function getTenantId(subdomain: string, documentId: string): string {
  const shortId = documentId.replace(/-/g, '').slice(0, 8)
  return `${subdomain}-${shortId}`
}
```

This is derived once when the environment detail loads (subdomain is in the document state).

### GraphQL Endpoint

Observability queries go to the same Switchboard GraphQL endpoint as existing mutations. The subgraph is registered on the same server — no new endpoint needed.

### New Queries

Add to `modules/cloud/graphql.ts`:

```graphql
environmentStatus(tenantId: String!): EnvironmentStatus
environmentPods(tenantId: String!): [Pod!]!
environmentEvents(tenantId: String!, limit: Int): [KubeEvent!]!
cpuUsage(tenantId: String!, range: MetricRange): [MetricSeries!]!
memoryUsage(tenantId: String!, range: MetricRange): [MetricSeries!]!
httpRequestRate(tenantId: String!, range: MetricRange): [MetricSeries!]!
httpLatency(tenantId: String!, range: MetricRange): [MetricSeries!]!
logs(tenantId: String!, service: TenantService, since: MetricRange, limit: Int): [LogEntry!]!
errorLogs(tenantId: String!, since: MetricRange, limit: Int): [LogEntry!]!
```

### New Hooks

| Hook                                                       | Queries                                 | Polling Interval    |
| ---------------------------------------------------------- | --------------------------------------- | ------------------- |
| `useEnvironmentStatus(tenantId)`                           | `environmentStatus` + `environmentPods` | 15s                 |
| `useEnvironmentEvents(tenantId, limit)`                    | `environmentEvents`                     | Manual refresh only |
| `useEnvironmentLogs(tenantId, service, range, errorsOnly)` | `logs` or `errorLogs`                   | 10s                 |
| `useEnvironmentMetrics(tenantId, range)`                   | All 4 metric queries in parallel        | 30s                 |

Each hook follows the existing pattern: uses `gql()` helper from `modules/cloud/graphql.ts` with auth token from Renown, returns typed data + loading/error states via React Query.

## New Components

| Component         | File                                             | Purpose                                       |
| ----------------- | ------------------------------------------------ | --------------------------------------------- |
| `StatusBadge`     | `modules/cloud/components/status-badge.tsx`      | Colored pill showing health/sync status       |
| `ServiceCard`     | `modules/cloud/components/service-card.tsx`      | Service row with pod info, health, visit link |
| `EventTimeline`   | `modules/cloud/components/event-timeline.tsx`    | Timestamped event list with type badges       |
| `LogViewer`       | `modules/cloud/components/log-viewer.tsx`        | Terminal-style log display                    |
| `Sparkline`       | `modules/cloud/components/sparkline.tsx`         | Lightweight SVG line chart                    |
| `MetricCard`      | `modules/cloud/components/metric-card.tsx`       | Chart + title + current value wrapper         |
| `TimeRangePicker` | `modules/cloud/components/time-range-picker.tsx` | Dropdown for selecting time ranges            |

## File Structure

```
app/cloud/[project]/
  page.tsx                    # Header + tab router (restructured)
  tabs/
    overview.tsx
    deployments.tsx
    logs.tsx
    metrics.tsx
    settings.tsx

modules/cloud/
  components/
    status-badge.tsx
    service-card.tsx
    event-timeline.tsx
    log-viewer.tsx
    sparkline.tsx
    metric-card.tsx
    time-range-picker.tsx
  hooks/
    use-environment-status.ts
    use-environment-events.ts
    use-environment-logs.ts
    use-environment-metrics.ts
  graphql.ts                  # Extended with observability queries
  types.ts                    # Extended with observability types
```

## Styling

Follow existing vetra.to patterns:

- Tailwind CSS v4 with the existing CSS variable theme
- Radix UI primitives (Tabs, DropdownMenu, Switch, Badge) from the shared component library
- Color usage: green (#04c161) for healthy, yellow (#ffa132) for warnings, red (#ea4335) for errors
- Monospace font for log viewer: `font-mono` Tailwind class
- Dark background for log viewer: `bg-gray-950 text-gray-100`
- Sparkline charts: pure SVG, no external chart library. Primary color for lines, muted grid.

## Behavior

### Loading States

- Skeleton loaders for each card/section while data loads
- Individual sections load independently (no full-page loader)
- Stale data shown with subtle opacity reduction while refetching

### Error States

- Per-section error display (not full-page error)
- "Failed to load" with retry button
- Graceful degradation: if observability subgraph is unavailable, show existing document data with a banner: "Live status unavailable"

### Empty States

- Metrics: "No data available" with muted chart placeholder
- Logs: "No logs in this time range"
- Events: "No recent events"
- Pods: shown only for enabled services

### Stopped Environments

When environment status is STOPPED:

- Overview shows "Environment is stopped" state
- Deployments tab still shows historical events
- Logs and Metrics tabs show empty state: "Start the environment to see logs/metrics"
- Settings tab fully functional
