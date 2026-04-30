import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AddAgentModal } from '@/modules/cloud/components/add-agent-modal'
import type { CloudEnvironment } from '@/modules/cloud/types'

vi.mock('@/modules/cloud/hooks/use-registry-search', () => ({
  useRegistryPackages: vi.fn(() => ({ packages: [], isLoading: false })),
  useRegistryVersions: vi.fn(() => ({ info: null, isLoading: false })),
  useRegistryManifest: vi.fn(() => ({ manifest: null, isLoading: false, error: null })),
  useRegistryManifests: vi.fn(() => ({ manifests: [], isLoading: false })),
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
  createdAtUtcIso: '2024-01-01T00:00:00Z',
  lastModifiedAtUtcIso: '2024-01-01T00:00:00Z',
  state: {
    owner: null,
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
