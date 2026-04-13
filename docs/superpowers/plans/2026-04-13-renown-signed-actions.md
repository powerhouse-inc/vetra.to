# Renown-Signed Actions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Replace bearer-token GraphQL mutations on `vetra-cloud-environment` with `RemoteDocumentController`-based signed actions across the entire vetra.to app.

**Architecture:** New `modules/cloud/` controller layer wraps `RemoteDocumentController` from `@powerhousedao/reactor-browser`. Page-level Context provider exposes a single controller instance to descendants. New-document creation uses a one-off batch controller. Mutation UI gated by `useCanSign()`.

**Tech Stack:** Next.js 16, React 19, TypeScript 6, `@powerhousedao/reactor-browser@6.0.0-dev.152`, `@powerhousedao/vetra-cloud-package` (linked workspace), Renown SDK, vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-04-13-renown-signed-actions-design.md`

---

## File Structure

### Create

| File                                                               | Responsibility                                                                      |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `modules/cloud/client.ts`                                          | `ReactorGraphQLClient` instance + `DRIVE_ID` constant                               |
| `modules/cloud/controller.ts`                                      | Controller factories: `loadEnvironmentController`, `createNewEnvironmentController` |
| `modules/cloud/hooks/use-can-sign.ts`                              | `useCanSign()` returns `{ canSign, signer, loading }`                               |
| `modules/cloud/hooks/use-environment-controller.ts`                | Loads doc into controller, exposes state + isLoading + error                        |
| `modules/cloud/hooks/use-create-environment.ts`                    | Returns `(input) => { documentId }` for new envs                                    |
| `modules/cloud/providers/environment-controller-provider.tsx`      | React Context wrapping the hook                                                     |
| `modules/cloud/components/require-signer.tsx`                      | Gates mutation UI on `canSign`                                                      |
| `modules/cloud/__tests__/use-can-sign.test.tsx`                    | Unit tests                                                                          |
| `modules/cloud/__tests__/use-environment-controller.test.tsx`      | Unit tests                                                                          |
| `modules/cloud/__tests__/use-create-environment.test.tsx`          | Unit tests                                                                          |
| `modules/cloud/__tests__/environment-controller-provider.test.tsx` | Unit tests                                                                          |
| `modules/cloud/__tests__/require-signer.test.tsx`                  | Unit tests                                                                          |
| `tests/e2e/cloud-signed-actions.spec.ts`                           | Playwright happy-path                                                               |

### Modify

| File                                      | Change                                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------------- |
| `package.json`                            | Add `@powerhousedao/vetra-cloud-package` dep                                    |
| `app/cloud/[project]/page.tsx`            | Wrap content in `EnvironmentControllerProvider`; settings tab uses controller   |
| `app/cloud/[project]/tabs/overview.tsx`   | Use `useEnvironmentControllerContext()` instead of `useEnvironmentDetail`       |
| `app/cloud/new-project-form.tsx`          | Wrap in `<RequireSigner>`, use `useCreateEnvironment()`                         |
| `app/cloud/new-project-modal-button.tsx`  | Disable trigger if `!canSign`                                                   |
| `app/cloud/cloud-projects.tsx`            | Signed delete via one-off controller                                            |
| `app/cloud/new/server/[project]/page.tsx` | Wire to controller (minor)                                                      |
| `modules/cloud/graphql.ts`                | Remove all mutation functions; keep queries, `getAuthToken`, `fetchEnvironment` |

### Delete

| File                                            | Reason                            |
| ----------------------------------------------- | --------------------------------- |
| `modules/cloud/hooks/use-environment-detail.ts` | Replaced by controller-based hook |

---

## Task 1: Dependencies & Setup

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Add `@powerhousedao/vetra-cloud-package` to deps**

Edit `package.json` `dependencies`:

```json
"@powerhousedao/vetra-cloud-package": "link:../vetra-cloud-package",
```

We use a `link:` reference because version `0.0.3-dev.15` (which is built against `document-model@6.0.0-dev.152`) isn't published. The local workspace at `../vetra-cloud-package` has the matching build.

- [ ] **Step 2: Install**

Run: `pnpm install`

Expected: vetra-cloud-package linked successfully. May warn about peer deps; ignore unless critical.

- [ ] **Step 3: Verify import works**

Run: `node -e "console.log(Object.keys(require('@powerhousedao/vetra-cloud-package/document-models')))"`

Expected: outputs `[ 'documentModels' ]` or similar (proves the package resolves).

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "deps: add @powerhousedao/vetra-cloud-package as workspace link"
```

---

## Task 2: Reactor Client Module

**Files:**

- Create: `modules/cloud/client.ts`

- [ ] **Step 1: Inspect existing env config**

Read `modules/shared/config/env.ts` to find the env variable accessors. Confirm `NEXT_PUBLIC_CLOUD_SWITCHBOARD_URL` and `NEXT_PUBLIC_CLOUD_DRIVE_ID` are exported (they are per spec).

- [ ] **Step 2: Create the client module**

Create `modules/cloud/client.ts`:

```typescript
import { createClient } from '@powerhousedao/reactor-browser'
import { env } from '@/modules/shared/config/env'

if (!env.NEXT_PUBLIC_CLOUD_SWITCHBOARD_URL) {
  throw new Error('NEXT_PUBLIC_CLOUD_SWITCHBOARD_URL is required')
}
if (!env.NEXT_PUBLIC_CLOUD_DRIVE_ID) {
  throw new Error('NEXT_PUBLIC_CLOUD_DRIVE_ID is required')
}

export const client = createClient(env.NEXT_PUBLIC_CLOUD_SWITCHBOARD_URL)
export const DRIVE_ID = env.NEXT_PUBLIC_CLOUD_DRIVE_ID
```

If the env import path is different on staging, adjust accordingly (look for the existing `env` export pattern in `modules/cloud/graphql.ts` which already references it).

- [ ] **Step 3: Typecheck**

Run: `npm run tsc`
Expected: no errors related to this file.

- [ ] **Step 4: Commit**

```bash
git add modules/cloud/client.ts
git commit -m "feat(cloud): add reactor graphql client module"
```

---

## Task 3: Controller Factory

**Files:**

- Create: `modules/cloud/controller.ts`

- [ ] **Step 1: Create the controller module**

Create `modules/cloud/controller.ts`:

```typescript
import type { ISigner } from 'document-model'
import { RemoteDocumentController } from '@powerhousedao/reactor-browser'
import { VetraCloudEnvironmentController } from '@powerhousedao/vetra-cloud-package/document-models/vetra-cloud-environment'
import { client, DRIVE_ID } from './client'

export type EnvironmentController = Awaited<ReturnType<typeof loadEnvironmentController>>

/** Load an existing environment document and wrap it for signed pushes. */
export function loadEnvironmentController(options: { documentId: string; signer: ISigner }) {
  return RemoteDocumentController.pull(VetraCloudEnvironmentController, {
    client,
    documentId: options.documentId,
    mode: 'batch',
    parentIdentifier: DRIVE_ID,
    signer: options.signer,
    onConflict: 'rebase',
  })
}

/** Create a controller for a new (not-yet-persisted) environment document. */
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

- [ ] **Step 2: Typecheck**

Run: `npm run tsc`
Expected: no errors. If the `VetraCloudEnvironmentController` import path differs (e.g. needs `/v1`), adjust based on the actual built output.

- [ ] **Step 3: Commit**

```bash
git add modules/cloud/controller.ts
git commit -m "feat(cloud): add environment controller factories"
```

---

## Task 4: useCanSign Hook + Tests

**Files:**

- Create: `modules/cloud/hooks/use-can-sign.ts`
- Create: `modules/cloud/__tests__/use-can-sign.test.tsx`

- [ ] **Step 1: Write the test**

Create `modules/cloud/__tests__/use-can-sign.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCanSign } from '../hooks/use-can-sign'

vi.mock('@powerhousedao/reactor-browser', () => ({
  useRenown: vi.fn(),
  useRenownAuth: vi.fn(),
}))

import { useRenown, useRenownAuth } from '@powerhousedao/reactor-browser'

describe('useCanSign', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns canSign=false and loading=true when auth is loading', () => {
    vi.mocked(useRenown).mockReturnValue(null as never)
    vi.mocked(useRenownAuth).mockReturnValue({ status: 'loading' } as never)
    const { result } = renderHook(() => useCanSign())
    expect(result.current.canSign).toBe(false)
    expect(result.current.loading).toBe(true)
    expect(result.current.signer).toBeNull()
  })

  it('returns canSign=false when not authorized', () => {
    vi.mocked(useRenown).mockReturnValue({ signer: null } as never)
    vi.mocked(useRenownAuth).mockReturnValue({ status: 'unauthorized' } as never)
    const { result } = renderHook(() => useCanSign())
    expect(result.current.canSign).toBe(false)
    expect(result.current.signer).toBeNull()
  })

  it('returns canSign=true when signer is present', () => {
    const fakeSigner = { sign: vi.fn() }
    vi.mocked(useRenown).mockReturnValue({ signer: fakeSigner } as never)
    vi.mocked(useRenownAuth).mockReturnValue({ status: 'authorized' } as never)
    const { result } = renderHook(() => useCanSign())
    expect(result.current.canSign).toBe(true)
    expect(result.current.signer).toBe(fakeSigner)
    expect(result.current.loading).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run modules/cloud/__tests__/use-can-sign.test.tsx`
Expected: FAIL — `use-can-sign` doesn't exist.

- [ ] **Step 3: Implement the hook**

Create `modules/cloud/hooks/use-can-sign.ts`:

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
  return {
    canSign: !!signer && !loading,
    signer,
    loading,
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run modules/cloud/__tests__/use-can-sign.test.tsx`
Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add modules/cloud/hooks/use-can-sign.ts modules/cloud/__tests__/use-can-sign.test.tsx
git commit -m "feat(cloud): add useCanSign hook"
```

---

## Task 5: useEnvironmentController Hook + Tests

**Files:**

- Create: `modules/cloud/hooks/use-environment-controller.ts`
- Create: `modules/cloud/__tests__/use-environment-controller.test.tsx`

- [ ] **Step 1: Write the test**

Create `modules/cloud/__tests__/use-environment-controller.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useEnvironmentController } from '../hooks/use-environment-controller'

vi.mock('../hooks/use-can-sign', () => ({ useCanSign: vi.fn() }))
vi.mock('../controller', () => ({ loadEnvironmentController: vi.fn() }))

import { useCanSign } from '../hooks/use-can-sign'
import { loadEnvironmentController } from '../controller'

const fakeSigner = { sign: vi.fn() }

function makeController(state: any) {
  const listeners = new Set<() => void>()
  return {
    state: { global: state },
    onChange: (cb: () => void) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    pull: vi.fn().mockResolvedValue({ id: 'doc1' }),
    _emit: () => listeners.forEach((cb) => cb()),
  } as any
}

describe('useEnvironmentController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does nothing when no signer is available', async () => {
    vi.mocked(useCanSign).mockReturnValue({ canSign: false, signer: null, loading: false })
    const { result } = renderHook(() => useEnvironmentController('doc1'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(loadEnvironmentController).not.toHaveBeenCalled()
    expect(result.current.controller).toBeNull()
  })

  it('does nothing when documentId is null', async () => {
    vi.mocked(useCanSign).mockReturnValue({
      canSign: true,
      signer: fakeSigner as never,
      loading: false,
    })
    const { result } = renderHook(() => useEnvironmentController(null))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(loadEnvironmentController).not.toHaveBeenCalled()
  })

  it('loads controller and exposes state', async () => {
    const ctrl = makeController({ label: 'env-1' })
    vi.mocked(useCanSign).mockReturnValue({
      canSign: true,
      signer: fakeSigner as never,
      loading: false,
    })
    vi.mocked(loadEnvironmentController).mockResolvedValue(ctrl)

    const { result } = renderHook(() => useEnvironmentController('doc1'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.controller).toBe(ctrl)
    expect(result.current.state).toEqual({ label: 'env-1' })
  })

  it('updates state when controller emits onChange', async () => {
    const ctrl = makeController({ label: 'old' })
    vi.mocked(useCanSign).mockReturnValue({
      canSign: true,
      signer: fakeSigner as never,
      loading: false,
    })
    vi.mocked(loadEnvironmentController).mockResolvedValue(ctrl)

    const { result } = renderHook(() => useEnvironmentController('doc1'))
    await waitFor(() => expect(result.current.state).toEqual({ label: 'old' }))

    ctrl.state.global = { label: 'new' }
    ctrl._emit()

    await waitFor(() => expect(result.current.state).toEqual({ label: 'new' }))
  })

  it('exposes error on load failure', async () => {
    vi.mocked(useCanSign).mockReturnValue({
      canSign: true,
      signer: fakeSigner as never,
      loading: false,
    })
    vi.mocked(loadEnvironmentController).mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useEnvironmentController('doc1'))
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error))
    expect(result.current.isLoading).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run modules/cloud/__tests__/use-environment-controller.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement the hook**

Create `modules/cloud/hooks/use-environment-controller.ts`:

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
  const [, setRevision] = useState(0)
  const [state, setState] = useState<VetraCloudEnvironmentState | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!signer || !documentId) {
      setIsLoading(false)
      return
    }
    let cancelled = false
    let unsubscribe: (() => void) | undefined
    setIsLoading(true)
    setError(null)
    ;(async () => {
      try {
        const ctrl = await loadEnvironmentController({ documentId, signer })
        if (cancelled) return
        controllerRef.current = ctrl
        setState(ctrl.state.global as VetraCloudEnvironmentState)
        setRevision((r) => r + 1)
        unsubscribe = ctrl.onChange(() => {
          setState(ctrl.state.global as VetraCloudEnvironmentState)
        })
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

- [ ] **Step 4: Run tests**

Run: `npx vitest run modules/cloud/__tests__/use-environment-controller.test.tsx`
Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add modules/cloud/hooks/use-environment-controller.ts modules/cloud/__tests__/use-environment-controller.test.tsx
git commit -m "feat(cloud): add useEnvironmentController hook"
```

---

## Task 6: useCreateEnvironment Hook + Tests

**Files:**

- Create: `modules/cloud/hooks/use-create-environment.ts`
- Create: `modules/cloud/__tests__/use-create-environment.test.tsx`

- [ ] **Step 1: Write the test**

Create `modules/cloud/__tests__/use-create-environment.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCreateEnvironment } from '../hooks/use-create-environment'

vi.mock('../hooks/use-can-sign', () => ({ useCanSign: vi.fn() }))
vi.mock('../controller', () => ({ createNewEnvironmentController: vi.fn() }))

import { useCanSign } from '../hooks/use-can-sign'
import { createNewEnvironmentController } from '../controller'

describe('useCreateEnvironment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws when no signer', async () => {
    vi.mocked(useCanSign).mockReturnValue({ canSign: false, signer: null, loading: false })
    const { result } = renderHook(() => useCreateEnvironment())
    await expect(
      result.current({
        label: 'env-1',
        subdomain: 'foo',
        baseDomain: 'vetra.io',
        enabledServices: [],
      }),
    ).rejects.toThrow(/logged in/i)
  })

  it('dispatches actions then pushes; returns documentId', async () => {
    const fakeSigner = { sign: vi.fn() }
    const setLabel = vi.fn()
    const initialize = vi.fn()
    const enableService = vi.fn()
    const push = vi.fn().mockResolvedValue({ remoteDocument: { id: 'new-doc-id' } })
    const ctrl = { setLabel, initialize, enableService, push } as never

    vi.mocked(useCanSign).mockReturnValue({
      canSign: true,
      signer: fakeSigner as never,
      loading: false,
    })
    vi.mocked(createNewEnvironmentController).mockReturnValue(ctrl)

    const { result } = renderHook(() => useCreateEnvironment())

    let res
    await act(async () => {
      res = await result.current({
        label: 'env-1',
        subdomain: 'foo',
        baseDomain: 'vetra.io',
        defaultPackageRegistry: 'https://registry.dev.vetra.io',
        enabledServices: [
          { type: 'CONNECT', prefix: 'connect' },
          { type: 'SWITCHBOARD', prefix: 'switchboard' },
        ],
      })
    })

    expect(setLabel).toHaveBeenCalledWith({ label: 'env-1' })
    expect(initialize).toHaveBeenCalledWith({
      genericSubdomain: 'foo',
      genericBaseDomain: 'vetra.io',
      defaultPackageRegistry: 'https://registry.dev.vetra.io',
    })
    expect(enableService).toHaveBeenCalledTimes(2)
    expect(enableService).toHaveBeenNthCalledWith(1, { type: 'CONNECT', prefix: 'connect' })
    expect(enableService).toHaveBeenNthCalledWith(2, { type: 'SWITCHBOARD', prefix: 'switchboard' })
    expect(push).toHaveBeenCalledOnce()
    expect(res).toEqual({ documentId: 'new-doc-id' })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run modules/cloud/__tests__/use-create-environment.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement the hook**

Create `modules/cloud/hooks/use-create-environment.ts`:

```typescript
'use client'
import { useCallback } from 'react'
import { createNewEnvironmentController } from '../controller'
import { useCanSign } from './use-can-sign'

export type CreateEnvironmentInput = {
  label: string
  subdomain: string
  baseDomain: string
  defaultPackageRegistry?: string | null
  enabledServices: Array<{ type: 'CONNECT' | 'SWITCHBOARD' | 'FUSION'; prefix: string }>
}

export type CreateEnvironmentResult = { documentId: string }

export function useCreateEnvironment() {
  const { signer } = useCanSign()
  return useCallback(
    async (input: CreateEnvironmentInput): Promise<CreateEnvironmentResult> => {
      if (!signer) {
        throw new Error('You must be logged in with Renown to create an environment')
      }
      const controller = createNewEnvironmentController({ signer })
      controller.setLabel({ label: input.label })
      controller.initialize({
        genericSubdomain: input.subdomain,
        genericBaseDomain: input.baseDomain,
        defaultPackageRegistry: input.defaultPackageRegistry ?? undefined,
      })
      for (const svc of input.enabledServices) {
        controller.enableService({ type: svc.type, prefix: svc.prefix })
      }
      const result = await controller.push()
      return { documentId: result.remoteDocument.id }
    },
    [signer],
  )
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run modules/cloud/__tests__/use-create-environment.test.tsx`
Expected: All 2 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add modules/cloud/hooks/use-create-environment.ts modules/cloud/__tests__/use-create-environment.test.tsx
git commit -m "feat(cloud): add useCreateEnvironment hook"
```

---

## Task 7: EnvironmentControllerProvider + Tests

**Files:**

- Create: `modules/cloud/providers/environment-controller-provider.tsx`
- Create: `modules/cloud/__tests__/environment-controller-provider.test.tsx`

- [ ] **Step 1: Write the test**

Create `modules/cloud/__tests__/environment-controller-provider.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  EnvironmentControllerProvider,
  useEnvironmentControllerContext,
} from '../providers/environment-controller-provider'

vi.mock('../hooks/use-environment-controller', () => ({
  useEnvironmentController: vi.fn(),
}))

import { useEnvironmentController } from '../hooks/use-environment-controller'

function Probe() {
  const ctx = useEnvironmentControllerContext()
  return <div data-testid="probe">{ctx.state ? (ctx.state as any).label : 'no state'}</div>
}

describe('EnvironmentControllerProvider', () => {
  it('throws when used outside provider', () => {
    expect(() => render(<Probe />)).toThrow(/EnvironmentControllerProvider/i)
  })

  it('exposes the hook result via context', () => {
    vi.mocked(useEnvironmentController).mockReturnValue({
      controller: null,
      state: { label: 'hello' } as never,
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    })
    render(
      <EnvironmentControllerProvider documentId="doc1">
        <Probe />
      </EnvironmentControllerProvider>,
    )
    expect(screen.getByTestId('probe').textContent).toBe('hello')
  })
})
```

- [ ] **Step 2: Implement the provider**

Create `modules/cloud/providers/environment-controller-provider.tsx`:

```typescript
'use client'
import { createContext, useContext, type ReactNode } from 'react'
import {
  useEnvironmentController,
  type UseEnvironmentControllerResult,
} from '../hooks/use-environment-controller'

const EnvironmentControllerContext = createContext<UseEnvironmentControllerResult | null>(null)

export function EnvironmentControllerProvider({
  documentId,
  children,
}: {
  documentId: string
  children: ReactNode
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
  if (!ctx) {
    throw new Error(
      'useEnvironmentControllerContext must be used within an EnvironmentControllerProvider',
    )
  }
  return ctx
}
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run modules/cloud/__tests__/environment-controller-provider.test.tsx`
Expected: All 2 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add modules/cloud/providers/ modules/cloud/__tests__/environment-controller-provider.test.tsx
git commit -m "feat(cloud): add EnvironmentControllerProvider context"
```

---

## Task 8: RequireSigner Component + Tests

**Files:**

- Create: `modules/cloud/components/require-signer.tsx`
- Create: `modules/cloud/__tests__/require-signer.test.tsx`

- [ ] **Step 1: Write the test**

Create `modules/cloud/__tests__/require-signer.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RequireSigner } from '../components/require-signer'

vi.mock('../hooks/use-can-sign', () => ({ useCanSign: vi.fn() }))
vi.mock('@powerhousedao/reactor-browser', () => ({
  useRenownAuth: vi.fn(),
}))

import { useCanSign } from '../hooks/use-can-sign'
import { useRenownAuth } from '@powerhousedao/reactor-browser'

describe('RequireSigner', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders nothing while loading', () => {
    vi.mocked(useCanSign).mockReturnValue({ canSign: false, signer: null, loading: true })
    vi.mocked(useRenownAuth).mockReturnValue({ status: 'loading', login: vi.fn() } as never)
    const { container } = render(
      <RequireSigner>
        <div data-testid="child">child</div>
      </RequireSigner>,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders children when canSign', () => {
    vi.mocked(useCanSign).mockReturnValue({
      canSign: true,
      signer: { sign: vi.fn() } as never,
      loading: false,
    })
    vi.mocked(useRenownAuth).mockReturnValue({ status: 'authorized', login: vi.fn() } as never)
    render(
      <RequireSigner>
        <div data-testid="child">child</div>
      </RequireSigner>,
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('renders login CTA when not signed in', () => {
    vi.mocked(useCanSign).mockReturnValue({ canSign: false, signer: null, loading: false })
    vi.mocked(useRenownAuth).mockReturnValue({ status: 'unauthorized', login: vi.fn() } as never)
    render(
      <RequireSigner>
        <div data-testid="child">child</div>
      </RequireSigner>,
    )
    expect(screen.queryByTestId('child')).not.toBeInTheDocument()
    expect(screen.getByText(/log in with renown/i)).toBeInTheDocument()
  })

  it('renders fallback when provided and not signed in', () => {
    vi.mocked(useCanSign).mockReturnValue({ canSign: false, signer: null, loading: false })
    vi.mocked(useRenownAuth).mockReturnValue({ status: 'unauthorized', login: vi.fn() } as never)
    render(
      <RequireSigner fallback={<div data-testid="fallback">custom</div>}>
        <div data-testid="child">child</div>
      </RequireSigner>,
    )
    expect(screen.getByTestId('fallback')).toBeInTheDocument()
    expect(screen.queryByTestId('child')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Implement the component**

Create `modules/cloud/components/require-signer.tsx`:

```typescript
'use client'
import type { ReactNode } from 'react'
import { useRenownAuth } from '@powerhousedao/reactor-browser'
import { useCanSign } from '../hooks/use-can-sign'
import { Button } from '@/modules/shared/components/ui/button'

export function RequireSigner({
  children,
  fallback,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  const { canSign, loading } = useCanSign()
  const auth = useRenownAuth()

  if (loading) return null
  if (canSign) return <>{children}</>
  if (fallback) return <>{fallback}</>

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-6 text-center">
      <p className="text-muted-foreground text-sm">Log in with Renown to continue.</p>
      <Button onClick={() => auth.login?.()}>Log in with Renown</Button>
    </div>
  )
}
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run modules/cloud/__tests__/require-signer.test.tsx`
Expected: All 4 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add modules/cloud/components/ modules/cloud/__tests__/require-signer.test.tsx
git commit -m "feat(cloud): add RequireSigner gating component"
```

---

## Task 9: Migrate `app/cloud/[project]/page.tsx`

**Files:**

- Modify: `app/cloud/[project]/page.tsx`

- [ ] **Step 1: Read current file**

Read the file fully. Identify:

- Where `useEnvironmentDetail(documentId)` is called
- All mutation calls (`setLabel`, `setGenericSubdomain`, `setDefaultPackageRegistry`, `approveChanges`)
- The page component structure

- [ ] **Step 2: Wrap content in `EnvironmentControllerProvider`**

At the top of the page component (after `documentId` is extracted from params):

```typescript
return (
  <EnvironmentControllerProvider documentId={documentId}>
    <ProjectPageContent documentId={documentId} />
  </EnvironmentControllerProvider>
)
```

Move the existing render body into a new inner `ProjectPageContent` component. Inside it, replace `useEnvironmentDetail(documentId)` with:

```typescript
const { state, controller, isLoading, error } = useEnvironmentControllerContext()
```

For each mutation handler, change e.g.:

```typescript
// Before
await mut.setLabel(newLabel)

// After
if (!controller) return
controller.setLabel({ label: newLabel })
await controller.push()
```

For `approveChanges`:

```typescript
controller.approveChanges({ _placeholder: '' })
await controller.push()
```

Wrap mutation buttons in `<RequireSigner>` or disable them via `useCanSign().canSign`.

- [ ] **Step 3: Typecheck + lint**

Run:

```bash
npm run tsc 2>&1 | head -30
npm run lint 2>&1 | head -30
```

Expected: no errors related to this file. Other files using removed exports may error — that's expected and gets resolved in subsequent tasks.

- [ ] **Step 4: Commit**

```bash
git add app/cloud/[project]/page.tsx
git commit -m "feat(cloud): migrate environment detail page to signed actions"
```

---

## Task 10: Migrate `app/cloud/[project]/tabs/overview.tsx`

**Files:**

- Modify: `app/cloud/[project]/tabs/overview.tsx`

This is the largest refactor (~1364 lines). The pattern is mechanical: replace every `mut.X()` call with `controller.X(input); await controller.push()`.

- [ ] **Step 1: Read current file**

Read the file. Find:

- The hook `useEnvironmentDetail(documentId)` call
- All mutation invocations: `setCustomDomain`, `enableService`, `disableService`, `addPackage`, `removePackage`, `setServiceVersion`, `setPackageVersion`, `terminate`, `deleteEnvironment`

- [ ] **Step 2: Replace hook call**

Replace:

```typescript
const mut = useEnvironmentDetail(documentId)
```

with:

```typescript
const { state, controller } = useEnvironmentControllerContext()
```

- [ ] **Step 3: Replace each mutation**

For each call, transform to controller dispatch + push. Mapping:

| Old                                          | New                                                                                     |
| -------------------------------------------- | --------------------------------------------------------------------------------------- |
| `mut.setCustomDomain(enabled, domain)`       | `controller.setCustomDomain({ enabled, domain }); await controller.push()`              |
| `mut.enableService(type, prefix)`            | `controller.enableService({ type, prefix }); await controller.push()`                   |
| `mut.disableService(type)`                   | `controller.disableService({ type }); await controller.push()`                          |
| `mut.addPackage(name, version)`              | `controller.addPackage({ packageName: name, version }); await controller.push()`        |
| `mut.removePackage(name)`                    | `controller.removePackage({ packageName: name }); await controller.push()`              |
| `mut.setServiceVersion(type, version)`       | `controller.setServiceVersion({ type, version }); await controller.push()`              |
| `mut.setPackageVersion(name, version)`       | `controller.setPackageVersion({ packageName: name, version }); await controller.push()` |
| `mut.terminate()`                            | `controller.terminateEnvironment({ _placeholder: '' }); await controller.push()`        |
| `await deleteEnvironment(documentId, token)` | `await controller.delete()`                                                             |

For each handler, also:

- Guard with `if (!controller) return` early
- Preserve existing toast/error handling (`toast.success`, `toast.error`)
- Preserve any router navigation (e.g. after delete, redirect to `/cloud`)

- [ ] **Step 4: Wrap mutation UI in `<RequireSigner>` where appropriate**

For example, the "Add Package" button and modal should be inside `<RequireSigner>` so unauthenticated users see the login CTA. Same for "Add Custom Domain", "Delete Environment", etc.

- [ ] **Step 5: Typecheck**

Run: `npm run tsc 2>&1 | head -30`
Expected: errors related to this file resolved.

- [ ] **Step 6: Commit**

```bash
git add app/cloud/[project]/tabs/overview.tsx
git commit -m "feat(cloud): migrate overview tab to signed actions"
```

---

## Task 11: Migrate `app/cloud/new-project-form.tsx` + Modal

**Files:**

- Modify: `app/cloud/new-project-form.tsx`
- Modify: `app/cloud/new-project-modal-button.tsx`

- [ ] **Step 1: Read both files**

Identify:

- Form schema (zod)
- Submit handler currently calls `createEnvironment`, `initializeEnvironment`, `enableService`, `setLabel` sequentially
- Modal trigger button

- [ ] **Step 2: Refactor `new-project-form.tsx`**

Replace the submit handler to use `useCreateEnvironment`:

```typescript
const createEnv = useCreateEnvironment()

async function onSubmit(values: FormValues) {
  try {
    setIsSubmitting(true)
    const { documentId } = await createEnv({
      label: values.label,
      subdomain: values.subdomain,
      baseDomain: BASE_DOMAIN_DEFAULT,
      defaultPackageRegistry: values.defaultPackageRegistry,
      enabledServices: [
        { type: 'CONNECT', prefix: 'connect' },
        { type: 'SWITCHBOARD', prefix: 'switchboard' },
      ],
    })
    toast.success('Environment created')
    router.push(`/cloud/${documentId}`)
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Failed to create environment')
  } finally {
    setIsSubmitting(false)
  }
}
```

Wrap the entire form (or its mutating section) in `<RequireSigner>`:

```typescript
return (
  <RequireSigner>
    <Form {...form}>
      ...existing form...
    </Form>
  </RequireSigner>
)
```

- [ ] **Step 3: Refactor `new-project-modal-button.tsx`**

Disable the trigger button when `!useCanSign().canSign`. Show a tooltip or label like "Log in to create" when disabled. Or simpler: keep the button enabled, the form's `<RequireSigner>` will handle the gating once the modal opens.

- [ ] **Step 4: Typecheck**

Run: `npm run tsc 2>&1 | head -30`

- [ ] **Step 5: Commit**

```bash
git add app/cloud/new-project-form.tsx app/cloud/new-project-modal-button.tsx
git commit -m "feat(cloud): migrate new project form to useCreateEnvironment"
```

---

## Task 12: Migrate `app/cloud/cloud-projects.tsx`

**Files:**

- Modify: `app/cloud/cloud-projects.tsx`

- [ ] **Step 1: Read the file**

Identify the `handleDelete` function that calls `deleteEnvironment(env.id, token)`.

- [ ] **Step 2: Replace delete with signed controller**

```typescript
import { loadEnvironmentController } from '@/modules/cloud/controller'
import { useCanSign } from '@/modules/cloud/hooks/use-can-sign'

const { signer, canSign } = useCanSign()

async function handleDelete(env: CloudEnvironment) {
  if (!signer) {
    toast.error('Log in with Renown to delete an environment')
    return
  }
  try {
    const controller = await loadEnvironmentController({ documentId: env.id, signer })
    await controller.delete()
    toast.success('Environment deleted')
    refetch()
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Failed to delete')
  }
}
```

Disable delete buttons when `!canSign` and show a tooltip explaining why.

- [ ] **Step 3: Typecheck + lint**

Run: `npm run tsc && npm run lint 2>&1 | tail -10`

- [ ] **Step 4: Commit**

```bash
git add app/cloud/cloud-projects.tsx
git commit -m "feat(cloud): migrate environment delete to signed controller"
```

---

## Task 13: Clean Up `useEnvironmentDetail` and `graphql.ts`

**Files:**

- Delete: `modules/cloud/hooks/use-environment-detail.ts`
- Modify: `modules/cloud/graphql.ts`

- [ ] **Step 1: Verify no remaining usages**

Run: `grep -rn "useEnvironmentDetail" app/ modules/ --include="*.ts" --include="*.tsx" | grep -v __tests__`
Expected: no results (after Tasks 9-12).

If there are still references, fix them before proceeding.

- [ ] **Step 2: Delete `useEnvironmentDetail`**

```bash
git rm modules/cloud/hooks/use-environment-detail.ts
```

- [ ] **Step 3: Strip mutation functions from `graphql.ts`**

Read `modules/cloud/graphql.ts`. Remove ONLY the mutation functions (`createEnvironment`, `setLabel`, `setGenericSubdomain`, `setCustomDomain`, `setDefaultPackageRegistry`, `enableService`, `disableService`, `toggleService`, `addPackage`, `removePackage`, `initializeEnvironment`, `approveChanges`, `terminateEnvironment`, `setServiceVersion`, `setPackageVersion`, `deleteEnvironment`).

Keep:

- `getAuthToken` helper (still used by `fetchEnvironment` for read auth)
- `gql` helper
- All read functions (`fetchEnvironment`, `listEnvironments`, observability queries, etc.)

If there are mutations left referenced somewhere, fix the reference (it should have been migrated in Tasks 9-12).

- [ ] **Step 4: Typecheck + lint**

Run: `npm run tsc && npm run lint 2>&1 | tail -10`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add modules/cloud/hooks/ modules/cloud/graphql.ts
git commit -m "refactor(cloud): remove obsolete bearer-token mutation functions"
```

---

## Task 14: E2E Playwright Test (Mocked)

**Files:**

- Create: `tests/e2e/cloud-signed-actions.spec.ts`

If running against a real switchboard isn't feasible in CI, mock the GraphQL endpoint and assert that mutation requests carry signed action payloads.

- [ ] **Step 1: Create the test**

Create `tests/e2e/cloud-signed-actions.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Signed cloud actions', () => {
  test('create environment requires login, then dispatches signed actions', async ({ page }) => {
    const seenRequests: any[] = []

    await page.route('**/graphql', async (route) => {
      const body = route.request().postDataJSON()
      seenRequests.push(body)

      if (
        body?.operationName === 'CreateEmptyDocument' ||
        body?.query?.includes('createEmptyDocument')
      ) {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ data: { createEmptyDocument: { id: 'new-doc-1' } } }),
        })
        return
      }
      // Default: empty success
      await route.fulfill({ status: 200, body: JSON.stringify({ data: {} }) })
    })

    await page.goto('/cloud/new')
    // Without login, the form should show the login CTA
    await expect(page.getByText(/log in with renown/i)).toBeVisible()
  })
})
```

This is the minimum smoke test. A real signed-action assertion test requires injecting a fake signer; document this as a TODO if not done in this task.

- [ ] **Step 2: Run test**

Run: `npx playwright test tests/e2e/cloud-signed-actions.spec.ts`
Expected: PASS (or skipped with note if Playwright env is not configured locally).

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/cloud-signed-actions.spec.ts
git commit -m "test(e2e): add cloud signed actions smoke test"
```

---

## Task 15: Final Verification

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run 2>&1 | tail -20`
Expected: all tests pass (existing + new).

- [ ] **Step 2: Run TypeScript check**

Run: `npm run tsc 2>&1 | tail -10`
Expected: no errors.

- [ ] **Step 3: Run lint**

Run: `npm run lint 2>&1 | tail -10`
Expected: no errors.

- [ ] **Step 4: Verify no remaining bearer-token mutations**

Run: `grep -rn "Bearer\|getAuthToken" modules/cloud/ app/cloud/ --include="*.ts" --include="*.tsx" | grep -v __tests__ | grep -v fetch`

Inspect output. The only remaining references to `getAuthToken` should be in read paths (e.g., `fetchEnvironment`).

- [ ] **Step 5: Build**

Run: `npm run build 2>&1 | tail -20`
Expected: successful build (no compile errors).

- [ ] **Step 6: Smoke test in dev mode (manual)**

Run `npm run dev` and verify in browser:

- `/cloud` list page loads
- New environment button — without login shows login CTA
- After login, can create new env (uses signed actions)
- Detail page loads
- Editing label/settings dispatches signed action
- Delete works after login

- [ ] **Step 7: Review git log**

Expected commits (newest first, after deps commit):

```
test(e2e): add cloud signed actions smoke test
refactor(cloud): remove obsolete bearer-token mutation functions
feat(cloud): migrate environment delete to signed controller
feat(cloud): migrate new project form to useCreateEnvironment
feat(cloud): migrate overview tab to signed actions
feat(cloud): migrate environment detail page to signed actions
feat(cloud): add RequireSigner gating component
feat(cloud): add EnvironmentControllerProvider context
feat(cloud): add useCreateEnvironment hook
feat(cloud): add useEnvironmentController hook
feat(cloud): add useCanSign hook
feat(cloud): add environment controller factories
feat(cloud): add reactor graphql client module
deps: add @powerhousedao/vetra-cloud-package as workspace link
docs: add renown-signed-actions design spec
```
