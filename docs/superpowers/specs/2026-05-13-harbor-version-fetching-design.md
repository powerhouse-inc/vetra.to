# Switch tenant-cloud version fetching from npm → Harbor

**Status:** approved
**Date:** 2026-05-13
**Author:** brainstormed with Frank

## Problem

The cloud-project UI in vetra.to surfaces "update available" badges and a version-picker dropdown for each running service (CONNECT, SWITCHBOARD). Today both signals are derived from **`registry.npmjs.org`**: vetra.to fetches the npm package's `dist-tags` and `versions` list and assumes container images at `cr.vetra.io` have matching tags.

That assumption broke for tenant `rapid-cat-45-2dc51c54` on 2026-05-13: the UI suggested `v6.0.0-dev.244` for both connect and switchboard. `cr.vetra.io/.../connect:v6.0.0-dev.244` existed; `switchboard:v6.0.0-dev.244` did **not**. The pod went into `ImagePullBackOff`, the ReplicaSet's `Progressing` condition flipped to `ProgressDeadlineExceeded`, and the vetra.to project page rendered an error state.

Root cause: npm publish and Harbor push are independent steps in the CI pipeline; npm can have versions Harbor doesn't (and vice-versa). The UI must read the source of truth that the runtime cluster actually pulls from — Harbor.

## Goals

1. Cloud-project UI never offers an image tag that doesn't exist in `cr.vetra.io`.
2. "Update available" badges reflect the newest tag actually present in Harbor for the tag's channel (dev / latest / etc.).
3. Single source of truth for channel detection — no duplication between the badge hook and the picker.

## Non-goals

- Replacing npm-fetching in the public **packages browser** (`/api/registry/versions/route.ts`, used by `/packages/[id]/page.tsx`). Those are genuinely npm packages, not container images.
- Building a generic OCI registry client. We support exactly the auth flow `cr.vetra.io` exposes (Harbor's anonymous Bearer-token flow for public projects).
- Pagination of `tags/list`. Harbor returns the full list for the project sizes we have today (135 switchboard tags, ~250 connect tags); revisit if a project ever crosses ~1000 tags.

## Architecture

```
┌─────────────────────┐         ┌──────────────────────────┐         ┌─────────────────┐
│  Browser            │         │  vetra.to server         │         │  cr.vetra.io   │
│                     │         │                          │         │                 │
│  use-service-       │ ──GET──▶│  /api/registry/tags      │ ──GET──▶│  /service/token │
│   updates.ts        │         │   ?service=SWITCHBOARD   │ ◀──────│  (anon)         │
│                     │         │                          │         │                 │
│  overview.tsx       │ ──GET──▶│  fetchHarborTags(...)    │ ──GET──▶│  /v2/.../tags/  │
│   (version picker)  │ ◀───────│  computeDistTags(...)    │ ◀──────│   list (bearer) │
│                     │         │  Cache 60s SWR 300s      │         │                 │
└─────────────────────┘         └──────────────────────────┘         └─────────────────┘
```

**New / modified files:**

| File                                         | Action | Purpose                                                 |
| -------------------------------------------- | ------ | ------------------------------------------------------- |
| `app/api/registry/tags/route.ts`             | modify | Wire up auth flow + distTags computation                |
| `lib/registry/harbor.ts`                     | new    | `fetchHarborTags(image)` — encapsulates 401→token→retry |
| `lib/registry/channels.ts`                   | new    | `computeDistTags(tags)` — generic channel discovery     |
| `lib/registry/channels.test.ts`              | new    | unit tests for channel logic                            |
| `lib/registry/harbor.test.ts`                | new    | unit tests for token flow (mocked fetch)                |
| `modules/cloud/hooks/use-service-updates.ts` | modify | swap npm URL → `/api/registry/tags`                     |
| `app/cloud/[project]/tabs/overview.tsx`      | modify | swap npm URL → `/api/registry/tags` in `loadTags`       |

## API contract

```
GET /api/registry/tags?service=<SERVICE_TYPE>
```

`service` is case-insensitive: `CONNECT` | `SWITCHBOARD` (mapped via `IMAGE_MAP` already in the route).

**200 OK:**

```ts
{
  tags: string[],            // all tags, sorted newest-first by channel-aware semver
  distTags: Record<string, string>
                             // e.g., { dev: 'v6.0.0-dev.240', latest: 'v5.4.2' }
}
```

**Error responses:**

| Status | When                                                              | Body                                |
| ------ | ----------------------------------------------------------------- | ----------------------------------- |
| 400    | missing or unknown `service`                                      | `{ error: '...' }`                  |
| 502    | Harbor token endpoint or `/v2` returned non-2xx after token retry | `{ error: 'registry unavailable' }` |
| 500    | unexpected exception                                              | `{ error: 'internal error' }`       |

**Cache:** `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` via `next: { revalidate: 60 }`. New tag visible to UI within at most 60s of push; SWR keeps responses fast during refill.

**Empty tags:** Harbor returning `{ tags: [] }` (e.g., brand-new image) responds `200 { tags: [], distTags: {} }`. Both callers already handle the empty case gracefully — no badge, empty picker.

## Channel detection

`computeDistTags(tags: string[]): Record<string, string>`:

- Match each tag against two regexes:
  - `CHANNEL_RE = /^v?\d+\.\d+\.\d+-([a-zA-Z]+)\.(\d+)$/` → `v6.0.0-dev.240` → channel `dev`, version `(6,0,0,240)`
  - `STABLE_RE  = /^v?\d+\.\d+\.\d+$/` → `v5.4.2` → channel `latest`, version `(5,4,2)`
- Tags matching neither are silently ignored (never surface in UI). Examples: `latest`, raw SHAs, `staging`, `sha256-…`.
- Channels are auto-discovered by suffix: anything matching `-<name>.N` becomes a channel. So `v6.0.0-beta.3` would surface `beta` if present. User chose this generic approach over hard-coding `dev`+`latest`.
- Comparator: `(major, minor, patch, bump)` tuple ordered desc. Bump is `Infinity` for stable tags so any stable beats any prerelease _of the same major.minor.patch_ (matches semver precedence). Across different `major.minor.patch`, plain numeric comparison wins.
- Output: `{ <channel>: <newest tag string in that channel> }`. The newest matched stable tag goes under `latest`.

## Harbor auth flow

`fetchHarborTags(image: string): Promise<string[]>`:

1. `GET https://cr.vetra.io/v2/<image>/tags/list` — expect `401` with `Www-Authenticate: Bearer realm="https://cr.vetra.io/service/token",service="harbor-registry",scope="repository:<image>:pull"`.
2. Parse `realm`, `service`, `scope` from the header (regex `(realm|service|scope)="([^"]+)"`). If parse fails or any field missing → return `[]`.
3. `GET <realm>?service=<service>&scope=<scope>` (no auth — Harbor project is `public: true`, anonymous tokens issued for pull scope) → `{ token: string }`.
4. Retry step 1 with `Authorization: Bearer <token>`. Expect `200 { name, tags: string[] }`. Return `tags`.

Non-recoverable: any unexpected status code on step 1 (200, 403, 5xx) or step 3 (any non-200) returns `[]` and logs. Don't loop on a second 401.

`cr.vetra.io` base URL is hard-coded (no env var). It's our registry, public read, not configurable per-environment. If we ever stand up a staging registry, take that as a refactor signal then.

## Caller refactor

**`modules/cloud/hooks/use-service-updates.ts`:**

```diff
- const npmPkg = SERVICE_NPM_PACKAGES[service.type]
- if (!npmPkg) return null
- const res = await fetch(`https://registry.npmjs.org/${npmPkg}`, { signal: controller.signal })
+ const res = await fetch(`/api/registry/tags?service=${service.type}`, { signal: controller.signal })
  if (!res.ok) return null
  const data = (await res.json()) as {
-   'dist-tags': Record<string, string>
+   distTags: Record<string, string>
  }
- const distTags = data['dist-tags'] ?? {}
+ const distTags = data.distTags ?? {}
```

`SERVICE_NPM_PACKAGES` constant deleted.

**`app/cloud/[project]/tabs/overview.tsx::loadTags`:**

```diff
- const res = await fetch(`https://registry.npmjs.org/${npmPackage}`)
+ const res = await fetch(`/api/registry/tags?service=${serviceType}`)
  if (res.ok) {
    const data = (await res.json()) as {
-     'dist-tags': Record<string, string>
-     versions: Record<string, unknown>
+     distTags: Record<string, string>
+     tags: string[]
    }
-   setDistTags(data['dist-tags'] ?? {})
-   setTags(Object.keys(data.versions ?? {}).reverse())
+   setDistTags(data.distTags ?? {})
+   setTags(data.tags ?? [])
  }
```

`SERVICE_NPM_PACKAGES` constant deleted from this file too. The stale comment block (`// The container image (cr.vetra.io/...) and the npm package ...`) removed.

## Testing

**Unit:**

- `lib/registry/channels.test.ts` — table-driven cases:
  - empty input → `{}`
  - pure dev list (`v6.0.0-dev.{225..240}`) → `{ dev: 'v6.0.0-dev.240' }`
  - mixed dev + stable → both channels populated
  - new channel (`v6.0.0-beta.3`) → `beta` channel surfaces
  - across major.minor.patch (e.g., `v5.99.0-dev.999` + `v6.0.0-dev.1`) → `dev: v6.0.0-dev.1` wins (higher base)
  - stable beats same-base prerelease (`v6.0.0` vs `v6.0.0-dev.99`) → `latest: v6.0.0`
  - unrecognized tags (`latest`, sha hashes, `staging`) → silently ignored
- `lib/registry/harbor.test.ts` — mocked fetch:
  - happy path: 401 → token → 200
  - bad `Www-Authenticate` header → empty result
  - token endpoint failure → empty result
  - tags/list 200 with `{ tags: null }` → empty array
- `app/api/registry/tags/route.test.ts` — mock `fetchHarborTags`, assert response shape + cache headers + 400 on missing/unknown service.

**Manual verification:**

- `pnpm dev`, hit `/api/registry/tags?service=SWITCHBOARD` → top dev tag = `v6.0.0-dev.240` (verified via curl during investigation).
- Open `/cloud/<a real project>` → version picker for switchboard no longer offers `.244`; update badge shows what Harbor actually has.

## Rollout

Single PR to vetra.to `staging`. No feature flag. Worst case: picker shows fewer versions than before (Harbor ⊆ npm), never broken ones. After staging soak, merge to main and ship.

## Risks & non-risks

- **Harbor outage** → API returns 502, both callers fall back to "no update" / empty picker. UI degrades gracefully; tenant-cloud functionality unaffected. Matches today's behavior when npm is down.
- **New channel naming** (e.g., someone tags `v6.0.0-rc.1`) → auto-surfaced as `rc` channel. No code change required, but the picker's channel-tab labels (if any) may need a label-mapping pass. Existing UI seems to treat channels as opaque strings, so probably fine.
- **Non-risk: rate limits.** Harbor has no anonymous rate limit on `/v2`; npm has had outage-via-rate-limit incidents in the past. This is a reliability improvement, not just correctness.
- **Non-risk: latency.** Two extra round-trips (token + tags) happen server-side, totalling ~150ms in cr.vetra.io. With 60s cache, p99 client-observed latency is the cache hit (~5ms).
