# Renown-Signed Actions for vetra.to — Design Spec

## Summary

Replace bearer-token GraphQL mutations on `vetra-cloud-environment` documents with signed actions via `RemoteDocumentController` from `@powerhousedao/reactor-browser`. Every action that mutates a document is signed by the user's Renown signer so switchboard can record an audit trail of who did what.

This supersedes PR #19 (`feat/renown-integration` → `feat/cloud-env`), which was written against an older snapshot of `app/cloud/`. The pattern is reapplied directly on current `staging`.

## Goals

- Every document mutation in vetra.to is signed via the user's Renown signer
- Switchboard records signed operation context for every mutation (audit trail of who did what)
- Mutation UI is disabled when the user is not logged in
- Single shared controller per environment detail page (no duplicate pulls/state)
- New environment creation works in a single signed batch

## Non-Goals

- Read-only queries (observability, metrics, logs) — these stay as plain GraphQL, no signing needed
- Renown login flow itself — already in place, not modified
- Backend changes to switchboard — it already accepts signed actions
- Other document models — vetra.to only mutates `vetra-cloud-environment`

## Architecture

```
User clicks "Save" in any cloud UI
  ↓
Component reads controller from EnvironmentControllerContext
  ↓
controller.someAction(input)   ← stages action locally (mode: 'batch')
  ↓
controller.push()              ← signs each action via Renown signer, POSTs to switchboard
  ↓
Switchboard records signed operation
  ↓
Controller emits onChange → React state updates
```

For new documents, the same pattern, except the controller starts without a documentId. The first `push()` calls `ensureRemoteDocument` to create the doc, then pushes signed actions.

## Component Map

```
modules/cloud/
├── client.ts                          # NEW: ReactorGraphQLClient + DRIVE_ID constants
├── controller.ts                      # NEW: VetraCloudEnvironmentController factory functions
├── providers/
│   └── environment-controller-provider.tsx  # NEW: page-level React Context
├── hooks/
│   ├── use-environment-controller.ts  # NEW: load existing doc into controller
│   ├── use-create-environment.ts      # NEW: batch controller for new doc
│   ├── use-can-sign.ts                # NEW: returns { canSign, signer, loading }
│   ├── use-environment-detail.ts      # REMOVED — replaced by controller
│   ├── use-environment.ts             # KEEP (read-only, GraphQL)
│   ├── use-environment-status.ts      # KEEP (read-only, observability)
│   ├── use-environment-events.ts      # KEEP (read-only, observability)
│   ├── use-environment-logs.ts        # KEEP (read-only, observability)
│   └── use-environment-metrics.ts     # KEEP (read-only, observability)
├── components/
│   └── require-signer.tsx             # NEW: wraps mutation UI, shows login CTA if no signer
├── graphql.ts                         # MODIFIED: keep queries + delete, REMOVE mutation functions
├── api.ts                             # NEW: thin findDocuments wrapper for list view
└── types.ts                           # KEEP

app/cloud/
├── new-project-form.tsx               # MODIFIED: use useCreateEnvironment
├── new-project-modal-button.tsx       # MODIFIED: gated by useCanSign
├── cloud-projects.tsx                 # MODIFIED: signed delete via one-off controller
├── [project]/
│   ├── page.tsx                       # MODIFIED: wraps in EnvironmentControllerProvider
│   └── tabs/
│       └── overview.tsx               # MODIFIED: consume controller from context
└── new/server/[project]/page.tsx      # MODIFIED: minor wiring update
```

## Module APIs

### `modules/cloud/client.ts`

```typescript
import { createClient } from '@powerhousedao/reactor-browser'
import { env } from '@/modules/shared/config/env'

export const client = createClient(env.NEXT_PUBLIC_CLOUD_SWITCHBOARD_URL)
export const DRIVE_ID = env.NEXT_PUBLIC_CLOUD_DRIVE_ID
```

### `modules/cloud/controller.ts`

Factory functions returning controller instances. Two flavors:

```typescript
import type { ISigner } from 'document-model'
import { PHDocumentController } from 'document-model'
import { RemoteDocumentController } from '@powerhousedao/reactor-browser'
import { VetraCloudEnvironment } from '@powerhousedao/vetra-cloud-package/document-models'
import type {
  VetraCloudEnvironmentAction,
  VetraCloudEnvironmentPHState,
} from '@powerhousedao/vetra-cloud-package/document-models/vetra-cloud-environment'
import { client, DRIVE_ID } from './client'

const VetraCloudEnvironmentController = PHDocumentController.forDocumentModel<
  VetraCloudEnvironmentPHState,
  VetraCloudEnvironmentAction
>(VetraCloudEnvironment)

export type EnvironmentController = Awaited<ReturnType<typeof loadEnvironmentController>>

/** Load an existing document and wrap it for signed pushes. */
export function loadEnvironmentController(options: { documentId: string; signer: ISigner }) {
  return RemoteDocumentController.pull(VetraCloudEnvironmentController, {
    client,
    documentId: options.documentId,
    mode: 'batch',
    parentIdentifier: DRIVE_ID,
    signer: options.signer,
  })
}

/** Create a controller for a new (not-yet-persisted) document. */
export function createNewEnvironmentController(options: { signer: ISigner }) {
  const inner = new VetraCloudEnvironmentController()
  return RemoteDocumentController.from(inner, {
    client,
    mode: 'batch',
    parentIdentifier: DRIVE_ID,
    signer: options.signer,
  })
}
```

### `modules/cloud/hooks/use-can-sign.ts`

```typescript
'use client'
import { useRenown, useRenownAuth } from '@powerhousedao/reactor-browser'
import type { ISigner } from 'document-model'

export type CanSignResult = {
  canSign: boolean
  signer: ISigner | null
  loading: boolean
}

export function useCanSign(): CanSignResult {
  const renown = useRenown()
  const auth = useRenownAuth()
  const loading = auth.status === 'loading' || auth.status === 'checking'
  const signer = renown?.signer ?? null
  return { canSign: !!signer && !loading, signer, loading }
}
```

### `modules/cloud/hooks/use-environment-controller.ts`

```typescript
'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { VetraCloudEnvironmentState } from '@powerhousedao/vetra-cloud-package/document-models/vetra-cloud-environment'
import { loadEnvironmentController, type EnvironmentController } from '../controller'
import { useCanSign } from './use-can-sign'

export type UseEnvironmentControllerResult = {
  controller: EnvironmentController | null
  state: VetraCloudEnvironmentState | null
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
}

export function useEnvironmentController(
  documentId: string | null,
): UseEnvironmentControllerResult {
  const { signer } = useCanSign()
  const controllerRef = useRef<EnvironmentController | null>(null)
  const [state, setState] = useState<VetraCloudEnvironmentState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!signer || !documentId) {
      setIsLoading(false)
      return
    }
    let cancelled = false
    let unsubscribe: (() => void) | undefined
    ;(async () => {
      try {
        setIsLoading(true)
        setError(null)
        const ctrl = await loadEnvironmentController({ documentId, signer })
        if (cancelled) return
        controllerRef.current = ctrl
        setState(ctrl.state.global)
        unsubscribe = ctrl.onChange(() => setState(ctrl.state.global))
        setIsLoading(false)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err : new Error('Failed to load environment'))
        setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
      unsubscribe?.()
      controllerRef.current = null
    }
  }, [documentId, signer])

  const refresh = useCallback(async () => {
    if (controllerRef.current) {
      await controllerRef.current.pull()
    }
  }, [])

  return {
    controller: controllerRef.current,
    state,
    isLoading,
    error,
    refresh,
  }
}
```

### `modules/cloud/hooks/use-create-environment.ts`

```typescript
'use client'
import { useCallback } from 'react'
import { createNewEnvironmentController } from '../controller'
import { useCanSign } from './use-can-sign'

export type CreateEnvironmentInput = {
  label: string
  subdomain: string
  baseDomain: string
  defaultPackageRegistry?: string
  enabledServices: Array<{ type: 'CONNECT' | 'SWITCHBOARD'; prefix?: string }>
}

export type CreateEnvironmentResult = {
  documentId: string
}

/** Returns a function that creates+initializes a new environment in a single signed batch. */
export function useCreateEnvironment() {
  const { signer, canSign } = useCanSign()
  return useCallback(
    async (input: CreateEnvironmentInput): Promise<CreateEnvironmentResult> => {
      if (!signer) throw new Error('You must be logged in with Renown to create an environment')
      const controller = createNewEnvironmentController({ signer })
      controller.setLabel({ label: input.label })
      controller.initialize({
        subdomain: input.subdomain,
        baseDomain: input.baseDomain,
        defaultPackageRegistry: input.defaultPackageRegistry ?? null,
      })
      for (const svc of input.enabledServices) {
        controller.enableService({ type: svc.type, prefix: svc.prefix ?? null })
      }
      const result = await controller.push()
      return { documentId: result.remoteDocument.id }
    },
    [signer],
  )
}
```

The exact action names and inputs are defined by the `vetra-cloud-environment` document model — adjusted to match its actual action signatures during implementation.

### `modules/cloud/providers/environment-controller-provider.tsx`

```typescript
'use client'
import { createContext, useContext } from 'react'
import { useEnvironmentController, type UseEnvironmentControllerResult } from '../hooks/use-environment-controller'

const EnvironmentControllerContext = createContext<UseEnvironmentControllerResult | null>(null)

export function EnvironmentControllerProvider({
  documentId,
  children,
}: {
  documentId: string
  children: React.ReactNode
}) {
  const value = useEnvironmentController(documentId)
  return (
    <EnvironmentControllerContext.Provider value={value}>
      {children}
    </EnvironmentControllerContext.Provider>
  )
}

export function useEnvironmentControllerContext(): UseEnvironmentControllerResult {
  const ctx = useContext(EnvironmentControllerContext)
  if (!ctx) throw new Error('useEnvironmentControllerContext must be used within EnvironmentControllerProvider')
  return ctx
}
```

### `modules/cloud/components/require-signer.tsx`

```typescript
'use client'
import type { ReactNode } from 'react'
import { useCanSign } from '../hooks/use-can-sign'
import { Button } from '@/modules/shared/components/ui/button'
import { useRenownAuth } from '@powerhousedao/reactor-browser'

/** Wraps mutation UI; shows a "Log in to continue" CTA if the user has no signer. */
export function RequireSigner({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { canSign, loading } = useCanSign()
  const auth = useRenownAuth()

  if (loading) return null
  if (canSign) return <>{children}</>
  if (fallback) return <>{fallback}</>

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-6 text-center">
      <p className="text-sm text-muted-foreground">Log in with Renown to continue.</p>
      <Button onClick={auth.login}>Log in with Renown</Button>
    </div>
  )
}
```

## Mutation Migration Map

Each call site below is transformed from the current bearer-token GraphQL pattern to controller dispatch + push.

| File                                      | Current (bearer token + GraphQL)                                                                                                                                             | New (controller)                                                                                   |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `app/cloud/new-project-form.tsx`          | `await createEnvironment(...); await initializeEnvironment(...); await enableService(...); await setLabel(...)`                                                              | `await useCreateEnvironment()(input)` — single signed batch                                        |
| `app/cloud/[project]/page.tsx` (settings) | calls `setLabel`, `setGenericSubdomain`, `setDefaultPackageRegistry`, `approveChanges` via `useEnvironmentDetail`                                                            | `controller.setLabel(...); await controller.push()` etc., from `useEnvironmentControllerContext()` |
| `app/cloud/[project]/tabs/overview.tsx`   | calls `setCustomDomain`, `enable/disableService`, `add/removePackage`, `setServiceVersion`, `setPackageVersion`, `terminate`, `deleteEnvironment` via `useEnvironmentDetail` | same pattern as above; `terminate` & `delete` use controller                                       |
| `app/cloud/cloud-projects.tsx`            | `await deleteEnvironment(env.id, token)`                                                                                                                                     | `const ctrl = await loadEnvironmentController({ documentId, signer }); await ctrl.delete()`        |

## Login Gate Behavior

- **List page** (`/cloud`) — viewable without login. New-project button gated; clicking when logged out opens Renown login.
- **Detail page** (`/cloud/[project]`) — viewable without login. Tabs render but mutation buttons (save, add package, etc.) wrapped in `<RequireSigner>` or use `useCanSign().canSign` to disable.
- **New project form** — entire form wrapped in `<RequireSigner>`. If not logged in, shows "Log in with Renown to continue".

## Removed / Deprecated Code

- `modules/cloud/hooks/use-environment-detail.ts` — entire file removed
- `modules/cloud/graphql.ts` — mutation functions removed (`createEnvironment`, `setLabel`, `setGenericSubdomain`, `setCustomDomain`, `setDefaultPackageRegistry`, `enableService`, `disableService`, `toggleService`, `addPackage`, `removePackage`, `initializeEnvironment`, `approveChanges`, `terminateEnvironment`, `setServiceVersion`, `setPackageVersion`, `deleteEnvironment`). Read-only queries (e.g. `getEnvironment`, `listEnvironments`) and the `getAuthToken` helper are kept for the queries that still use them.

## Dependencies

Add to `package.json`:

```json
"@powerhousedao/vetra-cloud-package": "*"
```

Resolved via the local workspace at `/home/froid/projects/powerhouse/vetra-cloud-package` (linked, since it's not published at the version we need). Implementation uses pnpm workspace protocol or a `link:../vetra-cloud-package` reference to pick up the unpublished `0.0.3-dev.15` build that matches `document-model@6.0.0-dev.152`.

## Error Handling

- **No signer** — mutation throws `Error('You must be logged in with Renown to <action>')`. Toast displayed. UI gated upstream so this is a defense-in-depth.
- **Push failure** (network / signing) — error from `controller.push()` propagates to caller. Toast displayed via `sonner`. Local controller state remains in pending; user can retry.
- **Conflict** — `RemoteDocumentController` supports `onConflict: 'rebase'`. Default is no resolution; we use `'rebase'` to auto-merge new remote operations and retry.
- **Pull failure on initial load** — `useEnvironmentController` exposes `error` state; page renders error UI.

## Testing Strategy

### Unit (vitest)

- `use-can-sign.test.ts` — verifies signer presence/absence/loading
- `use-environment-controller.test.tsx` — verifies controller is created, onChange fires, cleanup runs (with mocked `loadEnvironmentController`)
- `use-create-environment.test.tsx` — verifies actions are dispatched + push called (with mocked `createNewEnvironmentController`)
- `environment-controller-provider.test.tsx` — context propagation, throws when used outside provider
- `require-signer.test.tsx` — renders children when canSign, shows fallback otherwise

### E2E (Playwright)

One happy-path test: log in via mocked Renown → create new environment → verify it appears in list → open it → set label → verify update persists. Uses `NEXT_PUBLIC_CLOUD_SWITCHBOARD_URL` pointed at a test reactor (or stubbed network).

If running against a real switchboard isn't feasible in CI, the E2E test stubs the `/graphql` endpoint and asserts the request bodies contain signed action payloads (verifying the signing wiring rather than the cryptography itself).

## Out of Scope / Future Work

- Other document models gain signing as they're added to vetra.to
- Sign-in prompts for read-only views (e.g. "log in to see your team's deployments")
- Conflict resolution UX beyond auto-rebase
