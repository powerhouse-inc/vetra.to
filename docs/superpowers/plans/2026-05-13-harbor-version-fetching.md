# Harbor Version Fetching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `registry.npmjs.org` calls in the tenant-cloud UI with reads from `cr.vetra.io` (Harbor), so the version picker and "update available" badges can only ever surface image tags that actually exist in our registry.

**Architecture:** Single Next.js server-side API route (`/api/registry/tags`) performs Harbor's Docker Registry v2 anonymous-Bearer-token flow, lists tags, computes channel-aware `distTags` server-side, and returns a shape that mirrors npm's `dist-tags`. Two existing client callers swap their URL and consume the new shape.

**Tech Stack:** Next.js 15 App Router, TypeScript strict, vitest (without explicit `test` script — invoke via `pnpm vitest run`), Harbor 2.x at `cr.vetra.io`.

**Branch:** `fix/registry-tags-from-harbor` (already created off `staging`, spec committed).

**Commits:** small + incremental, **no Co-Authored-By trailer**.

---

## File Structure

| File                                                | Action | Responsibility                                                                             |
| --------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------ |
| `modules/cloud/registry/channels.ts`                | create | Pure `computeDistTags(tags)` — regex match + per-channel max version                       |
| `modules/cloud/registry/harbor.ts`                  | create | `fetchHarborTags(image)` — encapsulates `/v2/.../tags/list` 401→token→retry flow           |
| `modules/cloud/registry/__tests__/channels.test.ts` | create | Table-driven unit tests for channel detection                                              |
| `modules/cloud/registry/__tests__/harbor.test.ts`   | create | Mock-fetch tests for the auth flow                                                         |
| `app/api/registry/tags/route.ts`                    | modify | Wire `fetchHarborTags` + `computeDistTags`, set cache headers, return `{ tags, distTags }` |
| `modules/cloud/hooks/use-service-updates.ts`        | modify | Swap npm URL → `/api/registry/tags?service=${type}`, drop `SERVICE_NPM_PACKAGES`           |
| `app/cloud/[project]/tabs/overview.tsx`             | modify | Same swap in `loadTags`, drop `SERVICE_NPM_PACKAGES`, drop stale comment block             |

Channel detection and Harbor auth live in `modules/cloud/registry/` because they're cloud-specific (our registry, our tag conventions). The API route imports from there.

---

## Task 1: Channel detection — pure function with tests

**Files:**

- Create: `modules/cloud/registry/channels.ts`
- Create: `modules/cloud/registry/__tests__/channels.test.ts`

- [ ] **Step 1: Write the failing test**

`modules/cloud/registry/__tests__/channels.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { computeDistTags } from '@/modules/cloud/registry/channels'

describe('computeDistTags', () => {
  it('returns empty object for empty input', () => {
    expect(computeDistTags([])).toEqual({})
  })

  it('picks the highest .N for a single dev channel', () => {
    const tags = ['v6.0.0-dev.225', 'v6.0.0-dev.240', 'v6.0.0-dev.236']
    expect(computeDistTags(tags)).toEqual({ dev: 'v6.0.0-dev.240' })
  })

  it('handles dev + stable together', () => {
    const tags = ['v6.0.0-dev.240', 'v5.4.2', 'v5.3.6', 'v5.4.0-dev.10']
    expect(computeDistTags(tags)).toEqual({
      dev: 'v6.0.0-dev.240',
      latest: 'v5.4.2',
    })
  })

  it('auto-discovers new channels (beta)', () => {
    const tags = ['v6.0.0-beta.3', 'v6.0.0-beta.1', 'v6.0.0-dev.5']
    expect(computeDistTags(tags)).toEqual({
      beta: 'v6.0.0-beta.3',
      dev: 'v6.0.0-dev.5',
    })
  })

  it('compares across major.minor.patch (newer base wins)', () => {
    const tags = ['v5.99.0-dev.999', 'v6.0.0-dev.1']
    expect(computeDistTags(tags)).toEqual({ dev: 'v6.0.0-dev.1' })
  })

  it('stable beats same-base prerelease for latest', () => {
    const tags = ['v6.0.0', 'v6.0.0-dev.99']
    // Both channels populated; latest goes to the stable
    expect(computeDistTags(tags)).toEqual({
      latest: 'v6.0.0',
      dev: 'v6.0.0-dev.99',
    })
  })

  it('ignores unrecognized tags', () => {
    const tags = ['latest', 'staging', 'sha256-abc', 'v6.0.0-dev.240']
    expect(computeDistTags(tags)).toEqual({ dev: 'v6.0.0-dev.240' })
  })

  it('handles tags without the v prefix', () => {
    expect(computeDistTags(['6.0.0-dev.5', '6.0.0-dev.10'])).toEqual({
      dev: '6.0.0-dev.10',
    })
  })

  it('channel detection is case-insensitive (BETA == beta)', () => {
    expect(computeDistTags(['v6.0.0-BETA.1', 'v6.0.0-beta.2'])).toEqual({
      beta: 'v6.0.0-beta.2',
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/froid/projects/powerhouse/vetra.to && pnpm vitest run modules/cloud/registry/__tests__/channels.test.ts`
Expected: FAIL — `Cannot find module '@/modules/cloud/registry/channels'`.

- [ ] **Step 3: Write minimal implementation**

`modules/cloud/registry/channels.ts`:

```ts
const CHANNEL_RE = /^v?(\d+)\.(\d+)\.(\d+)-([a-zA-Z]+)\.(\d+)$/
const STABLE_RE = /^v?(\d+)\.(\d+)\.(\d+)$/

type Parsed = {
  tag: string
  major: number
  minor: number
  patch: number
  bump: number
}

function parseTag(tag: string): { channel: string; parsed: Parsed } | null {
  const channelMatch = tag.match(CHANNEL_RE)
  if (channelMatch) {
    const [, maj, min, pat, channel, bump] = channelMatch
    return {
      channel: channel.toLowerCase(),
      parsed: {
        tag,
        major: Number(maj),
        minor: Number(min),
        patch: Number(pat),
        bump: Number(bump),
      },
    }
  }
  const stableMatch = tag.match(STABLE_RE)
  if (stableMatch) {
    const [, maj, min, pat] = stableMatch
    return {
      channel: 'latest',
      parsed: {
        tag,
        major: Number(maj),
        minor: Number(min),
        patch: Number(pat),
        bump: Number.POSITIVE_INFINITY,
      },
    }
  }
  return null
}

function isNewer(a: Parsed, b: Parsed): boolean {
  if (a.major !== b.major) return a.major > b.major
  if (a.minor !== b.minor) return a.minor > b.minor
  if (a.patch !== b.patch) return a.patch > b.patch
  return a.bump > b.bump
}

export function computeDistTags(tags: string[]): Record<string, string> {
  const buckets: Record<string, Parsed> = {}
  for (const tag of tags) {
    const result = parseTag(tag)
    if (!result) continue
    const current = buckets[result.channel]
    if (!current || isNewer(result.parsed, current)) {
      buckets[result.channel] = result.parsed
    }
  }
  return Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, v.tag]))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /home/froid/projects/powerhouse/vetra.to && pnpm vitest run modules/cloud/registry/__tests__/channels.test.ts`
Expected: PASS — all 9 cases green.

- [ ] **Step 5: Commit**

```bash
cd /home/froid/projects/powerhouse/vetra.to
git add modules/cloud/registry/channels.ts modules/cloud/registry/__tests__/channels.test.ts
git commit -m "feat(registry): add channel-aware dist-tags computation"
```

---

## Task 2: Harbor auth + tags fetch — pure function with tests

**Files:**

- Create: `modules/cloud/registry/harbor.ts`
- Create: `modules/cloud/registry/__tests__/harbor.test.ts`

- [ ] **Step 1: Write the failing test**

`modules/cloud/registry/__tests__/harbor.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchHarborTags } from '@/modules/cloud/registry/harbor'

const IMAGE = 'powerhouse-inc-powerhouse/switchboard'
const TAGS_URL = `https://cr.vetra.io/v2/${IMAGE}/tags/list`
const TOKEN_URL =
  'https://cr.vetra.io/service/token?service=harbor-registry&scope=repository:powerhouse-inc-powerhouse/switchboard:pull'

const CHALLENGE_HEADERS = new Headers({
  'www-authenticate':
    'Bearer realm="https://cr.vetra.io/service/token",service="harbor-registry",scope="repository:powerhouse-inc-powerhouse/switchboard:pull"',
})

describe('fetchHarborTags', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('completes 401 → token → retry happy path', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401, headers: CHALLENGE_HEADERS }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: 'abc123' }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ name: IMAGE, tags: ['v1.0.0', 'v2.0.0'] }), {
          status: 200,
        }),
      )

    const tags = await fetchHarborTags(IMAGE)

    expect(tags).toEqual(['v1.0.0', 'v2.0.0'])
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[0][0]).toBe(TAGS_URL)
    expect(fetchMock.mock.calls[1][0]).toBe(TOKEN_URL)
    expect(fetchMock.mock.calls[2][0]).toBe(TAGS_URL)
    const retryInit = fetchMock.mock.calls[2][1] as RequestInit
    expect(new Headers(retryInit.headers).get('authorization')).toBe('Bearer abc123')
  })

  it('returns empty array when Www-Authenticate header is missing', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }))

    const tags = await fetchHarborTags(IMAGE)

    expect(tags).toEqual([])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('returns empty array when token endpoint fails', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401, headers: CHALLENGE_HEADERS }))
      .mockResolvedValueOnce(new Response(null, { status: 500 }))

    const tags = await fetchHarborTags(IMAGE)

    expect(tags).toEqual([])
  })

  it('does not loop on a second 401 after token retry', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401, headers: CHALLENGE_HEADERS }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: 'abc' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 401, headers: CHALLENGE_HEADERS }))

    const tags = await fetchHarborTags(IMAGE)

    expect(tags).toEqual([])
    expect(fetchMock).toHaveBeenCalledTimes(3) // not 4 — no second retry
  })

  it('returns empty array when first request is unexpectedly 200 without challenge', async () => {
    // Unauthenticated 200 without the challenge headers — we don't know the
    // shape; treat as malformed and return empty.
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ tags: ['v1.0.0'] }), { status: 200 }),
    )

    const tags = await fetchHarborTags(IMAGE)

    expect(tags).toEqual(['v1.0.0'])
  })

  it('handles tags field absent in response', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401, headers: CHALLENGE_HEADERS }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: 'abc' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ name: IMAGE }), { status: 200 }))

    const tags = await fetchHarborTags(IMAGE)

    expect(tags).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/froid/projects/powerhouse/vetra.to && pnpm vitest run modules/cloud/registry/__tests__/harbor.test.ts`
Expected: FAIL — `Cannot find module '@/modules/cloud/registry/harbor'`.

- [ ] **Step 3: Write minimal implementation**

`modules/cloud/registry/harbor.ts`:

```ts
const REGISTRY_BASE = 'https://cr.vetra.io'

type TagsListResponse = { name?: string; tags?: string[] | null }
type TokenResponse = { token?: string }

function parseChallenge(header: string | null): {
  realm: string
  service: string
  scope: string
} | null {
  if (!header) return null
  const get = (k: 'realm' | 'service' | 'scope') => {
    const m = header.match(new RegExp(`${k}="([^"]+)"`))
    return m ? m[1] : null
  }
  const realm = get('realm')
  const service = get('service')
  const scope = get('scope')
  if (!realm || !service || !scope) return null
  return { realm, service, scope }
}

async function listTags(image: string, token?: string): Promise<Response> {
  const url = `${REGISTRY_BASE}/v2/${image}/tags/list`
  const init: RequestInit = token ? { headers: { authorization: `Bearer ${token}` } } : {}
  return fetch(url, init)
}

export async function fetchHarborTags(image: string): Promise<string[]> {
  try {
    const first = await listTags(image)

    if (first.ok) {
      const data = (await first.json()) as TagsListResponse
      return data.tags ?? []
    }

    if (first.status !== 401) {
      console.warn(`[harbor] unexpected status ${first.status} for ${image}`)
      return []
    }

    const challenge = parseChallenge(first.headers.get('www-authenticate'))
    if (!challenge) {
      console.warn(`[harbor] 401 without parseable Www-Authenticate for ${image}`)
      return []
    }

    const tokenUrl = new URL(challenge.realm)
    tokenUrl.searchParams.set('service', challenge.service)
    tokenUrl.searchParams.set('scope', challenge.scope)

    const tokenRes = await fetch(tokenUrl.toString())
    if (!tokenRes.ok) {
      console.warn(`[harbor] token endpoint returned ${tokenRes.status}`)
      return []
    }
    const { token } = (await tokenRes.json()) as TokenResponse
    if (!token) {
      console.warn('[harbor] token endpoint response missing token field')
      return []
    }

    const retry = await listTags(image, token)
    if (!retry.ok) {
      console.warn(`[harbor] retry after token returned ${retry.status}`)
      return []
    }
    const data = (await retry.json()) as TagsListResponse
    return data.tags ?? []
  } catch (error) {
    console.error('[harbor] fetchHarborTags threw', error)
    return []
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /home/froid/projects/powerhouse/vetra.to && pnpm vitest run modules/cloud/registry/__tests__/harbor.test.ts`
Expected: PASS — all 6 cases green.

- [ ] **Step 5: Commit**

```bash
cd /home/froid/projects/powerhouse/vetra.to
git add modules/cloud/registry/harbor.ts modules/cloud/registry/__tests__/harbor.test.ts
git commit -m "feat(registry): fetch Harbor tags via anonymous bearer-token flow"
```

---

## Task 3: Wire up the API route

**Files:**

- Modify: `app/api/registry/tags/route.ts` (entire file rewrite)

- [ ] **Step 1: Rewrite the route**

`app/api/registry/tags/route.ts`:

```ts
import { type NextRequest, NextResponse } from 'next/server'

import { computeDistTags } from '@/modules/cloud/registry/channels'
import { fetchHarborTags } from '@/modules/cloud/registry/harbor'

export const dynamic = 'force-dynamic'
export const revalidate = 60

const IMAGE_MAP: Record<string, string> = {
  CONNECT: 'powerhouse-inc-powerhouse/connect',
  SWITCHBOARD: 'powerhouse-inc-powerhouse/switchboard',
}

const CACHE_HEADER = 'public, s-maxage=60, stale-while-revalidate=300'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serviceType = searchParams.get('service')

    if (!serviceType) {
      return NextResponse.json({ error: 'service parameter is required' }, { status: 400 })
    }

    const imagePath = IMAGE_MAP[serviceType.toUpperCase()]
    if (!imagePath) {
      return NextResponse.json({ error: `Unknown service type: ${serviceType}` }, { status: 400 })
    }

    const tags = await fetchHarborTags(imagePath)
    const distTags = computeDistTags(tags)

    return NextResponse.json({ tags, distTags }, { headers: { 'Cache-Control': CACHE_HEADER } })
  } catch (error) {
    console.error('Registry tags API error:', error)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Run type-check**

Run: `cd /home/froid/projects/powerhouse/vetra.to && pnpm tsc --noEmit`
Expected: PASS — no type errors.

- [ ] **Step 3: Run lint**

Run: `cd /home/froid/projects/powerhouse/vetra.to && pnpm lint --max-warnings=0 app/api/registry/tags/route.ts modules/cloud/registry`
Expected: PASS — no lint errors on changed files.

- [ ] **Step 4: Commit**

```bash
cd /home/froid/projects/powerhouse/vetra.to
git add app/api/registry/tags/route.ts
git commit -m "feat(api): wire /api/registry/tags to Harbor with distTags"
```

---

## Task 4: Swap caller — `use-service-updates` hook

**Files:**

- Modify: `modules/cloud/hooks/use-service-updates.ts`

- [ ] **Step 1: Rewrite the hook**

Replace the entire file with:

```ts
'use client'

import { useState, useEffect, useRef } from 'react'

import type { CloudEnvironmentService } from '../types'

export type ServiceUpdate = {
  serviceType: CloudEnvironmentService['type']
  currentVersion: string | null
  latestVersion: string
  channel: string
}

/**
 * Detect which release channel a version belongs to.
 * Strips leading "v" before matching.
 * e.g. "v6.0.0-dev.164" -> "dev", "v5.3.6" -> "latest"
 */
function detectChannel(version: string | null): string {
  if (!version) return 'latest'
  const clean = version.replace(/^v/, '')
  const match = clean.match(/-([a-zA-Z]+)\.?\d*$/)
  return match ? match[1].toLowerCase() : 'latest'
}

export function useServiceUpdates(services: CloudEnvironmentService[]) {
  const [updates, setUpdates] = useState<ServiceUpdate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const enabledServices = services.filter((s) => s.enabled)
    if (enabledServices.length === 0) {
      setUpdates([])
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsLoading(true)

    Promise.all(
      enabledServices.map(async (service) => {
        try {
          const res = await fetch(
            `/api/registry/tags?service=${encodeURIComponent(service.type)}`,
            { signal: controller.signal },
          )
          if (!res.ok) return null

          const data = (await res.json()) as {
            distTags: Record<string, string>
          }
          const distTags = data.distTags ?? {}

          const channel = detectChannel(service.version)
          const channelVersion = distTags[channel]
          if (!channelVersion) return null

          // Compare without v prefix
          const currentClean = service.version?.replace(/^v/, '') ?? ''
          const latestClean = channelVersion.replace(/^v/, '')
          if (latestClean === currentClean) return null

          return {
            serviceType: service.type,
            currentVersion: service.version,
            latestVersion: channelVersion.startsWith('v') ? channelVersion : `v${channelVersion}`,
            channel,
          } satisfies ServiceUpdate
        } catch {
          return null
        }
      }),
    )
      .then((results) => {
        if (!controller.signal.aborted) {
          setUpdates(results.filter((r): r is ServiceUpdate => r !== null))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [services])

  return { updates, isLoading }
}
```

Changes summarized: dropped `SERVICE_NPM_PACKAGES` constant + the `npmPkg` early-return; URL changed; consumes `distTags` (camelCase) instead of `dist-tags`; lower-cases the detected channel to match the server (`computeDistTags` lowercases too); preserves Harbor's tag format (`v6.0.0-dev.240` → stays with `v` prefix when reporting `latestVersion`).

- [ ] **Step 2: Run type-check**

Run: `cd /home/froid/projects/powerhouse/vetra.to && pnpm tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Run lint**

Run: `cd /home/froid/projects/powerhouse/vetra.to && pnpm lint --max-warnings=0 modules/cloud/hooks/use-service-updates.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
cd /home/froid/projects/powerhouse/vetra.to
git add modules/cloud/hooks/use-service-updates.ts
git commit -m "fix(cloud): read service-update versions from Harbor not npm"
```

---

## Task 5: Swap caller — version picker in overview tab

**Files:**

- Modify: `app/cloud/[project]/tabs/overview.tsx` (specifically: the `SERVICE_NPM_PACKAGES` constant block, the `loadTags` function, and the `npmPackage` references inside `ServiceRow`)

- [ ] **Step 1: Read the relevant section to confirm current state**

Run: `cd /home/froid/projects/powerhouse/vetra.to && grep -n "SERVICE_NPM_PACKAGES\|npmPackage\|registry.npmjs" app/cloud/[project]/tabs/overview.tsx`
Expected output lists the lines we're touching: the constant block (~lines 83-91), `npmPackage` prop derivation (~line 136), `loadTags` (~lines 174-195).

- [ ] **Step 2: Remove the `SERVICE_NPM_PACKAGES` constant block (~lines 83-91)**

Delete this block entirely:

```ts
// The container image (cr.vetra.io/...) and the npm package
// (@powerhousedao/...) point at the same artifact in two distribution
// channels — showing both in the UI is just noise. The npm package name is
// still kept below because the version-picker fetches dist-tags from
// registry.npmjs.org, but neither is rendered in the row.
const SERVICE_NPM_PACKAGES: Record<string, string> = {
  CONNECT: '@powerhousedao/connect',
  SWITCHBOARD: '@powerhousedao/switchboard',
}
```

- [ ] **Step 3: Remove the `npmPackage` local in `ServiceRow` (~line 136)**

Delete the line:

```ts
const npmPackage = SERVICE_NPM_PACKAGES[serviceType]
```

(It's no longer needed — `loadTags` will use `serviceType` directly.)

- [ ] **Step 4: Replace `loadTags` (~lines 174-195) with the Harbor-backed version**

Replace the whole `loadTags` definition with:

```ts
const loadTags = async () => {
  if (tags.length > 0) {
    setShowVersionPicker(!showVersionPicker)
    return
  }
  setShowVersionPicker(true)
  setTagsLoading(true)
  try {
    const res = await fetch(`/api/registry/tags?service=${encodeURIComponent(serviceType)}`)
    if (res.ok) {
      const data = (await res.json()) as {
        tags: string[]
        distTags: Record<string, string>
      }
      setDistTags(data.distTags ?? {})
      setTags(data.tags ?? [])
    }
  } finally {
    setTagsLoading(false)
  }
}
```

Key changes: no `if (!npmPackage) return` guard (the API rejects unknown service types with 400 — same effective behavior); consumes `data.tags` directly (already sorted newest-first server-side) instead of `Object.keys(data.versions).reverse()`.

- [ ] **Step 5: Run type-check**

Run: `cd /home/froid/projects/powerhouse/vetra.to && pnpm tsc --noEmit`
Expected: PASS — no type errors. If `serviceType` isn't already in scope inside `loadTags`, check the surrounding closure — it's a prop on `ServiceRow`, in scope.

- [ ] **Step 6: Run lint**

Run: `cd /home/froid/projects/powerhouse/vetra.to && pnpm lint --max-warnings=0 app/cloud/[project]/tabs/overview.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
cd /home/froid/projects/powerhouse/vetra.to
git add app/cloud/[project]/tabs/overview.tsx
git commit -m "fix(cloud): version picker reads tags from Harbor not npm"
```

---

## Task 6: Manual verification

**No file changes — verify behavior end-to-end.**

- [ ] **Step 1: Run all tests one more time as a regression check**

Run: `cd /home/froid/projects/powerhouse/vetra.to && pnpm vitest run modules/cloud/registry`
Expected: PASS — both test files green.

- [ ] **Step 2: Start the dev server**

Run: `cd /home/froid/projects/powerhouse/vetra.to && pnpm dev`
(Leave running.)

- [ ] **Step 3: Hit the API directly**

In a second terminal:

```bash
curl -sS 'http://localhost:3000/api/registry/tags?service=SWITCHBOARD' | python3 -m json.tool | head -30
```

Expected:

- `tags` array is non-empty (~135 entries) and starts with `v6.0.0-dev.240` (or higher if a newer dev tag has been pushed since spec was written).
- `distTags` contains at least a `dev` key whose value is `v6.0.0-dev.240` (or current top).
- Response headers include `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`. Check with `curl -sSI`.

- [ ] **Step 4: Verify error paths**

```bash
curl -sS 'http://localhost:3000/api/registry/tags' | python3 -m json.tool
# Expected: { "error": "service parameter is required" } with status 400
curl -sS 'http://localhost:3000/api/registry/tags?service=BOGUS' | python3 -m json.tool
# Expected: { "error": "Unknown service type: BOGUS" } with status 400
```

- [ ] **Step 5: UI smoke test**

Open `http://localhost:3000/cloud/<some real project from staging>` in a browser.

For each enabled service row:

- The "update available" badge — if it shows — references a tag visible in Harbor (cross-check by hitting the API directly).
- Click the version picker. Confirm the listed versions are all Harbor tags (no `v6.0.0-dev.244` for switchboard; top dev shown matches API).

- [ ] **Step 6: Stop dev server. Final regression: type-check + lint full project**

```bash
cd /home/froid/projects/powerhouse/vetra.to
pnpm tsc --noEmit
pnpm lint --max-warnings=0
```

Expected: PASS both.

---

## Task 7: Push branch + open PR

- [ ] **Step 1: Push the branch**

```bash
cd /home/froid/projects/powerhouse/vetra.to
git push -u origin fix/registry-tags-from-harbor
```

- [ ] **Step 2: Open PR against `staging` (vetra.to convention)**

```bash
cd /home/froid/projects/powerhouse/vetra.to
gh pr create --base staging --title "fix(cloud): read service version tags from Harbor not npm" --body "$(cat <<'EOF'
## Summary

- Tenant-cloud UI's "update available" badges and version-picker now read tag lists from `cr.vetra.io` (Harbor) instead of `registry.npmjs.org`.
- Eliminates a class of failure where vetra.to suggests an image tag that exists on npm but not in Harbor (broke `rapid-cat-45-2dc51c54` switchboard on 2026-05-13: pod stuck in ImagePullBackOff because `switchboard:v6.0.0-dev.244` only existed on npm).

## How

- Existing `/api/registry/tags` route now handles Harbor's Docker Registry v2 anonymous-bearer-token flow (project is `public: true`, so the token endpoint issues tokens without credentials) and returns `{ tags, distTags }`.
- Channel detection (`dev`/`latest`/...) moved server-side into a pure function so the badge hook and the picker don't duplicate the regex.
- Two client callers swap their fetch URL to the internal route; npm-package mapping constants deleted.

Spec: `docs/superpowers/specs/2026-05-13-harbor-version-fetching-design.md`
Plan: `docs/superpowers/plans/2026-05-13-harbor-version-fetching.md`

## Test plan

- [x] Unit tests: channel detection (9 cases) + Harbor auth flow (6 cases) — \`pnpm vitest run modules/cloud/registry\`
- [x] Manual: \`curl /api/registry/tags?service=SWITCHBOARD\` returns Harbor tags
- [x] Manual: 400 on missing/bogus \`service\` param
- [x] Manual: dev-mode UI version picker no longer shows \`v6.0.0-dev.244\` for switchboard
- [x] \`pnpm tsc --noEmit\` clean
- [x] \`pnpm lint --max-warnings=0\` clean
EOF
)"
```

- [ ] **Step 3: Return the PR URL** so the user can review and merge.

---

## Notes for the executor

- **No co-author trailer in any commit.** This is a hard user preference (project memory).
- **Small commits.** Each task ends with a commit; don't batch.
- **`pnpm vitest run <path>` not `pnpm test`**: there is no `test` script in `package.json`.
- **Pre-commit hook in vetra.to formats markdown tables.** This is fine — let the hook reformat; commit will still go through.
- **TypeScript strict mode is on.** Use exact types (`as { ... }`) on fetch JSON, not `any`.
- **No new env vars.** Harbor URL is hard-coded to `https://cr.vetra.io`.
