# Create Team Wizard (Slice E) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Multi-step wizard at `/profile/create-team` that mints a new `BuilderTeam` document with full profile + optional member invites, dispatching everything in one batched Renown signing event.

**Architecture:** vetra.to-only. New route + components + `useCreateTeam` hook. Uses `addDocument` + `dispatchActions` from `@powerhousedao/reactor-browser` and action creators from `@powerhousedao/vetra-builder-package/document-models/builder-team/v1`. Submit → mint doc → batched signed dispatch → poll relational read-model → redirect to public team page.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 6, Radix UI, Tailwind 4, `@powerhousedao/reactor-browser`, `viem` (ENS reverse lookup), `graphql-request`, vitest.

**Spec:** `docs/superpowers/specs/2026-05-13-create-team-wizard-design.md`

---

## File Structure

### vetra.to (new files)

- `app/profile/create-team/page.tsx` — wizard host, auth gate, form state, step routing, submit dispatch.
- `app/profile/create-team/components/stepper.tsx` — 4-dot step indicator.
- `app/profile/create-team/components/step-identity.tsx` — name + slug + live availability.
- `app/profile/create-team/components/step-brand.tsx` — description + logo URL + preview.
- `app/profile/create-team/components/step-socials.tsx` — three URL fields.
- `app/profile/create-team/components/step-members.tsx` — pinned creator + dynamic invite rows + ENS.
- `app/profile/create-team/components/submit-bar.tsx` — Back / Next / Create-team buttons.
- `modules/profile/lib/validations.ts` — slug, eth-address, URL validators + `slugify()`.
- `modules/profile/lib/use-slug-availability.ts` — debounced `fetchBuilderTeam(slug)` check.
- `modules/profile/lib/use-ens-resolver.ts` — debounced viem reverse ENS lookup.
- `modules/profile/lib/use-create-team.ts` — submit orchestrator.
- `modules/profile/lib/create-team-queries.ts` — `FETCH_BUILDER_TEAM_BY_SLUG` GraphQL doc + fetcher.

### vetra.to (modify)

- `app/profile/components/teams-tab.tsx` — empty-state: add "Create your first team" CTA.
- `app/profile/page.tsx` — header: add primary "Create team" button next to h1.

### vetra.to tests

- `modules/profile/__tests__/validations.test.ts`
- `modules/profile/__tests__/use-slug-availability.test.tsx`
- `modules/profile/__tests__/use-create-team.test.tsx`
- `app/profile/create-team/components/__tests__/step-identity.test.tsx`
- `app/profile/create-team/components/__tests__/step-members.test.tsx`

---

## Task 1: Validations + slugify helpers (TDD)

**Files:**

- Create: `modules/profile/lib/validations.ts`
- Create: `modules/profile/__tests__/validations.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// modules/profile/__tests__/validations.test.ts
import { describe, expect, it } from 'vitest'
import {
  slugify,
  isValidSlug,
  isValidEthAddress,
  isValidUrl,
} from '@/modules/profile/lib/validations'

describe('slugify', () => {
  it('lowercases and dash-joins', () => {
    expect(slugify('Acme Corp')).toBe('acme-corp')
  })
  it('strips non-alphanumeric', () => {
    expect(slugify('Hello, World!')).toBe('hello-world')
  })
  it('collapses repeats and trims dashes', () => {
    expect(slugify('  --Foo   Bar--  ')).toBe('foo-bar')
  })
  it('normalises unicode to ASCII', () => {
    expect(slugify('Café Münch')).toBe('cafe-munch')
  })
  it('returns empty for unsupportable input', () => {
    expect(slugify('!!!')).toBe('')
  })
})

describe('isValidSlug', () => {
  it('accepts good slugs', () => {
    expect(isValidSlug('acme-corp')).toBe(true)
    expect(isValidSlug('foo123')).toBe(true)
  })
  it('rejects too short / long', () => {
    expect(isValidSlug('ab')).toBe(false)
    expect(isValidSlug('a'.repeat(41))).toBe(false)
  })
  it('rejects leading/trailing dashes', () => {
    expect(isValidSlug('-foo')).toBe(false)
    expect(isValidSlug('foo-')).toBe(false)
  })
  it('rejects double dashes', () => {
    expect(isValidSlug('foo--bar')).toBe(false)
  })
  it('rejects uppercase / non-alnum', () => {
    expect(isValidSlug('Foo')).toBe(false)
    expect(isValidSlug('foo_bar')).toBe(false)
  })
})

describe('isValidEthAddress', () => {
  it('accepts well-formed 0x40-hex', () => {
    expect(isValidEthAddress('0x' + 'a'.repeat(40))).toBe(true)
    expect(isValidEthAddress('0x' + 'F'.repeat(40))).toBe(true)
  })
  it('rejects wrong length / charset / prefix', () => {
    expect(isValidEthAddress('0x' + 'a'.repeat(39))).toBe(false)
    expect(isValidEthAddress('0x' + 'a'.repeat(41))).toBe(false)
    expect(isValidEthAddress('aa' + 'a'.repeat(40))).toBe(false)
    expect(isValidEthAddress('0x' + 'z'.repeat(40))).toBe(false)
  })
})

describe('isValidUrl', () => {
  it('accepts http(s) URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true)
    expect(isValidUrl('http://example.com/path?q=1')).toBe(true)
  })
  it('rejects gibberish', () => {
    expect(isValidUrl('not a url')).toBe(false)
    expect(isValidUrl('javascript:alert(1)')).toBe(false)
  })
  it('treats empty as valid (caller decides if required)', () => {
    expect(isValidUrl('')).toBe(true)
  })
})
```

- [ ] **Step 2: Run, confirm fails**

```bash
cd /home/froid/projects/powerhouse/vetra.to
npx vitest run --config vitest.unit.config.ts modules/profile/__tests__/validations.test.ts
```

Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```ts
// modules/profile/lib/validations.ts
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function isValidSlug(slug: string): boolean {
  if (slug.length < 3 || slug.length > 40) return false
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}

export function isValidEthAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr)
}

export function isValidUrl(url: string): boolean {
  if (url === '') return true
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}
```

- [ ] **Step 4: Run, confirm passes**

```bash
npx vitest run --config vitest.unit.config.ts modules/profile/__tests__/validations.test.ts
```

Expected: PASS, all describe blocks green.

- [ ] **Step 5: Commit**

```bash
git add modules/profile/lib/validations.ts modules/profile/__tests__/validations.test.ts
git commit -m "feat(profile): validation helpers + slugify for create-team wizard"
```

---

## Task 2: GraphQL query for slug lookup + fetcher

**Files:**

- Create: `modules/profile/lib/create-team-queries.ts`

- [ ] **Step 1: Implement**

```ts
// modules/profile/lib/create-team-queries.ts
import { gql, request } from 'graphql-request'

export const FETCH_BUILDER_TEAM_BY_SLUG = gql`
  query fetchBuilderTeamBySlug($slug: String!) {
    fetchBuilderTeam(slug: $slug) {
      id
      profileSlug
    }
  }
`

type Response = {
  fetchBuilderTeam: { id: string; profileSlug: string } | null
}

function getEndpoint(): string {
  if (typeof window !== 'undefined') {
    const env = (window as unknown as { __ENV?: Record<string, string> }).__ENV
    if (env?.NEXT_PUBLIC_SWITCHBOARD_URL) return env.NEXT_PUBLIC_SWITCHBOARD_URL
  }
  return process.env.NEXT_PUBLIC_SWITCHBOARD_URL || 'https://switchboard.staging.vetra.io/graphql'
}

export async function fetchBuilderTeamBySlug(slug: string): Promise<{ id: string } | null> {
  const data = await request<Response>(getEndpoint(), FETCH_BUILDER_TEAM_BY_SLUG, { slug })
  return data.fetchBuilderTeam ? { id: data.fetchBuilderTeam.id } : null
}
```

- [ ] **Step 2: Commit**

```bash
git add modules/profile/lib/create-team-queries.ts
git commit -m "feat(profile): fetchBuilderTeamBySlug fetcher for slug availability check"
```

---

## Task 3: useSlugAvailability hook (TDD)

**Files:**

- Create: `modules/profile/lib/use-slug-availability.ts`
- Create: `modules/profile/__tests__/use-slug-availability.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// modules/profile/__tests__/use-slug-availability.test.tsx
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

const fetcher = vi.fn()
vi.mock('@/modules/profile/lib/create-team-queries', () => ({
  fetchBuilderTeamBySlug: (...args: unknown[]) => fetcher(...args),
}))

import { useSlugAvailability } from '@/modules/profile/lib/use-slug-availability'

describe('useSlugAvailability', () => {
  beforeEach(() => {
    fetcher.mockReset()
    vi.useFakeTimers()
  })

  it('returns idle when slug is invalid', () => {
    const { result } = renderHook(() => useSlugAvailability('ab', true))
    expect(result.current).toBe('idle')
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('returns available when fetcher returns null after debounce', async () => {
    fetcher.mockResolvedValueOnce(null)
    const { result } = renderHook(() => useSlugAvailability('acme-corp', true))
    expect(result.current).toBe('idle')
    await act(async () => {
      vi.advanceTimersByTime(300)
      await Promise.resolve()
    })
    await waitFor(() => expect(result.current).toBe('available'))
    expect(fetcher).toHaveBeenCalledWith('acme-corp')
  })

  it('returns taken when fetcher returns a team', async () => {
    fetcher.mockResolvedValueOnce({ id: 't1' })
    const { result } = renderHook(() => useSlugAvailability('acme', true))
    await act(async () => {
      vi.advanceTimersByTime(300)
      await Promise.resolve()
    })
    await waitFor(() => expect(result.current).toBe('taken'))
  })

  it('returns idle when enabled is false', () => {
    const { result } = renderHook(() => useSlugAvailability('acme-corp', false))
    expect(result.current).toBe('idle')
    expect(fetcher).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run, confirm fails**

```bash
npx vitest run --config vitest.unit.config.ts modules/profile/__tests__/use-slug-availability.test.tsx
```

Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```ts
// modules/profile/lib/use-slug-availability.ts
import { useEffect, useState } from 'react'
import { fetchBuilderTeamBySlug } from './create-team-queries'
import { isValidSlug } from './validations'

export type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error'

export function useSlugAvailability(slug: string, enabled: boolean): SlugStatus {
  const [status, setStatus] = useState<SlugStatus>('idle')

  useEffect(() => {
    if (!enabled || !isValidSlug(slug)) {
      setStatus('idle')
      return
    }
    setStatus('checking')
    let cancelled = false
    const t = setTimeout(() => {
      fetchBuilderTeamBySlug(slug)
        .then((team) => {
          if (cancelled) return
          setStatus(team ? 'taken' : 'available')
        })
        .catch(() => {
          if (cancelled) return
          setStatus('error')
        })
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [slug, enabled])

  return status
}
```

- [ ] **Step 4: Run, confirm passes**

```bash
npx vitest run --config vitest.unit.config.ts modules/profile/__tests__/use-slug-availability.test.tsx
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add modules/profile/lib/use-slug-availability.ts modules/profile/__tests__/use-slug-availability.test.tsx
git commit -m "feat(profile): useSlugAvailability hook with debounced check"
```

---

## Task 4: useEnsResolver hook (viem)

**Files:**

- Create: `modules/profile/lib/use-ens-resolver.ts`

- [ ] **Step 1: Implement**

```ts
// modules/profile/lib/use-ens-resolver.ts
import { useEffect, useState } from 'react'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { isValidEthAddress } from './validations'

const client = createPublicClient({ chain: mainnet, transport: http() })

export function useEnsResolver(address: string): string | null {
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    if (!isValidEthAddress(address)) {
      setName(null)
      return
    }
    let cancelled = false
    const t = setTimeout(() => {
      client
        .getEnsName({ address: address as `0x${string}` })
        .then((result) => {
          if (!cancelled) setName(result)
        })
        .catch(() => {
          if (!cancelled) setName(null)
        })
    }, 500)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [address])

  return name
}
```

- [ ] **Step 2: Commit**

```bash
git add modules/profile/lib/use-ens-resolver.ts
git commit -m "feat(profile): useEnsResolver hook (viem mainnet reverse lookup)"
```

---

## Task 5: useCreateTeam hook (TDD)

**Files:**

- Create: `modules/profile/lib/use-create-team.ts`
- Create: `modules/profile/__tests__/use-create-team.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// modules/profile/__tests__/use-create-team.test.tsx
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

const addDocumentMock = vi.fn()
const dispatchActionsMock = vi.fn()
vi.mock('@powerhousedao/reactor-browser', () => ({
  addDocument: (...args: unknown[]) => addDocumentMock(...args),
  dispatchActions: (...args: unknown[]) => dispatchActionsMock(...args),
}))
const setTeamName = vi.fn((i) => ({ type: 'SET_TEAM_NAME', input: i }))
const setSlug = vi.fn((i) => ({ type: 'SET_SLUG', input: i }))
const setDescription = vi.fn((i) => ({ type: 'SET_DESCRIPTION', input: i }))
const setLogo = vi.fn((i) => ({ type: 'SET_LOGO', input: i }))
const setSocials = vi.fn((i) => ({ type: 'SET_SOCIALS', input: i }))
const addMember = vi.fn((i) => ({ type: 'ADD_MEMBER', input: i }))
const updateMemberInfo = vi.fn((i) => ({ type: 'UPDATE_MEMBER_INFO', input: i }))
vi.mock('@powerhousedao/vetra-builder-package/document-models/builder-team/v1', () => ({
  setTeamName: (...a: unknown[]) => setTeamName(...a),
  setSlug: (...a: unknown[]) => setSlug(...a),
  setDescription: (...a: unknown[]) => setDescription(...a),
  setLogo: (...a: unknown[]) => setLogo(...a),
  setSocials: (...a: unknown[]) => setSocials(...a),
  addMember: (...a: unknown[]) => addMember(...a),
  updateMemberInfo: (...a: unknown[]) => updateMemberInfo(...a),
}))
const fetchSlugMock = vi.fn()
vi.mock('@/modules/profile/lib/create-team-queries', () => ({
  fetchBuilderTeamBySlug: (...a: unknown[]) => fetchSlugMock(...a),
}))

import { useCreateTeam } from '@/modules/profile/lib/use-create-team'

const baseForm = {
  name: 'Acme',
  slug: 'acme',
  description: '',
  profileLogo: '',
  profileSocialsX: '',
  profileSocialsGithub: '',
  profileSocialsWebsite: '',
  members: [],
}

describe('useCreateTeam', () => {
  beforeEach(() => {
    addDocumentMock.mockReset()
    dispatchActionsMock.mockReset()
    fetchSlugMock.mockReset()
    setTeamName.mockClear()
    setSlug.mockClear()
    setDescription.mockClear()
    setLogo.mockClear()
    setSocials.mockClear()
    addMember.mockClear()
    updateMemberInfo.mockClear()
  })

  it('mints doc, dispatches required actions, and resolves on success', async () => {
    addDocumentMock.mockResolvedValueOnce({ documentId: 'doc-1' })
    dispatchActionsMock.mockResolvedValueOnce(undefined)
    fetchSlugMock.mockResolvedValueOnce({ id: 'doc-1' }) // available after dispatch

    const { result } = renderHook(() =>
      useCreateTeam({ driveId: 'vetra-builder-package', creatorAddress: '0xCREATOR' }),
    )

    let outcome: { documentId: string } | undefined
    await act(async () => {
      outcome = await result.current.createTeam(baseForm)
    })

    expect(addDocumentMock).toHaveBeenCalledWith(
      'vetra-builder-package',
      'Acme',
      'powerhouse/builder-team',
    )
    expect(setTeamName).toHaveBeenCalledWith({ name: 'Acme' })
    expect(setSlug).toHaveBeenCalledWith({ slug: 'acme' })
    // Creator added: addMember + updateMemberInfo with ethAddress
    expect(addMember).toHaveBeenCalledTimes(1)
    expect(updateMemberInfo).toHaveBeenCalledWith(
      expect.objectContaining({ ethAddress: '0xCREATOR' }),
    )
    expect(dispatchActionsMock).toHaveBeenCalledTimes(1)
    expect(outcome?.documentId).toBe('doc-1')
  })

  it('includes optional fields only when non-empty', async () => {
    addDocumentMock.mockResolvedValueOnce({ documentId: 'doc-1' })
    dispatchActionsMock.mockResolvedValueOnce(undefined)
    fetchSlugMock.mockResolvedValueOnce({ id: 'doc-1' })
    const { result } = renderHook(() =>
      useCreateTeam({ driveId: 'vetra-builder-package', creatorAddress: '0xC' }),
    )
    await act(async () => {
      await result.current.createTeam({
        ...baseForm,
        description: 'hi',
        profileSocialsX: 'https://x.com/acme',
      })
    })
    expect(setDescription).toHaveBeenCalled()
    expect(setSocials).toHaveBeenCalledWith({
      xProfile: 'https://x.com/acme',
      github: undefined,
      website: undefined,
    })
    expect(setLogo).not.toHaveBeenCalled()
  })

  it('adds invited members as addMember+updateMemberInfo pairs', async () => {
    addDocumentMock.mockResolvedValueOnce({ documentId: 'doc-1' })
    dispatchActionsMock.mockResolvedValueOnce(undefined)
    fetchSlugMock.mockResolvedValueOnce({ id: 'doc-1' })
    const { result } = renderHook(() =>
      useCreateTeam({ driveId: 'vetra-builder-package', creatorAddress: '0xC' }),
    )
    await act(async () => {
      await result.current.createTeam({
        ...baseForm,
        members: [{ address: '0xINVITED1' }, { address: '0xINVITED2' }],
      })
    })
    // 1 creator + 2 invited = 3 addMember and 3 updateMemberInfo
    expect(addMember).toHaveBeenCalledTimes(3)
    expect(updateMemberInfo).toHaveBeenCalledTimes(3)
  })

  it('rejects when addDocument throws', async () => {
    addDocumentMock.mockRejectedValueOnce(new Error('auth required'))
    const { result } = renderHook(() =>
      useCreateTeam({ driveId: 'vetra-builder-package', creatorAddress: '0xC' }),
    )
    await expect(result.current.createTeam(baseForm)).rejects.toThrow('auth required')
    expect(dispatchActionsMock).not.toHaveBeenCalled()
  })

  it('rejects when dispatchActions throws', async () => {
    addDocumentMock.mockResolvedValueOnce({ documentId: 'doc-1' })
    dispatchActionsMock.mockRejectedValueOnce(new Error('signing cancelled'))
    const { result } = renderHook(() =>
      useCreateTeam({ driveId: 'vetra-builder-package', creatorAddress: '0xC' }),
    )
    await expect(result.current.createTeam(baseForm)).rejects.toThrow('signing cancelled')
  })
})
```

- [ ] **Step 2: Run, confirm fails**

```bash
npx vitest run --config vitest.unit.config.ts modules/profile/__tests__/use-create-team.test.tsx
```

Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```ts
// modules/profile/lib/use-create-team.ts
import { useCallback } from 'react'
import { addDocument, dispatchActions } from '@powerhousedao/reactor-browser'
import {
  addMember,
  setDescription,
  setLogo,
  setSlug,
  setSocials,
  setTeamName,
  updateMemberInfo,
} from '@powerhousedao/vetra-builder-package/document-models/builder-team/v1'
import { fetchBuilderTeamBySlug } from './create-team-queries'

export type CreateTeamForm = {
  name: string
  slug: string
  description: string
  profileLogo: string
  profileSocialsX: string
  profileSocialsGithub: string
  profileSocialsWebsite: string
  members: { address: string }[]
}

export type UseCreateTeamArgs = {
  driveId: string
  creatorAddress: string
}

function generateId(): string {
  return crypto.randomUUID()
}

async function waitForSlug(slug: string, timeoutMs: number): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const team = await fetchBuilderTeamBySlug(slug)
      if (team) return
    } catch {
      // ignore transient errors and keep polling
    }
    await new Promise((r) => setTimeout(r, 500))
  }
}

export function useCreateTeam({ driveId, creatorAddress }: UseCreateTeamArgs) {
  const createTeam = useCallback(
    async (form: CreateTeamForm): Promise<{ documentId: string }> => {
      const minted = await addDocument(driveId, form.name, 'powerhouse/builder-team')
      const documentId = (minted as { documentId: string }).documentId

      const actions: unknown[] = []
      actions.push(setTeamName({ name: form.name }))
      actions.push(setSlug({ slug: form.slug }))
      if (form.description) actions.push(setDescription({ description: form.description }))
      if (form.profileLogo) actions.push(setLogo({ logo: form.profileLogo }))
      if (form.profileSocialsX || form.profileSocialsGithub || form.profileSocialsWebsite) {
        actions.push(
          setSocials({
            xProfile: form.profileSocialsX || undefined,
            github: form.profileSocialsGithub || undefined,
            website: form.profileSocialsWebsite || undefined,
          }),
        )
      }

      // Creator first, then invited.
      const allAddresses = [creatorAddress, ...form.members.map((m) => m.address)]
      for (const ethAddress of allAddresses) {
        const id = generateId()
        actions.push(addMember({ id }))
        actions.push(updateMemberInfo({ id, ethAddress }))
      }

      await dispatchActions(actions as never, documentId)
      await waitForSlug(form.slug, 5000)
      return { documentId }
    },
    [driveId, creatorAddress],
  )

  return { createTeam }
}
```

- [ ] **Step 4: Run, confirm passes**

```bash
npx vitest run --config vitest.unit.config.ts modules/profile/__tests__/use-create-team.test.tsx
```

Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add modules/profile/lib/use-create-team.ts modules/profile/__tests__/use-create-team.test.tsx
git commit -m "feat(profile): useCreateTeam hook — mint doc + batched signed dispatch"
```

---

## Task 6: Stepper component

**Files:**

- Create: `app/profile/create-team/components/stepper.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/profile/create-team/components/stepper.tsx
'use client'
import { Check } from 'lucide-react'
import { cn } from '@/modules/shared/lib/utils'

export type StepKey = 'identity' | 'brand' | 'socials' | 'members'
export const STEPS: { key: StepKey; label: string }[] = [
  { key: 'identity', label: 'Identity' },
  { key: 'brand', label: 'Brand' },
  { key: 'socials', label: 'Socials' },
  { key: 'members', label: 'Members' },
]

export function Stepper({ active }: { active: StepKey }) {
  const activeIdx = STEPS.findIndex((s) => s.key === active)
  return (
    <ol className="mb-8 flex items-center gap-3">
      {STEPS.map((step, i) => {
        const status = i < activeIdx ? 'done' : i === activeIdx ? 'active' : 'pending'
        return (
          <li key={step.key} className="flex items-center gap-2">
            <span
              className={cn(
                'flex size-7 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                status === 'done' && 'bg-primary border-primary text-primary-foreground',
                status === 'active' && 'border-primary text-primary',
                status === 'pending' && 'border-muted-foreground/40 text-muted-foreground',
              )}
            >
              {status === 'done' ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span
              className={cn(
                'text-sm font-medium transition-colors',
                status === 'pending' && 'text-muted-foreground',
              )}
            >
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <span
                className={cn(
                  'mx-1 hidden h-px w-8 sm:inline-block',
                  status === 'done' ? 'bg-primary' : 'bg-muted-foreground/30',
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/profile/create-team/components/stepper.tsx
git commit -m "feat(profile): Stepper component for create-team wizard"
```

---

## Task 7: SubmitBar component

**Files:**

- Create: `app/profile/create-team/components/submit-bar.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/profile/create-team/components/submit-bar.tsx
'use client'
import { ChevronLeft, ChevronRight, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/modules/shared/components/ui/button'

export function SubmitBar({
  onBack,
  onNext,
  canBack,
  canNext,
  isLast,
  isSubmitting,
}: {
  onBack: () => void
  onNext: () => void
  canBack: boolean
  canNext: boolean
  isLast: boolean
  isSubmitting: boolean
}) {
  return (
    <div className="mt-8 flex items-center justify-between border-t pt-6">
      <Button variant="outline" onClick={onBack} disabled={!canBack || isSubmitting}>
        <ChevronLeft className="mr-1 size-4" />
        Back
      </Button>
      <Button onClick={onNext} disabled={!canNext || isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Creating…
          </>
        ) : isLast ? (
          <>
            <Sparkles className="mr-2 size-4" />
            Create team
          </>
        ) : (
          <>
            Next
            <ChevronRight className="ml-1 size-4" />
          </>
        )}
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/profile/create-team/components/submit-bar.tsx
git commit -m "feat(profile): SubmitBar component"
```

---

## Task 8: StepIdentity component (TDD)

**Files:**

- Create: `app/profile/create-team/components/step-identity.tsx`
- Create: `app/profile/create-team/components/__tests__/step-identity.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// app/profile/create-team/components/__tests__/step-identity.test.tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@/modules/profile/lib/use-slug-availability', () => ({
  useSlugAvailability: vi.fn(),
}))
import { useSlugAvailability } from '@/modules/profile/lib/use-slug-availability'
import { StepIdentity } from '../step-identity'

const useSlugMock = useSlugAvailability as unknown as ReturnType<typeof vi.fn>

describe('StepIdentity', () => {
  it('auto-suggests slug from name', () => {
    useSlugMock.mockReturnValue('idle')
    const set = vi.fn()
    render(<StepIdentity name="" slug="" onChange={set} />)
    const nameInput = screen.getByLabelText(/team name/i)
    fireEvent.change(nameInput, { target: { value: 'Acme Corp' } })
    expect(set).toHaveBeenCalledWith({ name: 'Acme Corp', slug: 'acme-corp' })
  })

  it('shows checking status', () => {
    useSlugMock.mockReturnValue('checking')
    render(<StepIdentity name="Acme" slug="acme" onChange={vi.fn()} />)
    expect(screen.getByText(/checking/i)).toBeTruthy()
  })

  it('shows available status', () => {
    useSlugMock.mockReturnValue('available')
    render(<StepIdentity name="Acme" slug="acme" onChange={vi.fn()} />)
    expect(screen.getByText(/available/i)).toBeTruthy()
  })

  it('shows taken status', () => {
    useSlugMock.mockReturnValue('taken')
    render(<StepIdentity name="Acme" slug="acme" onChange={vi.fn()} />)
    expect(screen.getByText(/taken/i)).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run, confirm fails**

```bash
npx vitest run --config vitest.unit.config.ts app/profile/create-team/components/__tests__/step-identity.test.tsx
```

Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```tsx
// app/profile/create-team/components/step-identity.tsx
'use client'
import { Check, Loader2, X } from 'lucide-react'
import { useSlugAvailability } from '@/modules/profile/lib/use-slug-availability'
import { isValidSlug, slugify } from '@/modules/profile/lib/validations'
import { cn } from '@/modules/shared/lib/utils'

export function StepIdentity({
  name,
  slug,
  onChange,
}: {
  name: string
  slug: string
  onChange: (next: { name: string; slug: string }) => void
}) {
  const slugStatus = useSlugAvailability(slug, isValidSlug(slug))

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="team-name" className="mb-1 block text-sm font-medium">
          Team name
        </label>
        <input
          id="team-name"
          className="bg-background focus:ring-primary w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          placeholder="Acme Corp"
          value={name}
          maxLength={60}
          onChange={(e) => {
            const nextName = e.target.value
            // Auto-suggest slug if it matches the previous auto-slug or is empty.
            const previousAuto = slugify(name)
            const next = slug === previousAuto || slug === '' ? slugify(nextName) : slug
            onChange({ name: nextName, slug: next })
          }}
        />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="team-slug" className="text-sm font-medium">
            URL slug
          </label>
          <SlugStatus status={slugStatus} />
        </div>
        <div className="bg-background focus-within:ring-primary flex items-stretch rounded-md border focus-within:ring-2">
          <span className="text-muted-foreground border-r px-3 py-2 text-sm">
            vetra.to/builders/
          </span>
          <input
            id="team-slug"
            className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none"
            placeholder="acme-corp"
            value={slug}
            maxLength={40}
            onChange={(e) => onChange({ name, slug: e.target.value })}
          />
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          Lowercase letters, numbers, and dashes. 3–40 characters.
        </p>
      </div>
    </div>
  )
}

function SlugStatus({ status }: { status: 'idle' | 'checking' | 'available' | 'taken' | 'error' }) {
  if (status === 'idle') return null
  const map = {
    checking: {
      icon: <Loader2 className="size-3 animate-spin" />,
      label: 'Checking',
      cls: 'text-muted-foreground',
    },
    available: {
      icon: <Check className="size-3" />,
      label: 'Available',
      cls: 'text-green-600 dark:text-green-500',
    },
    taken: { icon: <X className="size-3" />, label: 'Taken', cls: 'text-destructive' },
    error: {
      icon: <X className="size-3" />,
      label: "Couldn't check",
      cls: 'text-muted-foreground',
    },
  }[status]
  return (
    <span className={cn('flex items-center gap-1 text-xs font-medium', map.cls)}>
      {map.icon}
      {map.label}
    </span>
  )
}
```

- [ ] **Step 4: Adjust test to use `toBeTruthy()` (vitest doesn't bundle jest-dom in this repo)**

The test already uses `toBeTruthy()` — no change.

- [ ] **Step 5: Run, confirm passes**

```bash
npx vitest run --config vitest.unit.config.ts app/profile/create-team/components/__tests__/step-identity.test.tsx
```

Expected: PASS, 4 tests.

- [ ] **Step 6: Commit**

```bash
git add app/profile/create-team/components/step-identity.tsx app/profile/create-team/components/__tests__/step-identity.test.tsx
git commit -m "feat(profile): StepIdentity with live slug availability"
```

---

## Task 9: StepBrand component

**Files:**

- Create: `app/profile/create-team/components/step-brand.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/profile/create-team/components/step-brand.tsx
'use client'
import { Avatar, AvatarFallback, AvatarImage } from '@/modules/shared/components/ui/avatar'

function initials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase() || '??'
}

export function StepBrand({
  name,
  description,
  profileLogo,
  onChange,
}: {
  name: string
  description: string
  profileLogo: string
  onChange: (patch: { description?: string; profileLogo?: string }) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="team-description" className="text-sm font-medium">
            Description
          </label>
          <span className="text-muted-foreground text-xs">{description.length} / 280</span>
        </div>
        <textarea
          id="team-description"
          className="bg-background focus:ring-primary w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          rows={4}
          maxLength={280}
          placeholder="What does your team build?"
          value={description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor="team-logo" className="mb-1 block text-sm font-medium">
          Logo URL
        </label>
        <div className="flex items-start gap-3">
          <Avatar className="size-12">
            {profileLogo && <AvatarImage src={profileLogo} alt={name || 'Logo preview'} />}
            <AvatarFallback className="bg-muted text-sm font-bold">{initials(name)}</AvatarFallback>
          </Avatar>
          <input
            id="team-logo"
            className="bg-background focus:ring-primary flex-1 rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            placeholder="https://example.com/logo.png"
            value={profileLogo}
            onChange={(e) => onChange({ profileLogo: e.target.value })}
          />
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          Optional. Direct link to a square image (PNG, SVG, JPG). You can edit later.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/profile/create-team/components/step-brand.tsx
git commit -m "feat(profile): StepBrand with live logo preview"
```

---

## Task 10: StepSocials component

**Files:**

- Create: `app/profile/create-team/components/step-socials.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/profile/create-team/components/step-socials.tsx
'use client'
import { Github, Globe } from 'lucide-react'
import XLogo from '@/modules/shared/components/icons/x-logo'
import { isValidUrl } from '@/modules/profile/lib/validations'

type Socials = {
  profileSocialsX: string
  profileSocialsGithub: string
  profileSocialsWebsite: string
}

const FIELDS: {
  key: keyof Socials
  label: string
  placeholder: string
  Icon: React.ComponentType<{ className?: string }>
}[] = [
  {
    key: 'profileSocialsX',
    label: 'X (Twitter)',
    placeholder: 'https://x.com/your-team',
    Icon: ({ className }) => <XLogo className={className} />,
  },
  {
    key: 'profileSocialsGithub',
    label: 'GitHub',
    placeholder: 'https://github.com/your-team',
    Icon: Github,
  },
  {
    key: 'profileSocialsWebsite',
    label: 'Website',
    placeholder: 'https://your-team.com',
    Icon: Globe,
  },
]

export function StepSocials({
  values,
  onChange,
}: {
  values: Socials
  onChange: (patch: Partial<Socials>) => void
}) {
  return (
    <div className="space-y-5">
      {FIELDS.map(({ key, label, placeholder, Icon }) => {
        const v = values[key]
        const invalid = !isValidUrl(v)
        return (
          <div key={key}>
            <label htmlFor={key} className="mb-1 flex items-center gap-1.5 text-sm font-medium">
              <Icon className="size-3.5" />
              {label}
            </label>
            <input
              id={key}
              type="url"
              className="bg-background focus:ring-primary w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              placeholder={placeholder}
              value={v}
              onChange={(e) => onChange({ [key]: e.target.value } as Partial<Socials>)}
            />
            {invalid ? (
              <p className="text-destructive mt-1 text-xs">Must be a valid URL.</p>
            ) : (
              <p className="text-muted-foreground mt-1 text-xs">Optional.</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/profile/create-team/components/step-socials.tsx
git commit -m "feat(profile): StepSocials component"
```

---

## Task 11: StepMembers component (TDD)

**Files:**

- Create: `app/profile/create-team/components/step-members.tsx`
- Create: `app/profile/create-team/components/__tests__/step-members.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// app/profile/create-team/components/__tests__/step-members.test.tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@/modules/profile/lib/use-ens-resolver', () => ({
  useEnsResolver: vi.fn(() => null),
}))
import { StepMembers } from '../step-members'

describe('StepMembers', () => {
  it('shows creator pinned at top, not removable', () => {
    render(
      <StepMembers
        creator={{ address: '0xabc', displayName: 'Frank', displayAddress: '0xa…bc' }}
        members={[]}
        onChange={vi.fn()}
      />,
    )
    expect(screen.getByText(/Frank/)).toBeTruthy()
    expect(screen.getByText(/admin/i)).toBeTruthy()
  })

  it('adds a row when Add member is clicked', () => {
    const onChange = vi.fn()
    render(
      <StepMembers
        creator={{ address: '0xabc', displayName: 'Frank', displayAddress: '0xa…bc' }}
        members={[]}
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /add member/i }))
    expect(onChange).toHaveBeenCalledWith([{ address: '' }])
  })

  it('removes a row when remove button is clicked', () => {
    const onChange = vi.fn()
    render(
      <StepMembers
        creator={{ address: '0xabc', displayName: 'Frank', displayAddress: '0xa…bc' }}
        members={[{ address: '0x' + 'd'.repeat(40) }]}
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /remove/i }))
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('flags duplicate of creator address', () => {
    render(
      <StepMembers
        creator={{ address: '0x' + 'a'.repeat(40), displayName: 'Frank', displayAddress: '' }}
        members={[{ address: '0x' + 'a'.repeat(40) }]}
        onChange={vi.fn()}
      />,
    )
    expect(screen.getByText(/already invited/i)).toBeTruthy()
  })

  it('flags invalid address', () => {
    render(
      <StepMembers
        creator={{ address: '0xabc', displayName: 'Frank', displayAddress: '' }}
        members={[{ address: 'not-an-address' }]}
        onChange={vi.fn()}
      />,
    )
    expect(screen.getByText(/0x… address/i)).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run, confirm fails**

```bash
npx vitest run --config vitest.unit.config.ts app/profile/create-team/components/__tests__/step-members.test.tsx
```

Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```tsx
// app/profile/create-team/components/step-members.tsx
'use client'
import { Plus, ShieldCheck, X } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/modules/shared/components/ui/avatar'
import { Button } from '@/modules/shared/components/ui/button'
import { useEnsResolver } from '@/modules/profile/lib/use-ens-resolver'
import { isValidEthAddress } from '@/modules/profile/lib/validations'

export type MemberRow = { address: string }
export type StepMembersProps = {
  creator: { address: string; displayName: string | undefined; displayAddress: string | undefined }
  members: MemberRow[]
  onChange: (next: MemberRow[]) => void
}

export function StepMembers({ creator, members, onChange }: StepMembersProps) {
  const addRow = () => onChange([...members, { address: '' }])
  const updateRow = (i: number, address: string) => {
    const next = members.slice()
    next[i] = { address }
    onChange(next)
  }
  const removeRow = (i: number) => {
    const next = members.slice()
    next.splice(i, 1)
    onChange(next)
  }

  return (
    <div className="space-y-4">
      <div className="bg-muted/40 flex items-center gap-3 rounded-md border p-3">
        <Avatar className="size-9">
          <AvatarFallback className="bg-primary/15 text-primary">
            <ShieldCheck className="size-4" />
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">{creator.displayName ?? 'You'}</div>
          <div className="text-muted-foreground font-mono text-xs">
            {creator.displayAddress ?? creator.address}
          </div>
        </div>
        <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          You — admin
        </span>
      </div>

      {members.map((m, i) => (
        <MemberInviteRow
          key={i}
          address={m.address}
          creator={creator.address}
          others={members.filter((_, j) => j !== i).map((x) => x.address)}
          onChange={(v) => updateRow(i, v)}
          onRemove={() => removeRow(i)}
        />
      ))}

      <Button variant="outline" size="sm" onClick={addRow}>
        <Plus className="mr-1.5 size-3.5" />
        Add member
      </Button>
    </div>
  )
}

function MemberInviteRow({
  address,
  creator,
  others,
  onChange,
  onRemove,
}: {
  address: string
  creator: string
  others: string[]
  onChange: (v: string) => void
  onRemove: () => void
}) {
  const ens = useEnsResolver(address)
  const invalid = address !== '' && !isValidEthAddress(address)
  const dup =
    address !== '' &&
    (address.toLowerCase() === creator.toLowerCase() ||
      others.some((o) => o.toLowerCase() === address.toLowerCase()))
  const error = invalid ? 'Must be a 0x… address.' : dup ? 'Already invited.' : null
  return (
    <div>
      <div className="flex items-start gap-2">
        <input
          className="bg-background focus:ring-primary flex-1 rounded-md border px-3 py-2 font-mono text-sm focus:ring-2 focus:outline-none"
          placeholder="0x…"
          value={address}
          onChange={(e) => onChange(e.target.value)}
        />
        <Button variant="ghost" size="icon" onClick={onRemove} aria-label="Remove">
          <X className="size-4" />
        </Button>
      </div>
      {ens && !error && <p className="text-muted-foreground mt-1 pl-1 text-xs">→ {ens}</p>}
      {error && <p className="text-destructive mt-1 pl-1 text-xs">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 4: Run, confirm passes**

```bash
npx vitest run --config vitest.unit.config.ts app/profile/create-team/components/__tests__/step-members.test.tsx
```

Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add app/profile/create-team/components/step-members.tsx app/profile/create-team/components/__tests__/step-members.test.tsx
git commit -m "feat(profile): StepMembers with ENS lookup + dedupe + validation"
```

---

## Task 12: /profile/create-team page (route + form state)

**Files:**

- Create: `app/profile/create-team/page.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/profile/create-team/page.tsx
'use client'
import { useRenownAuth } from '@powerhousedao/reactor-browser'
import { Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useMemo, useState } from 'react'
import { LoginPrompt } from '../components/login-prompt'
import { Stepper, STEPS, type StepKey } from './components/stepper'
import { StepIdentity } from './components/step-identity'
import { StepBrand } from './components/step-brand'
import { StepSocials } from './components/step-socials'
import { StepMembers, type MemberRow } from './components/step-members'
import { SubmitBar } from './components/submit-bar'
import { isValidEthAddress, isValidSlug, isValidUrl } from '@/modules/profile/lib/validations'
import { useCreateTeam, type CreateTeamForm } from '@/modules/profile/lib/use-create-team'
import { useSlugAvailability } from '@/modules/profile/lib/use-slug-availability'
import { usePHToast } from '@powerhousedao/reactor-browser'

const DRIVE_ID = 'vetra-builder-package'

const emptyForm: CreateTeamForm = {
  name: '',
  slug: '',
  description: '',
  profileLogo: '',
  profileSocialsX: '',
  profileSocialsGithub: '',
  profileSocialsWebsite: '',
  members: [{ address: '' }],
}

function CreateTeamInner() {
  const auth = useRenownAuth()
  const router = useRouter()
  const params = useSearchParams()
  const toast = usePHToast()
  const stepParam = params.get('step')
  const stepIdx = Math.max(0, Math.min(STEPS.length - 1, parseInt(stepParam ?? '1', 10) - 1 || 0))
  const activeStep: StepKey = STEPS[stepIdx].key

  const [form, setForm] = useState<CreateTeamForm>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const slugStatus = useSlugAvailability(form.slug, isValidSlug(form.slug))

  const goToStep = useCallback(
    (idx: number) => {
      const sp = new URLSearchParams(params.toString())
      sp.set('step', String(idx + 1))
      router.replace(`/profile/create-team?${sp.toString()}`, { scroll: false })
    },
    [params, router],
  )

  const { createTeam } = useCreateTeam({
    driveId: DRIVE_ID,
    creatorAddress: auth.address ?? '',
  })

  const validMembers = useMemo(() => {
    const creator = (auth.address ?? '').toLowerCase()
    return form.members.filter((m) => {
      if (m.address === '') return true // empty rows are allowed (stripped on submit)
      if (!isValidEthAddress(m.address)) return false
      if (m.address.toLowerCase() === creator) return false
      return (
        form.members.findIndex((x) => x.address.toLowerCase() === m.address.toLowerCase()) ===
        form.members.indexOf(m)
      )
    })
  }, [form.members, auth.address])

  const canAdvance = useMemo(() => {
    switch (activeStep) {
      case 'identity':
        return form.name.length > 0 && isValidSlug(form.slug) && slugStatus === 'available'
      case 'brand':
        return true
      case 'socials':
        return (
          isValidUrl(form.profileSocialsX) &&
          isValidUrl(form.profileSocialsGithub) &&
          isValidUrl(form.profileSocialsWebsite)
        )
      case 'members':
        return validMembers.length === form.members.length
    }
  }, [activeStep, form, slugStatus, validMembers])

  if (auth.status === 'loading' || auth.status === 'checking') {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-8">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    )
  }
  if (auth.status !== 'authorized' || !auth.address) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoginPrompt onLogin={auth.login} />
      </div>
    )
  }

  const onNext = async () => {
    if (stepIdx < STEPS.length - 1) {
      goToStep(stepIdx + 1)
      return
    }
    // Final submit
    setSubmitting(true)
    try {
      const cleaned: CreateTeamForm = {
        ...form,
        members: form.members.filter((m) => m.address !== ''),
      }
      await createTeam(cleaned)
      toast?.({ type: 'success', message: 'Team created' })
      router.push(`/builders/${form.slug}`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong'
      toast?.({ type: 'error', message: `Couldn't create team — ${msg}` })
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Create new team</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Set up your team&apos;s profile and invite your first members.
        </p>
      </div>
      <Stepper active={activeStep} />
      {activeStep === 'identity' && (
        <StepIdentity
          name={form.name}
          slug={form.slug}
          onChange={(v) => setForm((f) => ({ ...f, ...v }))}
        />
      )}
      {activeStep === 'brand' && (
        <StepBrand
          name={form.name}
          description={form.description}
          profileLogo={form.profileLogo}
          onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
        />
      )}
      {activeStep === 'socials' && (
        <StepSocials
          values={{
            profileSocialsX: form.profileSocialsX,
            profileSocialsGithub: form.profileSocialsGithub,
            profileSocialsWebsite: form.profileSocialsWebsite,
          }}
          onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
        />
      )}
      {activeStep === 'members' && (
        <StepMembers
          creator={{
            address: auth.address,
            displayName: auth.displayName,
            displayAddress: auth.displayAddress,
          }}
          members={form.members}
          onChange={(members: MemberRow[]) => setForm((f) => ({ ...f, members }))}
        />
      )}
      <SubmitBar
        canBack={stepIdx > 0}
        canNext={canAdvance}
        isLast={stepIdx === STEPS.length - 1}
        isSubmitting={submitting}
        onBack={() => goToStep(stepIdx - 1)}
        onNext={onNext}
      />
    </div>
  )
}

export default function CreateTeamPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-8">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
        </div>
      }
    >
      <CreateTeamInner />
    </Suspense>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/profile/create-team/page.tsx
git commit -m "feat(profile): /profile/create-team route — wizard host + submit"
```

---

## Task 13: Wire CTA in /profile teams tab header + empty state

**Files:**

- Modify: `app/profile/page.tsx`
- Modify: `app/profile/components/teams-tab.tsx`

- [ ] **Step 1: Add header CTA**

Open `app/profile/page.tsx`. Replace the header block (where `<h1>My profile</h1>` lives) with a flex container that hosts the title block + a right-aligned "Create team" button. Use `Link` from `next/link` and `Button` from `@/modules/shared/components/ui/button`. Show only when the active tab is "teams" — use `useSearchParams` to read `tab`.

Concretely, replace this region in `app/profile/page.tsx`:

```tsx
<div className="mb-8">
  <h1 className="text-2xl font-bold tracking-tight">My profile</h1>
  <p className="text-muted-foreground mt-1 text-sm">
    Teams you&apos;re a member of, packages you&apos;ve published, and account settings.
  </p>
</div>
```

with:

```tsx
<div className="mb-8 flex flex-wrap items-start justify-between gap-3">
  <div>
    <h1 className="text-2xl font-bold tracking-tight">My profile</h1>
    <p className="text-muted-foreground mt-1 text-sm">
      Teams you&apos;re a member of, packages you&apos;ve published, and account settings.
    </p>
  </div>
  {showCreateButton && (
    <Button asChild>
      <Link href="/profile/create-team">
        <Plus className="mr-1.5 size-4" />
        Create team
      </Link>
    </Button>
  )}
</div>
```

And at the top of the file, add the imports + the `showCreateButton` logic (driven by the URL `?tab=` param, default `teams`):

```tsx
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/modules/shared/components/ui/button'
```

Inside `ProfilePageInner`, after the existing hooks:

```tsx
const params = useSearchParams()
const showCreateButton = (params.get('tab') ?? 'teams') === 'teams'
```

(Assuming `useSearchParams` isn't already imported — if it is, leave the existing import.)

- [ ] **Step 2: Add empty-state CTA**

Open `app/profile/components/teams-tab.tsx`. In the empty-state card (where the "Browse builders" link lives), add a primary button above the descriptive paragraph:

```tsx
import Link from 'next/link'
import { Button } from '@/modules/shared/components/ui/button'
import { Plus, Users } from 'lucide-react'
```

Replace the empty state's `<Card><CardContent>…</CardContent></Card>` block with:

```tsx
<Card>
  <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
    <div className="bg-muted flex size-12 items-center justify-center rounded-full">
      <Users className="text-muted-foreground size-6" />
    </div>
    <div>
      <h3 className="text-base font-semibold">You&apos;re not in any builder team yet</h3>
      <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
        Create your first team to start showcasing what you&apos;re building, or browse the
        ecosystem to find one to join.
      </p>
    </div>
    <div className="flex gap-2">
      <Button asChild>
        <Link href="/profile/create-team">
          <Plus className="mr-1.5 size-4" />
          Create your first team
        </Link>
      </Button>
      <Button variant="outline" asChild>
        <Link href="/builders">Browse builders</Link>
      </Button>
    </div>
  </CardContent>
</Card>
```

- [ ] **Step 3: Type-check**

```bash
rm -rf .next
npm run tsc 2>&1 | tail -10
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add app/profile/page.tsx app/profile/components/teams-tab.tsx
git commit -m "feat(profile): CTAs into create-team wizard (header + empty state)"
```

---

## Task 14: Final verification + dev-server walkthrough + UI/UX polish

- [ ] **Step 1: Lint + typecheck + all unit tests**

```bash
cd /home/froid/projects/powerhouse/vetra.to
npm run lint && npm run tsc && npx vitest run --config vitest.unit.config.ts
```

Expected: lint warnings only (pre-existing); typecheck clean; vitest all green.

- [ ] **Step 2: Start dev server**

```bash
npm run dev
```

- [ ] **Step 3: Manual walkthrough**

Open `http://localhost:3000/profile?tab=teams`. Walk through:

1. ✅ Not logged in — LoginPrompt shows.
2. Log in via Renown.
3. ✅ Header shows "Create team" button right of "My profile".
4. ✅ If no teams: empty-state has "Create your first team" CTA.
5. Click "Create team" → `/profile/create-team` opens.
6. ✅ Stepper shows 4 dots, "Identity" active.
7. Type a team name → ✅ slug auto-fills with slugified version.
8. Watch the slug status: typing fast shows "Checking…", debounced 300ms, then ✓ Available.
9. Click "Next" → URL becomes `?step=2`; "Identity" gets a checkmark; "Brand" is active.
10. Type a description (counter updates), paste a logo URL → ✅ avatar preview updates live.
11. Next → Socials; type invalid URL → "Must be a valid URL" inline; type valid → clears.
12. Next → Members. ✅ Pinned creator card at top with display name + "You — admin".
13. Empty member row already present. Type a valid 0x… address → no error. Type invalid → "Must be a 0x… address."
14. Type same as creator address → "Already invited."
15. Click "Add member" → another row.
16. Click "Create team" → Renown signing prompt appears with the action batch.
17. Sign → toast "Team created" → redirect to `/builders/[slug]`.
18. ✅ The public team page renders with name, description, logo, socials, members.
19. Refresh `/profile?tab=teams` → ✅ the new team shows up in the grid.

If any step fails, fix before merging.

- [ ] **Step 4: Light + dark polish pass**

For each step page, toggle theme. Verify:

- Inputs, helper text, avatar preview render in both themes.
- Stepper dots and connectors have visible contrast.
- Slug `?✓ Available` chip uses green that works in dark mode.
- Submit bar buttons (Back/Next/Create team) match other surfaces.

- [ ] **Step 5: Mobile 375px pass**

Verify:

- Stepper wraps gracefully (connectors hidden under sm:).
- Step content uses full width; inputs aren't clipped.
- Submit bar buttons stack to full width if needed (already flex-row; revisit if cramped).
- Pinned creator card on step 4 doesn't overflow.

Commit any tweaks:

```bash
git add -A
git commit -m "polish(profile): create-team wizard light/dark + mobile pass"
```

(Skip if no tweaks.)

---

## Task 15: Push to staging branch

- [ ] **Step 1: Push feature branch**

```bash
git push -u origin feat/profile-create-team-wizard 2>&1 | tail -3
```

- [ ] **Step 2: Open PR against staging**

```bash
gh pr create --base staging --title "feat(profile): create-team wizard at /profile/create-team" --body "$(cat <<'EOF'
## Summary

Slice E of the builder-teams + packages profile integration. Spec: `docs/superpowers/specs/2026-05-13-create-team-wizard-design.md`. Plan: `docs/superpowers/plans/2026-05-13-create-team-wizard.md`.

Multi-step wizard at \`/profile/create-team\`:
- Step 1: name + slug (live availability check)
- Step 2: description + logo URL (live preview)
- Step 3: socials (X, GitHub, website)
- Step 4: member invites (eth-address + viem mainnet ENS reverse lookup)

Single batched Renown signing event mints the BuilderTeam doc + dispatches all init actions in one call.

## Test plan

- [x] vitest: validations, useSlugAvailability, useCreateTeam, StepIdentity, StepMembers.
- [x] tsc + lint clean.
- [x] Dev-server walkthrough end-to-end: real Renown auth → submit → redirect to \`/builders/[slug]\` → team renders.

## Notes

- Targets the \`vetra-builder-package\` drive (hardcoded; multi-drive support out of scope).
- Logo input is URL-only in this slice; file upload is a future shared component.
- Member adds use \`addMember({id})\` + \`updateMemberInfo({id, ethAddress})\` — the document model splits id allocation from address.

## Follow-ups

- Slice B: edit existing team profile in-app.
- Slice C: add/remove members after creation.
- File upload for logos (shared component).
EOF
)" 2>&1 | tail -3
```

- [ ] **Step 3: Capture the PR URL** for the next iteration.

---

## Out of Scope / Follow-ups

- Multi-drive support (pick which drive the team lives in).
- File upload for logo (shared component for many surfaces).
- Edit a team after creation (slice B).
- Add/remove members after creation (slice C).
- Slug propagation toast/spinner if the read-side processor lags >5s.
- Permission gating (any Renown user can currently create).
