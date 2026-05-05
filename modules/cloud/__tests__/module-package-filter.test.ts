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
