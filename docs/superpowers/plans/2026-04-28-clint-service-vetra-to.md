# CLINT Service Support — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface CLINT services on vetra.to env detail page with combined enable+configure modal, inline edit card, and per-type endpoint rendering.

**Architecture:** Add a new "Agents" section to the env detail page that lists CLINT entries from `services[]`. New components: `agents-section`, `agent-card`, `enable-clint-modal`, `endpoint-row`, plus reusable `resource-size-picker` and `env-vars-editor`. New hooks: `use-clint-packages` (manifest filter+fetch), and extensions to existing `useEnvironmentDetail` for `enableService` (with clintConfig) and a new `setServiceConfig` mutation. Manifest convention extended via Zod schema.

**Tech Stack:** Next.js, React 19, TypeScript, Tailwind, Radix UI primitives, React Query, Vitest + RTL, Playwright, Storybook, Renown signed actions.

**Spec:** `docs/superpowers/specs/2026-04-28-clint-service-vetra-to-design.md`

---

## Cross-repo gating

Phases 1–4 have **no backend dependency** and can ship standalone (read-only fallback).

Phases 5–6 **require** these to land in `vetra-cloud-package` first:

- Pull `dev` cleanly, drop accidental removals (`owner`, `apexService`, `autoUpdateChannel`, `version`, `STOPPED`).
- Add `package: VetraCloudPackage!` and `env: [VetraCloudServiceEnv!]!` to `VetraCloudServiceClint`.
- Add `VetraCloudServiceEnv { name, value }` type.
- Extend `EnableServiceInput` with optional `clintConfig: VetraCloudServiceClintInput`.
- Add `SET_SERVICE_CONFIG(prefix, config)` op + reducer.
- Bump version + publish dev-channel image.

**If backend is not ready when Phase 5 starts, stop. Resume after the bump.**

---

## Phase 0 — Setup

### Task 0.1: Create feature branch

**Files:** none.

- [ ] **Step 1: Branch off `staging`**

```bash
git checkout staging
git pull --rebase
git checkout -b feat/clint-service-support
```

- [ ] **Step 2: Verify clean working tree**

```bash
git status
```

Expected: `nothing to commit, working tree clean`.

---

## Phase 1 — Foundation (no backend dep)

### Task 1.1: Add CLINT to local types

**Files:**

- Modify: `modules/cloud/types.ts`

- [ ] **Step 1: Add CLINT to `CloudEnvironmentServiceType` union**

Edit `modules/cloud/types.ts:1`:

```ts
export type CloudEnvironmentServiceType = 'CONNECT' | 'SWITCHBOARD' | 'FUSION' | 'CLINT'
```

- [ ] **Step 2: Add new clint-related types after existing service types**

Append to `modules/cloud/types.ts`:

```ts
export type CloudResourceSize =
  | 'VETRA_AGENT_S'
  | 'VETRA_AGENT_M'
  | 'VETRA_AGENT_L'
  | 'VETRA_AGENT_XL'
  | 'VETRA_AGENT_XXL'

export type CloudServiceEnv = { name: string; value: string }

export type ClintEndpointType = 'api-graphql' | 'api-mcp' | 'website'

export type ClintEndpoint = {
  id: string
  type: ClintEndpointType
  port: string
  status?: 'enabled' | 'disabled'
}

export type CloudServiceClintConfig = {
  package: CloudPackage
  env: CloudServiceEnv[]
  serviceCommand: string | null
  selectedRessource: CloudResourceSize | null
  enabledEndpoints: string[]
}
```

- [ ] **Step 3: Add optional `config` field to `CloudEnvironmentService`**

Edit the existing `CloudEnvironmentService` type:

```ts
export type CloudEnvironmentService = {
  type: CloudEnvironmentServiceType
  prefix: string
  enabled: boolean
  url: string | null
  status: ServiceStatus
  version: string | null
  config?: CloudServiceClintConfig | null
}
```

- [ ] **Step 4: Run tsc**

```bash
npm run tsc
```

Expected: PASS (no compile errors).

- [ ] **Step 5: Commit**

```bash
git add modules/cloud/types.ts
git commit -m "feat(cloud): add CLINT service type and clint config types"
```

---

### Task 1.2: Extend `PackageManifest` Zod schema with clint fields

**Files:**

- Modify: `modules/cloud/config/types.ts`
- Test: `modules/cloud/__tests__/clint-manifest.test.ts` (new)

- [ ] **Step 1: Write the failing test**

Create `modules/cloud/__tests__/clint-manifest.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { PackageManifestSchema } from '@/modules/cloud/config/types'

describe('PackageManifestSchema with clint extension', () => {
  it('accepts a clint-project manifest with all fields', () => {
    const manifest = {
      name: 'ph-rupert',
      version: '1.0.0',
      type: 'clint-project',
      serviceCommand: 'ph-rupert --stand-alone',
      supportedResources: ['vetra-agent-s', 'vetra-agent-m'],
      endpoints: [{ id: 'agent-graphql', type: 'api-graphql', port: '12345', status: 'disabled' }],
    }
    const result = PackageManifestSchema.safeParse(manifest)
    expect(result.success).toBe(true)
  })

  it('accepts a non-clint manifest (clint fields omitted)', () => {
    const manifest = { name: 'foo', version: '1.0.0' }
    const result = PackageManifestSchema.safeParse(manifest)
    expect(result.success).toBe(true)
  })

  it('rejects an endpoint with unknown type', () => {
    const manifest = {
      name: 'ph-rupert',
      version: '1.0.0',
      type: 'clint-project',
      endpoints: [{ id: 'x', type: 'unknown-type', port: '1' }],
    }
    const result = PackageManifestSchema.safeParse(manifest)
    expect(result.success).toBe(false)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm run test -- modules/cloud/__tests__/clint-manifest.test.ts
```

Expected: FAIL (clint fields not yet defined or shape mismatches).

- [ ] **Step 3: Extend the Zod schema**

In `modules/cloud/config/types.ts`, locate the `PackageManifestSchema` declaration and add (preserving existing fields):

```ts
const ClintEndpointSchema = z.object({
  id: z.string(),
  type: z.enum(['api-graphql', 'api-mcp', 'website']),
  port: z.string(),
  status: z.enum(['enabled', 'disabled']).optional(),
})

const ClintResourceSizeSchema = z.enum([
  'vetra-agent-s',
  'vetra-agent-m',
  'vetra-agent-l',
  'vetra-agent-xl',
  'vetra-agent-xxl',
])

// Add these optional fields to the existing PackageManifestSchema:
//   type: z.string().optional(),
//   serviceCommand: z.string().optional(),
//   supportedResources: z.array(ClintResourceSizeSchema).optional(),
//   endpoints: z.array(ClintEndpointSchema).optional(),
```

Export `ClintEndpointSchema` and `ClintResourceSizeSchema` so other code can reuse them.

- [ ] **Step 4: Run the test**

```bash
npm run test -- modules/cloud/__tests__/clint-manifest.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add modules/cloud/config/types.ts modules/cloud/__tests__/clint-manifest.test.ts
git commit -m "feat(cloud): extend PackageManifest Zod schema with clint fields"
```

---

### Task 1.3: Add `Bot` icon for CLINT in `service-card`

**Files:**

- Modify: `modules/cloud/components/service-card.tsx:17-24`

- [ ] **Step 1: Add Bot import and CLINT entry to `SERVICE_ICONS`**

Edit `modules/cloud/components/service-card.tsx`:

```tsx
import { Bot, ExternalLink, Globe, Server, Zap } from 'lucide-react'

// …

const SERVICE_ICONS: Record<
  CloudEnvironmentServiceType,
  React.ComponentType<{ className?: string }>
> = {
  CONNECT: Globe,
  SWITCHBOARD: Server,
  FUSION: Zap,
  CLINT: Bot,
}
```

- [ ] **Step 2: Run tsc + lint**

```bash
npm run tsc && npm run lint
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add modules/cloud/components/service-card.tsx
git commit -m "feat(cloud): register Bot icon for CLINT service type"
```

---

### Task 1.4: Pure helper — `clint-endpoint-url`

**Files:**

- Create: `modules/cloud/lib/clint-endpoint-url.ts`
- Test: `modules/cloud/__tests__/clint-endpoint-url.test.ts`

- [ ] **Step 1: Write the failing test**

Create `modules/cloud/__tests__/clint-endpoint-url.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { composeClintEndpointUrl } from '@/modules/cloud/lib/clint-endpoint-url'

describe('composeClintEndpointUrl', () => {
  const endpoint = { id: 'agent-graphql', type: 'api-graphql' as const, port: '12345' }

  it('uses service.url when provided', () => {
    const url = composeClintEndpointUrl({
      serviceUrl: 'https://rupert.demo.vetra.io',
      prefix: 'rupert',
      genericSubdomain: 'demo',
      genericBaseDomain: 'vetra.io',
      endpoint,
    })
    expect(url).toBe('https://rupert.demo.vetra.io/agent-graphql')
  })

  it('composes from prefix + subdomain + base when service.url is null', () => {
    const url = composeClintEndpointUrl({
      serviceUrl: null,
      prefix: 'rupert',
      genericSubdomain: 'demo',
      genericBaseDomain: 'vetra.io',
      endpoint,
    })
    expect(url).toBe('https://rupert.demo.vetra.io/agent-graphql')
  })

  it('returns placeholder when subdomain is missing', () => {
    const url = composeClintEndpointUrl({
      serviceUrl: null,
      prefix: 'rupert',
      genericSubdomain: null,
      genericBaseDomain: 'vetra.io',
      endpoint,
    })
    expect(url).toContain('<subdomain>')
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
npm run test -- modules/cloud/__tests__/clint-endpoint-url.test.ts
```

Expected: FAIL (module not found).

- [ ] **Step 3: Implement the helper**

Create `modules/cloud/lib/clint-endpoint-url.ts`:

```ts
import type { ClintEndpoint } from '@/modules/cloud/types'

export type ComposeClintEndpointUrlInput = {
  serviceUrl: string | null
  prefix: string
  genericSubdomain: string | null
  genericBaseDomain: string | null
  endpoint: Pick<ClintEndpoint, 'id'>
}

export function composeClintEndpointUrl(input: ComposeClintEndpointUrlInput): string {
  const { serviceUrl, prefix, genericSubdomain, genericBaseDomain, endpoint } = input
  if (serviceUrl) {
    return `${serviceUrl.replace(/\/$/, '')}/${endpoint.id}`
  }
  const sub = genericSubdomain ?? '<subdomain>'
  const base = genericBaseDomain ?? 'vetra.io'
  return `https://${prefix}.${sub}.${base}/${endpoint.id}`
}
```

- [ ] **Step 4: Run to verify pass**

```bash
npm run test -- modules/cloud/__tests__/clint-endpoint-url.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add modules/cloud/lib/clint-endpoint-url.ts modules/cloud/__tests__/clint-endpoint-url.test.ts
git commit -m "feat(cloud): add clint-endpoint-url composition helper"
```

---

## Phase 2 — Reusable components (no backend dep)

### Task 2.1: `resource-size-picker`

**Files:**

- Create: `modules/cloud/components/resource-size-picker.tsx`
- Test: `modules/cloud/__tests__/resource-size-picker.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ResourceSizePicker } from '@/modules/cloud/components/resource-size-picker'

describe('ResourceSizePicker', () => {
  const supported = ['VETRA_AGENT_S', 'VETRA_AGENT_M', 'VETRA_AGENT_L'] as const

  it('renders only supported sizes as options', () => {
    render(<ResourceSizePicker supported={[...supported]} value={null} onChange={() => {}} />)
    expect(screen.getByText('Small')).toBeInTheDocument()
    expect(screen.getByText('Medium')).toBeInTheDocument()
    expect(screen.getByText('Large')).toBeInTheDocument()
    expect(screen.queryByText('X-Large')).not.toBeInTheDocument()
  })

  it('calls onChange with selected size', () => {
    const onChange = vi.fn()
    render(<ResourceSizePicker supported={[...supported]} value={null} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText('Medium'))
    expect(onChange).toHaveBeenCalledWith('VETRA_AGENT_M')
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
npm run test -- modules/cloud/__tests__/resource-size-picker.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement**

Create `modules/cloud/components/resource-size-picker.tsx`:

```tsx
'use client'

import type { CloudResourceSize } from '@/modules/cloud/types'
import { Label } from '@/modules/shared/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/modules/shared/components/ui/radio-group'

const LABELS: Record<CloudResourceSize, string> = {
  VETRA_AGENT_S: 'Small',
  VETRA_AGENT_M: 'Medium',
  VETRA_AGENT_L: 'Large',
  VETRA_AGENT_XL: 'X-Large',
  VETRA_AGENT_XXL: '2X-Large',
}

const ORDER: CloudResourceSize[] = [
  'VETRA_AGENT_S',
  'VETRA_AGENT_M',
  'VETRA_AGENT_L',
  'VETRA_AGENT_XL',
  'VETRA_AGENT_XXL',
]

type Props = {
  supported: CloudResourceSize[]
  value: CloudResourceSize | null
  onChange: (size: CloudResourceSize) => void
  disabled?: boolean
}

export function ResourceSizePicker({ supported, value, onChange, disabled }: Props) {
  const supportedSet = new Set(supported)
  const ordered = ORDER.filter((s) => supportedSet.has(s))
  return (
    <RadioGroup
      value={value ?? undefined}
      onValueChange={(v) => onChange(v as CloudResourceSize)}
      disabled={disabled}
      className="flex flex-wrap gap-2"
    >
      {ordered.map((size) => (
        <div key={size} className="flex items-center gap-2">
          <RadioGroupItem value={size} id={`rs-${size}`} />
          <Label htmlFor={`rs-${size}`}>{LABELS[size]}</Label>
        </div>
      ))}
    </RadioGroup>
  )
}
```

- [ ] **Step 4: Run to verify pass**

```bash
npm run test -- modules/cloud/__tests__/resource-size-picker.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add modules/cloud/components/resource-size-picker.tsx modules/cloud/__tests__/resource-size-picker.test.tsx
git commit -m "feat(cloud): add resource-size-picker component"
```

---

### Task 2.2: `env-vars-editor`

**Files:**

- Create: `modules/cloud/components/env-vars-editor.tsx`
- Test: `modules/cloud/__tests__/env-vars-editor.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { EnvVarsEditor } from '@/modules/cloud/components/env-vars-editor'

describe('EnvVarsEditor', () => {
  it('renders existing env vars', () => {
    render(<EnvVarsEditor value={[{ name: 'FOO', value: 'bar' }]} onChange={() => {}} />)
    expect(screen.getByDisplayValue('FOO')).toBeInTheDocument()
    expect(screen.getByDisplayValue('bar')).toBeInTheDocument()
  })

  it('adds a new empty row when "Add" clicked', () => {
    const onChange = vi.fn()
    render(<EnvVarsEditor value={[]} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /add/i }))
    expect(onChange).toHaveBeenCalledWith([{ name: '', value: '' }])
  })

  it('removes a row', () => {
    const onChange = vi.fn()
    render(
      <EnvVarsEditor
        value={[
          { name: 'A', value: '1' },
          { name: 'B', value: '2' },
        ]}
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getAllByRole('button', { name: /remove/i })[0])
    expect(onChange).toHaveBeenCalledWith([{ name: 'B', value: '2' }])
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
npm run test -- modules/cloud/__tests__/env-vars-editor.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement**

Create `modules/cloud/components/env-vars-editor.tsx`:

```tsx
'use client'

import { Plus, Trash2 } from 'lucide-react'
import type { CloudServiceEnv } from '@/modules/cloud/types'
import { Button } from '@/modules/shared/components/ui/button'
import { Input } from '@/modules/shared/components/ui/input'

type Props = {
  value: CloudServiceEnv[]
  onChange: (next: CloudServiceEnv[]) => void
  disabled?: boolean
}

export function EnvVarsEditor({ value, onChange, disabled }: Props) {
  const update = (idx: number, patch: Partial<CloudServiceEnv>) => {
    onChange(value.map((row, i) => (i === idx ? { ...row, ...patch } : row)))
  }
  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx))
  const add = () => onChange([...value, { name: '', value: '' }])
  return (
    <div className="space-y-2">
      {value.map((row, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <Input
            aria-label={`env-name-${idx}`}
            placeholder="NAME"
            value={row.name}
            onChange={(e) => update(idx, { name: e.target.value })}
            disabled={disabled}
            className="font-mono text-sm"
          />
          <Input
            aria-label={`env-value-${idx}`}
            placeholder="value"
            value={row.value}
            onChange={(e) => update(idx, { value: e.target.value })}
            disabled={disabled}
            className="font-mono text-sm"
          />
          <Button
            variant="ghost"
            size="icon"
            type="button"
            aria-label="remove env var"
            onClick={() => remove(idx)}
            disabled={disabled}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        type="button"
        onClick={add}
        disabled={disabled}
        className="gap-1.5"
      >
        <Plus className="h-3.5 w-3.5" /> Add env var
      </Button>
    </div>
  )
}
```

- [ ] **Step 4: Run to verify pass**

```bash
npm run test -- modules/cloud/__tests__/env-vars-editor.test.tsx
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add modules/cloud/components/env-vars-editor.tsx modules/cloud/__tests__/env-vars-editor.test.tsx
git commit -m "feat(cloud): add env-vars-editor component"
```

---

### Task 2.3: `endpoint-row`

**Files:**

- Create: `modules/cloud/components/endpoint-row.tsx`
- Test: `modules/cloud/__tests__/endpoint-row.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { EndpointRow } from '@/modules/cloud/components/endpoint-row'

const baseProps = {
  url: 'https://rupert.demo.vetra.io/x',
  checked: false,
  onCheckedChange: () => {},
}

describe('EndpointRow', () => {
  it('renders graphql with playground link', () => {
    render(<EndpointRow {...baseProps} endpoint={{ id: 'x', type: 'api-graphql', port: '1' }} />)
    expect(screen.getByRole('link', { name: /playground/i })).toBeInTheDocument()
  })

  it('renders mcp with copy button', () => {
    render(<EndpointRow {...baseProps} endpoint={{ id: 'x', type: 'api-mcp', port: '1' }} />)
    expect(screen.getByRole('button', { name: /copy mcp config/i })).toBeInTheDocument()
  })

  it('renders website with visit link', () => {
    render(<EndpointRow {...baseProps} endpoint={{ id: 'x', type: 'website', port: '1' }} />)
    expect(screen.getByRole('link', { name: /visit/i })).toBeInTheDocument()
  })

  it('toggles checked state', () => {
    const onCheckedChange = vi.fn()
    render(
      <EndpointRow
        {...baseProps}
        endpoint={{ id: 'x', type: 'website', port: '1' }}
        onCheckedChange={onCheckedChange}
      />,
    )
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
npm run test -- modules/cloud/__tests__/endpoint-row.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement**

Create `modules/cloud/components/endpoint-row.tsx`:

```tsx
'use client'

import { Copy, ExternalLink, Globe, Network, Terminal } from 'lucide-react'
import { useCallback } from 'react'
import type { ClintEndpoint, ClintEndpointType } from '@/modules/cloud/types'
import { Button } from '@/modules/shared/components/ui/button'
import { Checkbox } from '@/modules/shared/components/ui/checkbox'

const TYPE_ICONS: Record<ClintEndpointType, React.ComponentType<{ className?: string }>> = {
  'api-graphql': Network,
  'api-mcp': Terminal,
  website: Globe,
}

type Props = {
  endpoint: ClintEndpoint
  url: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}

export function EndpointRow({ endpoint, url, checked, onCheckedChange, disabled }: Props) {
  const Icon = TYPE_ICONS[endpoint.type]
  const onCopyMcp = useCallback(() => {
    const config = JSON.stringify({ mcpServers: { [endpoint.id]: { url } } }, null, 2)
    void navigator.clipboard.writeText(config)
  }, [endpoint.id, url])

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border p-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Checkbox
          checked={checked}
          onCheckedChange={(v) => onCheckedChange(v === true)}
          disabled={disabled}
          aria-label={`enable ${endpoint.id}`}
        />
        <Icon className="text-muted-foreground h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">{endpoint.id}</div>
          <div className="text-muted-foreground truncate font-mono text-xs">
            {url} · :{endpoint.port}
          </div>
        </div>
      </div>
      {endpoint.type === 'api-graphql' && (
        <Button variant="outline" size="sm" asChild>
          <a href={`${url}/graphql`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            Playground
          </a>
        </Button>
      )}
      {endpoint.type === 'api-mcp' && (
        <Button variant="outline" size="sm" onClick={onCopyMcp}>
          <Copy className="mr-1.5 h-3.5 w-3.5" />
          Copy MCP config
        </Button>
      )}
      {endpoint.type === 'website' && (
        <Button variant="outline" size="sm" asChild>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            Visit
          </a>
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run to verify pass**

```bash
npm run test -- modules/cloud/__tests__/endpoint-row.test.tsx
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add modules/cloud/components/endpoint-row.tsx modules/cloud/__tests__/endpoint-row.test.tsx
git commit -m "feat(cloud): add endpoint-row component with per-type affordances"
```

---

## Phase 3 — Display + structure (no backend dep)

### Task 3.1: `agent-card` (collapsed view only — read-only first)

**Files:**

- Create: `modules/cloud/components/agent-card.tsx`
- Test: `modules/cloud/__tests__/agent-card.test.tsx`

- [ ] **Step 1: Write failing test for collapsed view**

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AgentCard } from '@/modules/cloud/components/agent-card'
import type { CloudEnvironmentService, CloudPackage } from '@/modules/cloud/types'

const pkg: CloudPackage = { registry: 'https://r', name: 'ph-rupert', version: '1.2.3' }
const service: CloudEnvironmentService = {
  type: 'CLINT',
  prefix: 'rupert',
  enabled: true,
  url: null,
  status: 'ACTIVE',
  version: null,
  config: {
    package: pkg,
    env: [],
    serviceCommand: null,
    selectedRessource: 'VETRA_AGENT_XXL',
    enabledEndpoints: ['ep-1', 'ep-2'],
  },
}

describe('AgentCard collapsed', () => {
  it('renders package name@version, prefix, resource size, endpoint count', () => {
    render(<AgentCard service={service} env={null} canEdit={false} />)
    expect(screen.getByText(/ph-rupert@1\.2\.3/)).toBeInTheDocument()
    expect(screen.getByText(/rupert/)).toBeInTheDocument()
    expect(screen.getByText(/2X-Large/)).toBeInTheDocument()
    expect(screen.getByText(/2 endpoints/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
npm run test -- modules/cloud/__tests__/agent-card.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement collapsed view**

Create `modules/cloud/components/agent-card.tsx`:

```tsx
'use client'

import { Bot, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type {
  CloudEnvironment,
  CloudEnvironmentService,
  CloudResourceSize,
} from '@/modules/cloud/types'
import { Badge } from '@/modules/shared/components/ui/badge'
import { Button } from '@/modules/shared/components/ui/button'
import { StatusBadge } from './status-badge'

const SIZE_LABELS: Record<CloudResourceSize, string> = {
  VETRA_AGENT_S: 'Small',
  VETRA_AGENT_M: 'Medium',
  VETRA_AGENT_L: 'Large',
  VETRA_AGENT_XL: 'X-Large',
  VETRA_AGENT_XXL: '2X-Large',
}

type Props = {
  service: CloudEnvironmentService
  env: CloudEnvironment | null
  canEdit: boolean
}

export function AgentCard({ service, env, canEdit }: Props) {
  const [expanded, setExpanded] = useState(false)
  const cfg = service.config
  const pkgLabel = cfg ? `${cfg.package.name}@${cfg.package.version ?? 'latest'}` : 'unconfigured'
  const sizeLabel = cfg?.selectedRessource ? SIZE_LABELS[cfg.selectedRessource] : '—'
  const endpointCount = cfg?.enabledEndpoints.length ?? 0

  return (
    <div className="rounded-lg border">
      <div className="flex items-center justify-between gap-4 p-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-md">
            <Bot className="text-muted-foreground h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{pkgLabel}</span>
              <StatusBadge status={service.status} />
              <Badge variant="secondary" className="font-mono text-xs">
                {service.prefix}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {sizeLabel}
              </Badge>
              <span className="text-muted-foreground text-xs">
                {endpointCount} endpoint{endpointCount === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </div>
        {canEdit && (
          <Button variant="outline" size="sm" onClick={() => setExpanded((e) => !e)}>
            <ChevronDown
              className={`mr-1.5 h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
            Configure
          </Button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run to verify pass**

```bash
npm run test -- modules/cloud/__tests__/agent-card.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add modules/cloud/components/agent-card.tsx modules/cloud/__tests__/agent-card.test.tsx
git commit -m "feat(cloud): add agent-card collapsed view"
```

---

### Task 3.2: `agents-section` with empty state

**Files:**

- Create: `modules/cloud/components/agents-section.tsx`
- Test: `modules/cloud/__tests__/agents-section.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AgentsSection } from '@/modules/cloud/components/agents-section'
import type { CloudEnvironmentService } from '@/modules/cloud/types'

const clint = (prefix: string): CloudEnvironmentService => ({
  type: 'CLINT',
  prefix,
  enabled: true,
  url: null,
  status: 'ACTIVE',
  version: null,
  config: {
    package: { registry: 'r', name: 'ph-' + prefix, version: '1.0.0' },
    env: [],
    serviceCommand: null,
    selectedRessource: 'VETRA_AGENT_S',
    enabledEndpoints: [],
  },
})

describe('AgentsSection', () => {
  it('renders empty state when no CLINT services', () => {
    render(<AgentsSection services={[{ type: 'CONNECT' } as never]} env={null} canEdit={false} />)
    expect(screen.getByText(/run ai agents/i)).toBeInTheDocument()
  })

  it('renders one card per CLINT service, sorted by prefix', () => {
    render(<AgentsSection services={[clint('zeta'), clint('alpha')]} env={null} canEdit={false} />)
    const headings = screen.getAllByText(/ph-/)
    expect(headings[0].textContent).toContain('alpha')
    expect(headings[1].textContent).toContain('zeta')
  })

  it('shows "Add Agent" CTA when canEdit', () => {
    render(<AgentsSection services={[]} env={null} canEdit />)
    expect(screen.getByRole('button', { name: /add agent/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
npm run test -- modules/cloud/__tests__/agents-section.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement**

Create `modules/cloud/components/agents-section.tsx`:

```tsx
'use client'

import { Bot, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { CloudEnvironment, CloudEnvironmentService } from '@/modules/cloud/types'
import { Button } from '@/modules/shared/components/ui/button'
import { AgentCard } from './agent-card'

type Props = {
  services: CloudEnvironmentService[]
  env: CloudEnvironment | null
  canEdit: boolean
  onAddAgent?: () => void
}

export function AgentsSection({ services, env, canEdit, onAddAgent }: Props) {
  const clintServices = useMemo(
    () =>
      services.filter((s) => s.type === 'CLINT').sort((a, b) => a.prefix.localeCompare(b.prefix)),
    [services],
  )

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Agents</h2>
        {canEdit && (
          <Button size="sm" onClick={onAddAgent} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add Agent
          </Button>
        )}
      </div>
      {clintServices.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
          <Bot className="h-8 w-8" />
          <p className="text-sm">Run AI agents in this environment</p>
        </div>
      ) : (
        <div className="space-y-2">
          {clintServices.map((s) => (
            <AgentCard key={s.prefix} service={s} env={env} canEdit={canEdit} />
          ))}
        </div>
      )}
    </section>
  )
}
```

- [ ] **Step 4: Run to verify pass**

```bash
npm run test -- modules/cloud/__tests__/agents-section.test.tsx
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add modules/cloud/components/agents-section.tsx modules/cloud/__tests__/agents-section.test.tsx
git commit -m "feat(cloud): add agents-section with empty state"
```

---

### Task 3.3: Integrate `<AgentsSection />` into env detail page

**Files:**

- Modify: `app/cloud/[project]/page.tsx` (or current env detail page entrypoint — verify path with `grep -rn "useEnvironmentDetail" app/cloud`)

- [ ] **Step 1: Locate the env detail page render path**

Run:

```bash
grep -rn "useEnvironmentDetail\|AutoUpdateCard" app/cloud modules/cloud --include="*.tsx" | head -20
```

Use that to find the page that composes Services / Packages cards.

- [ ] **Step 2: Insert `<AgentsSection />` between Services and Packages**

In the page that renders the existing services strip and packages list, after the services strip and before the packages list, add:

```tsx
import { AgentsSection } from '@/modules/cloud/components/agents-section'

// Within the JSX where services + packages render:
;<AgentsSection
  services={env.state.services}
  env={env}
  canEdit={canSign}
  onAddAgent={() => setEnableClintModalOpen(true)}
/>
```

For now, leave `onAddAgent` as a no-op (`() => {}`) until the modal exists in Phase 5. Or wire it into a `useState` placeholder.

- [ ] **Step 3: Visual smoke**

Run:

```bash
npm run dev
```

Navigate to a cloud env. Confirm Agents section renders with empty state for envs without CLINT services. Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add app/cloud/[project]/page.tsx
git commit -m "feat(cloud): render agents section on env detail page"
```

---

## Phase 4 — Manifest fetching (no backend dep)

### Task 4.1: Verify `useRegistryManifest` passthrough

**Files:**

- Read-only check: `modules/cloud/hooks/use-registry-search.ts`, `app/api/registry/manifest/route.ts` (if it exists)

- [ ] **Step 1: Inspect the manifest-fetch flow**

Run:

```bash
grep -rn "useRegistryManifest\|/api/registry/manifest" modules/cloud app --include="*.ts*" | head -20
cat $(grep -rln "useRegistryManifest" modules/cloud/hooks) | head -120
```

- [ ] **Step 2: Confirm unknown fields are preserved**

If the route handler or hook normalizes the manifest with a strict Zod parse that strips unknown fields, change to `.passthrough()` or extend the schema with the new clint fields. The Zod extension from Task 1.2 already covers this; verify no other place strips fields.

- [ ] **Step 3: Add a regression test if missing**

If the current test for `useRegistryManifest` doesn't assert that clint fields survive a fetch+parse round-trip, add one in `modules/cloud/__tests__/use-registry-manifest.test.ts` (create if needed):

```ts
import { describe, expect, it } from 'vitest'
import { PackageManifestSchema } from '@/modules/cloud/config/types'

describe('PackageManifestSchema preserves clint fields', () => {
  it('round-trips type/serviceCommand/supportedResources/endpoints', () => {
    const input = {
      name: 'x',
      version: '1.0.0',
      type: 'clint-project',
      serviceCommand: 'cmd',
      supportedResources: ['vetra-agent-s'],
      endpoints: [{ id: 'e', type: 'website', port: '1', status: 'disabled' }],
    }
    const parsed = PackageManifestSchema.parse(input)
    expect(parsed.type).toBe('clint-project')
    expect(parsed.serviceCommand).toBe('cmd')
    expect(parsed.supportedResources).toEqual(['vetra-agent-s'])
    expect(parsed.endpoints).toHaveLength(1)
  })
})
```

- [ ] **Step 4: Run test**

```bash
npm run test -- modules/cloud/__tests__/use-registry-manifest.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit (if changes)**

```bash
git add -A
git commit -m "test(cloud): assert PackageManifest preserves clint fields"
```

---

### Task 4.2: `use-clint-packages` hook

**Files:**

- Create: `modules/cloud/hooks/use-clint-packages.ts`
- Test: `modules/cloud/__tests__/use-clint-packages.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useClintPackages } from '@/modules/cloud/hooks/use-clint-packages'

vi.mock('@/modules/cloud/hooks/use-registry-search', () => ({
  useRegistryManifests: (registry: string | null, names: string[]) => {
    const manifests = names.map((n) => ({
      packageName: n,
      manifest:
        n === 'ph-clint'
          ? {
              name: n,
              version: '1.0.0',
              type: 'clint-project',
              serviceCommand: 'go',
              supportedResources: ['vetra-agent-s'],
              endpoints: [],
            }
          : { name: n, version: '1.0.0' },
    }))
    return { manifests, isLoading: false }
  },
}))

describe('useClintPackages', () => {
  it('returns only clint-project packages with parsed manifests', async () => {
    const { result } = renderHook(() =>
      useClintPackages({
        registry: 'https://r',
        packages: [
          { registry: 'https://r', name: 'ph-clint', version: '1.0.0' },
          { registry: 'https://r', name: 'other-pkg', version: '1.0.0' },
        ],
      }),
    )
    await waitFor(() => expect(result.current.clintPackages).toHaveLength(1))
    expect(result.current.clintPackages[0].package.name).toBe('ph-clint')
    expect(result.current.clintPackages[0].manifest.type).toBe('clint-project')
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
npm run test -- modules/cloud/__tests__/use-clint-packages.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement**

Create `modules/cloud/hooks/use-clint-packages.ts`:

```ts
'use client'

import { useMemo } from 'react'
import type { PackageManifest } from '@/modules/cloud/config/types'
import type { CloudPackage } from '@/modules/cloud/types'
import { useRegistryManifests } from './use-registry-search'

export type ClintPackageEntry = {
  package: CloudPackage
  manifest: Required<Pick<PackageManifest, 'type'>> & PackageManifest
}

type Args = {
  registry: string | null
  packages: CloudPackage[]
}

export function useClintPackages({ registry, packages }: Args) {
  const names = useMemo(() => packages.map((p) => p.name), [packages])
  const { manifests, isLoading } = useRegistryManifests(registry, names)
  const clintPackages = useMemo<ClintPackageEntry[]>(() => {
    return manifests
      .map(({ packageName, manifest }) => {
        if (!manifest || manifest.type !== 'clint-project') return null
        const pkg = packages.find((p) => p.name === packageName)
        if (!pkg) return null
        return { package: pkg, manifest } as ClintPackageEntry
      })
      .filter((x): x is ClintPackageEntry => x !== null)
  }, [manifests, packages])
  return { clintPackages, isLoading }
}
```

- [ ] **Step 4: Run to verify pass**

```bash
npm run test -- modules/cloud/__tests__/use-clint-packages.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add modules/cloud/hooks/use-clint-packages.ts modules/cloud/__tests__/use-clint-packages.test.tsx
git commit -m "feat(cloud): add use-clint-packages hook"
```

---

## ⚠️ GATE — Phase 5+ requires `vetra-cloud-package` backend changes

Before proceeding, verify:

```bash
# In ../vetra-cloud-package
git log --oneline -5
# Expect commits referencing CLINT config additions: package field, env field, SET_SERVICE_CONFIG, EnableServiceInput.clintConfig
```

If those aren't present, **stop here**. Phases 1–4 ship as a no-op visual scaffold (no CLINT services exist in production yet). Resume Phase 5 once backend is published.

---

## Phase 5 — Enable flow (BACKEND DEP)

### Task 5.1: Bump `@powerhousedao/*` deps + run codegen

**Files:**

- Modify: `package.json`, `pnpm-lock.yaml` (or `package-lock.json`)
- Modify: `modules/__generated__/**` (auto)

- [ ] **Step 1: Bump dep versions**

Edit `package.json` to set `@powerhousedao/reactor`, `@powerhousedao/shared`, `@renown/sdk` to the dev tag carrying CLINT changes. Confirm exact version with the vetra-cloud-package release (likely `6.0.0-dev.<n>` where `<n>` is the new bump).

- [ ] **Step 2: Install**

```bash
npm install
```

- [ ] **Step 3: Run codegen**

```bash
npm run codegen
```

Expected: clean exit; new types appear in `modules/__generated__/` for `VetraCloudServiceClint`, `VetraCloudServiceEnv`, `VetraCloudRessourceSize`, `EnableServiceInput.clintConfig`, `SetServiceConfigInput`.

- [ ] **Step 4: Run tsc**

```bash
npm run tsc
```

Expected: PASS. If type drift appears in vetra.to types, reconcile (the local `types.ts` mirrors should already match; if not, update them).

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml modules/__generated__/
git commit -m "chore(cloud): bump powerhouse deps for CLINT support and rerun codegen"
```

---

### Task 5.2: Extend `enableService` in `useEnvironmentDetail`

**Files:**

- Modify: `modules/cloud/hooks/use-environment-detail.ts:199-205`

- [ ] **Step 1: Update `enableService` signature**

In `use-environment-detail.ts`, change:

```ts
const enableService = useCallback(
  (type: CloudEnvironmentServiceType, prefix: string) =>
    mutate((c) => c.enableService({ type, prefix })),
  [mutate],
)
```

to:

```ts
const enableService = useCallback(
  (type: CloudEnvironmentServiceType, prefix: string, clintConfig?: CloudServiceClintConfigInput) =>
    mutate((c) => c.enableService({ type, prefix, clintConfig })),
  [mutate],
)
```

Where `CloudServiceClintConfigInput` is the codegen'd input type (likely `VetraCloudServiceClintInput`). Re-export it from `modules/cloud/types.ts` if not already.

- [ ] **Step 2: Update existing test**

In `modules/cloud/__tests__/use-create-environment.test.tsx`, ensure existing assertions still pass. The new optional arg is backward-compatible.

```bash
npm run test -- modules/cloud/__tests__/use-create-environment.test.tsx
```

Expected: PASS.

- [ ] **Step 3: tsc**

```bash
npm run tsc
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add modules/cloud/hooks/use-environment-detail.ts
git commit -m "feat(cloud): accept optional clintConfig in enableService"
```

---

### Task 5.3: `enable-clint-modal`

**Files:**

- Create: `modules/cloud/components/enable-clint-modal.tsx`
- Test: `modules/cloud/__tests__/enable-clint-modal.test.tsx`

- [ ] **Step 1: Write failing test (high level)**

```tsx
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { EnableClintModal } from '@/modules/cloud/components/enable-clint-modal'

const baseEnv = {
  services: [],
  packages: [{ registry: 'https://r', name: 'ph-rupert', version: '1.0.0' }],
  defaultPackageRegistry: 'https://r',
  genericSubdomain: 'demo',
  genericBaseDomain: 'vetra.io',
}

vi.mock('@/modules/cloud/hooks/use-clint-packages', () => ({
  useClintPackages: () => ({
    clintPackages: [
      {
        package: { registry: 'https://r', name: 'ph-rupert', version: '1.0.0' },
        manifest: {
          name: 'ph-rupert',
          version: '1.0.0',
          type: 'clint-project',
          serviceCommand: 'ph-rupert --stand-alone',
          supportedResources: ['vetra-agent-s', 'vetra-agent-m'],
          endpoints: [
            { id: 'graphql', type: 'api-graphql', port: '12345', status: 'enabled' },
            { id: 'web', type: 'website', port: '12345', status: 'disabled' },
          ],
        },
      },
    ],
    isLoading: false,
  }),
}))

describe('EnableClintModal', () => {
  it('submits the right payload', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(
      <EnableClintModal open onOpenChange={() => {}} env={baseEnv as never} onSubmit={onSubmit} />,
    )
    // Wait for clint packages to load and the form to show.
    await waitFor(() => screen.getByLabelText(/prefix/i))

    fireEvent.change(screen.getByLabelText(/prefix/i), { target: { value: 'rupert' } })
    fireEvent.click(screen.getByRole('button', { name: /enable agent/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    const payload = onSubmit.mock.calls[0][0]
    expect(payload.prefix).toBe('rupert')
    expect(payload.clintConfig.serviceCommand).toBe('ph-rupert --stand-alone')
    expect(payload.clintConfig.selectedRessource).toBe('VETRA_AGENT_S') // smallest supported default
    expect(payload.clintConfig.enabledEndpoints).toEqual(['graphql']) // status: enabled by default
  })

  it('rejects duplicate prefix', async () => {
    const onSubmit = vi.fn()
    const envWithExisting = {
      ...baseEnv,
      services: [{ type: 'CLINT', prefix: 'rupert', enabled: true } as never],
    }
    render(
      <EnableClintModal
        open
        onOpenChange={() => {}}
        env={envWithExisting as never}
        onSubmit={onSubmit}
      />,
    )
    await waitFor(() => screen.getByLabelText(/prefix/i))
    fireEvent.change(screen.getByLabelText(/prefix/i), { target: { value: 'rupert' } })
    expect(screen.getByText(/already in use/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enable agent/i })).toBeDisabled()
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
npm run test -- modules/cloud/__tests__/enable-clint-modal.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement modal**

Create `modules/cloud/components/enable-clint-modal.tsx`. The component is large; outline:

- Props: `{ open, onOpenChange, env, onSubmit }`. `onSubmit({ prefix, clintConfig })`.
- Uses `useClintPackages({ registry: env.defaultPackageRegistry, packages: env.packages })`.
- Form state managed with `useState` for: `selectedPackage`, `prefix`, `selectedRessource`, `serviceCommand`, `enabledEndpoints` (Set<string>), `envVars` (CloudServiceEnv[]).
- Initialize from manifest defaults when `selectedPackage` changes.
- Validate prefix: regex `/^[a-z0-9-]+$/` AND not in `env.services.map(s => s.prefix)`.
- Submit assembles payload, calls `onSubmit`, awaits, closes modal.
- Renders fields: package dropdown, prefix input, `<ResourceSizePicker>`, command textarea, endpoints `<EndpointRow>` list, `<EnvVarsEditor>`.
- Empty state: if `clintPackages.length === 0`, show CTA "No clint packages installed — Install one first" linking to the existing Add Package modal.

```tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import type { CloudEnvironment, CloudResourceSize, CloudServiceEnv } from '@/modules/cloud/types'
import { Button } from '@/modules/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/modules/shared/components/ui/dialog'
import { Input } from '@/modules/shared/components/ui/input'
import { Label } from '@/modules/shared/components/ui/label'
import { Textarea } from '@/modules/shared/components/ui/textarea'
import { useClintPackages } from '@/modules/cloud/hooks/use-clint-packages'
import { composeClintEndpointUrl } from '@/modules/cloud/lib/clint-endpoint-url'
import { EndpointRow } from './endpoint-row'
import { EnvVarsEditor } from './env-vars-editor'
import { ResourceSizePicker } from './resource-size-picker'

const PREFIX_RE = /^[a-z0-9-]+$/

const SIZE_TO_TS: Record<string, CloudResourceSize> = {
  'vetra-agent-s': 'VETRA_AGENT_S',
  'vetra-agent-m': 'VETRA_AGENT_M',
  'vetra-agent-l': 'VETRA_AGENT_L',
  'vetra-agent-xl': 'VETRA_AGENT_XL',
  'vetra-agent-xxl': 'VETRA_AGENT_XXL',
}

type SubmitPayload = {
  prefix: string
  clintConfig: {
    package: { registry: string; name: string; version: string | null }
    env: CloudServiceEnv[]
    serviceCommand: string | null
    selectedRessource: CloudResourceSize | null
    enabledEndpoints: string[]
  }
}

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  env: CloudEnvironment
  onSubmit: (payload: SubmitPayload) => Promise<void>
}

export function EnableClintModal({ open, onOpenChange, env, onSubmit }: Props) {
  const { clintPackages, isLoading } = useClintPackages({
    registry: env.state.defaultPackageRegistry ?? null,
    packages: env.state.packages,
  })
  const [selectedIdx, setSelectedIdx] = useState<number>(0)
  const selected = clintPackages[selectedIdx]

  const [prefix, setPrefix] = useState('')
  const [serviceCommand, setServiceCommand] = useState<string>('')
  const [selectedRessource, setSelectedRessource] = useState<CloudResourceSize | null>(null)
  const [enabledEndpoints, setEnabledEndpoints] = useState<Set<string>>(new Set())
  const [envVars, setEnvVars] = useState<CloudServiceEnv[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Reset form whenever the selected package changes
  useEffect(() => {
    if (!selected) return
    setPrefix(selected.package.name.replace(/[^a-z0-9-]/g, '-'))
    setServiceCommand(selected.manifest.serviceCommand ?? '')
    const supported = (selected.manifest.supportedResources ?? []).map((s) => SIZE_TO_TS[s])
    setSelectedRessource(supported[0] ?? null)
    setEnabledEndpoints(
      new Set(
        (selected.manifest.endpoints ?? []).filter((e) => e.status === 'enabled').map((e) => e.id),
      ),
    )
    setEnvVars([])
  }, [selected])

  const existingPrefixes = useMemo(
    () => new Set(env.state.services.map((s) => s.prefix)),
    [env.state.services],
  )
  const prefixError = useMemo(() => {
    if (!prefix) return null
    if (!PREFIX_RE.test(prefix)) return 'lowercase letters, digits, and hyphens only'
    if (existingPrefixes.has(prefix)) return 'prefix already in use'
    return null
  }, [prefix, existingPrefixes])

  const canSubmit = !!selected && !!prefix && !prefixError && !!selectedRessource && !submitting

  const handleSubmit = async () => {
    if (!selected || !canSubmit) return
    setSubmitting(true)
    try {
      await onSubmit({
        prefix,
        clintConfig: {
          package: selected.package,
          env: envVars.filter((v) => v.name),
          serviceCommand: serviceCommand || null,
          selectedRessource,
          enabledEndpoints: Array.from(enabledEndpoints),
        },
      })
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Agent</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="text-muted-foreground p-4 text-sm">Loading clint packages…</div>
        ) : clintPackages.length === 0 ? (
          <div className="text-muted-foreground p-4 text-sm">
            No clint packages installed in this environment. Install one first via Packages → Add
            Package.
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Clint package</Label>
              <select
                className="mt-1 w-full rounded border p-2 text-sm"
                value={selectedIdx}
                onChange={(e) => setSelectedIdx(Number(e.target.value))}
              >
                {clintPackages.map((p, i) => (
                  <option key={p.package.name} value={i}>
                    {p.package.name}@{p.package.version ?? 'latest'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="prefix">Prefix</Label>
              <Input
                id="prefix"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                aria-invalid={!!prefixError}
              />
              {prefixError && <p className="text-destructive mt-1 text-xs">{prefixError}</p>}
            </div>

            {selected && (
              <>
                <div>
                  <Label>Resource size</Label>
                  <ResourceSizePicker
                    supported={(selected.manifest.supportedResources ?? []).map(
                      (s) => SIZE_TO_TS[s],
                    )}
                    value={selectedRessource}
                    onChange={setSelectedRessource}
                  />
                </div>

                <div>
                  <Label htmlFor="cmd">Service command</Label>
                  <Textarea
                    id="cmd"
                    value={serviceCommand}
                    onChange={(e) => setServiceCommand(e.target.value)}
                    className="font-mono text-sm"
                    rows={2}
                  />
                  {selected.manifest.serviceCommand &&
                    serviceCommand !== selected.manifest.serviceCommand && (
                      <button
                        type="button"
                        className="text-primary mt-1 text-xs underline"
                        onClick={() => setServiceCommand(selected.manifest.serviceCommand ?? '')}
                      >
                        Reset to default
                      </button>
                    )}
                </div>

                <div>
                  <Label>Endpoints</Label>
                  <div className="mt-2 space-y-2">
                    {(selected.manifest.endpoints ?? []).map((ep) => (
                      <EndpointRow
                        key={ep.id}
                        endpoint={ep}
                        url={composeClintEndpointUrl({
                          serviceUrl: null,
                          prefix: prefix || '<prefix>',
                          genericSubdomain: env.state.genericSubdomain,
                          genericBaseDomain: env.state.genericBaseDomain,
                          endpoint: ep,
                        })}
                        checked={enabledEndpoints.has(ep.id)}
                        onCheckedChange={(checked) => {
                          setEnabledEndpoints((prev) => {
                            const next = new Set(prev)
                            checked ? next.add(ep.id) : next.delete(ep.id)
                            return next
                          })
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Environment variables</Label>
                  <EnvVarsEditor value={envVars} onChange={setEnvVars} />
                </div>
              </>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {submitting ? 'Enabling…' : 'Enable agent'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 4: Run to verify pass**

```bash
npm run test -- modules/cloud/__tests__/enable-clint-modal.test.tsx
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add modules/cloud/components/enable-clint-modal.tsx modules/cloud/__tests__/enable-clint-modal.test.tsx
git commit -m "feat(cloud): add enable-clint-modal combined enable+configure form"
```

---

### Task 5.4: Wire `EnableClintModal` to `useEnvironmentDetail.enableService`

**Files:**

- Modify: env detail page (same file as Task 3.3)

- [ ] **Step 1: Add modal state and wire submit**

In the env detail page, add:

```tsx
const [enableClintOpen, setEnableClintOpen] = useState(false)

const handleEnableClint = useCallback(
  async (payload: SubmitPayload) => {
    await enableService('CLINT', payload.prefix, payload.clintConfig)
  },
  [enableService],
)

// In JSX:
<AgentsSection
  services={env.state.services}
  env={env}
  canEdit={canSign}
  onAddAgent={() => setEnableClintOpen(true)}
/>
{canSign && env && (
  <EnableClintModal
    open={enableClintOpen}
    onOpenChange={setEnableClintOpen}
    env={env}
    onSubmit={handleEnableClint}
  />
)}
```

- [ ] **Step 2: Manual smoke (after starting dev server)**

```bash
npm run dev
```

In a browser:

- Open an env where you have a clint-project package installed
- Click "Add Agent"
- Fill the form, submit
- Confirm card appears with `PROVISIONING` status
- Refresh — card persists

Stop dev server.

- [ ] **Step 3: Commit**

```bash
git add app/cloud/[project]/page.tsx
git commit -m "feat(cloud): wire enable-clint-modal into env detail page"
```

---

## Phase 6 — Configure flow (BACKEND DEP)

### Task 6.1: Add `setServiceConfig` mutation hook in `useEnvironmentDetail`

**Files:**

- Modify: `modules/cloud/hooks/use-environment-detail.ts:199-280`

- [ ] **Step 1: Add the wrapper**

After `enableService`, add:

```ts
const setServiceConfig = useCallback(
  (prefix: string, config: CloudServiceClintConfigInput) =>
    mutate((c) => c.setServiceConfig({ prefix, config })),
  [mutate],
)
```

Include `setServiceConfig` in the returned object.

- [ ] **Step 2: tsc**

```bash
npm run tsc
```

Expected: PASS (codegen exposes `setServiceConfig` after Task 5.1).

- [ ] **Step 3: Commit**

```bash
git add modules/cloud/hooks/use-environment-detail.ts
git commit -m "feat(cloud): expose setServiceConfig mutation in useEnvironmentDetail"
```

---

### Task 6.2: Expand `agent-card` with edit form

**Files:**

- Modify: `modules/cloud/components/agent-card.tsx`
- Modify: `modules/cloud/__tests__/agent-card.test.tsx` (add expanded tests)

- [ ] **Step 1: Write failing tests for expanded view**

Append to `modules/cloud/__tests__/agent-card.test.tsx`:

```tsx
import { fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

describe('AgentCard expanded', () => {
  it('shows form on Configure click and submits changes', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const onDisable = vi.fn()
    const env = {
      state: { genericSubdomain: 'demo', genericBaseDomain: 'vetra.io' },
    } as never
    // Use a manifest stub: assume agent-card pulls from a passed-in manifest prop or use-clint-packages mock
    render(
      <AgentCard
        service={service}
        env={env}
        canEdit
        manifest={{
          name: 'ph-rupert',
          version: '1.2.3',
          type: 'clint-project',
          serviceCommand: 'ph-rupert',
          supportedResources: ['vetra-agent-s', 'vetra-agent-m', 'vetra-agent-xxl'],
          endpoints: [{ id: 'ep-1', type: 'website', port: '1' }],
        }}
        onSave={onSave}
        onDisable={onDisable}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /configure/i }))
    fireEvent.click(screen.getByLabelText('Medium'))
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(onSave).toHaveBeenCalled())
    expect(onSave.mock.calls[0][0].selectedRessource).toBe('VETRA_AGENT_M')
  })
})
```

- [ ] **Step 2: Update `AgentCard` to accept `manifest`, `onSave`, `onDisable`**

Update the component signature:

```tsx
type Props = {
  service: CloudEnvironmentService
  env: CloudEnvironment | null
  canEdit: boolean
  manifest?: PackageManifest | null
  onSave?: (config: CloudServiceClintConfig) => Promise<void>
  onDisable?: () => Promise<void>
}
```

Add expanded form rendering (when `expanded && canEdit && manifest`):

- `<ResourceSizePicker>` for resource size
- `<Textarea>` for command (with reset link)
- `<EndpointRow>` list joined from `manifest.endpoints` + `service.config.enabledEndpoints`
- `<EnvVarsEditor>` for env vars
- Save / Cancel / Disable agent buttons
- Local form state mirrors `service.config`; cancel resets it; save calls `onSave(nextConfig)` and collapses the card on success.

- [ ] **Step 3: Run to verify pass**

```bash
npm run test -- modules/cloud/__tests__/agent-card.test.tsx
```

Expected: PASS (collapsed + expanded tests).

- [ ] **Step 4: Commit**

```bash
git add modules/cloud/components/agent-card.tsx modules/cloud/__tests__/agent-card.test.tsx
git commit -m "feat(cloud): add agent-card expanded edit form"
```

---

### Task 6.3: Wire `agents-section` to manifests + `setServiceConfig` + `disableService`

**Files:**

- Modify: `modules/cloud/components/agents-section.tsx`
- Modify: `modules/cloud/__tests__/agents-section.test.tsx` (extend)

- [ ] **Step 1: Update props to thread save/disable handlers + manifests**

In `agents-section.tsx`:

```tsx
type Props = {
  services: CloudEnvironmentService[]
  env: CloudEnvironment | null
  canEdit: boolean
  onAddAgent?: () => void
  onSaveConfig?: (prefix: string, config: CloudServiceClintConfig) => Promise<void>
  onDisable?: (prefix: string) => Promise<void>
  manifests?: Record<string, PackageManifest> // packageName -> manifest
}
```

Pass per-card:

```tsx
<AgentCard
  ...
  manifest={s.config ? (manifests?.[s.config.package.name] ?? null) : null}
  onSave={onSaveConfig ? (cfg) => onSaveConfig(s.prefix, cfg) : undefined}
  onDisable={onDisable ? () => onDisable(s.prefix) : undefined}
/>
```

- [ ] **Step 2: Wire from env detail page**

In the env detail page, source manifests via `useClintPackages` (re-run with the env's installed packages) and pass them in. Wire `onSaveConfig` to `setServiceConfig`, `onDisable` to `disableService`.

- [ ] **Step 3: Manual smoke**

```bash
npm run dev
```

- Expand an agent card
- Toggle endpoints → save → confirm persistence
- Change resource size → save → confirm
- Click Disable → confirm card removal

- [ ] **Step 4: Commit**

```bash
git add modules/cloud/components/agents-section.tsx app/cloud/[project]/page.tsx
git commit -m "feat(cloud): wire agent edit and disable actions"
```

---

## Phase 7 — Verification & polish

### Task 7.1: Storybook stories

**Files:**

- Create: `modules/cloud/components/agent-card.stories.tsx`
- Create: `modules/cloud/components/enable-clint-modal.stories.tsx`
- Create: `modules/cloud/components/endpoint-row.stories.tsx`

- [ ] **Step 1: Stub stories using existing patterns**

Mirror an existing component story (e.g., `service-card.stories.tsx` if present, or `metric-card.stories.tsx`). Cover:

- `agent-card`: collapsed/expanded × ACTIVE/PROVISIONING/SUSPENDED/BILLING_ISSUE
- `enable-clint-modal`: empty packages, one package, multi-package
- `endpoint-row`: one per endpoint type, plus disabled state

- [ ] **Step 2: Run Storybook to verify**

```bash
npm run storybook
```

Visually inspect, then stop.

- [ ] **Step 3: Commit**

```bash
git add modules/cloud/components/*.stories.tsx
git commit -m "feat(cloud): storybook coverage for clint components"
```

---

### Task 7.2: E2E smoke (Playwright)

**Files:**

- Create: `tests/cloud/clint.spec.ts`

- [ ] **Step 1: Write smoke spec**

Mirror an existing Playwright spec. Cover:

1. Login (use existing helper)
2. Open an env with a clint-project package installed
3. Click "Add Agent" → fill form → submit → expect new card with PROVISIONING badge
4. Expand card → toggle an endpoint → Save → expect optimistic check persists after reload
5. Click Disable → expect card removed

- [ ] **Step 2: Run E2E**

```bash
npx playwright test tests/cloud/clint.spec.ts
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/cloud/clint.spec.ts
git commit -m "test(cloud): playwright smoke for clint enable/configure/disable"
```

---

### Task 7.3: Final verification gate

- [ ] **Step 1: Run all checks in parallel**

```bash
npm run tsc
npm run lint
npm run test
npm run format:check
```

All must PASS. Fix issues, re-commit per fix.

- [ ] **Step 2: Manual exploratory smoke**

```bash
npm run dev
```

Walk through:

- Empty Agents section in a fresh env
- Install a clint package
- Add Agent → Enable → wait for ACTIVE
- Configure → change every field → Save
- All three endpoint types render with correct affordances:
  - graphql → Playground link works
  - mcp → Copy MCP config produces valid JSON
  - website → Visit opens in new tab
- Disable agent
- Auth fallback: log out → confirm Agents section hides Add Agent + edit controls (read-only)

- [ ] **Step 3: Open PR**

```bash
git push -u origin feat/clint-service-support
gh pr create --title "feat(cloud): CLINT service support on env detail page" --body "$(cat <<'EOF'
## Summary
- Adds CLINT service type + config (resource size, endpoints, env vars, service command) to the env detail page
- New Agents section with combined enable+configure modal and inline edit
- Per-endpoint-type rendering (graphql / mcp / website)
- Manifest convention for clint-project packages

## Test plan
- [ ] tsc / lint / format / vitest green
- [ ] Storybook renders all states
- [ ] Playwright smoke green
- [ ] Manual: enable, configure, disable on a real env

Spec: docs/superpowers/specs/2026-04-28-clint-service-vetra-to-design.md
Plan: docs/superpowers/plans/2026-04-28-clint-service-vetra-to.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-review notes

- Phase 1 (types) and Phase 2 (reusable comps) and Phase 4 (manifest) are all backend-independent and TDD-friendly. Phase 3 wires them in read-only.
- Phase 5 / 6 are gated behind backend changes; the gate banner before Phase 5 is explicit.
- Tests precede implementation in every component task.
- Commits are small (≤ one task each).
- `selectedRessource` (with the schema's typo) used consistently.
- Manifest size keys use kebab-case (`vetra-agent-s`); TS enum uses snake-screaming (`VETRA_AGENT_S`); Task 5.3 carries an explicit `SIZE_TO_TS` map at the boundary.

## Risks / known unknowns

- Exact paths of env-detail page entrypoint depend on current routing; Task 3.3 step 1 has a `grep` to discover it before editing.
- `useRegistryManifests` API in Task 4.2 mock — verify the actual signature matches (`manifests`, `isLoading`). Adjust the mock if the API differs.
- Codegen output naming for `clintConfig` field: assumed `EnableServiceInput.clintConfig` and `setServiceConfig({ prefix, config })`. If backend names it differently, update Task 5.2 and 6.1.
