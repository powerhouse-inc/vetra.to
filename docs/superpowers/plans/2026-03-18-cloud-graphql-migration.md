# Cloud GraphQL Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `@powerhousedao/vetra-cloud-package` controller pattern with direct GraphQL calls to the switchboard, and add subdomain auto-generation so environments deploy to k8s.

**Architecture:** Thin GraphQL client (`modules/cloud/graphql.ts`) wraps typed switchboard mutations. A `useEnvironmentDetail` hook provides query + mutation wrappers for the detail page. Subdomain generator is a pure function copied from vetra-cloud-package.

**Tech Stack:** TypeScript, Next.js, React hooks, fetch-based GraphQL client

**Spec:** `docs/superpowers/specs/2026-03-18-cloud-graphql-migration-design.md`

---

## File Map

| File                                                | Action  | Responsibility                                 |
| --------------------------------------------------- | ------- | ---------------------------------------------- |
| `modules/cloud/types.ts`                            | Rewrite | Local TS types matching GraphQL schema         |
| `modules/cloud/subdomain.ts`                        | Create  | Deterministic subdomain generator              |
| `modules/cloud/graphql.ts`                          | Create  | GraphQL queries + mutations                    |
| `modules/cloud/hooks/use-environment.ts`            | Update  | List environments hook (use graphql.ts)        |
| `modules/cloud/hooks/use-environment-detail.ts`     | Create  | Detail page hook with mutation wrappers        |
| `app/cloud/new-project-form.tsx`                    | Update  | Use graphql.ts + subdomain on create           |
| `app/cloud/[project]/page.tsx`                      | Update  | Use useEnvironmentDetail + subdomain auto-heal |
| `app/cloud/new/server/[project]/page.tsx`           | Update  | Use useEnvironmentDetail for addPackage        |
| `app/cloud/cloud-dashboard.tsx`                     | Update  | Import types from local types.ts               |
| `app/cloud/cloud-projects.tsx`                      | Update  | Use deleteEnvironment from graphql.ts          |
| `modules/cloud/controller.ts`                       | Delete  | Was PHDocumentController setup                 |
| `modules/cloud/hooks/use-environment-controller.ts` | Delete  | Was controller hook                            |
| `modules/cloud/api.ts`                              | Delete  | Merged into graphql.ts                         |
| `modules/cloud/client.ts`                           | Delete  | Endpoint config moves into graphql.ts          |

---

### Task 1: Rewrite types.ts

**Files:**

- Rewrite: `modules/cloud/types.ts`

- [ ] **Step 1: Rewrite types.ts with local types**

Replace the current contents of `modules/cloud/types.ts` with types matching the GraphQL schema. Key changes: add `subdomain`, `customDomain` fields, use union types for `status` and `services`.

```typescript
export type CloudEnvironmentService = 'CONNECT' | 'SWITCHBOARD'
export type CloudEnvironmentStatus = 'STARTED' | 'STOPPED' | 'DEPLOYING'

export type CloudPackage = {
  name: string
  version: string | null
}

export type CloudEnvironmentState = {
  name: string | null
  subdomain: string | null
  customDomain: string | null
  services: CloudEnvironmentService[]
  packages: CloudPackage[] | null
  status: CloudEnvironmentStatus
}

export type CloudEnvironment = {
  id: string
  name: string
  documentType: string
  createdAtUtcIso: string
  lastModifiedAtUtcIso: string
  revision: number
  state: CloudEnvironmentState
}
```

- [ ] **Step 2: Commit**

```
git add modules/cloud/types.ts
git commit -m "refactor(cloud): rewrite types.ts with local types matching GraphQL schema"
```

---

### Task 2: Create subdomain.ts

**Files:**

- Create: `modules/cloud/subdomain.ts`

- [ ] **Step 1: Create subdomain generator**

Copy the `generateSubdomain` function verbatim from `../vetra-cloud-package/shared/subdomain-generator.ts`. This is a pure function with zero dependencies. The exact word lists and hash algorithm must match to produce identical subdomains for existing document IDs.

Source file to copy from: `/home/froid/projects/powerhouse/vetra-cloud-package/shared/subdomain-generator.ts`

- [ ] **Step 2: Commit**

```
git add modules/cloud/subdomain.ts
git commit -m "feat(cloud): add deterministic subdomain generator"
```

---

### Task 3: Create graphql.ts

**Files:**

- Create: `modules/cloud/graphql.ts`

- [ ] **Step 1: Create the GraphQL client module**

This is the core of the migration. Create `modules/cloud/graphql.ts` with:

1. **Config**: Endpoint URL from `NEXT_PUBLIC_CLOUD_SWITCHBOARD_URL` || `NEXT_PUBLIC_SWITCHBOARD_URL`, drive ID from `NEXT_PUBLIC_CLOUD_DRIVE_ID` || `'powerhouse'`

2. **Generic helper**: `gql<T>(query, variables?)` — posts JSON to the endpoint, returns `T`, throws on GraphQL errors.

3. **Shared GraphQL fragments** for the document fields used by both queries and mutation responses:
   - State fragment: `name subdomain customDomain status services packages { name version }`
   - Document fragment: `id name documentType createdAtUtcIso lastModifiedAtUtcIso revisionsList { scope revision } state { global { ...stateFields } }`

4. **Query functions**:
   - `fetchEnvironments()` — uses `VetraCloudEnvironment_findDocuments` with `parentId` from env var. Returns `CloudEnvironment[]`. Maps `items[].state.global` to `state`, extracts revision from `revisionsList`.
   - `fetchEnvironment(id)` — uses `VetraCloudEnvironment_document`. Returns `CloudEnvironment | null`. The response shape is `{ document: { ...fields } }`.

5. **Mutation functions** — all take `docId` + action-specific args, return updated `CloudEnvironment`:
   - `createEnvironment(name: string)` — uses `VetraCloudEnvironment_createDocument(name, parentIdentifier)`. Note: no `docId` arg, uses `parentIdentifier` from env var.
   - `setEnvironmentName(docId, name)`
   - `setSubdomain(docId, subdomain)`
   - `enableService(docId, serviceName)` / `disableService(docId, serviceName)`
   - `addPackage(docId, packageName, version?)` / `removePackage(docId, packageName)`
   - `startEnvironment(docId)` / `stopEnvironment(docId)` — input is `{ _placeholder: null }`
   - `deleteEnvironment(docId)` — uses the generic `deleteDocument` mutation (check: may need to use `VetraCloudEnvironment_deleteDocument` or the generic `deleteDocument` from the existing `api.ts` pattern)

6. **Response mapper**: A helper function `mapDocument(raw) => CloudEnvironment` that extracts `state.global` to `state` and `revisionsList` to `revision`.

Key API shapes (verified via introspection):

- `findDocuments` returns `{ items: [{ id, name, state: { global: {...} } }] }`
- `document` returns `{ document: { id, name, documentType, createdAtUtcIso, lastModifiedAtUtcIso, revisionsList, state: { global: {...} } } }`
- All mutations return `VetraCloudEnvironmentMutationResult` which has the same shape as the document query result (id, name, state, etc.)

- [ ] **Step 2: Commit**

```
git add modules/cloud/graphql.ts
git commit -m "feat(cloud): add pure GraphQL client for switchboard API"
```

---

### Task 4: Create use-environment-detail.ts hook

**Files:**

- Create: `modules/cloud/hooks/use-environment-detail.ts`

- [ ] **Step 1: Create the hook**

This hook replaces `useEnvironmentController`. It:

1. Fetches the document via `fetchEnvironment(documentId)` on mount
2. Stores the result in `useState<CloudEnvironment | null>`
3. Provides mutation wrappers that call the GraphQL mutation, then update local state from the response
4. Each mutation wrapper: sets loading state, calls graphql function, updates environment state from response, handles errors

```typescript
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { CloudEnvironment, CloudEnvironmentService } from '../types'
import {
  fetchEnvironment,
  setEnvironmentName as gqlSetName,
  setSubdomain as gqlSetSubdomain,
  enableService as gqlEnableService,
  disableService as gqlDisableService,
  addPackage as gqlAddPackage,
  removePackage as gqlRemovePackage,
  startEnvironment as gqlStart,
  stopEnvironment as gqlStop,
} from '../graphql'

export function useEnvironmentDetail(documentId: string) {
  const [environment, setEnvironment] = useState<CloudEnvironment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setIsLoading(true)
        setError(null)
        const env = await fetchEnvironment(documentId)
        if (!cancelled) setEnvironment(env)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err : new Error('Failed to load'))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [documentId])

  // Generic mutation wrapper
  const mutate = useCallback(async (fn: () => Promise<CloudEnvironment>) => {
    const updated = await fn()
    setEnvironment(updated)
  }, [])

  const setName = useCallback(
    (name: string) => mutate(() => gqlSetName(documentId, name)),
    [documentId, mutate],
  )
  const setSubdomain = useCallback(
    (subdomain: string) => mutate(() => gqlSetSubdomain(documentId, subdomain)),
    [documentId, mutate],
  )
  const enableService = useCallback(
    (service: CloudEnvironmentService) => mutate(() => gqlEnableService(documentId, service)),
    [documentId, mutate],
  )
  const disableService = useCallback(
    (service: CloudEnvironmentService) => mutate(() => gqlDisableService(documentId, service)),
    [documentId, mutate],
  )
  const addPackage = useCallback(
    (name: string, version?: string) => mutate(() => gqlAddPackage(documentId, name, version)),
    [documentId, mutate],
  )
  const removePackage = useCallback(
    (name: string) => mutate(() => gqlRemovePackage(documentId, name)),
    [documentId, mutate],
  )
  const start = useCallback(() => mutate(() => gqlStart(documentId)), [documentId, mutate])
  const stop = useCallback(() => mutate(() => gqlStop(documentId)), [documentId, mutate])

  return {
    environment,
    isLoading,
    error,
    setName,
    setSubdomain,
    enableService,
    disableService,
    addPackage,
    removePackage,
    start,
    stop,
  }
}
```

- [ ] **Step 2: Commit**

```
git add modules/cloud/hooks/use-environment-detail.ts
git commit -m "feat(cloud): add useEnvironmentDetail hook with GraphQL mutations"
```

---

### Task 5: Update use-environment.ts hook

**Files:**

- Modify: `modules/cloud/hooks/use-environment.ts`

- [ ] **Step 1: Update imports and fetch call**

Replace `import { fetchEnvironments } from '../api'` with `import { fetchEnvironments } from '../graphql'`.
Replace `import type { CloudEnvironment } from '../types'` (already correct path, but type may need updating).

The rest of the hook logic stays the same — it already returns `CloudEnvironment[]` and uses `useEnvironments()`, `useRefreshEnvironments()`, `useEnvironment(id)`.

- [ ] **Step 2: Commit**

```
git add modules/cloud/hooks/use-environment.ts
git commit -m "refactor(cloud): update use-environment hook to use graphql.ts"
```

---

### Task 6: Update new-project-form.tsx

**Files:**

- Modify: `app/cloud/new-project-form.tsx`

- [ ] **Step 1: Replace controller with GraphQL calls**

Changes:

1. Remove `import { useRenown } from '@powerhousedao/reactor-browser'`
2. Remove `import type { EnvironmentController } from '@/modules/cloud/controller'`
3. Remove `import { createEnvironmentController } from '@/modules/cloud/controller'`
4. Add `import { createEnvironment, setSubdomain, setEnvironmentName } from '@/modules/cloud/graphql'`
5. Add `import { generateSubdomain } from '@/modules/cloud/subdomain'`
6. Remove `const renown = useRenown()` from the component
7. In `handleSubmit`, replace the create path (the `else` branch, when `!controller`):

Old:

```typescript
const ctrl = await createEnvironmentController({ signer: renown?.signer })
ctrl.setEnvironmentName({ name: values.name })
const result = await ctrl.push()
onCreated?.(result.remoteDocument.id)
```

New:

```typescript
const env = await createEnvironment(values.name)
await setSubdomain(env.id, generateSubdomain(env.id))
onCreated?.(env.id)
```

8. For the rename path (when `controller` is provided): this prop type changes. The component needs to accept either a `docId` for rename mode or nothing for create mode. Replace `controller?: EnvironmentController` + `onPush?` with `docId?: string`:

Old rename path:

```typescript
controller.setEnvironmentName({ name: values.name })
await onPush?.()
```

New rename path:

```typescript
await setEnvironmentName(docId!, values.name)
```

Update the props type:

```typescript
type NewEnvironmentFormProps = {
  docId?: string
  initialName?: string
  onCreated?: (id: string) => void
  onSuccess?: () => void
}
```

- [ ] **Step 2: Commit**

```
git add app/cloud/new-project-form.tsx
git commit -m "refactor(cloud): update creation form to use GraphQL + subdomain"
```

---

### Task 7: Update detail page [project]/page.tsx

**Files:**

- Modify: `app/cloud/[project]/page.tsx`

- [ ] **Step 1: Replace controller with useEnvironmentDetail**

This is the largest change. Key modifications:

1. Remove all imports from `@/modules/cloud/controller` and `@/modules/cloud/hooks/use-environment-controller`
2. Add `import { useEnvironmentDetail } from '@/modules/cloud/hooks/use-environment-detail'`
3. Add `import { generateSubdomain } from '@/modules/cloud/subdomain'`
4. In `EnvironmentDetailPage`, replace:
   ```typescript
   const { controller, state, isLoading, push } = useEnvironmentController(project)
   ```
   with:
   ```typescript
   const {
     environment,
     isLoading,
     error,
     setName,
     setSubdomain,
     enableService,
     disableService,
     addPackage,
     removePackage,
     start,
     stop,
   } = useEnvironmentDetail(project)
   ```
5. Replace all `state.xxx` references with `environment?.state.xxx`
6. Replace `controller?.header` references: `environment?.documentType`, `environment?.id`, `environment?.revision`, `environment?.createdAtUtcIso`, `environment?.lastModifiedAtUtcIso`
7. Add subdomain auto-heal with `useRef` guard:

   ```typescript
   const subdomainHealedRef = useRef(false)
   useEffect(() => {
     if (!environment || subdomainHealedRef.current) return
     if (environment.state.subdomain === null) {
       subdomainHealedRef.current = true
       setSubdomain(generateSubdomain(environment.id))
     }
   }, [environment, setSubdomain])
   ```

8. Update `StartStopButton` component: replace `controller: EnvironmentController` prop with `onStart` and `onStop` callbacks.

9. Update `AddPackageModal` component: replace `controller` + `onPush` props with `onAdd: (name: string, version?: string) => Promise<void>`.

10. Update `PackageRow` component: replace `controller` + `onPush` with `onRemove: (name: string) => Promise<void>`.

11. Update `ServiceRow` component: replace `controller` + `onPush` with `onToggle: (enabled: boolean) => Promise<void>`.

12. Update `NewEnvironmentForm` usage in Settings tab: pass `docId={environment.id}` instead of `controller={controller}` + `onPush={push}`.

- [ ] **Step 2: Commit**

```
git add app/cloud/[project]/page.tsx
git commit -m "refactor(cloud): migrate detail page to GraphQL + add subdomain auto-heal"
```

---

### Task 8: Update add package page new/server/[project]/page.tsx

**Files:**

- Modify: `app/cloud/new/server/[project]/page.tsx`

- [ ] **Step 1: Replace controller with useEnvironmentDetail**

1. Remove `import { useEnvironmentController } from '@/modules/cloud/hooks/use-environment-controller'`
2. Add `import { useEnvironmentDetail } from '@/modules/cloud/hooks/use-environment-detail'`
3. Replace:
   ```typescript
   const { controller, state, isLoading, push } = useEnvironmentController(project)
   ```
   with:
   ```typescript
   const { environment, isLoading, addPackage } = useEnvironmentDetail(project)
   ```
4. In `handleSubmit`, replace:
   ```typescript
   controller.addPackage({ packageName: values.packageName, version: values.version || null })
   await push()
   ```
   with:
   ```typescript
   await addPackage(values.packageName, values.version || undefined)
   ```
5. Replace `state?.name || controller?.header.name` with `environment?.state.name || environment?.name`
6. Remove the `if (!controller)` guard — the hook handles loading state

- [ ] **Step 2: Commit**

```
git add app/cloud/new/server/[project]/page.tsx
git commit -m "refactor(cloud): migrate add-package page to GraphQL"
```

---

### Task 9: Update dashboard + projects list

**Files:**

- Modify: `app/cloud/cloud-dashboard.tsx`
- Modify: `app/cloud/cloud-projects.tsx`

- [ ] **Step 1: Update cloud-projects.tsx**

1. Replace `import { deleteDocument } from '@/modules/cloud/api'` with `import { deleteEnvironment } from '@/modules/cloud/graphql'`
2. In `handleDelete`, replace `await deleteDocument(env.id)` with `await deleteEnvironment(env.id)`
3. The type import `import type { CloudEnvironment } from './types'` already re-exports from `@/modules/cloud/types` — this chain still works.

- [ ] **Step 2: Update cloud-dashboard.tsx**

No changes needed — it imports `useEnvironments` from the hook (which we updated in Task 5) and the `CloudEnvironments` component. The type `CloudEnvironment` flows through correctly.

Verify: `cloud-dashboard.tsx` does NOT import from `@/modules/cloud/api` or the package. Confirmed — it only imports `useEnvironments` and UI components.

- [ ] **Step 3: Commit**

```
git add app/cloud/cloud-projects.tsx app/cloud/cloud-dashboard.tsx
git commit -m "refactor(cloud): update project list to use graphql.ts"
```

---

### Task 10: Delete old files + remove package dependency

**Files:**

- Delete: `modules/cloud/controller.ts`
- Delete: `modules/cloud/hooks/use-environment-controller.ts`
- Delete: `modules/cloud/api.ts`
- Delete: `modules/cloud/client.ts`
- Modify: `package.json`

- [ ] **Step 1: Delete old cloud module files**

```bash
rm modules/cloud/controller.ts
rm modules/cloud/hooks/use-environment-controller.ts
rm modules/cloud/api.ts
rm modules/cloud/client.ts
```

- [ ] **Step 2: Remove package dependency**

Remove `@powerhousedao/vetra-cloud-package` from `package.json` dependencies.
Run `pnpm install` to update the lockfile.

- [ ] **Step 3: Verify no remaining imports**

Search for any remaining references to the deleted files or the removed package:

```bash
grep -r "vetra-cloud-package" --include="*.ts" --include="*.tsx" modules/ app/
grep -r "use-environment-controller" --include="*.ts" --include="*.tsx" modules/ app/
grep -r "cloud/controller" --include="*.ts" --include="*.tsx" modules/ app/
grep -r "cloud/api" --include="*.ts" --include="*.tsx" modules/ app/
grep -r "cloud/client" --include="*.ts" --include="*.tsx" modules/ app/
```

All should return zero results (except possibly the types.tsx re-export which is fine).

- [ ] **Step 4: Commit**

```
git add -A modules/cloud/ app/cloud/ package.json pnpm-lock.yaml
git commit -m "refactor(cloud): remove vetra-cloud-package dependency and old controller files"
```

---

### Task 11: Verify build + manual smoke test

- [ ] **Step 1: Run build**

```bash
pnpm build
```

Fix any TypeScript errors. Common issues to watch for:

- Missing imports
- Type mismatches (the old `state` had `status: string`, new has `CloudEnvironmentStatus`)
- Props changes in components that were updated

- [ ] **Step 2: Manual smoke test**

Start dev server and test:

1. Go to `/cloud` — environments list should load
2. Click "Open" on an environment — detail page should load, subdomain should auto-heal if null
3. Try start/stop button
4. Try adding/removing a package
5. Try enabling/disabling a service
6. Create a new environment — should get subdomain set automatically

- [ ] **Step 3: Final commit if any fixes were needed**

```
git add -A
git commit -m "fix(cloud): address build issues from GraphQL migration"
```
