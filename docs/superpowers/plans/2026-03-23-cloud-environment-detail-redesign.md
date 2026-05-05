# Cloud Environment Detail Page Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the vetra.to environment detail page into a 5-tab Vercel-inspired cloud dashboard with live status, deployments, logs, and metrics powered by the observability subgraph.

**Architecture:** The existing `page.tsx` (605 lines) is restructured into a thin shell (header + tab router) with five tab components. New data hooks fetch from the observability subgraph using the existing `gql()` helper. New reusable components (StatusBadge, Sparkline, LogViewer, etc.) are created in `modules/cloud/components/`.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v4, Radix UI (Tabs, DropdownMenu, Badge), Lucide icons, existing `gql()` GraphQL helper

**Spec:** `docs/superpowers/specs/2026-03-23-cloud-environment-detail-redesign.md`

---

## File Map

| File                                             | Responsibility                              |
| ------------------------------------------------ | ------------------------------------------- |
| `modules/cloud/types.ts`                         | Extended with observability types           |
| `modules/cloud/graphql.ts`                       | Extended with observability query functions |
| `modules/cloud/tenant-id.ts`                     | `getTenantId()` utility                     |
| `modules/cloud/hooks/use-environment-status.ts`  | Polls status + pods (15s)                   |
| `modules/cloud/hooks/use-environment-events.ts`  | Fetches K8s events                          |
| `modules/cloud/hooks/use-environment-logs.ts`    | Fetches logs (10s refresh)                  |
| `modules/cloud/hooks/use-environment-metrics.ts` | Fetches metrics (30s refresh)               |
| `modules/cloud/components/status-badge.tsx`      | Health/sync status pill                     |
| `modules/cloud/components/service-card.tsx`      | Service row with pod info                   |
| `modules/cloud/components/event-timeline.tsx`    | K8s event list                              |
| `modules/cloud/components/log-viewer.tsx`        | Terminal-style log display                  |
| `modules/cloud/components/sparkline.tsx`         | Lightweight SVG chart                       |
| `modules/cloud/components/metric-card.tsx`       | Chart + title wrapper                       |
| `modules/cloud/components/time-range-picker.tsx` | Time range dropdown                         |
| `app/cloud/[project]/page.tsx`                   | Restructured: thin header + tab router      |
| `app/cloud/[project]/tabs/overview.tsx`          | Overview tab content                        |
| `app/cloud/[project]/tabs/deployments.tsx`       | Deployments tab content                     |
| `app/cloud/[project]/tabs/logs.tsx`              | Logs tab content                            |
| `app/cloud/[project]/tabs/metrics.tsx`           | Metrics tab content                         |
| `app/cloud/[project]/tabs/settings.tsx`          | Settings tab content                        |

---

### Task 1: Types + Tenant ID Utility + Observability GraphQL Queries

**Files:**

- Modify: `modules/cloud/types.ts`
- Create: `modules/cloud/tenant-id.ts`
- Modify: `modules/cloud/graphql.ts`

- [ ] **Step 1: Add observability types to `modules/cloud/types.ts`**

Append these types after the existing ones:

```typescript
// Observability types (from vetra-cloud-observability subgraph)

export type ArgoSyncStatus = 'SYNCED' | 'OUT_OF_SYNC' | 'UNKNOWN'
export type ArgoHealthStatus = 'HEALTHY' | 'DEGRADED' | 'PROGRESSING' | 'MISSING' | 'UNKNOWN'
export type PodPhase = 'RUNNING' | 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'UNKNOWN'
export type EventType = 'NORMAL' | 'WARNING'
export type TenantService = 'CONNECT' | 'SWITCHBOARD'
export type MetricRange =
  | 'ONE_MIN'
  | 'FIVE_MIN'
  | 'FIFTEEN_MIN'
  | 'ONE_HOUR'
  | 'SIX_HOURS'
  | 'TWENTY_FOUR_HOURS'

export type EnvironmentStatus = {
  tenantId: string
  argoSyncStatus: ArgoSyncStatus
  argoHealthStatus: ArgoHealthStatus
  argoLastSyncedAt: string | null
  argoMessage: string | null
  configDriftDetected: boolean
  tlsCertValid: boolean | null
  tlsCertExpiresAt: string | null
  domainResolves: boolean | null
  updatedAt: string
}

export type Pod = {
  name: string
  service: TenantService | null
  phase: PodPhase
  ready: boolean
  restartCount: number
  updatedAt: string
}

export type KubeEvent = {
  type: EventType
  reason: string
  message: string
  involvedObject: string
  timestamp: string
}

export type MetricSeries = {
  label: string
  datapoints: Datapoint[]
}

export type Datapoint = {
  timestamp: number
  value: number
}

export type LogEntry = {
  timestamp: number
  line: string
}
```

- [ ] **Step 2: Create `modules/cloud/tenant-id.ts`**

```typescript
export function getTenantId(subdomain: string, documentId: string): string {
  const shortId = documentId.replace(/-/g, '').slice(0, 8)
  return `${subdomain}-${shortId}`
}
```

- [ ] **Step 3: Add observability query functions to `modules/cloud/graphql.ts`**

Append after the existing mutation functions:

```typescript
// ---------------------------------------------------------------------------
// Observability queries (vetra-cloud-observability subgraph)
// ---------------------------------------------------------------------------

export async function fetchEnvironmentStatus(
  tenantId: string,
  token?: string | null,
): Promise<EnvironmentStatus | null> {
  const data = await gql<{ environmentStatus: EnvironmentStatus | null }>(
    `query ($tenantId: String!) {
      environmentStatus(tenantId: $tenantId) {
        tenantId argoSyncStatus argoHealthStatus argoLastSyncedAt
        argoMessage configDriftDetected tlsCertValid tlsCertExpiresAt
        domainResolves updatedAt
      }
    }`,
    { tenantId },
    token,
  )
  return data.environmentStatus
}

export async function fetchEnvironmentPods(
  tenantId: string,
  token?: string | null,
): Promise<Pod[]> {
  const data = await gql<{ environmentPods: Pod[] }>(
    `query ($tenantId: String!) {
      environmentPods(tenantId: $tenantId) {
        name service phase ready restartCount updatedAt
      }
    }`,
    { tenantId },
    token,
  )
  return data.environmentPods
}

export async function fetchEnvironmentEvents(
  tenantId: string,
  limit?: number,
  token?: string | null,
): Promise<KubeEvent[]> {
  const data = await gql<{ environmentEvents: KubeEvent[] }>(
    `query ($tenantId: String!, $limit: Int) {
      environmentEvents(tenantId: $tenantId, limit: $limit) {
        type reason message involvedObject timestamp
      }
    }`,
    { tenantId, limit },
    token,
  )
  return data.environmentEvents
}

export async function fetchMetrics(
  tenantId: string,
  range: MetricRange,
  token?: string | null,
): Promise<{
  cpu: MetricSeries[]
  memory: MetricSeries[]
  requestRate: MetricSeries[]
  latency: MetricSeries[]
}> {
  const data = await gql<{
    cpuUsage: MetricSeries[]
    memoryUsage: MetricSeries[]
    httpRequestRate: MetricSeries[]
    httpLatency: MetricSeries[]
  }>(
    `query ($tenantId: String!, $range: MetricRange) {
      cpuUsage(tenantId: $tenantId, range: $range) { label datapoints { timestamp value } }
      memoryUsage(tenantId: $tenantId, range: $range) { label datapoints { timestamp value } }
      httpRequestRate(tenantId: $tenantId, range: $range) { label datapoints { timestamp value } }
      httpLatency(tenantId: $tenantId, range: $range) { label datapoints { timestamp value } }
    }`,
    { tenantId, range },
    token,
  )
  return {
    cpu: data.cpuUsage,
    memory: data.memoryUsage,
    requestRate: data.httpRequestRate,
    latency: data.httpLatency,
  }
}

export async function fetchLogs(
  tenantId: string,
  service: TenantService | null,
  since: MetricRange,
  limit: number,
  errorsOnly: boolean,
  token?: string | null,
): Promise<LogEntry[]> {
  if (errorsOnly) {
    const data = await gql<{ errorLogs: LogEntry[] }>(
      `query ($tenantId: String!, $since: MetricRange, $limit: Int) {
        errorLogs(tenantId: $tenantId, since: $since, limit: $limit) {
          timestamp line
        }
      }`,
      { tenantId, since, limit },
      token,
    )
    return data.errorLogs
  }

  const data = await gql<{ logs: LogEntry[] }>(
    `query ($tenantId: String!, $service: TenantService, $since: MetricRange, $limit: Int) {
      logs(tenantId: $tenantId, service: $service, since: $since, limit: $limit) {
        timestamp line
      }
    }`,
    { tenantId, service, since, limit },
    token,
  )
  return data.logs
}
```

Also add the new type imports at the top of graphql.ts:

```typescript
import type { ..., EnvironmentStatus, Pod, KubeEvent, MetricSeries, LogEntry, MetricRange, TenantService } from './types'
```

- [ ] **Step 4: Verify it compiles**

Run: `cd /home/froid/projects/powerhouse/vetra.to && npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add modules/cloud/types.ts modules/cloud/tenant-id.ts modules/cloud/graphql.ts
git commit -m "feat(cloud): add observability types, tenant ID utility, and GraphQL queries"
```

---

### Task 2: Observability Data Hooks

**Files:**

- Create: `modules/cloud/hooks/use-environment-status.ts`
- Create: `modules/cloud/hooks/use-environment-events.ts`
- Create: `modules/cloud/hooks/use-environment-logs.ts`
- Create: `modules/cloud/hooks/use-environment-metrics.ts`

- [ ] **Step 1: Create `use-environment-status.ts`**

```typescript
'use client'

import { useRenown } from '@powerhousedao/reactor-browser'
import { useState, useEffect, useCallback } from 'react'
import type { EnvironmentStatus, Pod } from '../types'
import { getAuthToken, fetchEnvironmentStatus, fetchEnvironmentPods } from '../graphql'

export function useEnvironmentStatus(tenantId: string | null) {
  const renown = useRenown()
  const [status, setStatus] = useState<EnvironmentStatus | null>(null)
  const [pods, setPods] = useState<Pod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    if (!tenantId) return
    try {
      const token = await getAuthToken(renown)
      const [s, p] = await Promise.all([
        fetchEnvironmentStatus(tenantId, token),
        fetchEnvironmentPods(tenantId, token),
      ])
      setStatus(s)
      setPods(p)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load status'))
    } finally {
      setIsLoading(false)
    }
  }, [tenantId, renown])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 15_000)
    return () => clearInterval(interval)
  }, [refresh])

  return { status, pods, isLoading, error, refresh }
}
```

- [ ] **Step 2: Create `use-environment-events.ts`**

```typescript
'use client'

import { useRenown } from '@powerhousedao/reactor-browser'
import { useState, useCallback } from 'react'
import type { KubeEvent } from '../types'
import { getAuthToken, fetchEnvironmentEvents } from '../graphql'

export function useEnvironmentEvents(tenantId: string | null, limit = 50) {
  const renown = useRenown()
  const [events, setEvents] = useState<KubeEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    if (!tenantId) return
    try {
      setIsLoading(true)
      const token = await getAuthToken(renown)
      const data = await fetchEnvironmentEvents(tenantId, limit, token)
      setEvents(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load events'))
    } finally {
      setIsLoading(false)
    }
  }, [tenantId, limit, renown])

  // Load once on mount
  useState(() => {
    refresh()
  })

  return { events, isLoading, error, refresh }
}
```

- [ ] **Step 3: Create `use-environment-logs.ts`**

```typescript
'use client'

import { useRenown } from '@powerhousedao/reactor-browser'
import { useState, useEffect, useCallback } from 'react'
import type { LogEntry, MetricRange, TenantService } from '../types'
import { getAuthToken, fetchLogs } from '../graphql'

export function useEnvironmentLogs(
  tenantId: string | null,
  service: TenantService | null,
  range: MetricRange,
  errorsOnly: boolean,
) {
  const renown = useRenown()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    if (!tenantId) return
    try {
      const token = await getAuthToken(renown)
      const data = await fetchLogs(tenantId, service, range, 500, errorsOnly, token)
      setLogs(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load logs'))
    } finally {
      setIsLoading(false)
    }
  }, [tenantId, service, range, errorsOnly, renown])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 10_000)
    return () => clearInterval(interval)
  }, [refresh])

  return { logs, isLoading, error, refresh }
}
```

- [ ] **Step 4: Create `use-environment-metrics.ts`**

```typescript
'use client'

import { useRenown } from '@powerhousedao/reactor-browser'
import { useState, useEffect, useCallback } from 'react'
import type { MetricSeries, MetricRange } from '../types'
import { getAuthToken, fetchMetrics } from '../graphql'

export type Metrics = {
  cpu: MetricSeries[]
  memory: MetricSeries[]
  requestRate: MetricSeries[]
  latency: MetricSeries[]
}

export function useEnvironmentMetrics(tenantId: string | null, range: MetricRange) {
  const renown = useRenown()
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    if (!tenantId) return
    try {
      const token = await getAuthToken(renown)
      const data = await fetchMetrics(tenantId, range, token)
      setMetrics(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load metrics'))
    } finally {
      setIsLoading(false)
    }
  }, [tenantId, range, renown])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 30_000)
    return () => clearInterval(interval)
  }, [refresh])

  return { metrics, isLoading, error, refresh }
}
```

- [ ] **Step 5: Verify it compiles**

Run: `cd /home/froid/projects/powerhouse/vetra.to && npx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
git add modules/cloud/hooks/use-environment-status.ts modules/cloud/hooks/use-environment-events.ts modules/cloud/hooks/use-environment-logs.ts modules/cloud/hooks/use-environment-metrics.ts
git commit -m "feat(cloud): add observability data hooks with polling"
```

---

### Task 3: Reusable UI Components

**Files:**

- Create: `modules/cloud/components/status-badge.tsx`
- Create: `modules/cloud/components/service-card.tsx`
- Create: `modules/cloud/components/event-timeline.tsx`
- Create: `modules/cloud/components/log-viewer.tsx`
- Create: `modules/cloud/components/sparkline.tsx`
- Create: `modules/cloud/components/metric-card.tsx`
- Create: `modules/cloud/components/time-range-picker.tsx`

These are all presentational components — no data fetching, just props in, UI out. Implement each following the existing component patterns in `modules/shared/components/ui/` (Tailwind classes, Radix primitives, Lucide icons).

- [ ] **Step 1: Create `status-badge.tsx`**

A colored pill showing environment health. Props: `argoHealthStatus`, `argoSyncStatus`, `environmentStatus` (STARTED/STOPPED). Derives a label and color:

- Healthy + Synced + Started → green "Healthy"
- Degraded → yellow "Degraded"
- Progressing or OutOfSync → blue pulsing "Syncing"
- Missing or all pods not ready → red "Down"
- STOPPED → gray "Stopped"

Use the existing `Badge` component from `@/modules/shared/components/ui/badge`.

- [ ] **Step 2: Create `service-card.tsx`**

A card row showing a service with pod details. Props: `serviceName`, `label`, `subdomain`, `pods` (filtered to this service), `isEnabled`. Shows: icon, name, pod phase badge, ready dot, restart count (if > 0), service URL link, "Visit" button.

- [ ] **Step 3: Create `event-timeline.tsx`**

A list of K8s events. Props: `events: KubeEvent[]`, `filterWarningsOnly: boolean`. Each row: formatted timestamp, type badge (Normal=gray, Warning=yellow), reason (bold), message, involved object (muted). Include relative time display ("3m ago").

- [ ] **Step 4: Create `log-viewer.tsx`**

Terminal-style log display. Props: `logs: LogEntry[]`, `isLoading: boolean`. Dark background (`bg-gray-950`), monospace font, each line: `HH:mm:ss.SSS  <line text>`. Scrollable container with max-height. Loading skeleton. Empty state.

- [ ] **Step 5: Create `sparkline.tsx`**

Pure SVG line chart. Props: `series: MetricSeries[]`, `width`, `height`, `formatValue` (for tooltip/axis labels). Renders one polyline per series with different colors. Subtle grid lines. No external chart library.

- [ ] **Step 6: Create `metric-card.tsx`**

Wrapper card combining title, current value, and a Sparkline. Props: `title`, `series`, `formatValue`, `unit`. Shows the latest datapoint value prominently.

- [ ] **Step 7: Create `time-range-picker.tsx`**

Dropdown selector for time ranges. Props: `value: MetricRange`, `onChange`. Options: 1m, 5m, 15m, 1h, 6h, 24h. Use the existing `DropdownMenu` component.

- [ ] **Step 8: Verify it compiles**

Run: `cd /home/froid/projects/powerhouse/vetra.to && npx tsc --noEmit`

- [ ] **Step 9: Commit**

```bash
git add modules/cloud/components/
git commit -m "feat(cloud): add reusable observability UI components"
```

---

### Task 4: Tab Components

**Files:**

- Create: `app/cloud/[project]/tabs/overview.tsx`
- Create: `app/cloud/[project]/tabs/deployments.tsx`
- Create: `app/cloud/[project]/tabs/logs.tsx`
- Create: `app/cloud/[project]/tabs/metrics.tsx`
- Create: `app/cloud/[project]/tabs/settings.tsx`

- [ ] **Step 1: Create `overview.tsx`**

Props: `tenantId: string | null`, `environment: CloudEnvironment`. Uses `useEnvironmentStatus(tenantId)`. Contains:

- Status row (3 cards: ArgoCD, Config drift, Domain)
- Services section (one ServiceCard per enabled service, with pods filtered by service)
- Recent Activity (last 5 events from `useEnvironmentEvents(tenantId, 5)`, with "View all" link)

- [ ] **Step 2: Create `deployments.tsx`**

Props: `tenantId: string | null`. Uses `useEnvironmentEvents(tenantId, 50)` and `useEnvironmentStatus(tenantId)`. Contains:

- Sync status banner (if out of sync or drift detected)
- EventTimeline component with warnings-only filter toggle
- Refresh button

- [ ] **Step 3: Create `logs.tsx`**

Props: `tenantId: string | null`, `isStopped: boolean`. Local state for service filter, time range, errors-only toggle. Uses `useEnvironmentLogs(...)`. Contains:

- Controls bar (service dropdown, time range picker, errors checkbox, refresh)
- LogViewer component
- "Start the environment to see logs" message when stopped

- [ ] **Step 4: Create `metrics.tsx`**

Props: `tenantId: string | null`, `isStopped: boolean`. Local state for time range. Uses `useEnvironmentMetrics(tenantId, range)`. Contains:

- Time range picker (top right)
- 2x2 grid of MetricCards (CPU, Memory, Request Rate, Latency)
- Each card uses formatValue appropriate to its unit
- "Start the environment to see metrics" when stopped

- [ ] **Step 5: Create `settings.tsx`**

Props: full `environment`, all mutation handlers from `useEnvironmentDetail`. Contains the current Overview+Settings content reorganized:

- Packages section (AddPackageModal, PackageRow table — move from current page.tsx)
- Services section (ServiceRow toggles — move from current page.tsx)
- Domain section (generic domain display, custom domain coming soon)
- General section (rename form, metadata)
- Danger Zone (delete with confirmation)

Extract `AddPackageModal`, `PackageRow`, `ServiceRow` from current `page.tsx` into this file (or keep as local components).

- [ ] **Step 6: Verify it compiles**

Run: `cd /home/froid/projects/powerhouse/vetra.to && npx tsc --noEmit`

- [ ] **Step 7: Commit**

```bash
git add app/cloud/\\[project\\]/tabs/
git commit -m "feat(cloud): add tab components for overview, deployments, logs, metrics, settings"
```

---

### Task 5: Restructure page.tsx (Header + Tab Router)

**Files:**

- Modify: `app/cloud/[project]/page.tsx` (rewrite)

- [ ] **Step 1: Rewrite `page.tsx`**

Replace the 605-line file with a thin shell:

```typescript
'use client'

import { ArrowLeft, Play, Square, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useState, use, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useSearchParams, useRouter } from 'next/navigation'

import { useEnvironmentDetail } from '@/modules/cloud/hooks/use-environment-detail'
import { useEnvironmentStatus } from '@/modules/cloud/hooks/use-environment-status'
import { generateSubdomain } from '@/modules/cloud/subdomain'
import { getTenantId } from '@/modules/cloud/tenant-id'
import { StatusBadge } from '@/modules/cloud/components/status-badge'
import { Button } from '@/modules/shared/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shared/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/modules/shared/components/ui/dropdown-menu'

import { OverviewTab } from './tabs/overview'
import { DeploymentsTab } from './tabs/deployments'
import { LogsTab } from './tabs/logs'
import { MetricsTab } from './tabs/metrics'
import { SettingsTab } from './tabs/settings'

// ... StartStopButton component (keep from original)

export default function EnvironmentDetailPage({ params }: PageProps) {
  const { project } = use(params)
  const searchParams = useSearchParams()
  const router = useRouter()
  const defaultTab = searchParams.get('tab') || 'overview'

  const detail = useEnvironmentDetail(project)
  const { environment, isLoading } = detail
  const state = environment?.state
  const subdomain = state?.subdomain ?? null
  const tenantId = subdomain && environment ? getTenantId(subdomain, environment.id) : null
  const isStopped = state?.status !== 'STARTED'
  const { status } = useEnvironmentStatus(tenantId)

  // Auto-heal subdomain (keep from original)
  // ...

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  // Header with StatusBadge, Start/Stop, Visit dropdown
  // Tabs: overview, deployments, logs, metrics, settings
  // Each TabsContent renders the corresponding tab component
}
```

The key changes:

- Header now uses `StatusBadge` instead of simple Badge
- "Visit" dropdown with links to Connect/Switchboard URLs
- Tab value synced with `?tab=` search param
- Each tab component receives `tenantId`, `environment`, and relevant handlers
- `AddPackageModal`, `PackageRow`, `ServiceRow`, `StartStopButton` moved to `tabs/settings.tsx` or kept as shared local components

- [ ] **Step 2: Verify it compiles and renders**

Run: `cd /home/froid/projects/powerhouse/vetra.to && npx tsc --noEmit`
Run: `cd /home/froid/projects/powerhouse/vetra.to && pnpm dev` and verify the page loads

- [ ] **Step 3: Commit**

```bash
git add app/cloud/\\[project\\]/page.tsx
git commit -m "feat(cloud): restructure environment detail page with 5-tab layout"
```

---

### Task 6: Final Verification

- [ ] **Step 1: Run typecheck**

Run: `cd /home/froid/projects/powerhouse/vetra.to && npx tsc --noEmit`

- [ ] **Step 2: Run lint**

Run: `cd /home/froid/projects/powerhouse/vetra.to && pnpm lint --fix`

- [ ] **Step 3: Verify dev server**

Run: `cd /home/froid/projects/powerhouse/vetra.to && pnpm dev`

Navigate to `/cloud/{any-environment-id}` and verify:

- Header shows with StatusBadge
- All 5 tabs render without errors
- Overview shows status cards (may be empty if subgraph not deployed yet)
- Logs/Metrics show "Start the environment" for stopped environments
- Settings shows existing package/service management

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix(cloud): lint and type fixes for environment detail redesign"
```

---

## Summary

| Task | Description                       | Key Files                                |
| ---- | --------------------------------- | ---------------------------------------- |
| 1    | Types, tenant ID, GraphQL queries | `types.ts`, `tenant-id.ts`, `graphql.ts` |
| 2    | Data hooks with polling           | `hooks/use-environment-*.ts` (4 files)   |
| 3    | Reusable UI components            | `components/*.tsx` (7 files)             |
| 4    | Tab components                    | `tabs/*.tsx` (5 files)                   |
| 5    | Restructure page.tsx              | `page.tsx` (rewrite)                     |
| 6    | Final verification                | Typecheck, lint, dev server              |
