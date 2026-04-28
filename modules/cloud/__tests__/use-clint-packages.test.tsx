import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

vi.mock('@/modules/cloud/hooks/use-registry-search', () => ({
  useRegistryManifests: (
    registryUrl: string | null,
    packages: Array<{ name: string; version?: string | null }>,
  ) => {
    const manifests = packages.map((p) => ({
      packageName: p.name,
      manifest:
        p.name === 'ph-clint'
          ? {
              name: p.name,
              type: 'clint-project',
              serviceCommand: 'go',
              supportedResources: ['vetra-agent-s'],
              endpoints: [{ id: 'e', type: 'website', port: '1', status: 'disabled' }],
            }
          : { name: p.name },
    }))
    return { manifests, isLoading: false }
  },
}))

import { useClintPackages } from '@/modules/cloud/hooks/use-clint-packages'

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

  it('returns empty when no clint packages', async () => {
    const { result } = renderHook(() =>
      useClintPackages({
        registry: 'https://r',
        packages: [{ registry: 'https://r', name: 'other-pkg', version: '1.0.0' }],
      }),
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.clintPackages).toHaveLength(0)
  })
})
