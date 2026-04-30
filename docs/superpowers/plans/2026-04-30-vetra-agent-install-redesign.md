# Vetra.to — Agent Install Flow Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the two-step "install package then enable agent" flow with a single self-contained `AddAgentModal` driven by registry search, hide clint-project packages from the Reactor Modules section, and publish `@powerhousedao/ph-pirate-cli` as the canonical example agent.

**Architecture:** UI-only change in vetra.to plus a manifest fix and a `pnpm publish` in `vetra-cloud-package/ph-pirate`. The system env var contract (`SERVICE_ANNOUNCE_URL/TOKEN/DOCUMENT_ID/PREFIX`) already exists end-to-end (ph-clint reads them, powerhouse-chart injects them) and needs no change.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind, Radix UI, Vitest + RTL, prettier, eslint, ph-publish (for ph-pirate-cli registry push).

**Spec:** `docs/superpowers/specs/2026-04-30-vetra-agent-install-redesign-design.md`

---

## File Structure

### vetra-cloud-package (one repo, two changes)

| Path                                               | Action | Responsibility                                                      |
| -------------------------------------------------- | ------ | ------------------------------------------------------------------- |
| `ph-pirate/ph-pirate-cli/powerhouse.manifest.json` | Modify | Real `features.agent`, declare `MODEL` / `ANTHROPIC_API_KEY` config |

### vetra.to (current branch: `feat/clint-service-support`)

| Path                                               | Action | Responsibility                                                                           |
| -------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| `modules/cloud/components/add-agent-modal.tsx`     | Create | New self-contained agent install modal (registry search + manifest + config + submit)    |
| `modules/cloud/components/enable-clint-modal.tsx`  | Delete | Replaced by `add-agent-modal.tsx`                                                        |
| `modules/cloud/components/agents-section.tsx`      | Modify | Empty-state copy update                                                                  |
| `modules/cloud/lib/agent-discovery.ts`             | Create | Pure helpers: `isAgentPackageName`, `validateAgentManifest`, `composeServiceAnnounceUrl` |
| `modules/cloud/lib/system-env-vars.ts`             | Create | Pure helpers: `RESERVED_ENV_NAMES`, `buildSystemEnvPreview`                              |
| `modules/cloud/__tests__/add-agent-modal.test.tsx` | Create | Vitest + RTL integration test for the modal                                              |
| `modules/cloud/__tests__/agent-discovery.test.ts`  | Create | Unit tests for the helpers                                                               |
| `modules/cloud/__tests__/system-env-vars.test.ts`  | Create | Unit tests for env-var helpers                                                           |
| `app/cloud/[project]/tabs/overview.tsx`            | Modify | Wire `AddAgentModal`, filter clint-project packages from Reactor Modules card            |

---

## Cross-repo gating

Phase A (vetra-cloud-package manifest fix + publish) is **blocking** for end-to-end validation in Phase D, but **not** blocking for Phases B–C (UI work tests against mocked registry/manifest).

Sequencing:

1. Phase A: do it first so the dev registry has a real example. Independent of UI changes.
2. Phase B–C: in parallel-ish; they live on `feat/clint-service-support` branch in vetra.to.
3. Phase D: validation against a deployed dev env, after A merges and B–C ship.

---

## Phase A — Publish ph-pirate-cli to dev registry

### Task A.1: Fix the ph-pirate-cli manifest

**Files:**

- Modify: `/home/froid/projects/powerhouse/vetra-cloud-package/ph-pirate/ph-pirate-cli/powerhouse.manifest.json`

- [ ] **Step 1: Inspect the current state**

```bash
cat /home/froid/projects/powerhouse/vetra-cloud-package/ph-pirate/ph-pirate-cli/powerhouse.manifest.json
```

Expected: `features.agent` is `false`, no `config` array.

- [ ] **Step 2: Replace the manifest with the corrected version**

Write `/home/froid/projects/powerhouse/vetra-cloud-package/ph-pirate/ph-pirate-cli/powerhouse.manifest.json`:

```json
{
  "type": "clint-project",
  "features": {
    "agent": {
      "id": "ph-pirate",
      "name": "Pirate",
      "description": "arr — example agent that streams pirate-themed responses",
      "image": "https://i.etsystatic.com/23517656/r/il/de3780/2541111757/il_570xN.2541111757_2h0x.jpg",
      "models": [{ "id": "anthropic/claude-sonnet-4-5", "default": true }]
    },
    "powerhouse": {
      "support": "Switchboard",
      "package": "@powerhousedao/ph-pirate-app"
    }
  },
  "serviceCommand": "ph-pirate",
  "serviceAnnouncement": true,
  "supportedResources": ["vetra-agent-s", "vetra-agent-m"],
  "config": [
    {
      "name": "MODEL",
      "type": "var",
      "description": "LLM model for the agent",
      "required": false,
      "default": "anthropic/claude-sonnet-4-5"
    },
    {
      "name": "ANTHROPIC_API_KEY",
      "type": "secret",
      "description": "Anthropic API key — required when using an Anthropic model",
      "required": true
    }
  ]
}
```

- [ ] **Step 3: Validate the manifest parses against vetra.to's Zod schema**

From vetra.to:

```bash
cd /home/froid/projects/powerhouse/vetra.to
node -e "
  import('./modules/cloud/config/types.js').then(({ PackageManifestSchema }) => {
    const m = require('/home/froid/projects/powerhouse/vetra-cloud-package/ph-pirate/ph-pirate-cli/powerhouse.manifest.json')
    console.log(JSON.stringify(PackageManifestSchema.parse(m), null, 2))
  })
"
```

If the project doesn't expose `PackageManifestSchema` as a runtime export (it's a `.ts` source file), skip this step and rely on the in-app test in Task B.3.

- [ ] **Step 4: Verify ph-pirate's package.json declares the correct package name and version**

```bash
cat /home/froid/projects/powerhouse/vetra-cloud-package/ph-pirate/ph-pirate-cli/package.json | head -5
```

Expected: `"name": "@powerhousedao/ph-pirate-cli"`, `"version": "0.1.0-dev.1"` (or similar dev tag).

### Task A.2: Build and publish to registry.dev.vetra.io

**Files:** none modified; this is a publish step.

- [ ] **Step 1: Build the package**

```bash
cd /home/froid/projects/powerhouse/vetra-cloud-package/ph-pirate
pnpm build
```

Expected: clean exit; `ph-pirate-cli/dist/` populated; `ph-pirate-cli/.ph/` build cache present.

If build fails for unrelated reasons (e.g. ph-pirate-app build error), stop and surface to the user — Phase A blocks on a clean build of both packages in the group.

- [ ] **Step 2: Dry-run publish to inspect what would be uploaded**

```bash
cd /home/froid/projects/powerhouse/vetra-cloud-package/ph-pirate
pnpm publish:dev --dry-run
```

Expected: log lines for `ph-pirate-app` and `ph-pirate-cli`, target registry `https://registry.dev.vetra.io`, and the manifest content matches what was written in Task A.1.

- [ ] **Step 3: Publish for real**

```bash
cd /home/froid/projects/powerhouse/vetra-cloud-package/ph-pirate
pnpm publish:dev
```

Expected: success log with new prerelease versions (e.g. `0.1.0-dev.2`).

- [ ] **Step 4: Verify the registry has the package**

```bash
curl -s https://registry.dev.vetra.io/@powerhousedao/ph-pirate-cli | jq '. | { name, "dist-tags", versions: (.versions | keys) }'
```

Expected: JSON with the published version under `dist-tags.dev` and present in the `versions` keys.

- [ ] **Step 5: Verify the manifest endpoint returns the corrected manifest**

```bash
curl -s 'https://registry.dev.vetra.io/api/registry/manifest?package=%40powerhousedao%2Fph-pirate-cli' | jq '. | { type, features: (.features | keys), config: (.config | length) }'
```

Expected: `type === "clint-project"`, `features` includes `agent` and `powerhouse`, `config` length is 2.

**Note**: the exact registry-side manifest endpoint may differ. Check `/api/registry/manifest` proxy convention used by vetra.to (see `app/api/registry/manifest/route.ts`). If different, use that path.

- [ ] **Step 6: Smoke test from vetra.to's dev session**

```bash
cd /home/froid/projects/powerhouse/vetra.to
pnpm dev
# In another terminal:
curl -s 'http://localhost:3000/api/registry/packages?registry=https%3A%2F%2Fregistry.dev.vetra.io&search=pirate' | jq '.'
```

Expected: array containing `@powerhousedao/ph-pirate-cli` with name ending in `-cli`.

---

## Phase B — `AddAgentModal` in vetra.to

All tasks in Phase B are on the existing `feat/clint-service-support` branch in `/home/froid/projects/powerhouse/vetra.to`.

### Task B.1: Pure helpers + tests for agent discovery

**Files:**

- Create: `modules/cloud/lib/agent-discovery.ts`
- Create: `modules/cloud/__tests__/agent-discovery.test.ts`

- [ ] **Step 1: Write the failing test**

Create `modules/cloud/__tests__/agent-discovery.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { isAgentPackageName, validateAgentManifest } from '@/modules/cloud/lib/agent-discovery'
import type { PackageManifest } from '@/modules/cloud/config/types'

describe('isAgentPackageName', () => {
  it('accepts names ending in -cli', () => {
    expect(isAgentPackageName('@powerhousedao/ph-pirate-cli')).toBe(true)
    expect(isAgentPackageName('foo-cli')).toBe(true)
  })
  it('rejects names not ending in -cli', () => {
    expect(isAgentPackageName('@powerhousedao/ph-pirate')).toBe(false)
    expect(isAgentPackageName('foo-cli-tools')).toBe(false)
    expect(isAgentPackageName('')).toBe(false)
  })
})

describe('validateAgentManifest', () => {
  const okManifest: PackageManifest = {
    name: '@powerhousedao/ph-pirate-cli',
    type: 'clint-project',
    features: { agent: { id: 'ph-pirate', name: 'Pirate' } },
  }
  it('returns ok=true on a clint-project manifest', () => {
    expect(validateAgentManifest(okManifest)).toEqual({ ok: true, manifest: okManifest })
  })
  it('returns ok=false when manifest is null', () => {
    const result = validateAgentManifest(null)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('manifest-missing')
  })
  it('returns ok=false when type is not clint-project', () => {
    const result = validateAgentManifest({ ...okManifest, type: 'doc-model' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('not-clint')
  })
})
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
pnpm vitest --run modules/cloud/__tests__/agent-discovery.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the helpers**

Create `modules/cloud/lib/agent-discovery.ts`:

```ts
import type { PackageManifest } from '@/modules/cloud/config/types'

/**
 * Agents are published as packages whose name ends in `-cli`. The suffix is
 * a fast registry-search filter; manifest validation (below) is the
 * authoritative check before installation proceeds.
 */
export function isAgentPackageName(name: string): boolean {
  return name.length > 4 && name.endsWith('-cli')
}

export type AgentManifestValidation =
  | { ok: true; manifest: PackageManifest }
  | { ok: false; reason: 'manifest-missing' | 'not-clint' }

/** Validate a registry-fetched manifest as an installable agent. */
export function validateAgentManifest(manifest: PackageManifest | null): AgentManifestValidation {
  if (!manifest) return { ok: false, reason: 'manifest-missing' }
  if (manifest.type !== 'clint-project') return { ok: false, reason: 'not-clint' }
  return { ok: true, manifest }
}
```

- [ ] **Step 4: Run the test to confirm it passes**

```bash
pnpm vitest --run modules/cloud/__tests__/agent-discovery.test.ts
```

Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add modules/cloud/lib/agent-discovery.ts modules/cloud/__tests__/agent-discovery.test.ts
git commit -m "feat(cloud): agent-discovery helpers (name + manifest validation)"
```

### Task B.2: System env var helpers + tests

**Files:**

- Create: `modules/cloud/lib/system-env-vars.ts`
- Create: `modules/cloud/__tests__/system-env-vars.test.ts`

- [ ] **Step 1: Write the failing test**

Create `modules/cloud/__tests__/system-env-vars.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  RESERVED_ENV_NAMES,
  buildSystemEnvPreview,
  isReservedEnvName,
} from '@/modules/cloud/lib/system-env-vars'

describe('RESERVED_ENV_NAMES', () => {
  it('includes the four SERVICE_* vars and NODE_OPTIONS', () => {
    expect(RESERVED_ENV_NAMES).toEqual(
      expect.arrayContaining([
        'SERVICE_ANNOUNCE_URL',
        'SERVICE_ANNOUNCE_TOKEN',
        'SERVICE_DOCUMENT_ID',
        'SERVICE_PREFIX',
        'NODE_OPTIONS',
      ]),
    )
  })
})

describe('isReservedEnvName', () => {
  it('matches reserved names', () => {
    expect(isReservedEnvName('SERVICE_PREFIX')).toBe(true)
    expect(isReservedEnvName('NODE_OPTIONS')).toBe(true)
  })
  it('does not match user names', () => {
    expect(isReservedEnvName('MODEL')).toBe(false)
    expect(isReservedEnvName('SERVICE')).toBe(false)
  })
})

describe('buildSystemEnvPreview', () => {
  it('returns a row per reserved var with computed values', () => {
    const rows = buildSystemEnvPreview({
      environmentId: 'doc-123',
      prefix: 'pirate',
    })
    const byName = Object.fromEntries(rows.map((r) => [r.name, r]))
    expect(byName.SERVICE_ANNOUNCE_URL.preview).toMatch(/^https:\/\//)
    expect(byName.SERVICE_ANNOUNCE_TOKEN.preview).toBe('••••••')
    expect(byName.SERVICE_DOCUMENT_ID.preview).toBe('doc-123')
    expect(byName.SERVICE_PREFIX.preview).toBe('pirate')
  })
  it('shows <prefix-pending> when prefix is empty', () => {
    const rows = buildSystemEnvPreview({ environmentId: 'doc-123', prefix: '' })
    const prefixRow = rows.find((r) => r.name === 'SERVICE_PREFIX')!
    expect(prefixRow.preview).toBe('<prefix-pending>')
  })
})
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
pnpm vitest --run modules/cloud/__tests__/system-env-vars.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement the helpers**

Create `modules/cloud/lib/system-env-vars.ts`:

```ts
/**
 * Env vars the platform sets on every CLINT pod, sourced by ph-clint's
 * announce module from process.env. The names are reserved — user-supplied
 * env vars must not shadow them.
 *
 * Today the announce URL is a single global value (per processor deploy),
 * not derived per-environment, so we render it as a static informational
 * preview. See spec §9 for the open question.
 */
export const SERVICE_ANNOUNCE_URL_PREVIEW = 'https://admin-dev.vetra.io/graphql'

export const RESERVED_ENV_NAMES: readonly string[] = [
  'SERVICE_ANNOUNCE_URL',
  'SERVICE_ANNOUNCE_TOKEN',
  'SERVICE_DOCUMENT_ID',
  'SERVICE_PREFIX',
  'NODE_OPTIONS',
] as const

export function isReservedEnvName(name: string): boolean {
  return RESERVED_ENV_NAMES.includes(name)
}

export type SystemEnvRow = {
  name: string
  preview: string
  helpText?: string
  masked?: boolean
}

/** Compute the read-only preview rows displayed in the modal's System block. */
export function buildSystemEnvPreview({
  environmentId,
  prefix,
}: {
  environmentId: string
  prefix: string
}): SystemEnvRow[] {
  return [
    {
      name: 'SERVICE_ANNOUNCE_URL',
      preview: SERVICE_ANNOUNCE_URL_PREVIEW,
      helpText: 'Where the agent posts its endpoints — set by the platform.',
    },
    {
      name: 'SERVICE_ANNOUNCE_TOKEN',
      preview: '••••••',
      masked: true,
      helpText: 'Minted per-agent on first deploy.',
    },
    {
      name: 'SERVICE_DOCUMENT_ID',
      preview: environmentId,
      helpText: 'This environment’s document ID.',
    },
    {
      name: 'SERVICE_PREFIX',
      preview: prefix || '<prefix-pending>',
      helpText: 'Distinguishes this agent within the environment.',
    },
  ]
}
```

- [ ] **Step 4: Run the test to confirm it passes**

```bash
pnpm vitest --run modules/cloud/__tests__/system-env-vars.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add modules/cloud/lib/system-env-vars.ts modules/cloud/__tests__/system-env-vars.test.ts
git commit -m "feat(cloud): system env var helpers for agent install modal"
```

### Task B.3: AddAgentModal scaffold + pick-agent section

**Files:**

- Create: `modules/cloud/components/add-agent-modal.tsx`
- Create: `modules/cloud/__tests__/add-agent-modal.test.tsx`

- [ ] **Step 1: Write the failing test for the empty open modal**

Create `modules/cloud/__tests__/add-agent-modal.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AddAgentModal } from '@/modules/cloud/components/add-agent-modal'
import type { CloudEnvironment } from '@/modules/cloud/types'

vi.mock('@/modules/cloud/hooks/use-registry-search', () => ({
  useRegistryPackages: () => ({ packages: [], isLoading: false }),
  useRegistryVersions: () => ({ info: null, isLoading: false }),
  useRegistryManifest: () => ({ manifest: null, isLoading: false, error: null }),
  useRegistryManifests: () => ({ manifests: [], isLoading: false }),
}))

vi.mock('@/modules/cloud/hooks/use-tenant-config', () => ({
  useTenantConfig: () => ({ envVars: [], secrets: [] }),
}))

vi.mock('@powerhousedao/reactor-browser', () => ({
  useRenown: () => null,
}))

const fakeEnv: CloudEnvironment = {
  id: 'env-doc-1',
  name: 'env-doc-1',
  documentType: 'vetra-cloud-environment',
  revision: 0,
  createdAtUtcIso: null,
  lastModifiedAtUtcIso: null,
  state: {
    label: 'Test',
    status: 'READY',
    services: [],
    packages: [],
    customDomain: null,
    apexService: null,
    autoUpdateChannel: null,
    genericSubdomain: 'test',
    genericBaseDomain: 'vetra.io',
    defaultPackageRegistry: 'https://registry.dev.vetra.io',
  },
}

describe('AddAgentModal', () => {
  it('renders dialog with title when open', () => {
    render(
      <AddAgentModal
        open
        onOpenChange={() => {}}
        env={fakeEnv}
        registryUrl="https://registry.dev.vetra.io"
        tenantId={null}
        installedPackages={[]}
        onSubmit={async () => {}}
      />,
    )
    expect(screen.queryByText(/add agent/i)).not.toBeNull()
  })

  it('renders the empty-results state for the package picker', () => {
    render(
      <AddAgentModal
        open
        onOpenChange={() => {}}
        env={fakeEnv}
        registryUrl="https://registry.dev.vetra.io"
        tenantId={null}
        installedPackages={[]}
        onSubmit={async () => {}}
      />,
    )
    expect(screen.queryByText(/no agents found/i)).not.toBeNull()
  })
})
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
pnpm vitest --run modules/cloud/__tests__/add-agent-modal.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement minimal AddAgentModal**

Create `modules/cloud/components/add-agent-modal.tsx` with:

- Dialog wrapper (Radix), title "Add Agent".
- Pick-agent combobox using `useRegistryPackages(registryUrl, search)` filtered by `isAgentPackageName`.
- Empty-state copy "No agents found." when no results.

```tsx
'use client'

import { Bot, Loader2, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'

import { isAgentPackageName, validateAgentManifest } from '@/modules/cloud/lib/agent-discovery'
import {
  useRegistryManifest,
  useRegistryPackages,
  useRegistryVersions,
} from '@/modules/cloud/hooks/use-registry-search'
import type { CloudEnvironment, CloudPackage, CloudServiceClintConfig } from '@/modules/cloud/types'
import { Button } from '@/modules/shared/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/modules/shared/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/modules/shared/components/ui/dialog'

export type AddAgentSubmitPayload = {
  packageName: string
  version: string | undefined
  prefix: string
  clintConfig: CloudServiceClintConfig
}

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  env: CloudEnvironment
  registryUrl: string | null
  tenantId: string | null
  installedPackages: CloudPackage[]
  onSubmit: (payload: AddAgentSubmitPayload) => Promise<void>
}

export function AddAgentModal({
  open,
  onOpenChange,
  env,
  registryUrl,
  tenantId,
  installedPackages,
  onSubmit,
}: Props) {
  const [search, setSearch] = useState('')
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)

  const { packages, isLoading: packagesLoading } = useRegistryPackages(registryUrl, search)

  const agentPackages = useMemo(
    () => packages.filter((p) => isAgentPackageName(p.name)),
    [packages],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Agent</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Pick an agent</label>
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search agents (packages ending in -cli)…"
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                {packagesLoading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                  </div>
                )}
                {!packagesLoading && agentPackages.length === 0 && (
                  <CommandEmpty>
                    {registryUrl ? 'No agents found.' : 'No registry configured.'}
                  </CommandEmpty>
                )}
                <CommandGroup>
                  {agentPackages.map((pkg) => (
                    <CommandItem
                      key={pkg.name}
                      value={pkg.name}
                      onSelect={() => setSelectedPackage(pkg.name)}
                    >
                      <Bot className="text-muted-foreground mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">{pkg.name}</span>
                        <span className="text-muted-foreground text-xs">latest: {pkg.version}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled>Install agent</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 4: Run the test to confirm it passes**

```bash
pnpm vitest --run modules/cloud/__tests__/add-agent-modal.test.tsx
```

Expected: PASS — 2 tests.

- [ ] **Step 5: Commit**

```bash
git add modules/cloud/components/add-agent-modal.tsx modules/cloud/__tests__/add-agent-modal.test.tsx
git commit -m "feat(cloud): add-agent modal scaffold with registry search filter"
```

### Task B.4: Manifest validation + agent preview card

**Files:**

- Modify: `modules/cloud/components/add-agent-modal.tsx`
- Modify: `modules/cloud/__tests__/add-agent-modal.test.tsx`

- [ ] **Step 1: Add failing tests for manifest validation**

Append to `modules/cloud/__tests__/add-agent-modal.test.tsx` inside `describe('AddAgentModal', …)`:

```tsx
import { useRegistryManifest, useRegistryPackages } from '@/modules/cloud/hooks/use-registry-search'

// ... below the existing tests, add:

it('renders manifest-not-clint error when type is wrong', () => {
  vi.mocked(useRegistryPackages).mockReturnValue({
    packages: [{ name: '@x/foo-cli', version: '1.0.0', description: null }],
    isLoading: false,
  })
  vi.mocked(useRegistryManifest).mockReturnValue({
    manifest: { name: '@x/foo-cli', type: 'doc-model' },
    isLoading: false,
    error: null,
  })
  render(
    <AddAgentModal
      open
      onOpenChange={() => {}}
      env={fakeEnv}
      registryUrl="https://registry.dev.vetra.io"
      tenantId={null}
      installedPackages={[]}
      onSubmit={async () => {}}
      defaultSelectedPackage="@x/foo-cli"
    />,
  )
  expect(screen.queryByText(/isn[’']t a powerhouse agent/i)).not.toBeNull()
})

it('renders agent preview when manifest is clint-project', () => {
  vi.mocked(useRegistryPackages).mockReturnValue({
    packages: [{ name: '@x/foo-cli', version: '1.0.0', description: null }],
    isLoading: false,
  })
  vi.mocked(useRegistryManifest).mockReturnValue({
    manifest: {
      name: '@x/foo-cli',
      type: 'clint-project',
      features: { agent: { id: 'foo', name: 'Foo Agent', description: 'does foo' } },
    },
    isLoading: false,
    error: null,
  })
  render(
    <AddAgentModal
      open
      onOpenChange={() => {}}
      env={fakeEnv}
      registryUrl="https://registry.dev.vetra.io"
      tenantId={null}
      installedPackages={[]}
      onSubmit={async () => {}}
      defaultSelectedPackage="@x/foo-cli"
    />,
  )
  expect(screen.queryByText('Foo Agent')).not.toBeNull()
  expect(screen.queryByText('does foo')).not.toBeNull()
})
```

Update the top-level `vi.mock` to use `vi.fn()` so per-test overrides work:

```ts
vi.mock('@/modules/cloud/hooks/use-registry-search', () => ({
  useRegistryPackages: vi.fn(() => ({ packages: [], isLoading: false })),
  useRegistryVersions: vi.fn(() => ({ info: null, isLoading: false })),
  useRegistryManifest: vi.fn(() => ({ manifest: null, isLoading: false, error: null })),
  useRegistryManifests: vi.fn(() => ({ manifests: [], isLoading: false })),
}))
```

- [ ] **Step 2: Run the test to confirm it fails**

Expected: FAIL — `defaultSelectedPackage` prop not supported, no preview card rendered.

- [ ] **Step 3: Add manifest validation + preview card to the modal**

In `modules/cloud/components/add-agent-modal.tsx`:

1. Add `defaultSelectedPackage?: string` to `Props`.
2. Initialize `selectedPackage` from it: `const [selectedPackage, setSelectedPackage] = useState<string | null>(defaultSelectedPackage ?? null)`.
3. After the picker block, fetch the manifest and validate:

```tsx
const { manifest, isLoading: manifestLoading } = useRegistryManifest(
  registryUrl,
  selectedPackage,
  null, // version selected later
)
const validation = useMemo(
  () => (selectedPackage ? validateAgentManifest(manifest) : null),
  [selectedPackage, manifest],
)
const agentInfo =
  validation?.ok && validation.manifest.features?.agent ? validation.manifest.features.agent : null
```

4. Render the preview / error block:

```tsx
{
  selectedPackage && manifestLoading && (
    <div className="text-muted-foreground flex items-center gap-2 text-xs">
      <Loader2 className="h-3 w-3 animate-spin" />
      Loading manifest…
    </div>
  )
}
{
  validation && !validation.ok && validation.reason === 'not-clint' && (
    <p className="text-destructive text-xs">
      This package isn’t a Powerhouse agent. Pick another or contact the package author.
    </p>
  )
}
{
  agentInfo && (
    <div className="bg-muted/40 flex items-start gap-3 rounded-md border p-3">
      <div className="bg-muted flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md">
        {agentInfo.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={agentInfo.image} alt={agentInfo.name} className="h-full w-full object-cover" />
        ) : (
          <Bot className="text-muted-foreground h-6 w-6" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{agentInfo.name}</div>
        {agentInfo.description && (
          <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
            {agentInfo.description}
          </p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run the test to confirm it passes**

```bash
pnpm vitest --run modules/cloud/__tests__/add-agent-modal.test.tsx
```

Expected: PASS — all 4 tests.

- [ ] **Step 5: Commit**

```bash
git add modules/cloud/components/add-agent-modal.tsx modules/cloud/__tests__/add-agent-modal.test.tsx
git commit -m "feat(cloud): manifest validation + agent preview in add-agent modal"
```

### Task B.5: Version + configuration sections

**Files:**

- Modify: `modules/cloud/components/add-agent-modal.tsx`
- Modify: `modules/cloud/__tests__/add-agent-modal.test.tsx`

This task ports three blocks from `EnableClintModal` verbatim: version combobox (from `AddPackageModal`), prefix input with collision validation, resource size picker, service command textarea.

- [ ] **Step 1: Write failing tests**

Append to `modules/cloud/__tests__/add-agent-modal.test.tsx`:

```tsx
it('defaults the prefix to the agent id and resource size to first supported', () => {
  vi.mocked(useRegistryPackages).mockReturnValue({
    packages: [{ name: '@x/foo-cli', version: '1.0.0', description: null }],
    isLoading: false,
  })
  vi.mocked(useRegistryManifest).mockReturnValue({
    manifest: {
      name: '@x/foo-cli',
      type: 'clint-project',
      features: { agent: { id: 'foo', name: 'Foo' } },
      supportedResources: ['vetra-agent-m', 'vetra-agent-l'],
      serviceCommand: 'foo --run',
    },
    isLoading: false,
    error: null,
  })
  render(
    <AddAgentModal
      open
      onOpenChange={() => {}}
      env={fakeEnv}
      registryUrl="https://registry.dev.vetra.io"
      tenantId={null}
      installedPackages={[]}
      onSubmit={async () => {}}
      defaultSelectedPackage="@x/foo-cli"
    />,
  )
  expect(screen.getByLabelText(/prefix/i)).toHaveValue('foo')
  expect(screen.queryByText('Medium')).not.toBeNull() // first supported size
  expect(screen.getByLabelText(/service command/i)).toHaveValue('foo --run')
})
```

- [ ] **Step 2: Run the test to confirm it fails**

Expected: FAIL — prefix/resource/command UI not rendered.

- [ ] **Step 3: Add the constants, state, reset effect, and three rendered blocks**

Add to the top of `add-agent-modal.tsx` (above the component):

```tsx
import type { CloudResourceSize, CloudServiceEnv } from '@/modules/cloud/types'
import { Input } from '@/modules/shared/components/ui/input'
import { Label } from '@/modules/shared/components/ui/label'
import { Textarea } from '@/modules/shared/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shared/components/ui/popover'
import { ChevronsUpDown, Check } from 'lucide-react'
import { ResourceSizePicker } from './resource-size-picker'

const PREFIX_RE = /^[a-z0-9-]+$/

const SIZE_TO_TS: Record<string, CloudResourceSize> = {
  'vetra-agent-s': 'VETRA_AGENT_S',
  'vetra-agent-m': 'VETRA_AGENT_M',
  'vetra-agent-l': 'VETRA_AGENT_L',
  'vetra-agent-xl': 'VETRA_AGENT_XL',
  'vetra-agent-xxl': 'VETRA_AGENT_XXL',
}

function sanitize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
```

Add inside the component (after the existing pickup/manifest hooks):

```tsx
const [selectedVersion, setSelectedVersion] = useState<string>('')
const [versionPopoverOpen, setVersionPopoverOpen] = useState(false)
const [prefix, setPrefix] = useState('')
const [serviceCommand, setServiceCommand] = useState('')
const [selectedRessource, setSelectedRessource] = useState<CloudResourceSize | null>(null)

const { info: versionInfo, isLoading: versionsLoading } = useRegistryVersions(
  registryUrl,
  selectedPackage,
)

useEffect(() => {
  if (!validation?.ok) return
  const m = validation.manifest
  const agent = m.features?.agent || null
  const defaultPrefix = agent ? sanitize(agent.id) : sanitize(m.name)
  setPrefix(defaultPrefix)
  setServiceCommand(m.serviceCommand ?? '')
  const supported = (m.supportedResources ?? []).map((s) => SIZE_TO_TS[s]).filter(Boolean)
  setSelectedRessource(supported[0] ?? null)
  setSelectedVersion('')
}, [validation])

const existingByPrefix = useMemo(
  () => new Map(env.state.services.map((s) => [s.prefix, s])),
  [env.state.services],
)
const prefixError = useMemo<{
  kind: 'format' | 'collision'
  message: string
} | null>(() => {
  if (!prefix) return null
  if (!PREFIX_RE.test(prefix))
    return { kind: 'format', message: 'lowercase letters, digits, and hyphens only' }
  const collide = existingByPrefix.get(prefix)
  if (collide) {
    return {
      kind: 'collision',
      message: `Prefix '${prefix}' is used by an existing ${collide.type.toLowerCase()} service`,
    }
  }
  return null
}, [prefix, existingByPrefix])

const supportedSizes = useMemo<CloudResourceSize[]>(
  () =>
    validation?.ok
      ? (validation.manifest.supportedResources ?? []).map((s) => SIZE_TO_TS[s]).filter(Boolean)
      : [],
  [validation],
)
```

Render the three new blocks inside the dialog body, after the agent preview and before the (future) System block:

```tsx
{
  /* Version */
}
{
  selectedPackage && (
    <div className="space-y-2">
      <Label>Version</Label>
      <Popover open={versionPopoverOpen} onOpenChange={setVersionPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={versionPopoverOpen}
            className="w-full justify-between font-mono text-sm font-normal"
            disabled={versionsLoading}
          >
            {versionsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              selectedVersion || 'latest'
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search versions..." />
            <CommandList>
              <CommandEmpty>No versions found.</CommandEmpty>
              <CommandGroup heading="Tags">
                {Object.entries(versionInfo?.distTags ?? {}).map(([tag, ver]) => (
                  <CommandItem
                    key={tag}
                    value={`tag:${tag}`}
                    onSelect={() => {
                      setSelectedVersion(ver)
                      setVersionPopoverOpen(false)
                    }}
                  >
                    <span className="font-medium">{tag}</span>
                    <span className="text-muted-foreground ml-2 font-mono text-xs">{ver}</span>
                    {selectedVersion === ver && <Check className="ml-auto h-4 w-4 shrink-0" />}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup heading="Versions">
                {(versionInfo?.versions ?? []).map((ver) => (
                  <CommandItem
                    key={ver}
                    value={ver}
                    onSelect={() => {
                      setSelectedVersion(ver)
                      setVersionPopoverOpen(false)
                    }}
                  >
                    <span className="font-mono text-sm">{ver}</span>
                    {selectedVersion === ver && <Check className="ml-auto h-4 w-4 shrink-0" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

{
  /* Prefix */
}
{
  validation?.ok && (
    <div className="space-y-2">
      <Label htmlFor="prefix">Prefix</Label>
      <Input
        id="prefix"
        value={prefix}
        onChange={(e) => setPrefix(e.target.value)}
        aria-invalid={!!prefixError}
        placeholder="agent"
      />
      {prefixError && <p className="text-destructive text-xs">{prefixError.message}</p>}
    </div>
  )
}

{
  /* Resource size */
}
{
  validation?.ok && supportedSizes.length > 0 && (
    <div className="space-y-2">
      <Label>Resource size</Label>
      <ResourceSizePicker
        supported={supportedSizes}
        value={selectedRessource}
        onChange={setSelectedRessource}
      />
    </div>
  )
}

{
  /* Service command */
}
{
  validation?.ok && (
    <div className="space-y-2">
      <Label htmlFor="cmd">Service command</Label>
      <Textarea
        id="cmd"
        value={serviceCommand}
        onChange={(e) => setServiceCommand(e.target.value)}
        className="font-mono text-sm"
        rows={2}
      />
    </div>
  )
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add modules/cloud/components/add-agent-modal.tsx modules/cloud/__tests__/add-agent-modal.test.tsx
git commit -m "feat(cloud): version, prefix, resource, command sections in add-agent modal"
```

### Task B.6: System env vars block (read-only)

**Files:**

- Modify: `modules/cloud/components/add-agent-modal.tsx`
- Modify: `modules/cloud/__tests__/add-agent-modal.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
it('renders the four SERVICE_* env vars in the System block', () => {
  vi.mocked(useRegistryPackages).mockReturnValue({
    packages: [{ name: '@x/foo-cli', version: '1.0.0', description: null }],
    isLoading: false,
  })
  vi.mocked(useRegistryManifest).mockReturnValue({
    manifest: {
      name: '@x/foo-cli',
      type: 'clint-project',
      features: { agent: { id: 'foo', name: 'Foo' } },
    },
    isLoading: false,
    error: null,
  })
  render(
    <AddAgentModal
      open
      onOpenChange={() => {}}
      env={fakeEnv}
      registryUrl="https://registry.dev.vetra.io"
      tenantId={null}
      installedPackages={[]}
      onSubmit={async () => {}}
      defaultSelectedPackage="@x/foo-cli"
    />,
  )
  expect(screen.queryByText('SERVICE_ANNOUNCE_URL')).not.toBeNull()
  expect(screen.queryByText('SERVICE_ANNOUNCE_TOKEN')).not.toBeNull()
  expect(screen.queryByText('SERVICE_DOCUMENT_ID')).not.toBeNull()
  expect(screen.queryByText('SERVICE_PREFIX')).not.toBeNull()
  expect(screen.queryByText('env-doc-1')).not.toBeNull() // SERVICE_DOCUMENT_ID preview
})
```

- [ ] **Step 2: Run the test to confirm it fails**

Expected: FAIL.

- [ ] **Step 3: Add the System block**

Inside the modal body (after the configuration section, before any future Manifest/Custom blocks):

```tsx
import { buildSystemEnvPreview } from '@/modules/cloud/lib/system-env-vars'

// inside the JSX, after the Configuration section:
{
  validation?.ok && (
    <div className="space-y-2">
      <Label>System (set by the platform)</Label>
      <dl className="bg-muted/30 divide-border divide-y rounded-md border text-xs">
        {buildSystemEnvPreview({ environmentId: env.id, prefix }).map((row) => (
          <div key={row.name} className="grid grid-cols-[max-content_1fr] gap-3 px-3 py-2">
            <dt className="text-muted-foreground font-mono">{row.name}</dt>
            <dd className="font-mono break-all">{row.preview}</dd>
          </div>
        ))}
      </dl>
      <p className="text-muted-foreground text-xs">
        These are set automatically when the agent runs. Listed here so you can see what the agent
        will receive.
      </p>
    </div>
  )
}
```

- [ ] **Step 4: Run the test to confirm it passes**

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(cloud): read-only system env vars block in add-agent modal"
```

### Task B.7: Manifest config block (PackageConfigForm reuse)

**Files:**

- Modify: `modules/cloud/components/add-agent-modal.tsx`
- Modify: `modules/cloud/__tests__/add-agent-modal.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
it('renders manifest config entries via PackageConfigForm', () => {
  vi.mocked(useRegistryManifest).mockReturnValue({
    manifest: {
      name: '@x/foo-cli',
      type: 'clint-project',
      features: { agent: { id: 'foo', name: 'Foo' } },
      config: [
        { name: 'MODEL', type: 'var', default: 'm-1' },
        { name: 'API_KEY', type: 'secret', required: true },
      ],
    },
    isLoading: false,
    error: null,
  })
  vi.mocked(useRegistryPackages).mockReturnValue({
    packages: [{ name: '@x/foo-cli', version: '1.0.0', description: null }],
    isLoading: false,
  })
  render(
    <AddAgentModal
      open
      onOpenChange={() => {}}
      env={fakeEnv}
      registryUrl="https://registry.dev.vetra.io"
      tenantId="tenant-1"
      installedPackages={[]}
      onSubmit={async () => {}}
      defaultSelectedPackage="@x/foo-cli"
    />,
  )
  expect(screen.queryByText('MODEL')).not.toBeNull()
  expect(screen.queryByText('API_KEY')).not.toBeNull()
})
```

- [ ] **Step 2: Run the test to confirm it fails**

- [ ] **Step 3: Wire `PackageConfigForm` and tenant config**

Add imports:

```tsx
import { useRegistryManifests } from '@/modules/cloud/hooks/use-registry-search'
import { applyConfigChanges, computeConfigChanges } from '@/modules/cloud/config/apply'
import { buildCollisionMap } from '@/modules/cloud/config/collisions'
import {
  initialConfigFormState,
  PackageConfigForm,
  validateConfigForm,
  type ConfigFormState,
} from '@/modules/cloud/components/package-config-form'
import { useTenantConfig } from '@/modules/cloud/hooks/use-tenant-config'
import { useRenown } from '@powerhousedao/reactor-browser'
```

Add state:

```tsx
const renown = useRenown()
const [configState, setConfigState] = useState<ConfigFormState>({})
const { envVars, secrets } = useTenantConfig(open ? tenantId : null)
const existingVarValues = useMemo(
  () => Object.fromEntries(envVars.map((v) => [v.key, v.value])),
  [envVars],
)
const existingSecretKeys = useMemo(() => new Set(secrets.map((s) => s.key)), [secrets])

const installedForFetch = useMemo(
  () => (open ? installedPackages.map((p) => ({ name: p.name, version: p.version })) : []),
  [open, installedPackages],
)
const { manifests: installedManifests } = useRegistryManifests(registryUrl, installedForFetch)

const collisions = useMemo(() => {
  const fromInstalled = installedManifests.map((m) => ({
    packageName: m.packageName,
    manifest: m.manifest,
  }))
  const candidate =
    selectedPackage && validation?.ok
      ? [{ packageName: selectedPackage, manifest: validation.manifest }]
      : []
  return buildCollisionMap([...fromInstalled, ...candidate])
}, [installedManifests, validation, selectedPackage])

useEffect(() => {
  if (!validation?.ok || !selectedPackage) {
    setConfigState({})
    return
  }
  const entries = validation.manifest.config ?? []
  if (entries.length === 0) {
    setConfigState({})
    return
  }
  setConfigState(
    initialConfigFormState(entries, {
      existingVarValues,
      existingSecretKeys,
      collisions,
      ownerPackageName: selectedPackage,
    }),
  )
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [validation, selectedPackage])
```

Render the form when entries exist:

```tsx
{
  validation?.ok && (validation.manifest.config?.length ?? 0) > 0 && tenantId !== null && (
    <div className="space-y-2">
      <Label>Required by the agent</Label>
      <PackageConfigForm
        manifest={validation.manifest}
        state={configState}
        onChange={setConfigState}
        ctx={{
          existingVarValues,
          existingSecretKeys,
          collisions,
          ownerPackageName: selectedPackage!,
        }}
      />
    </div>
  )
}
```

- [ ] **Step 4: Run the test to confirm it passes**

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(cloud): manifest config block in add-agent modal"
```

### Task B.8: Custom env vars block + reservation validation

**Files:**

- Modify: `modules/cloud/components/add-agent-modal.tsx`
- Modify: `modules/cloud/__tests__/add-agent-modal.test.tsx`

- [ ] **Step 1: Write failing tests for the custom block + reservation rejection**

```tsx
import { fireEvent } from '@testing-library/react'

it('blocks submit when a custom env var name collides with a SERVICE_* var', async () => {
  vi.mocked(useRegistryManifest).mockReturnValue({
    manifest: {
      name: '@x/foo-cli',
      type: 'clint-project',
      features: { agent: { id: 'foo', name: 'Foo' } },
      supportedResources: ['vetra-agent-s'],
    },
    isLoading: false,
    error: null,
  })
  vi.mocked(useRegistryPackages).mockReturnValue({
    packages: [{ name: '@x/foo-cli', version: '1.0.0', description: null }],
    isLoading: false,
  })
  const onSubmit = vi.fn()
  render(
    <AddAgentModal
      open
      onOpenChange={() => {}}
      env={fakeEnv}
      registryUrl="https://registry.dev.vetra.io"
      tenantId={null}
      installedPackages={[]}
      onSubmit={onSubmit}
      defaultSelectedPackage="@x/foo-cli"
    />,
  )
  // Add a custom env var that collides with SERVICE_PREFIX:
  fireEvent.click(screen.getByRole('button', { name: /add env var/i }))
  fireEvent.change(screen.getByLabelText('env-name-0'), { target: { value: 'SERVICE_PREFIX' } })
  fireEvent.change(screen.getByLabelText('env-value-0'), { target: { value: 'oops' } })
  fireEvent.click(screen.getByRole('button', { name: /install agent/i }))
  expect(screen.queryByText(/reserved/i)).not.toBeNull()
  expect(onSubmit).not.toHaveBeenCalled()
})
```

- [ ] **Step 2: Run the test to confirm it fails**

- [ ] **Step 3: Add Custom block + collision validation**

Add state:

```tsx
import { EnvVarsEditor } from './env-vars-editor'
import type { CloudServiceEnv } from '@/modules/cloud/types'
import { isReservedEnvName } from '@/modules/cloud/lib/system-env-vars'

const [customEnvVars, setCustomEnvVars] = useState<CloudServiceEnv[]>([])
```

Render after the manifest config block:

```tsx
<div className="space-y-2">
  <Label>Custom environment variables</Label>
  <EnvVarsEditor value={customEnvVars} onChange={setCustomEnvVars} />
</div>
```

Validation in `handleSubmit` (computed before `onSubmit`):

```tsx
const reservedNames = new Set([...customEnvVars.map((v) => v.name).filter(isReservedEnvName)])
const manifestConfigNames = new Set(
  validation?.ok ? (validation.manifest.config ?? []).map((c) => c.name) : [],
)
const shadowed = customEnvVars.find(
  (v) => v.name && (isReservedEnvName(v.name) || manifestConfigNames.has(v.name)),
)
if (shadowed) {
  setError(
    `"${shadowed.name}" is reserved (set by the platform or declared by the agent). Pick another name.`,
  )
  return
}
```

- [ ] **Step 4: Run the test to confirm it passes**

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(cloud): custom env vars + reserved-name validation in add-agent modal"
```

### Task B.9: Submit flow (config + addPackage + enableService)

**Files:**

- Modify: `modules/cloud/components/add-agent-modal.tsx`
- Modify: `modules/cloud/__tests__/add-agent-modal.test.tsx`

- [ ] **Step 1: Write failing test for submit ordering**

```tsx
it('calls applyConfigChanges, addPackage, then enableService in order', async () => {
  // Mock applyConfigChanges as a sentinel; instrument onSubmit to capture call.
  vi.mocked(useRegistryManifest).mockReturnValue({
    manifest: {
      name: '@x/foo-cli',
      type: 'clint-project',
      features: { agent: { id: 'foo', name: 'Foo' } },
      supportedResources: ['vetra-agent-s'],
    },
    isLoading: false,
    error: null,
  })
  vi.mocked(useRegistryPackages).mockReturnValue({
    packages: [{ name: '@x/foo-cli', version: '1.0.0', description: null }],
    isLoading: false,
  })
  const calls: string[] = []
  const onSubmit = vi.fn(async (payload) => {
    calls.push('submit:' + payload.packageName + '@' + (payload.version ?? 'latest'))
  })
  render(
    <AddAgentModal
      open
      onOpenChange={() => {}}
      env={fakeEnv}
      registryUrl="https://registry.dev.vetra.io"
      tenantId={null}
      installedPackages={[]}
      onSubmit={onSubmit}
      defaultSelectedPackage="@x/foo-cli"
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: /install agent/i }))
  // Wait for submit to settle:
  await new Promise((r) => setTimeout(r, 10))
  expect(onSubmit).toHaveBeenCalledOnce()
  expect(calls[0]).toMatch(/^submit:@x\/foo-cli/)
})
```

- [ ] **Step 2: Run the test to confirm it fails**

- [ ] **Step 3: Implement handleSubmit**

```tsx
const [submitting, setSubmitting] = useState(false)
const [error, setError] = useState<string | null>(null)

const canSubmit =
  !!selectedPackage &&
  validation?.ok &&
  !!prefix &&
  !prefixError &&
  !!selectedRessource &&
  !submitting

const handleSubmit = async () => {
  if (!canSubmit || !validation?.ok) return
  setError(null)

  // Reservation check (Task B.8)
  // ...

  // Required-config check via validateConfigForm
  if (validation.manifest.config?.length && tenantId) {
    const missing = validateConfigForm(validation.manifest.config, configState, {
      existingVarValues,
      existingSecretKeys,
      collisions,
      ownerPackageName: selectedPackage!,
    })
    if (missing.length > 0) {
      setError(`Missing required config: ${missing.join(', ')}`)
      return
    }
  }

  setSubmitting(true)
  try {
    if (validation.manifest.config?.length && tenantId) {
      const changes = computeConfigChanges(
        validation.manifest.config,
        configState,
        existingVarValues,
      )
      if (changes.length > 0) {
        await applyConfigChanges(tenantId, changes, renown)
      }
    }
    await onSubmit({
      packageName: selectedPackage!,
      version: selectedVersion || undefined,
      prefix,
      clintConfig: {
        package: {
          registry: registryUrl ?? '',
          name: selectedPackage!,
          version: selectedVersion || null,
        },
        env: customEnvVars.filter((v) => v.name.trim()),
        serviceCommand: serviceCommand.trim() || null,
        selectedRessource,
      },
    })
    onOpenChange(false)
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to install agent')
  } finally {
    setSubmitting(false)
  }
}
```

Wire the submit button:

```tsx
;<Button onClick={handleSubmit} disabled={!canSubmit}>
  {submitting ? 'Installing…' : 'Install agent'}
</Button>
{
  error && <p className="text-destructive text-sm">{error}</p>
}
```

- [ ] **Step 4: Run the test to confirm it passes**

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(cloud): submit flow for add-agent modal"
```

- [ ] **Step 6: Add a failure-mode test (onSubmit throws)**

Append:

```tsx
it('shows an error and stays open when onSubmit throws', async () => {
  vi.mocked(useRegistryManifest).mockReturnValue({
    manifest: {
      name: '@x/foo-cli',
      type: 'clint-project',
      features: { agent: { id: 'foo', name: 'Foo' } },
      supportedResources: ['vetra-agent-s'],
    },
    isLoading: false,
    error: null,
  })
  vi.mocked(useRegistryPackages).mockReturnValue({
    packages: [{ name: '@x/foo-cli', version: '1.0.0', description: null }],
    isLoading: false,
  })
  const onOpenChange = vi.fn()
  const onSubmit = vi.fn(async () => {
    throw new Error('addPackage failed')
  })
  render(
    <AddAgentModal
      open
      onOpenChange={onOpenChange}
      env={fakeEnv}
      registryUrl="https://registry.dev.vetra.io"
      tenantId={null}
      installedPackages={[]}
      onSubmit={onSubmit}
      defaultSelectedPackage="@x/foo-cli"
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: /install agent/i }))
  await new Promise((r) => setTimeout(r, 10))
  expect(onSubmit).toHaveBeenCalledOnce()
  expect(onOpenChange).not.toHaveBeenCalledWith(false)
  expect(screen.queryByText(/addPackage failed/i)).not.toBeNull()
})
```

Run the test, confirm it passes (the existing handler already catches and surfaces errors).

- [ ] **Step 7: Commit**

```bash
git commit -am "test(cloud): failure-mode test for add-agent modal submit"
```

### Task B.10: Wire AddAgentModal into overview, remove EnableClintModal

**Files:**

- Modify: `app/cloud/[project]/tabs/overview.tsx`
- Delete: `modules/cloud/components/enable-clint-modal.tsx`
- Update tests as needed.

- [ ] **Step 1: Replace `EnableClintModal` import + usage in overview**

In `app/cloud/[project]/tabs/overview.tsx`:

```tsx
// Remove:
// import { EnableClintModal } from '@/modules/cloud/components/enable-clint-modal'
// Add:
import { AddAgentModal } from '@/modules/cloud/components/add-agent-modal'
```

Replace the `<EnableClintModal …/>` block (lines ~1117-1127) with:

```tsx
{
  canSign && (
    <AddAgentModal
      open={enableClintOpen}
      onOpenChange={setEnableClintOpen}
      env={environment}
      registryUrl={state.defaultPackageRegistry ?? 'https://registry.dev.vetra.io'}
      tenantId={tenantId}
      installedPackages={state.packages}
      onSubmit={async ({ packageName, version, prefix, clintConfig }) => {
        await addPackage(packageName, version)
        await enableService('CLINT', prefix, clintConfig)
        toast.success('Agent installed')
      }}
    />
  )
}
```

Rename the state variable for clarity (optional):

```tsx
const [addAgentOpen, setAddAgentOpen] = useState(false)
// ... use addAgentOpen / setAddAgentOpen everywhere `enableClintOpen` was used.
```

- [ ] **Step 2: Update agents-section empty state copy**

In `modules/cloud/components/agents-section.tsx:55`:

```tsx
<p className="text-sm">Install your first agent — they’re packages whose name ends in -cli.</p>
```

- [ ] **Step 3: Delete EnableClintModal**

```bash
git rm modules/cloud/components/enable-clint-modal.tsx
```

- [ ] **Step 4: Run typecheck and the affected test files**

```bash
pnpm tsc
pnpm vitest --run modules/cloud/__tests__/add-agent-modal.test.tsx modules/cloud/__tests__/agents-section.test.tsx
```

Expected: tsc clean; tests pass.

- [ ] **Step 5: Commit**

```bash
git add -u
git add modules/cloud/components/agents-section.tsx app/cloud/[project]/tabs/overview.tsx
git commit -m "feat(cloud): wire AddAgentModal in env detail page, remove EnableClintModal"
```

---

## Phase C — Reactor Modules section: hide clint-project packages

### Task C.1: Filter clint-project from Reactor Modules card + tests

**Files:**

- Modify: `app/cloud/[project]/tabs/overview.tsx`

- [ ] **Step 1: Add a failing test (or verify by running the dev server)**

Note: `overview.tsx` doesn't currently have a unit test. Cover this via a new lightweight test on the helper, then visually verify in dev.

Create `modules/cloud/__tests__/module-package-filter.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { partitionPackagesByManifestType } from '@/modules/cloud/lib/module-package-filter'
import type { CloudPackage } from '@/modules/cloud/types'
import type { PackageManifest } from '@/modules/cloud/config/types'

describe('partitionPackagesByManifestType', () => {
  it('separates clint-project packages from regular modules', () => {
    const packages: CloudPackage[] = [
      { registry: 'r', name: 'mod-a', version: '1' },
      { registry: 'r', name: 'agent-cli', version: '1' },
    ]
    const manifestsByName: Record<string, PackageManifest> = {
      'mod-a': { name: 'mod-a', type: 'doc-model' },
      'agent-cli': { name: 'agent-cli', type: 'clint-project' },
    }
    const { modules, agents } = partitionPackagesByManifestType(packages, manifestsByName)
    expect(modules.map((p) => p.name)).toEqual(['mod-a'])
    expect(agents.map((p) => p.name)).toEqual(['agent-cli'])
  })

  it('treats unknown manifests as modules (conservative default)', () => {
    const packages: CloudPackage[] = [{ registry: 'r', name: 'unknown', version: '1' }]
    const { modules, agents } = partitionPackagesByManifestType(packages, {})
    expect(modules.map((p) => p.name)).toEqual(['unknown'])
    expect(agents).toEqual([])
  })
})
```

- [ ] **Step 2: Run the test to confirm it fails**

- [ ] **Step 3: Implement the helper**

Create `modules/cloud/lib/module-package-filter.ts`:

```ts
import type { PackageManifest } from '@/modules/cloud/config/types'
import type { CloudPackage } from '@/modules/cloud/types'

/**
 * Split a package list into "modules" (doc-model packages) and "agents"
 * (clint-project packages) based on manifest type. Packages without a
 * known manifest are treated as modules — failing closed avoids hiding
 * a package the user intentionally installed.
 *
 * TODO: a follow-up could surface clint-project packages with no
 * corresponding CLINT service back in the modules section so users can
 * remove orphans. See spec §6.5.
 */
export function partitionPackagesByManifestType(
  packages: CloudPackage[],
  manifestsByName: Record<string, PackageManifest>,
): { modules: CloudPackage[]; agents: CloudPackage[] } {
  const modules: CloudPackage[] = []
  const agents: CloudPackage[] = []
  for (const p of packages) {
    if (manifestsByName[p.name]?.type === 'clint-project') {
      agents.push(p)
    } else {
      modules.push(p)
    }
  }
  return { modules, agents }
}
```

- [ ] **Step 4: Use the helper in overview.tsx**

In `app/cloud/[project]/tabs/overview.tsx`:

```tsx
import { partitionPackagesByManifestType } from '@/modules/cloud/lib/module-package-filter'

// inside the component, after clintManifestsByName is computed:
const { modules: modulePackages } = useMemo(
  () => partitionPackagesByManifestType(state.packages, clintManifestsByName),
  [state.packages, clintManifestsByName],
)
```

Replace `state.packages` with `modulePackages` in the Reactor Modules card body (the `Table`/`PackageRow` map). Update the empty-state copy to "No reactor modules installed".

For `AvailableUpdatesCard`, pass `modulePackages` to `usePackageUpdates` instead of `state.packages` so agent updates don't appear in the modules-update list (agents have their own update path via `AgentCard`).

- [ ] **Step 5: Run tests**

```bash
pnpm vitest --run modules/cloud/__tests__/module-package-filter.test.ts
pnpm tsc
```

- [ ] **Step 6: Commit**

```bash
git commit -am "feat(cloud): hide clint-project packages from Reactor Modules section"
```

---

## Phase D — Validation and deploy

### Task D.1: Full local validation

**Files:** none.

- [ ] **Step 1: Lint, format, typecheck, test**

```bash
cd /home/froid/projects/powerhouse/vetra.to
pnpm lint
pnpm format:check
pnpm tsc
pnpm vitest --run
```

Expected: all clean. Fix anything that fails before proceeding.

- [ ] **Step 2: Manual UI walk-through against a dev environment**

```bash
pnpm dev
```

Open `http://localhost:3000/cloud/<some-doc-id>` in the browser. Walk:

1. Open the Agents section. Click "Add Agent".
2. Search for "pirate". Verify `@powerhousedao/ph-pirate-cli` appears (and only `-cli` packages).
3. Select it. Verify the agent preview card renders the pirate name, image, description.
4. Verify default prefix `ph-pirate`, default size, default service command.
5. Verify the System block lists the four `SERVICE_*` vars with `SERVICE_DOCUMENT_ID === environment.id` and `SERVICE_PREFIX === ph-pirate`.
6. Verify the manifest-config block asks for `MODEL` (default filled) and `ANTHROPIC_API_KEY` (required).
7. Try entering a custom env var named `SERVICE_PREFIX` — submit should be blocked with a "reserved" error.
8. Fill `ANTHROPIC_API_KEY` with a test value, click "Install agent". Verify it closes with a success toast.
9. Confirm the new agent appears in the Agents section.
10. Confirm the Reactor Modules section does NOT list the new package.
11. Reload — state persists.

If any step fails, return to the relevant Phase B/C task and fix.

### Task D.2: Push the branch

**Files:** none.

- [ ] **Step 1: Push**

```bash
cd /home/froid/projects/powerhouse/vetra.to
git push -u origin feat/clint-service-support
```

- [ ] **Step 2: Open or update the PR**

```bash
gh pr view --web 2>/dev/null || gh pr create --title "feat(cloud): redesign agent install flow" --body "$(cat <<'EOF'
## Summary
- Replaces the two-step install flow with a self-contained `AddAgentModal` driven by registry search (`*-cli` filter).
- Hides clint-project packages from the Reactor Modules section — they appear only as agents.
- Adds a read-only "System" env-var block in the install modal showing the `SERVICE_*` vars the platform injects on every CLINT pod.
- Publishes `@powerhousedao/ph-pirate-cli` to `registry.dev.vetra.io` as the canonical example agent.

## Test plan
- [x] vitest unit + integration tests
- [x] tsc + lint + prettier
- [ ] Manual install of `@powerhousedao/ph-pirate-cli` end-to-end in dev (Phase D.3)
- [ ] Confirm `clintRuntimeEndpointsByEnv` returns announced endpoints after agent boot

Spec: `docs/superpowers/specs/2026-04-30-vetra-agent-install-redesign-design.md`
Plan: `docs/superpowers/plans/2026-04-30-vetra-agent-install-redesign.md`
EOF
)"
```

### Task D.3: End-to-end deploy validation

**Files:** none. Validation against the deployed dev environment after the PR merges (or against the preview deployment if vetra.to has one).

- [ ] **Step 1: Wait for PR merge or use preview URL**

If a preview deploy exists for the branch, use that. Otherwise wait for merge to dev/main and ArgoCD sync.

- [ ] **Step 2: Repeat the manual walk-through from Task D.1 Step 2 against the deployed env**

In particular: after step 8, wait ~30-60s for the CLINT pod to start. Then confirm:

```bash
# Substitute <subdomain> + <doc-id> appropriately
curl -s -X POST https://admin-dev.vetra.io/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ clintRuntimeEndpointsByEnv(documentId:\"<doc-id>\") { prefix endpoints { id type port status } } }"}' \
  | jq '.'
```

Expected: at least one entry under `clintRuntimeEndpointsByEnv` with `prefix: "ph-pirate"` (the agent has announced).

- [ ] **Step 3: Confirm in UI**

Open the env detail page. Confirm:

- The pirate agent card shows `ACTIVE` status.
- The agent's expand panel lists the runtime-announced endpoints.
- The agent's logs show the announcement succeeded (no `no SERVICE_ANNOUNCE_* env vars set` warnings).

- [ ] **Step 4: Close out**

If all pass, the feature is shipped. Update the spec status to `Shipped`:

```bash
cd /home/froid/projects/powerhouse/vetra.to
sed -i 's/^\*\*Status:\*\* Draft/**Status:** Shipped/' docs/superpowers/specs/2026-04-30-vetra-agent-install-redesign-design.md
git commit -am "docs(cloud): mark agent install redesign spec as Shipped"
git push
```
